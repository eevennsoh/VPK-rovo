const assert = require("node:assert/strict");
const { test } = require("node:test");

const {
	areAllAgentLoadingAgentsFinished,
	getAgentLoadingSlots,
	shouldCycleAgentLoading,
} = require("./agent-loading-model.ts");

test("Agent loading cycles multiple agents until every agent is finished", () => {
	const workingAgents = [{ status: "working" }, { status: "finished" }];
	const finishedAgents = [{ status: "finished" }, { status: "finished" }];

	assert.equal(shouldCycleAgentLoading(workingAgents), true);
	assert.equal(areAllAgentLoadingAgentsFinished(workingAgents), false);
	assert.equal(shouldCycleAgentLoading(finishedAgents), false);
	assert.equal(areAllAgentLoadingAgentsFinished(finishedAgents), true);
	assert.equal(areAllAgentLoadingAgentsFinished([]), false);
});

test("Agent loading assigns front, back, and hidden slots and wraps safely", () => {
	const agents = ["Cursor", "Jira Coding agent", "Rovo"];

	assert.deepEqual(getAgentLoadingSlots(agents, 0), {
		front: "Cursor",
		back: "Jira Coding agent",
		hidden: "Rovo",
	});
	assert.deepEqual(getAgentLoadingSlots(agents, 3), {
		front: "Cursor",
		back: "Jira Coding agent",
		hidden: "Rovo",
	});
	assert.equal(getAgentLoadingSlots([], 0), null);
	assert.equal(getAgentLoadingSlots(["Cursor"], 0), null);
});
