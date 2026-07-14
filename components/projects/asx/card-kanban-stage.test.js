const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");

const STAGE_SOURCE = readFileSync(join(__dirname, "components/card-kanban-stage.tsx"), "utf8");
const AUTO_CYCLE_SOURCE = readFileSync(join(__dirname, "hooks/use-auto-cycle.ts"), "utf8");
const JIRA_ISSUE_SOURCE = readFileSync(join(__dirname, "../../blocks/jira-issue/index.tsx"), "utf8");
const AGENT_ACTIVITY_SOURCE = readFileSync(join(__dirname, "../../blocks/jira-issue/agent-activity.tsx"), "utf8");

test("Card Kanban keeps auto-cycling paused while a portalled agent flyout is open", () => {
	assert.match(STAGE_SOURCE, /setExternalInteractionActive,/u);
	assert.match(STAGE_SOURCE, /onAgentActivityOpenChange=\{setExternalInteractionActive\}/u);
	assert.match(AUTO_CYCLE_SOURCE, /setExternalInteractionActive: \(active: boolean\) => void;/u);
	assert.match(AUTO_CYCLE_SOURCE, /wrapperInteractingRef\.current \|\| externalInteractingRef\.current/u);
	assert.match(JIRA_ISSUE_SOURCE, /onAgentActivityOpenChange\?: \(open: boolean\) => void;/u);
	assert.match(JIRA_ISSUE_SOURCE, /onOpenChange=\{onAgentActivityOpenChange\}/u);
	assert.match(AGENT_ACTIVITY_SOURCE, /<HoverCard onOpenChange=\{onOpenChange\}>/u);
});
