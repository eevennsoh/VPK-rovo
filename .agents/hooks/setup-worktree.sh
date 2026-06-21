#!/usr/bin/env bash
#
# Bootstrap worktree dependencies and env for local agent worktrees.
#
# Shared by:
#   - Claude Code SessionStart hooks
#   - Cursor .cursor/worktrees.json setup-worktree
#
# Mirrors the Codex setup-script behavior for local worktrees by delegating to
# the shared bootstrap helper:
#   - ignored .env* files are copied from another local worktree when available.
#   - node_modules is warmed from a matching source checkout when possible,
#     falling back to pnpm install --prefer-offline.
#
# Wired via .claude/settings.json -> hooks.SessionStart with
# matcher: "startup", so this fires once when a new session enters a
# worktree (or the main worktree) and no-ops on /compact, /clear, resume.
#
# Claude hook output contract:
#   - Installer noise -> stderr (visible in terminal, NOT injected into
#     Claude's context window — keeps the first turn lean).
#   - One short status line -> structured hookSpecificOutput JSON, which
#     becomes additionalContext for Claude on session start. Skipped
#     entirely when there is nothing to report. Non-Claude callers only get
#     human-readable stderr/stdout.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
. "$SCRIPT_DIR/lib/worktree-bootstrap.sh"

PROJECT_DIR="${PROJECT_DIR:-${CODEX_WORKTREE_PATH:-${CURSOR_WORKTREE_PATH:-${CLAUDE_PROJECT_DIR:-$PWD}}}}"
SOURCE_TREE_PATH="${SOURCE_TREE_PATH:-${CODEX_SOURCE_TREE_PATH:-${CURSOR_SOURCE_TREE_PATH:-}}}"
IS_CLAUDE_HOOK=0

if [ -n "${CLAUDE_PROJECT_DIR:-}" ]; then
	IS_CLAUDE_HOOK=1
fi

vpk_bootstrap_worktree "$PROJECT_DIR" "$SOURCE_TREE_PATH"

if [ "$IS_CLAUDE_HOOK" -eq 1 ] && [ ${#VPK_BOOTSTRAP_MESSAGES[@]} -gt 0 ]; then
	CONTEXT="${VPK_BOOTSTRAP_MESSAGES[*]}"
	CONTEXT_ESCAPED=$(printf '%s' "$CONTEXT" | sed 's/\\/\\\\/g; s/"/\\"/g' | tr -d '\n')
	cat <<EOF
{
  "hookSpecificOutput": {
    "hookEventName": "SessionStart",
    "additionalContext": "$CONTEXT_ESCAPED"
  }
}
EOF
fi

exit 0
