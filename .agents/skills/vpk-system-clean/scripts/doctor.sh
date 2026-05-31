#!/bin/zsh
# doctor.sh — inspect (and optionally fix) runaway Next.js dev servers live.
#
# Usage:
#   doctor.sh            # list every next-server: CPU, RSS, port, worktree
#   doctor.sh --kill     # kill servers sustained-hot above the CPU threshold
#                        # (and their `next dev` parents) so you can restart clean
#
# A next-server pegged at high CPU is a Turbopack watch/recompile thrash loop.
# Killing it is the reliable live fix; restart your dev server afterward (clear
# .next first for good measure: it regenerates).
set -u
setopt NULL_GLOB

NEXT_CPU_HOT=150
DO_KILL=0; [[ "${1:-}" == "--kill" ]] && DO_KILL=1

cpu_of()  { ps -o %cpu= -p "$1" 2>/dev/null | tr -d ' '; }
rssmb_of(){ ps -o rss=  -p "$1" 2>/dev/null | awk '{print int($1/1024)}'; }
cwd_of()  { lsof -a -p "$1" -d cwd -Fn 2>/dev/null | grep '^n' | sed 's/^n//'; }
port_of() { ps -o command= -p "$1" 2>/dev/null | grep -oE -- '--port [0-9]+' | awk '{print $2}'; }

pids=( ${(f)"$(pgrep -f 'next-server' 2>/dev/null)"} )
if (( ${#pids} == 0 )); then
	print -- "No next-server processes running."
	exit 0
fi

print -- "next-server processes (hot threshold ${NEXT_CPU_HOT}% CPU):"
print -- ""
printf "  %-7s %-7s %-7s %-7s %s\n" PID CPU% RSSGB PORT WORKTREE
hot=()
for p in $pids; do
	c=$(cpu_of "$p"); c=${c:-0}
	r=$(rssmb_of "$p"); rg=$(( ${r:-0} / 1024 ))
	port=$(port_of "$p"); cwd=$(cwd_of "$p")
	flag=""; (( ${c%%.*} >= NEXT_CPU_HOT )) && { flag="  ⚠ HOT"; hot+="$p"; }
	printf "  %-7s %-7s %-7s %-7s %s%s\n" "$p" "$c" "$rg" "${port:-?}" "${cwd:-?}" "$flag"
done

if (( ${#hot} == 0 )); then
	print -- "\nNothing sustained-hot. (Brief spikes during compile are normal.)"
	exit 0
fi

if (( DO_KILL == 0 )); then
	print -- "\n${#hot} server(s) flagged HOT. Re-run with --kill to restart them, e.g.:"
	print -- "  zsh ${0:A} --kill"
	exit 0
fi

# Confirm still hot after a short settle, then kill server + its next dev parent.
sleep 4
for p in $hot; do
	c=$(cpu_of "$p"); [[ -n "$c" ]] || continue
	if (( ${c%%.*} >= NEXT_CPU_HOT )); then
		pp=$(ps -o ppid= -p "$p" 2>/dev/null | tr -d ' ')
		kill "$p" 2>/dev/null
		[[ -n "$pp" && "$pp" != 1 ]] && kill "$pp" 2>/dev/null
		print -- "killed runaway next-server $p (~${c}% CPU, parent $pp)"
	else
		print -- "pid $p settled (${c}%) — left running"
	fi
done
print -- "\nDone. Restart your dev server (pnpm run dev / rovo). Tip: clear .next first."
