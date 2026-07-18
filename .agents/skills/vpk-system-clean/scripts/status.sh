#!/bin/zsh
# status.sh — one-glance, read-only health check for vpk-system-clean.
set -u
setopt NULL_GLOB

LABEL="com.$(id -un).vpk-system-clean"
LOG="$HOME/Library/Logs/vpk-system-clean.log"
SUDOERS="/etc/sudoers.d/vpk-system-clean"
NEXT_CPU_HOT=150
ALMD_CPU_HOT=50
ALMD_PATH="/usr/local/bin/almd"
NEXT_DIRS=(
	"$HOME/Labs/vpk-rovo/.next"
	"$HOME"/.codex/worktrees/*/vpk-rovo/.next
	"$HOME"/Labs/vpk-rovo/.claude/worktrees/*/.next
)

print -- "── dev servers (next-server) ──"
np=( ${(f)"$(pgrep -f 'next-server' 2>/dev/null)"} )
if (( ${#np} )); then
	for p in $np; do
		c=$(ps -o %cpu= -p "$p" 2>/dev/null | tr -d ' '); c=${c:-0}
		flag=""; (( ${c%%.*} >= NEXT_CPU_HOT )) && flag="  ⚠ HOT — runaway; see doctor.sh --kill"
		print -- "pid $p  ${c}% CPU$flag"
	done
else
	print -- "(none running)"
fi

print -- "\n── Atlassian local monitoring (almd) ──"
ap=( ${(f)"$(pgrep -x almd 2>/dev/null)"} )
if (( ${#ap} )); then
	for p in $ap; do
		c=$(ps -o %cpu= -p "$p" 2>/dev/null | tr -d ' '); c=${c:-0}
		age=$(ps -o etime= -p "$p" 2>/dev/null | tr -d ' '); age=${age:-?}
		exe=$(lsof -a -d txt -p "$p" -Fn 2>/dev/null | sed -n 's/^n//p' | head -1)
		flag=""
		if [[ "$exe" != "$ALMD_PATH" ]]; then
			flag="  ⚠ unexpected executable: ${exe:-unknown}; sweep will keep it"
		elif (( ${c%%.*} >= ALMD_CPU_HOT )); then
			flag="  ⚠ hot candidate — sweep verifies age + 3 sustained samples"
		fi
		print -- "pid $p  ${c}% CPU  age $age$flag"
	done
else
	print -- "(not running; its LaunchAgent retries every 5 minutes)"
fi

print -- "\n── launchd agent ──"
if launchctl print "gui/$(id -u)/$LABEL" >/dev/null 2>&1; then
	sched=$(launchctl print "gui/$(id -u)/$LABEL" 2>/dev/null | grep -iE "next firing|run interval" | head -1 | sed 's/^[[:space:]]*//')
	print -- "loaded ✓   ${sched:-(scheduled)}"
else
	print -- "NOT loaded ✗   (run install.sh to fix)"
fi

print -- "\n── sudoers (fseventsd auto-reset) ──"
[[ -f "$SUDOERS" ]] && print -- "present ✓" || print -- "missing ✗   (fseventsd reset disabled until added)"

print -- "\n── fseventsd ──"
fp=$(pgrep -x fseventsd | head -1)
if [[ -n "$fp" ]]; then
	mb=$(ps -o rss= -p "$fp" 2>/dev/null | awk '{print int($1/1024)}')
	flag=""; (( ${mb:-0} > 2048 )) && flag="  ⚠ over 2GB — a reset would help"
	print -- "RSS ${mb}MB$flag"
fi

print -- "\n── tmux dev sessions (vpk-dev-*) ──"
if command -v tmux >/dev/null 2>&1; then
	rows=( ${(f)"$(tmux list-sessions -F '#{session_name}|#{session_path}|#{session_attached}' 2>/dev/null | grep '^vpk-dev-')"} )
	if (( ${#rows} )); then
		for row in $rows; do
			sname="${row%%|*}"; rest="${row#*|}"
			spath="${rest%%|*}"; sattached="${rest##*|}"
			att=""; [[ "$sattached" == 1 ]] && att=" (attached)"
			if [[ -n "$spath" && -d "$spath" ]]; then
				print -- "${sname}${att}  $spath"
			else
				flag="  ⚠ orphaned — worktree gone; sweep will kill it"
				[[ "$sattached" == 1 ]] && flag="  ⚠ orphaned but attached — sweep keeps it"
				print -- "${sname}${att}  ${spath:-?}$flag"
			fi
		done
	else
		print -- "(none running)"
	fi
else
	print -- "(tmux not installed)"
fi

print -- "\n── .next caches ──"
any=0
for nx in ${(u)NEXT_DIRS}; do
	[[ -d "$nx" ]] || continue
	any=1
	gb=$(du -sg "$nx" 2>/dev/null | awk '{print $1}')
	flag=""; (( ${gb:-0} >= 3 )) && flag="  ⚠ over threshold"
	print -- "${gb}G  $nx$flag"
done
(( any == 0 )) && print -- "(none on disk)"

print -- "\n── recent log (last 12 lines) ──"
[[ -f "$LOG" ]] && tail -n 12 "$LOG" || print -- "(no log yet — never run)"
