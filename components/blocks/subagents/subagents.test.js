const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");

const SUBAGENTS_PAGE_SOURCE = readFileSync(join(__dirname, "page.tsx"), "utf8");
const SUBAGENTS_NAVIGATOR_SOURCE = readFileSync(join(__dirname, "subagents-navigator.tsx"), "utf8");
const SUBAGENTS_INDEX_SOURCE = readFileSync(join(__dirname, "index.ts"), "utf8");
const BLOCK_DETAILS_SOURCE = readFileSync(
	join(__dirname, "..", "..", "..", "app", "data", "details", "blocks.ts"),
	"utf8",
);

test("Subagents uses the compact agent config surface instead of chat messages", () => {
	assert.match(SUBAGENTS_PAGE_SOURCE, /AgentConfigFields/u);
	assert.match(SUBAGENTS_PAGE_SOURCE, /layout="compact"/u);
	assert.match(SUBAGENTS_PAGE_SOURCE, /type SubagentsAgent/u);
	assert.match(SUBAGENTS_PAGE_SOURCE, /initialAgents\?: ReadonlyArray<SubagentsAgent>/u);
	assert.doesNotMatch(SUBAGENTS_PAGE_SOURCE, /MessageContent/u);
	assert.doesNotMatch(SUBAGENTS_PAGE_SOURCE, /SubagentsMessage/u);
	assert.doesNotMatch(SUBAGENTS_PAGE_SOURCE, /mock-thread/u);
	assert.doesNotMatch(SUBAGENTS_INDEX_SOURCE, /SubagentsMessage|mock-thread/u);
});

test("Subagents switcher exposes the empty-state create action and grouped panel", () => {
	assert.match(SUBAGENTS_NAVIGATOR_SOURCE, /Create subagent/u);
	assert.match(SUBAGENTS_NAVIGATOR_SOURCE, /onCreateSubagent/u);
	assert.match(SUBAGENTS_NAVIGATOR_SOURCE, /Subagents/u);
	assert.match(SUBAGENTS_NAVIGATOR_SOURCE, /Open subagent switcher/u);
	assert.match(SUBAGENTS_NAVIGATOR_SOURCE, /event\.key === "Escape"/u);
});

test("Subagents docs describe agent configs instead of timeline messages", () => {
	const subagentsDetailsStart = BLOCK_DETAILS_SOURCE.indexOf("subagents: {");
	const terminalSwitchStart = BLOCK_DETAILS_SOURCE.indexOf('"terminal-switch"', subagentsDetailsStart);
	const subagentsDetails = BLOCK_DETAILS_SOURCE.slice(subagentsDetailsStart, terminalSwitchStart);

	assert.match(subagentsDetails, /SubagentsAgent/u);
	assert.match(subagentsDetails, /initialAgents/u);
	assert.match(subagentsDetails, /master orchestrator/u);
	assert.doesNotMatch(subagentsDetails, /SubagentsMessage/u);
	assert.doesNotMatch(subagentsDetails, /Chat transcript/u);
});
