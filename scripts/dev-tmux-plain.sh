#!/usr/bin/env bash

set -euo pipefail

# Lightweight tmux launcher for the plain dev stack (frontend + backend via
# `pnpm run dev`, no Rovo Serve pool). Companion to scripts/dev-tmux.sh, which
# owns the heavier `rovo:tmux:*` 8-pane session.
#
# Why this exists separately:
#   - It only needs `pnpm run dev`, so it has none of the Rovo billing/port-pool
#     prerequisites of dev-tmux.sh.
#   - It resolves a *standalone* tmux binary and runs on a private socket. On
#     machines where a managed tmux shim shadows `tmux` on PATH (e.g. cmux's
#     ~/.cmuxterm/claude-teams-bin/tmux), control commands against that shim fail
#     with "Failed to write to socket (Broken pipe)". A private socket on the
#     real binary sidesteps that entirely and keeps the dev server alive across
#     terminal/session boundaries.

REPO_ROOT="$(pwd)"
FRONTEND_PORT_FILE=".dev-frontend-port"
BACKEND_PORT_FILE=".dev-backend-port"
SOCKET="${VPK_TMUX_SOCKET:-vpk-dev}"

# Resolve a real tmux binary, never the managed shim (which rejects detached
# session control). Honor an explicit override first, then common install
# locations, then a PATH lookup that is rejected if it points at a shim.
resolve_tmux() {
	local candidate
	for candidate in "${VPK_TMUX_BIN:-}" /opt/homebrew/bin/tmux /usr/local/bin/tmux /usr/bin/tmux; do
		if [[ -n "$candidate" && -x "$candidate" && "$candidate" != *".cmuxterm"* ]]; then
			printf '%s' "$candidate"
			return 0
		fi
	done

	local path_tmux
	path_tmux="$(command -v tmux 2>/dev/null || true)"
	if [[ -n "$path_tmux" && "$path_tmux" != *".cmuxterm"* ]]; then
		printf '%s' "$path_tmux"
		return 0
	fi

	return 1
}

TMUX_BIN="$(resolve_tmux || true)"
if [[ -z "$TMUX_BIN" ]]; then
	echo "No standalone tmux binary found." >&2
	echo "Install tmux (e.g. 'brew install tmux') or set VPK_TMUX_BIN to its path." >&2
	exit 1
fi

# All tmux invocations go through the private socket so we never touch a managed
# server.
tm() {
	"$TMUX_BIN" -L "$SOCKET" "$@"
}

# Per-worktree session name so parallel worktrees don't collide on one socket.
resolve_session_name() {
	node - <<'NODE'
const { getWorktreeName } = require("./scripts/lib/worktree-ports");

const sanitizeToken = (value, fallback) => {
	const normalized = String(value ?? "")
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9_-]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.replace(/-{2,}/g, "-");
	return normalized.length > 0 ? normalized : fallback;
};

const explicitName = process.env.VPK_DEV_TMUX_SESSION;
if (typeof explicitName === "string" && explicitName.trim().length > 0) {
	process.stdout.write(explicitName.trim());
	process.exit(0);
}

const prefix = sanitizeToken(process.env.VPK_DEV_TMUX_SESSION_PREFIX || "vpk-dev", "vpk-dev");
const worktree = sanitizeToken(getWorktreeName() || "main", "main");
process.stdout.write(`${prefix}-${worktree}`);
NODE
}

SESSION_NAME="$(resolve_session_name)"

# Seed .env.local the same way the non-tmux launchers do, preferring the main
# worktree's copy and falling back to the example file.
seed_env_local() {
	node - <<'NODE'
const { ensureEnvLocalExists } = require("./scripts/lib/env-local");
const result = ensureEnvLocalExists({ cwd: process.cwd() });
if (result.createdFrom === "main-worktree") {
	console.log(`[dev:tmux] Created .env.local from main worktree: ${result.mainWorktreePath}`);
} else if (result.createdFrom === "example") {
	console.log("[dev:tmux] Created .env.local from .env.local.example");
}
NODE
}

read_port() {
	if [[ -f "$1" ]]; then
		tr -d '[:space:]' <"$1"
	fi
	return 0
}

# Poll until the frontend records a port AND that port is actually listening.
# Prints the port on success; prints whatever was recorded (possibly empty) and
# returns 1 on timeout.
wait_for_frontend() {
	local attempts="${VPK_DEV_TMUX_WAIT:-90}"
	local port=""
	local i
	for ((i = 0; i < attempts; i++)); do
		port="$(read_port "$FRONTEND_PORT_FILE")"
		if [[ -n "$port" ]] && lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then
			printf '%s' "$port"
			return 0
		fi
		sleep 1
	done
	printf '%s' "$port"
	return 1
}

print_endpoints() {
	local fe="$1" be
	be="$(read_port "$BACKEND_PORT_FILE")"
	echo ""
	if [[ -n "$fe" ]]; then
		echo "  ▲ Frontend: http://localhost:$fe"
	fi
	if [[ -n "$be" ]]; then
		echo "  ⚙ Backend:  http://localhost:$be"
	fi
	echo ""
}

print_controls() {
	echo "  Attach/logs: $TMUX_BIN -L $SOCKET attach -t $SESSION_NAME   (detach: Ctrl-b then d)"
	echo "               pnpm run dev:tmux:attach"
	echo "  Stop:        pnpm run dev:tmux:stop"
}

start_session() {
	if tm has-session -t "$SESSION_NAME" 2>/dev/null; then
		echo "Session '$SESSION_NAME' already running (socket: $SOCKET)."
	else
		# Clear stale port files so wait_for_frontend doesn't latch onto a dead
		# port from a previous run.
		rm -f "$FRONTEND_PORT_FILE" "$BACKEND_PORT_FILE"
		seed_env_local
		tm new-session -d -s "$SESSION_NAME" -c "$REPO_ROOT"
		tm send-keys -t "$SESSION_NAME" "cd \"$REPO_ROOT\" && pnpm run dev" C-m
		echo "Started tmux session '$SESSION_NAME' (socket: $SOCKET)."
	fi

	echo "Waiting for the frontend to come up..."
	local port
	if port="$(wait_for_frontend)"; then
		print_endpoints "$port"
	else
		echo "Frontend hasn't reported a listening port yet — check the logs:"
	fi
	print_controls
}

stop_session() {
	if tm has-session -t "$SESSION_NAME" 2>/dev/null; then
		tm kill-session -t "$SESSION_NAME"
		echo "Stopped tmux session '$SESSION_NAME' (socket: $SOCKET)."
	else
		echo "No tmux session '$SESSION_NAME' on socket '$SOCKET'."
	fi
	rm -f "$FRONTEND_PORT_FILE" "$BACKEND_PORT_FILE"
}

attach_session() {
	if tm has-session -t "$SESSION_NAME" 2>/dev/null; then
		exec "$TMUX_BIN" -L "$SOCKET" attach -t "$SESSION_NAME"
	fi
	echo "No tmux session '$SESSION_NAME' on socket '$SOCKET'. Start it with: pnpm run dev:tmux:start"
	exit 1
}

status_session() {
	echo "Session: $SESSION_NAME"
	echo "Socket:  $SOCKET"
	echo "tmux:    $TMUX_BIN"
	if tm has-session -t "$SESSION_NAME" 2>/dev/null; then
		echo "State:   running"
		tm list-panes -t "$SESSION_NAME" -F "  pane #{pane_index}: #{pane_current_command}"
	else
		echo "State:   stopped"
	fi
	local fe be
	fe="$(read_port "$FRONTEND_PORT_FILE")"
	be="$(read_port "$BACKEND_PORT_FILE")"
	echo "Frontend port: ${fe:-missing}"
	echo "Backend port:  ${be:-missing}"
}

usage() {
	echo "Usage: $0 [start|stop|attach|status]"
	echo ""
	echo "Runs the plain dev stack (pnpm run dev) in a detached tmux session on a"
	echo "private socket, kept alive independently of the launching terminal."
	echo ""
	echo "Commands:"
	echo "  start   Start (or report) the session, then print the bound ports (default)"
	echo "  stop    Kill the session and remove this worktree's dev port files"
	echo "  attach  Attach to the running session (Ctrl-b then d to detach)"
	echo "  status  Show session and port state"
	echo ""
	echo "Environment overrides:"
	echo "  VPK_TMUX_BIN               Path to the tmux binary to use"
	echo "  VPK_TMUX_SOCKET            Private socket name (default: vpk-dev)"
	echo "  VPK_DEV_TMUX_SESSION       Exact session name override"
	echo "  VPK_DEV_TMUX_SESSION_PREFIX Prefix for the auto session name (default: vpk-dev)"
}

command="${1:-start}"
if [[ "$command" == "--" ]]; then
	shift
	command="${1:-start}"
fi

case "$command" in
	start) start_session ;;
	stop) stop_session ;;
	attach) attach_session ;;
	status) status_session ;;
	-h | --help | help) usage ;;
	*)
		echo "Unknown command: $command"
		usage
		exit 1
		;;
esac
