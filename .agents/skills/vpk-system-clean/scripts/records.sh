#!/bin/zsh
# records.sh — cleanup history & totals, parsed from the run log.
#
# Usage:
#   records.sh           # summary: totals + recent runs
#   records.sh --raw     # dump the full log
#   records.sh --removed # every cache that was ever removed, with sizes
set -u

LOG="$HOME/Library/Logs/vpk-system-clean.log"

if [[ ! -f "$LOG" ]]; then
	print -- "No records yet — the cleanup has never run. (Run it once, or wait for the schedule.)"
	exit 0
fi

case "${1:-}" in
	--raw)     cat "$LOG"; exit 0 ;;
	--removed) grep -E "removed .* \([0-9]+G\)" "$LOG" || print -- "(no removals recorded)"; exit 0 ;;
esac

# --- aggregate ---------------------------------------------------------------
runs=$(grep -c "run start" "$LOG")
resets=$(grep -c "restarted fseventsd" "$LOG")
removals=$(grep -cE "removed .* \([0-9]+G\)" "$LOG")
tmux_kills=$(grep -c "killed stale tmux session" "$LOG")
almd_resets=$(grep -c "stopped runaway almd" "$LOG")

# Total GB reclaimed: prefer the per-run "summary: freed NG" lines; if a log
# predates summaries, fall back to summing individual "removed ... (NG)" lines.
total=$(grep "summary:" "$LOG" | sed -E 's/.*freed ([0-9]+)G.*/\1/' | awk '{s+=$1} END{print s+0}')
if (( total == 0 )); then
	total=$(grep -E "removed .* \([0-9]+G\)" "$LOG" | sed -E 's/.*\(([0-9]+)G\)/\1/' | awk '{s+=$1} END{print s+0}')
fi

first=$(grep "run start" "$LOG" | head -1 | sed -E 's/^\[([^]]+)\].*/\1/')
last=$(grep "run start" "$LOG" | tail -1 | sed -E 's/^\[([^]]+)\].*/\1/')

print -- "── vpk-system-clean records ──"
print -- "runs            : ${runs}   (first ${first:-—}, last ${last:-—})"
print -- "caches removed  : ${removals}"
print -- "GB reclaimed    : ~${total}G"
print -- "stale tmux kills: ${tmux_kills}"
print -- "almd resets      : ${almd_resets}"
print -- "fseventsd resets: ${resets}"

print -- "\n── recent runs (last 8) ──"
grep "summary:" "$LOG" | tail -n 8 | sed -E 's/^\[([^]]+)\] summary: /\1  /' || print -- "(none yet)"

print -- "\nTip: 'records.sh --removed' lists every removed cache; '--raw' dumps the full log."
