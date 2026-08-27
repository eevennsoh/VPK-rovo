const assert = require("node:assert/strict");
const test = require("node:test");

async function loadSession() {
	return import("./agent-list-session.ts");
}

function sessionItem(sessionDetails) {
	return {
		agent: { avatarSrc: "", kind: "agent", name: "Claude" },
		id: "lw-scope-thread",
		sessionDetails,
		state: "complete",
		title: "Scope the migration",
	};
}

test("resume command leaves shell-safe values unquoted", async () => {
	const { toAgentListResumeCommand } = await loadSession();

	assert.equal(
		toAgentListResumeCommand(sessionItem({ resumeSessionId: "abc-123", worktreePath: "/Users/venn/Labs/vpk-rovo" })),
		"cd /Users/venn/Labs/vpk-rovo && claude --resume abc-123",
	);
	assert.equal(
		toAgentListResumeCommand(sessionItem(undefined)),
		"claude --resume lw-scope-thread",
	);
});

test("resume command quotes worktree paths containing spaces", async () => {
	const { toAgentListResumeCommand } = await loadSession();

	assert.equal(
		toAgentListResumeCommand(sessionItem({ resumeSessionId: "abc-123", worktreePath: "/Users/venn/My Project/vpk" })),
		"cd '/Users/venn/My Project/vpk' && claude --resume abc-123",
	);
});

test("resume command neutralises shell metacharacters instead of executing them", async () => {
	const { toAgentListResumeCommand } = await loadSession();

	const command = toAgentListResumeCommand(
		sessionItem({ resumeSessionId: "id; rm -rf /", worktreePath: "/tmp/$(whoami)" }),
	);

	assert.equal(command, "cd '/tmp/$(whoami)' && claude --resume 'id; rm -rf /'");
	// The dangerous fragments survive only inside single quotes, never bare.
	assert.doesNotMatch(command, /--resume id; rm/u);
	assert.doesNotMatch(command, /cd \/tmp\/\$\(whoami\)/u);
});

test("resume command escapes embedded single quotes", async () => {
	const { quoteShellArgument } = await loadSession();

	assert.equal(quoteShellArgument("it's here"), String.raw`'it'\''s here'`);
});
