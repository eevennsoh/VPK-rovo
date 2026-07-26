const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");

const SOURCE = readFileSync(join(__dirname, "index.tsx"), "utf8");
const JIRA_ISSUE_SOURCE = readFileSync(
	join(__dirname, "../jira-issue/agent-activity.tsx"),
	"utf8",
);
const AGENT_LIST_SOURCE = readFileSync(
	join(__dirname, "../agent-list/agent-list-card.tsx"),
	"utf8",
);

test("Agent States owns the shared Jira agent flyout surface", () => {
	assert.match(SOURCE, /export type AgentStatesState = "working" \| "awaiting-input" \| "completed";/u);
	assert.match(SOURCE, /export interface AgentStatesProps/u);
	assert.match(SOURCE, /data-slot="agent-states"/u);
	assert.match(SOURCE, /w-\[400px\][\s\S]*bg-surface-overlay[\s\S]*shadow-2xl/u);
	assert.match(SOURCE, /<AgentCardHeader/u);
	assert.match(SOURCE, /<ElapsedTime/u);
	assert.match(SOURCE, /<AgentStatesComposer onSubmit=\{onSubmit\} \/>/u);
	assert.match(SOURCE, /state === "awaiting-input" && question/u);
});

test("Jira Issue and Agent List consume Agent States instead of local flyout cards", () => {
	assert.match(
		JIRA_ISSUE_SOURCE,
		/import \{ AgentStates \} from "@\/components\/blocks\/agent-states";/u,
	);
	assert.match(JIRA_ISSUE_SOURCE, /<AgentStates/u);
	assert.match(
		AGENT_LIST_SOURCE,
		/import \{[\s\S]*AgentStates,[\s\S]*\} from "@\/components\/blocks\/agent-states";/u,
	);
	assert.match(AGENT_LIST_SOURCE, /<AgentStates/u);
	assert.doesNotMatch(AGENT_LIST_SOURCE, /AgentProfileCard/u);
});
