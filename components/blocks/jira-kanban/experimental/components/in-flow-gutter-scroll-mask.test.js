const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");

const {
	IN_FLOW_GUTTER_SCROLLPORT_SELECTOR,
	isInFlowGutterScrollMaskActive,
} = require("./in-flow-gutter-scroll-mask.ts");

const HOOK_SOURCE = readFileSync(
	join(__dirname, "use-in-flow-gutter-scroll-mask.ts"),
	"utf8",
);

test("the gutter mask stays off at rest and turns on once horizontal scrolling starts", () => {
	assert.equal(isInFlowGutterScrollMaskActive(0), false);
	assert.equal(isInFlowGutterScrollMaskActive(0.4), true);
	assert.equal(isInFlowGutterScrollMaskActive(1), true);
	assert.equal(isInFlowGutterScrollMaskActive(240), true);
});

test("the gutter mask watches the existing Board and List scrollports", () => {
	assert.match(IN_FLOW_GUTTER_SCROLLPORT_SELECTOR, /data-jira-kanban-scrollport/u);
	assert.match(IN_FLOW_GUTTER_SCROLLPORT_SELECTOR, /jira-list-table-scroll/u);
	assert.match(HOOK_SOURCE, /parent\.querySelector<HTMLElement>\(\s*IN_FLOW_GUTTER_SCROLLPORT_SELECTOR/u);
	assert.doesNotMatch(HOOK_SOURCE, /window\.addEventListener\("scroll"/u);
});
