const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { test } = require("node:test");

const {
	AGENT_LOADING_SIZE_PX,
	areAllAgentLoadingAgentsFinished,
	getAgentLoadingSlotStyle,
	getAgentLoadingSlots,
	listAgentLoadingSlots,
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
	assert.deepEqual(listAgentLoadingSlots({
		front: "Cursor",
		back: "Jira Coding agent",
		hidden: "Rovo",
	}), [
		{ agent: "Rovo", slot: "hidden" },
		{ agent: "Jira Coding agent", slot: "back" },
		{ agent: "Cursor", slot: "front" },
	]);
	assert.deepEqual(getAgentLoadingSlotStyle("front"), {
		x: 0,
		y: 0,
		scale: 1,
		opacity: 1,
		zIndex: 3,
	});
	assert.deepEqual(getAgentLoadingSlotStyle("back"), {
		x: 12,
		y: 12,
		scale: 0.75,
		opacity: 0.8,
		zIndex: 2,
	});
	assert.deepEqual(getAgentLoadingSlotStyle("hidden"), {
		x: 0,
		y: 20,
		scale: 0.25,
		opacity: 0,
		zIndex: 1,
	});
});

test("Agent loading exposes visible status copy, size variants, and uses VPK motion tokens", () => {
	assert.deepEqual(AGENT_LOADING_SIZE_PX, { default: 24, small: 16 });
	assert.match(COMPONENT_SOURCE, /return <span className="sr-only">\{announcement\}\. <\/span>/u);
	assert.match(COMPONENT_SOURCE, /<span className="min-w-0 self-center whitespace-nowrap text-sm text-text">/u);
	assert.doesNotMatch(COMPONENT_SOURCE, /<span aria-hidden="true" className="min-w-0 self-center/u);
	assert.match(COMPONENT_SOURCE, /AGENT_LOADING_SWAP_MS = 150; \/\/ duration-normal/u);
	assert.match(COMPONENT_SOURCE, /duration: 0\.15, ease: \[0\.4, 1, 0\.6, 1\] \}; \/\/ duration-normal \+ ease-out-practical/u);
	assert.match(COMPONENT_SOURCE, /duration: 0\.1, ease: \[0\.6, 0, 0\.8, 0\.6\] \}; \/\/ duration-fast \+ ease-in/u);
	assert.match(COMPONENT_SOURCE, /from "motion\/react"/u);
	assert.match(COMPONENT_SOURCE, /size = "default"/u);
	assert.match(COMPONENT_SOURCE, /data-size=\{size\}/u);
	assert.match(MOTION_SOURCE, /&\[data-size="small"\]/u);
	assert.match(MOTION_SOURCE, /transform: scale\(calc\(4 \/ 6\)\)/u);
	assert.doesNotMatch(MOTION_SOURCE, /@keyframes agent-loading-/u);
});
