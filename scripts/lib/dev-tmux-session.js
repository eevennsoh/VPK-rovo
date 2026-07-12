"use strict";

const { getWorktreeName } = require("./worktree-ports");

function sanitizeToken(value, fallback) {
	const normalized = String(value ?? "")
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9_-]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.replace(/-{2,}/g, "-");

	return normalized.length > 0 ? normalized : fallback;
}

function resolveDevTmuxSessionName({
	env = process.env,
	getWorktreeNameImpl = getWorktreeName,
} = {}) {
	const explicitName = env.ROVO_TMUX_SESSION;
	if (typeof explicitName === "string" && explicitName.trim().length > 0) {
		return explicitName.trim();
	}

	const prefix = sanitizeToken(env.ROVO_TMUX_SESSION_PREFIX || "vpk-dev", "vpk-dev");
	const worktree = sanitizeToken(getWorktreeNameImpl() || "main", "main");
	return `${prefix}-${worktree}`;
}

module.exports = {
	resolveDevTmuxSessionName,
	sanitizeToken,
};
