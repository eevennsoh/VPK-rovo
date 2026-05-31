#!/bin/zsh
# schedule.sh — set or show when the cleanup runs.
#
# Usage:
#   schedule.sh 04:17                 # daily at one time
#   schedule.sh 04:00 12:00 20:00     # several specific times per day
#   schedule.sh daily 6:30            # daily (explicit keyword)
#   schedule.sh every 6h              # every N hours/minutes (also 30m, 3600s)
#   schedule.sh show                  # print current schedule
#
# Persists to ~/.config/vpk-system-clean/schedule.env, then re-runs install.sh
# so launchd picks it up. install.sh re-reads this on every repair, so the timer
# survives reinstalls.
set -u
setopt NULL_GLOB

SKILL_DIR="${0:A:h:h}"
CONF_DIR="$HOME/.config/vpk-system-clean"
CONF="$CONF_DIR/schedule.env"
LABEL="com.$(id -un).vpk-system-clean"

show() {
	print -- "configured schedule:"
	if [[ -f "$CONF" ]]; then sed 's/^/  /' "$CONF"; else print -- "  (default) MODE=daily HOUR=4 MINUTE=17"; fi
	print -- "\nlive launchd agent:"
	launchctl print "gui/$(id -u)/$LABEL" 2>/dev/null | grep -iE "next firing|run interval" | sed 's/^[[:space:]]*/  /' || print -- "  (agent not loaded — run install.sh)"
}

to_seconds() {  # 6h | 30m | 3600s | 3600 -> seconds
	case "$1" in
		*h) print -- $(( ${1%h} * 3600 )) ;;
		*m) print -- $(( ${1%m} * 60 )) ;;
		*s) print -- "${1%s}" ;;
		*)  print -- "$1" ;;
	esac
}

[[ $# -eq 0 || "$1" == "show" ]] && { show; exit 0; }

mkdir -p "$CONF_DIR"

if [[ "$1" == "every" ]]; then
	[[ -n "${2:-}" ]] || { print -- "usage: schedule.sh every <6h|30m|3600s>"; exit 1; }
	secs=$(to_seconds "$2")
	if ! [[ "$secs" == <-> ]] || (( secs < 600 )); then
		print -- "interval must be a number >= 600s (10m) to avoid thrashing"; exit 1
	fi
	print -- "MODE=interval\nINTERVAL=$secs" > "$CONF"
else
	# Collect every HH:MM argument (ignore a leading "daily" keyword).
	times=()
	for a in "$@"; do
		[[ "$a" == "daily" ]] && continue
		if [[ "$a" == <->:<-> ]]; then
			hh=${a%%:*}; mm=${a##*:}
			if (( hh < 0 || hh > 23 || mm < 0 || mm > 59 )); then print -- "bad time: $a"; exit 1; fi
			times+=( "$(printf '%d:%d' "$hh" "$mm")" )
		else
			print -- "unrecognized arg: $a  (use HH:MM, 'every <dur>', or 'show')"; exit 1
		fi
	done
	(( ${#times} )) || { print -- "usage: schedule.sh HH:MM [HH:MM ...]"; exit 1; }

	if (( ${#times} == 1 )); then
		hh=${times[1]%%:*}; mm=${times[1]##*:}
		print -- "MODE=daily\nHOUR=$hh\nMINUTE=$mm" > "$CONF"
	else
		print -- "MODE=times\nTIMES=\"${times[*]}\"" > "$CONF"
	fi
fi

print -- "wrote $CONF:"; sed 's/^/  /' "$CONF"
print -- "\napplying via install.sh ...\n"
exec /bin/zsh "$SKILL_DIR/scripts/install.sh"
