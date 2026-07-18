#!/bin/zsh
# vpk-system-clean.sh
# Keeps a 24/7 Mac from drowning in local-development churn. Six guards:
#  1. RUNAWAY DEV SERVER (CPU): a `next-server` stuck at high CPU is a
#     Turbopack watch/recompile thrash loop. Detected by sampling CPU twice so a
#     normal bursty compile is NOT mistaken for a runaway. Killed (with its
#     `next dev` parent) so it can be restarted clean. This is the live "fix".
#  2. BLOATED DEV SERVER (MEMORY): a `next-server` IDLING at multi-GB memory is
#     a leaking server (arm64 MAP_JIT leak). Measured as vmmap Physical
#     footprint, NOT ps RSS — the JIT/native mappings barely count toward RSS
#     (an 11.1GB-footprint server showed 0.19GB RSS). A healthy compile burst
#     can also peak in the double digits before Turbopack's eviction reclaims
#     it (observed 12.9GB -> 1.7GB in one run), so this is sampled twice with a
#     settle window and only killed if still bloated AND idle (low CPU) on the
#     second sample — an idle server holding this much memory is the leak; a
#     busy one is a normal burst. Killed (with its `next dev` parent) to
#     restart clean.
#  3. RUNAWAY .next CACHES: Turbopack's .next/dev grows unbounded (15GB seen);
#     every file feeds macOS FSEvents and amplifies the thrash. Deleted PER
#     WORKTREE when over threshold AND that worktree has no live dev server (each
#     running server's cwd is matched to the cache's worktree root) — so idle
#     caches are reclaimed even while OTHER worktrees keep a live build. This is
#     the "prevention". The old all-or-nothing skip reclaimed nothing in
#     practice, because a 24/7 box always has at least one server up somewhere.
#  4. STALE TMUX SESSIONS: dev-tmux.sh and dev-tmux-plain.sh leave a
#     vpk-dev-<worktree> session alive per worktree. When a worktree is deleted
#     the session is orphaned and keeps burning resources. Killed when its
#     worktree path is gone AND no client is attached.
#  5. RUNAWAY ALMD: Atlassian's /usr/local/bin/almd can get stuck consuming a
#     CPU core for hours. Restarted only after exact-path verification, a
#     minimum process age, and three sustained-hot samples. Its user LaunchAgent
#     retries it automatically.
#  6. fseventsd LEAK: the FS-events daemon leaks CPU/RAM over long uptimes
#     (22GB seen). Restarted if ballooned (needs the sudoers rule from install).
#
# Safe unattended: never deletes a live build's cache, and only kills a process
# that matches its exact guard conditions. Each run appends a parseable
# "summary:" line.
set -u
setopt NULL_GLOB

LOG="$HOME/Library/Logs/vpk-system-clean.log"
NEXT_MAX_GB=3            # delete .next only once it grows past this
FSEVENTS_MAX_MB=2048     # restart fseventsd only above this RSS
NEXT_CPU_HOT=150         # a next-server sustained above this %CPU is a runaway
KILL_RUNAWAY_NEXT=1      # 1 = kill sustained-hot dev servers; 0 = report only
NEXT_MEM_MAX_GB=6        # a next-server above this physical footprint (GB) is bloated/leaking
KILL_BLOATED_NEXT=1      # 1 = kill bloated dev servers; 0 = report only
NEXT_MEM_SETTLE_SECS=30  # settle window before re-checking a bloated candidate
NEXT_MEM_IDLE_CPU_MAX=20 # %CPU below which a still-bloated server counts as idle (leak, not a compile burst)
ALMD_PATH="/usr/local/bin/almd"
ALMD_CPU_HOT=50          # minimum %CPU for every sample before almd is reset
ALMD_MIN_AGE_SECS=900    # never reset almd during its first 15 minutes
ALMD_SAMPLE_COUNT=3      # three observations avoid treating a brief burst as runaway
ALMD_SAMPLE_SECS=10      # 20-second confirmation window after the first sample
ALMD_TERM_GRACE_SECS=5   # allow graceful exit before a guarded SIGKILL fallback
KILL_RUNAWAY_ALMD=1      # 1 = reset sustained-hot almd; 0 = report only

NEXT_DIRS=(
	"$HOME/Labs/vpk-rovo/.next"
	"$HOME"/.codex/worktrees/*/vpk-rovo/.next
	"$HOME"/Labs/vpk-rovo/.claude/worktrees/*/.next
)

ts() { date "+%Y-%m-%d %H:%M:%S"; }
log() { print -r -- "[$(ts)] $*" >> "$LOG"; }
cpu_of() { ps -o %cpu= -p "$1" 2>/dev/null | tr -d ' '; }   # decaying avg %CPU
exe_of() { lsof -a -d txt -p "$1" -Fn 2>/dev/null | sed -n 's/^n//p' | head -1; }
elapsed_secs_of() {
	local raw days=0 hours=0 minutes=0 seconds=0
	local -a parts
	raw=$(ps -o etime= -p "$1" 2>/dev/null | tr -d '[:space:]')
	[[ -n "$raw" ]] || return 1
	if [[ "$raw" == *-* ]]; then
		days="${raw%%-*}"
		raw="${raw#*-}"
	fi
	parts=( ${(s/:/)raw} )
	case ${#parts} in
		3) hours="${parts[1]}"; minutes="${parts[2]}"; seconds="${parts[3]}" ;;
		2) minutes="${parts[1]}"; seconds="${parts[2]}" ;;
		*) return 1 ;;
	esac
	print -- $(( days * 86400 + hours * 3600 + minutes * 60 + seconds ))
}
# Whole GB of real memory. vmmap Physical footprint is the truth for the MAP_JIT
# leak (ps RSS undercounts it ~50x); ~1s per pid is fine for a scheduled sweep.
# Falls back to ps RSS if vmmap is unavailable or fails.
mem_gb_of() {
	local gb
	gb=$(vmmap -summary "$1" 2>/dev/null | awk '/^Physical footprint:/{v=$3; u=substr(v,length(v)); if (u=="G") print int(v+0); else print 0; exit}')
	if [[ -n "$gb" ]]; then
		print -r -- "$gb"
	else
		ps -o rss= -p "$1" 2>/dev/null | awk '{print int($1/1024/1024)}'
	fi
}

# Keep the log bounded on a 24/7 box (cap ~500 lines).
if [[ -f "$LOG" ]] && (( $(wc -l < "$LOG") > 500 )); then
	tail -n 200 "$LOG" > "$LOG.tmp" && mv "$LOG.tmp" "$LOG"
fi

log "run start"
freed=0; count=0; killed=0; bloated=0; almd_resets=0

# --- 1. runaway dev server -----------------------------------------------------
# First pass: which next-server pids are hot right now?
hot1=()
for p in ${(f)"$(pgrep -f 'next-server' 2>/dev/null)"}; do
	c=$(cpu_of "$p"); [[ -n "$c" ]] || continue
	(( ${c%%.*} >= NEXT_CPU_HOT )) && hot1+="$p"
done
# Second pass after a short settle: still hot => genuine runaway, not a burst.
if (( ${#hot1} )); then
	sleep 4
	for p in $hot1; do
		c=$(cpu_of "$p"); [[ -n "$c" ]] || continue
		if (( ${c%%.*} >= NEXT_CPU_HOT )); then
			if (( KILL_RUNAWAY_NEXT )); then
				pp=$(ps -o ppid= -p "$p" 2>/dev/null | tr -d ' ')
				kill "$p" 2>/dev/null
				[[ -n "$pp" && "$pp" != 1 ]] && kill "$pp" 2>/dev/null
				killed=$(( killed + 1 ))
				log "killed runaway next-server pid $p (~${c}% CPU, parent $pp) — restart dev server to recover"
			else
				log "runaway next-server pid $p (~${c}% CPU) — KILL_RUNAWAY_NEXT=0, left running"
			fi
		fi
	done
fi

# --- 2. bloated dev server -----------------------------------------------------
# First pass: which next-server pids are over the memory threshold right now?
# Measured as vmmap Physical footprint — ps RSS misses the MAP_JIT leak.
bloat1=()
for p in ${(f)"$(pgrep -f 'next-server' 2>/dev/null)"}; do
	gb=$(mem_gb_of "$p"); [[ -n "$gb" ]] || continue
	(( gb >= NEXT_MEM_MAX_GB )) && bloat1+="$p"
done
# Second pass after a settle window: kill only if still bloated AND idle (low
# CPU) — a busy compile burst is not a leak, even at double-digit GB.
if (( ${#bloat1} )); then
	sleep "$NEXT_MEM_SETTLE_SECS"
	for p in $bloat1; do
		gb=$(mem_gb_of "$p"); [[ -n "$gb" ]] || continue
		c=$(cpu_of "$p"); c=${c:-0}
		if (( gb >= NEXT_MEM_MAX_GB )) && (( ${c%%.*} < NEXT_MEM_IDLE_CPU_MAX )); then
			bloated=$(( bloated + 1 ))
			if (( KILL_BLOATED_NEXT )); then
				pp=$(ps -o ppid= -p "$p" 2>/dev/null | tr -d ' ')
				kill "$p" 2>/dev/null
				[[ -n "$pp" && "$pp" != 1 ]] && kill "$pp" 2>/dev/null
				log "killed bloated next-server pid $p (~${gb}GB physical footprint, idle at ${c}% CPU, parent $pp) — restart dev server to recover"
			else
				log "bloated next-server pid $p (~${gb}GB physical footprint, idle at ${c}% CPU) — KILL_BLOATED_NEXT=0, left running"
			fi
		else
			log "next-server pid $p still elevated (~${gb}GB) but actively compiling (~${c}% CPU) or settled below threshold — deferred to next sweep"
		fi
	done
fi

# --- 3. .next cleanup (per-worktree) ------------------------------------------
# Map each running dev server to the worktree it serves (by its cwd), then
# delete only the .next caches whose OWN worktree has no live server. This keeps
# the "never touch a live build" guarantee while still reclaiming idle caches —
# the previous all-or-nothing skip freed nothing whenever any server was up.
cwd_of() { lsof -a -d cwd -p "$1" -Fn 2>/dev/null | sed -n 's/^n//p' | head -1; }
busy_roots=()
for p in ${(f)"$(pgrep -f 'next dev|next-server' 2>/dev/null)"}; do
	c=$(cwd_of "$p"); [[ -n "$c" ]] && busy_roots+="$c"
done

for nx in ${(u)NEXT_DIRS}; do
	[[ -d "$nx" ]] || continue
	root="${nx:h}"                       # worktree root = parent dir of .next
	busy=0
	for b in $busy_roots; do
		# busy if a live server's cwd is this worktree root or nested under it
		[[ "$b" == "$root" || "$b" == "$root/"* ]] && { busy=1; break; }
	done
	if (( busy )); then
		log "kept $nx (dev server live in this worktree)"
		continue
	fi
	gb=$(du -sg "$nx" 2>/dev/null | awk '{print $1}'); gb=${gb:-0}
	if (( gb >= NEXT_MAX_GB )); then
		if rm -rf "$nx"; then
			freed=$(( freed + gb )); count=$(( count + 1 )); log "removed $nx (${gb}G, no live server)"
		else
			log "FAILED to remove $nx"
		fi
	else
		log "kept $nx (${gb}G < ${NEXT_MAX_GB}G)"
	fi
done

# --- 4. stale tmux sessions ----------------------------------------------------
# dev-tmux.sh and dev-tmux-plain.sh name each session vpk-dev-<worktree> and
# point session_path at the worktree root. Check both the default tmux socket and
# the private vpk-dev socket used by the plain stack. When a worktree is deleted
# its session is orphaned: it keeps a frontend/backend and sometimes a Rovo port
# pool alive against a path that no longer exists. Kill those (skipping any
# session you're attached to — never tear down a session in active use).
# Self-correcting: a live worktree's path still exists, so it is never touched.
tmux_action="not-checked"
if command -v tmux >/dev/null 2>&1; then
	stale_killed=0
	for socket in default vpk-dev; do
		socket_killed=0
		if [[ "$socket" == "default" ]]; then
			rows=( ${(f)"$(tmux list-sessions -F '#{session_name}|#{session_path}|#{session_attached}' 2>/dev/null)"} )
		else
			rows=( ${(f)"$(tmux -L "$socket" list-sessions -F '#{session_name}|#{session_path}|#{session_attached}' 2>/dev/null)"} )
		fi
		for row in $rows; do
			sname="${row%%|*}"; rest="${row#*|}"
			spath="${rest%%|*}"; sattached="${rest##*|}"
			[[ -n "$sname" ]] || continue
			[[ "$sname" == vpk-dev-* ]] || continue
			[[ -n "$spath" && -d "$spath" ]] && continue   # worktree still exists
			if [[ "$sattached" == 1 ]]; then
				log "kept tmux session $sname on $socket socket (orphaned path '$spath' but attached)"
				continue
			fi
			if [[ "$socket" == "default" ]]; then
				tmux kill-session -t "$sname" 2>/dev/null
			else
				tmux -L "$socket" kill-session -t "$sname" 2>/dev/null
			fi
			if (( $? == 0 )); then
				stale_killed=$(( stale_killed + 1 ))
				socket_killed=$(( socket_killed + 1 ))
				log "killed stale tmux session $sname on $socket socket (worktree path '$spath' gone)"
			else
				log "FAILED to kill tmux session $sname on $socket socket"
			fi
		done
		log "checked tmux socket $socket (${socket_killed} stale session(s) killed)"
	done
	tmux_action="checked default+vpk-dev sockets; ${stale_killed} stale session(s) killed"
fi

# --- 5. runaway almd ----------------------------------------------------------
# almd is a user LaunchAgent that retries every five minutes. Reset only the
# exact deployed binary, only after it is old enough to be past startup work,
# and only when every sample in a 20-second window remains hot.
almd_action="not-running"
almd_pids=( ${(f)"$(pgrep -x almd 2>/dev/null)"} )
if (( ${#almd_pids} )); then
	almd_action="ok"
	for p in $almd_pids; do
		exe=$(exe_of "$p")
		if [[ "$exe" != "$ALMD_PATH" ]]; then
			almd_action="kept-unrecognized"
			log "kept almd pid $p (unexpected executable '${exe:-unknown}', expected $ALMD_PATH)"
			continue
		fi

		age=$(elapsed_secs_of "$p"); age=${age:-0}
		if (( age < ALMD_MIN_AGE_SECS )); then
			almd_action="warming"
			log "kept almd pid $p (${age}s old < ${ALMD_MIN_AGE_SECS}s minimum)"
			continue
		fi

		c=$(cpu_of "$p"); [[ -n "$c" ]] || continue
		(( ${c%%.*} >= ALMD_CPU_HOT )) || continue

		sustained=1
		for (( sample = 2; sample <= ALMD_SAMPLE_COUNT; sample++ )); do
			sleep "$ALMD_SAMPLE_SECS"
			if [[ "$(exe_of "$p")" != "$ALMD_PATH" ]]; then
				sustained=0
				almd_action="exited-during-check"
				break
			fi
			c=$(cpu_of "$p"); [[ -n "$c" ]] || { sustained=0; break; }
			if (( ${c%%.*} < ALMD_CPU_HOT )); then
				sustained=0
				almd_action="settled"
				log "kept almd pid $p (settled to ${c}% CPU during confirmation)"
				break
			fi
		done

		(( sustained )) || continue
		if (( ! KILL_RUNAWAY_ALMD )); then
			almd_action="hot-report-only"
			log "runaway almd pid $p (~${c}% CPU, ${age}s old) — KILL_RUNAWAY_ALMD=0, left running"
			continue
		fi

		if ! kill "$p" 2>/dev/null; then
			almd_action="reset-failed"
			log "FAILED to terminate runaway almd pid $p (~${c}% CPU, ${age}s old)"
			continue
		fi

		signal="TERM"
		sleep "$ALMD_TERM_GRACE_SECS"
		if kill -0 "$p" 2>/dev/null; then
			if [[ "$(exe_of "$p")" != "$ALMD_PATH" ]] || ! kill -9 "$p" 2>/dev/null; then
				almd_action="reset-failed"
				log "FAILED to force-stop runaway almd pid $p after TERM"
				continue
			fi
			signal="KILL"
		fi

		almd_resets=$(( almd_resets + 1 ))
		almd_action="reset ${almd_resets}"
		log "stopped runaway almd pid $p with $signal (~${c}% CPU, ${age}s old; LaunchAgent will retry)"
	done
	(( almd_resets > 0 )) && almd_action="reset ${almd_resets}"
fi

# --- 6. fseventsd reset --------------------------------------------------------
fse_action="not-checked"
fp=$(pgrep -x fseventsd | head -1)
if [[ -n "$fp" ]]; then
	rss=$(ps -o rss= -p "$fp" 2>/dev/null | awk '{print int($1/1024)}'); rss=${rss:-0}
	if (( rss > FSEVENTS_MAX_MB )); then
		if /usr/bin/sudo -n /usr/bin/pkill -x fseventsd 2>/dev/null; then
			fse_action="restarted (was ${rss}MB)"; log "restarted fseventsd (was ${rss}MB; auto-respawns)"
		else
			fse_action="skipped-no-sudoers (${rss}MB)"; log "fseventsd at ${rss}MB but no passwordless sudo -> skipped"
		fi
	else
		fse_action="ok (${rss}MB)"; log "fseventsd ok (${rss}MB <= ${FSEVENTS_MAX_MB}MB)"
	fi
fi

log "summary: killed ${killed} runaway server(s); bloated ${bloated} server(s); freed ${freed}G from ${count} cache(s); tmux ${tmux_action}; almd ${almd_action}; fseventsd ${fse_action}"
log "run done"
