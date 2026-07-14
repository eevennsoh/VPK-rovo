const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");

const PAGE_SOURCE = readFileSync(join(__dirname, "page.tsx"), "utf8");
const STAGE_SOURCE = readFileSync(join(__dirname, "components/work-item-stage.tsx"), "utf8");
const CONTROLLER_SOURCE = readFileSync(
	join(__dirname, "../../blocks/agent-sessions/experimental/use-agent-sessions-controller.ts"),
	"utf8",
);

test("ASX Work item opens the experimental Agent Sessions design from its state buttons", () => {
	assert.match(PAGE_SOURCE, /item\.id === "work-item"[\s\S]*<WorkItemStage \/>/u);
	assert.match(STAGE_SOURCE, /<ExperimentalAgentSessions/u);
	assert.match(STAGE_SOURCE, /function openPreset[\s\S]*setPreset\(nextPreset\);[\s\S]*setIsOpen\(true\);/u);
	assert.match(STAGE_SOURCE, /aria-label="Open a work item state"/u);
	assert.doesNotMatch(STAGE_SOURCE, /Open work item/u);
});

test("ASX Work item can jump between all requested presets", () => {
	assert.match(STAGE_SOURCE, /label: "Empty", value: "empty"/u);
	assert.match(STAGE_SOURCE, /label: "Filled", value: "filled"/u);
	assert.match(STAGE_SOURCE, /label: "Agents running", value: "running"/u);
	assert.doesNotMatch(STAGE_SOURCE, /controls=/u);
	assert.match(CONTROLLER_SOURCE, /dispatch\(\{ type: "hydrate-preset", preset: initialPreset \}\)/u);
});
