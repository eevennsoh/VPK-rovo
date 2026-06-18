#!/bin/zsh
# vpk-system-clean.sh
# Keeps a 24/7 Mac from drowning in Next.js/Turbopack dev churn. Three guards:
#  1. RUNAWAY DEV SERVER (the big one): a `next-server` stuck at high CPU is a
#     Turbopack watch/recompile thrash loop. Detected by sampling CPU twice so a
#     normal bursty compile is NOT mistaken for a runaway. Killed (with its
#     `next dev` parent) so it can be restarted clean. This is the live "fix".
#  2. RUNAWAY .next CACHES: Turbopack's .next/dev grows unbounded (15GB seen);
#     every file feeds macOS FSEvents and amplifies the thrash. Deleted PER
#     WORKTREE when over threshold AND that worktree has no live dev server (each
#     running server's cwd is matched to the cache's worktree root) — so idle
#     caches are reclaimed even while OTHER worktrees keep a live build. This is
#     the "prevention". The old all-or-nothing skip reclaimed nothing in
#     practice, because a 24/7 box always has at least one server up somewhere.
#  3. STALE TMUX SESSIONS: dev-tmux.sh leaves a vpk-dev-<worktree> session (with
#     frontend, backend, and a Rovo port pool) alive per worktree. When a worktree
#     is deleted the session is orphaned and keeps burning resources. Killed when
#     its worktree path is gone AND no client is attached.
#  4. fseventsd LEAK: the FS-events daemon leaks CPU/RAM over long uptimes
#     (22GB seen). Restarted if ballooned (needs the sudoers rule from install).
#
# Safe unattended: never deletes a live build's cache, and only kills a server
# that is *sustained* hot. Each run appends a parseable "summary:" line.
set -u
setopt NULL_GLOB

LOG="$HOME/Library/Logs/vpk-system-clean.log"
NEXT_MAX_GB=3            # delete .next only once it grows past this
FSEVENTS_MAX_MB=2048     # restart fseventsd only above this RSS
NEXT_CPU_HOT=150         # a next-server sustained above this %CPU is a runaway
KILL_RUNAWAY_NEXT=1      # 1 = kill sustained-hot dev servers; 0 = report only

NEXT_DIRS=(
	"$HOME/Documents/Labs/vpk-rovo/.next"
	"$HOME"/.codex/worktrees/*/vpk-rovo/.next
	"$HOME"/Documents/Labs/vpk-rovo/.claude/worktrees/*/.next
)

ts() { date "+%Y-%m-%d %H:%M:%S"; }
log() { print -r -- "[$(ts)] $*" >> "$LOG"; }
cpu_of() { ps -o %cpu= -p "$1" 2>/dev/null | tr -d ' '; }   # decaying avg %CPU

# Keep the log bounded on a 24/7 box (cap ~500 lines).
if [[ -f "$LOG" ]] && (( $(wc -l < "$LOG") > 500 )); then
	tail -n 200 "$LOG" > "$LOG.tmp" && mv "$LOG.tmp" "$LOG"
fi

log "run start"
freed=0; count=0; killed=0

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

# --- 2. .next cleanup (per-worktree) ------------------------------------------
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

# --- 3. stale tmux sessions ----------------------------------------------------
# dev-tmux.sh names each session vpk-dev-<worktree> and points session_path at
# the worktree root. When a worktree is deleted its session is orphaned: it keeps
# a frontend, backend, and a pool of Rovo port processes alive against a path
# that no longer exists. Kill those (skipping any session you're attached to —
# never tear down a session in active use). Self-correcting: a live worktree's
# path still exists, so it is never touched.
tmux_action="not-checked"
if command -v tmux >/dev/null 2>&1; then
	stale_killed=0
	while IFS='|' read -r sname spath sattached; do
		[[ -n "$sname" ]] || continue
		[[ "$sname" == vpk-dev-* ]] || continue
		[[ -n "$spath" && -d "$spath" ]] && continue   # worktree still exists
		if [[ "$sattached" == 1 ]]; then
			log "kept tmux session $sname (orphaned path '$spath' but attached)"
			continue
		fi
		if tmux kill-session -t "$sname" 2>/dev/null; then
			stale_killed=$(( stale_killed + 1 ))
			log "killed stale tmux session $sname (worktree path '$spath' gone)"
		else
			log "FAILED to kill tmux session $sname"
		fi
	done < <(tmux list-sessions -F '#{session_name}|#{session_path}|#{session_attached}' 2>/dev/null)
	tmux_action="${stale_killed} stale session(s) killed"
fi

# --- 4. fseventsd reset --------------------------------------------------------
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

log "summary: killed ${killed} runaway server(s); freed ${freed}G from ${count} cache(s); tmux ${tmux_action}; fseventsd ${fse_action}"
log "run done"
