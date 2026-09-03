const assert = require("node:assert/strict");
const test = require("node:test");

async function loadAttention() {
	return import("./use-assigned-agent-attention.ts");
}

test("first-seen attention statuses are not treated as changes", async () => {
	const { resolveAssignedAgentAttentionChanges } = await loadAttention();
	const { changedIds } = resolveAssignedAgentAttentionChanges(
		[
			{ id: "release-notes-drafter", statusKind: "needs-input" },
			{ id: "code-reviewer", statusKind: "finished" },
		],
		new Map(),
	);

	assert.deepEqual(changedIds, []);
});

test("later status changes clear only the agents that actually changed", async () => {
	const { resolveAssignedAgentAttentionChanges } = await loadAttention();
	const previousKinds = new Map([
		["release-notes-drafter", "needs-input"],
		["code-reviewer", "working"],
	]);
	const { changedIds } = resolveAssignedAgentAttentionChanges(
		[
			{ id: "release-notes-drafter", statusKind: "needs-input" },
			{ id: "code-reviewer", statusKind: "finished" },
		],
		previousKinds,
	);

	assert.deepEqual(changedIds, ["code-reviewer"]);
});
