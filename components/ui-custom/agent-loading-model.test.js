const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { test } = require("node:test");

const {
	areAllAgentLoadingAgentsFinished,
	getAgentLoadingSlots,
	shouldCycleAgentLoading,
} = require("./agent-loading-model.ts");

const COMPONENT_SOURCE = readFileSync(`${__dirname}/agent-loading.tsx`, "utf8");
const MOTION_SOURCE = readFileSync(`${__dirname}/../../app/tailwind-theme-agent-loading.css`, "utf8");

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

test("Agent loading exposes visible status copy and uses VPK motion tokens", () => {
	assert.match(COMPONENT_SOURCE, /return <span className="sr-only">\{announcement\}\. <\/span>/u);
	assert.match(COMPONENT_SOURCE, /<span className="min-w-0 self-center whitespace-nowrap text-sm text-text">/u);
	assert.doesNotMatch(COMPONENT_SOURCE, /<span aria-hidden="true" className="min-w-0 self-center/u);
	assert.match(COMPONENT_SOURCE, /AGENT_LOADING_SWAP_MS = 150; \/\/ duration-normal/u);
	assert.match(MOTION_SOURCE, /--agent-loading-swap-duration: var\(--duration-normal\)/u);
	assert.match(MOTION_SOURCE, /--agent-loading-swap-easing: var\(--ease-out-practical\)/u);
});
