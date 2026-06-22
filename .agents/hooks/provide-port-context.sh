#!/bin/bash
#
# Hook: Provide port context before browser/agent-browser tools
#
# This hook reads the active dev server ports from the worktree's port files
# and provides them as context to Claude before browser-related tool calls.
#
# Port files:
#   .dev-frontend-port - Contains the frontend port (e.g., 3000, 3020)
#   .dev-backend-port  - Contains the backend port (e.g., 8080, 8100)

# Read the hook input from stdin (JSON with tool info)
INPUT=$(cat)

# Determine project directory
PROJECT_DIR="${CLAUDE_PROJECT_DIR:-.}"

# Initialize port variables
FRONTEND_PORT=""
BACKEND_PORT=""
CONTEXT_PARTS=()

# Read frontend port if file exists
FRONTEND_PORT_FILE="$PROJECT_DIR/.dev-frontend-port"
if [ -f "$FRONTEND_PORT_FILE" ]; then
    FRONTEND_PORT=$(cat "$FRONTEND_PORT_FILE" 2>/dev/null | tr -d '[:space:]')
    if [ -n "$FRONTEND_PORT" ]; then
        CONTEXT_PARTS+=("Frontend: http://localhost:$FRONTEND_PORT")
    fi
fi

# Resolve this worktree's stable Portless URL (preferred navigation target) by
# matching the frontend port against ~/.portless/routes.json. Best-effort: empty
# if portless isn't routing this worktree or node is unavailable.
PORTLESS_URL=""
if [ -n "$FRONTEND_PORT" ] && command -v node >/dev/null 2>&1; then
    PORTLESS_URL=$(FP="$FRONTEND_PORT" node -e '
try {
  const fs = require("fs"), os = require("os"), path = require("path");
  const file = path.join(os.homedir(), ".portless", "routes.json");
  if (!fs.existsSync(file)) process.exit(0);
  const routes = JSON.parse(fs.readFileSync(file, "utf8"));
  const port = Number(process.env.FP);
  const route = Array.isArray(routes) ? routes.find((r) => r && r.port === port) : null;
  if (route && route.hostname) process.stdout.write("https://" + route.hostname);
} catch {}' 2>/dev/null)
    if [ -n "$PORTLESS_URL" ]; then
        CONTEXT_PARTS=("Portless URL: $PORTLESS_URL" "${CONTEXT_PARTS[@]}")
    fi
fi

# Read backend port if file exists
BACKEND_PORT_FILE="$PROJECT_DIR/.dev-backend-port"
if [ -f "$BACKEND_PORT_FILE" ]; then
    BACKEND_PORT=$(cat "$BACKEND_PORT_FILE" 2>/dev/null | tr -d '[:space:]')
    if [ -n "$BACKEND_PORT" ]; then
        CONTEXT_PARTS+=("Backend API: http://localhost:$BACKEND_PORT")
    fi
fi

# Read rovo port if file exists
ROVO_PORT_FILE="$PROJECT_DIR/.dev-rovo-port"
if [ -f "$ROVO_PORT_FILE" ]; then
    ROVO_PORT=$(cat "$ROVO_PORT_FILE" 2>/dev/null | tr -d '[:space:]')
    if [ -n "$ROVO_PORT" ]; then
        CONTEXT_PARTS+=("Rovo Serve: http://localhost:$ROVO_PORT")
    fi
fi

# If we found any ports, output context for Claude
if [ ${#CONTEXT_PARTS[@]} -gt 0 ]; then
    # Build the context message
    CONTEXT="Dev servers running in this worktree: ${CONTEXT_PARTS[*]}. Use these recorded worktree ports/URLs instead of assuming default localhost ports."
    if [ -n "$PORTLESS_URL" ]; then
        CONTEXT="$CONTEXT Prefer the stable Portless URL ($PORTLESS_URL) when navigating to pages; it survives dev-server restarts and is origin-isolated per worktree."
    elif [ -n "$FRONTEND_PORT" ]; then
        CONTEXT="$CONTEXT Use the frontend URL (http://localhost:$FRONTEND_PORT) when navigating to pages."
    fi

    # Escape for JSON
    CONTEXT_ESCAPED=$(echo "$CONTEXT" | sed 's/"/\\"/g' | tr -d '\n')

    # Output JSON with additional context
    cat << EOF
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "additionalContext": "$CONTEXT_ESCAPED"
  }
}
EOF
else
    # No ports found - check if servers might not be running
    cat << EOF
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "additionalContext": "No dev servers detected in this worktree. For browser verification, start the worktree-aware tmux stack with 'pnpm run dev:tmux:start' — it runs the dev stack through 'portless run' and prints this worktree's stable .localhost URL (also shown by 'pnpm ports' as '🌐 https://…'). Prefer that Portless URL when navigating; fall back to .dev-frontend-port/.dev-backend-port only if no route exists. Use 'pnpm run dev' only as a foreground fallback when tmux is unavailable."
  }
}
EOF
fi

exit 0
