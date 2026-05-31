#!/bin/zsh
# vpk-system-clean.sh
# Keeps a 24/7 Mac from drowning in Next.js/Turbopack dev churn. Three guards:
#  1. RUNAWAY DEV SERVER (the big one): a `next-server` stuck at high CPU is a
#     Turbopack watch/recompile thrash loop. Detected by sampling CPU twice so a
#     normal bursty compile is NOT mistaken for a runaway. Killed (with its
#     `next dev` parent) so it can be restarted clean. This is the live "fix".
#  2. RUNAWAY .next CACHES: Turbopack's .next/dev grows unbounded (15GB seen);
#     every file feeds macOS FSEvents and amplifies the thrash. Deleted when over
#     threshold AND no dev server is running. This is the "prevention".
#  3. fseventsd LEAK: the FS-events daemon leaks CPU/RAM over long uptimes
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

# --- 2. .next cleanup ----------------------------------------------------------
if pgrep -f "next dev|next-server" >/dev/null 2>&1; then
	log "a dev server is still running -> skipping .next cleanup (won't touch a live build)"
else
	for nx in ${(u)NEXT_DIRS}; do
		[[ -d "$nx" ]] || continue
		gb=$(du -sg "$nx" 2>/dev/null | awk '{print $1}'); gb=${gb:-0}
		if (( gb >= NEXT_MAX_GB )); then
			if rm -rf "$nx"; then
				freed=$(( freed + gb )); count=$(( count + 1 )); log "removed $nx (${gb}G)"
			else
				log "FAILED to remove $nx"
			fi
		else
			log "kept $nx (${gb}G < ${NEXT_MAX_GB}G)"
		fi
	done
fi

# --- 3. fseventsd reset --------------------------------------------------------
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

log "summary: killed ${killed} runaway server(s); freed ${freed}G from ${count} cache(s); fseventsd ${fse_action}"
log "run done"
