const assert = require("node:assert/strict");
const test = require("node:test");

async function loadSession() {
	return import("./agent-list-session.ts");
}

function sessionItem(sessionDetails, overrides = {}) {
	return {
		agent: { avatarSrc: "", kind: "agent", name: "Claude" },
		id: "lw-scope-thread",
		sessionDetails,
		state: "complete",
		title: "Scope the migration",
		...overrides,
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

test("session flyout preserves row-owned lifecycle while completing optional context", async () => {
	const { toAgentSessionFlyoutItem } = await loadSession();
	const item = sessionItem(
		{
			agentName: "Stale name",
			branch: "rovo/vita-142-vision-deck",
			host: "local",
			issueKey: "VITA-142",
			issueSummary: "Prepare vision deck",
			pullRequestNumber: 42,
			status: "stopped",
		},
		{
			agent: { avatarSrc: "/agents/vita.svg", kind: "agent", name: "Vita" },
			completedAtMs: 1_000,
			completedSecondsAgo: 30,
			elapsedSeconds: 90,
			host: "cloud",
			prStatus: "created",
			startedAtMs: 910,
		},
	);

	assert.deepEqual(toAgentSessionFlyoutItem(item), {
		agentAvatarSrc: "/agents/vita.svg",
		agentName: "Vita",
		branch: "rovo/vita-142-vision-deck",
		completedAtMs: 1_000,
		completedSecondsAgo: 30,
		host: "cloud",
		id: "lw-scope-thread",
		initialElapsedSeconds: 90,
		issueKey: "VITA-142",
		issueSummary: "Prepare vision deck",
		pullRequestNumber: 42,
		startedAtMs: 910,
		status: "pr-open",
		title: "Scope the migration",
	});
});

test("session flyout derives lifecycle, issue, and host fallbacks from a row", async () => {
	const { deriveIssueKeyFromBranch, toAgentSessionFlyoutItem } = await loadSession();

	assert.equal(deriveIssueKeyFromBranch("rovo/vita-142-vision-deck"), "VITA-142");
	assert.equal(deriveIssueKeyFromBranch("feature/vision-deck"), "feature/vision-deck");
	assert.equal(deriveIssueKeyFromBranch(undefined), "");

	assert.equal(toAgentSessionFlyoutItem(sessionItem(undefined)).host, "cloud");
	assert.equal(
		toAgentSessionFlyoutItem(sessionItem({ host: "local" })).host,
		"local",
	);
	assert.equal(
		toAgentSessionFlyoutItem(sessionItem(undefined, { state: "needs-input" })).status,
		"awaiting-input",
	);
	assert.equal(
		toAgentSessionFlyoutItem(sessionItem(undefined, { state: "attention" })).status,
		"awaiting-input",
	);
	assert.equal(
		toAgentSessionFlyoutItem(sessionItem(undefined, { state: "running" })).status,
		"running",
	);
	assert.equal(
		toAgentSessionFlyoutItem(sessionItem(undefined, { prStatus: "merged" })).status,
		"merged",
	);
});
