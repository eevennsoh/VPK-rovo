const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");

const SOURCE = readFileSync(join(__dirname, "index.tsx"), "utf8");
const PAGE_SOURCE = readFileSync(join(__dirname, "page.tsx"), "utf8");
const JIRA_ISSUE_SOURCE = readFileSync(
	join(__dirname, "../jira-issue/agent-activity.tsx"),
	"utf8",
);
const AGENT_LIST_SOURCE = readFileSync(
	join(__dirname, "../agent-list/agent-list-card.tsx"),
	"utf8",
);
const AGENT_PROFILE_SOURCE = readFileSync(
	join(__dirname, "../../ui-custom/entity-card/agent-profile.tsx"),
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

test("Agent States demo exposes distinct content for each state", () => {
	assert.match(
		PAGE_SOURCE,
		/import \{ QUESTION_CARD_SINGLE_SELECT_DEMO \} from "@\/components\/blocks\/question-card\/data\/questions";/u,
	);
	assert.match(PAGE_SOURCE, /question=\{QUESTION_CARD_SINGLE_SELECT_DEMO\[0\]\}/u);
	assert.doesNotMatch(PAGE_SOURCE, /\bmessage=/u);
});

test("compact agent composers use the shared raised elevation treatment", () => {
	for (const source of [SOURCE, AGENT_PROFILE_SOURCE]) {
		assert.match(source, /\bshadow-md\b/u);
		assert.doesNotMatch(
			source,
			/shadow-\[0px_-2px_25px_rgba\(30,31,33,0\.08\)\]/u,
		);
	}
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
