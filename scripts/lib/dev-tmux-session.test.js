const assert = require("node:assert/strict");
const test = require("node:test");

const {
	resolveDevTmuxSessionName,
	sanitizeToken,
} = require("./dev-tmux-session");

test("resolveDevTmuxSessionName honors explicit ROVO_TMUX_SESSION", () => {
	assert.equal(
		resolveDevTmuxSessionName({
			env: { ROVO_TMUX_SESSION: "custom-session" },
			getWorktreeNameImpl: () => "ignored",
		}),
		"custom-session",
	);
});

test("resolveDevTmuxSessionName applies prefix and worktree sanitization", () => {
	assert.equal(
		resolveDevTmuxSessionName({
			env: { ROVO_TMUX_SESSION_PREFIX: "VPK Dev!" },
			getWorktreeNameImpl: () => "HTML Selector Block Plan",
		}),
		"vpk-dev-html-selector-block-plan",
	);
});

test("resolveDevTmuxSessionName falls back to main when worktree name is empty", () => {
	assert.equal(
		resolveDevTmuxSessionName({
			env: {},
			getWorktreeNameImpl: () => "",
		}),
		"vpk-dev-main",
	);
});

test("sanitizeToken keeps lowercase alphanumeric underscore and dash tokens", () => {
	assert.equal(sanitizeToken(" Foo__Bar--Baz! ", "fallback"), "foo__bar-baz");
	assert.equal(sanitizeToken(" !!! ", "fallback"), "fallback");
});
