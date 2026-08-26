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

test("Agent States composer keeps the agent mention directory enabled", () => {
	assert.match(
		SOURCE,
		/<PromptInputTextarea[\s\S]*?enableDirectoryAutocomplete\s*[\r\n]+\s*onChange=/u,
	);
	assert.doesNotMatch(SOURCE, /enableDirectoryAutocomplete=\{false\}/u);
});

test("Agent States composer cannot silently clear a prompt without a destination", () => {
	assert.match(SOURCE, /const canSubmit = Boolean\(onSubmit && reply\.trim\(\)\);/u);
	assert.match(SOURCE, /if \(!prompt \|\| !onSubmit\) return;\s*onSubmit\(prompt\);\s*setReply\(""\);/u);
	assert.match(SOURCE, /submitDisabled=\{onSubmit === undefined\}/u);
});

test("completed Agent States cards show a fixed update time instead of a live runtime", () => {
	assert.match(SOURCE, /import \{ ElapsedTime, RelativeTime \} from "@\/components\/ui\/elapsed-time";/u);
	assert.match(
		SOURCE,
		/state === "completed" \? \([\s\S]*<RelativeTime[\s\S]*secondsAgo=\{completedSecondsAgo\}[\s\S]*timestampMs=\{completedAtMs\}[\s\S]*\) : \([\s\S]*<ElapsedTime/u,
	);
});

test("Agent States demo exposes distinct content for each state", () => {
	assert.match(
		PAGE_SOURCE,
		/import \{ QUESTION_CARD_SINGLE_SELECT_DEMO \} from "@\/components\/blocks\/question-card\/data\/questions";/u,
	);
	assert.match(PAGE_SOURCE, /question=\{QUESTION_CARD_SINGLE_SELECT_DEMO\[0\]\}/u);
	assert.doesNotMatch(PAGE_SOURCE, /\bmessage=/u);
});

test("compact agent surfaces use their intended elevation treatment", () => {
	assert.match(SOURCE, /className=\{className\}/u);
	assert.doesNotMatch(SOURCE, /\bborder-0\b/u);
	assert.doesNotMatch(SOURCE, /\bshadow-md\b/u);
	assert.match(
		SOURCE,
		/<RovoComposerActionButton[\s\S]*experimentalDarkCta[\s\S]*onStartDictation=\{startPreviewDictation\}[\s\S]*showSubmitWhenEmpty/u,
	);
	assert.doesNotMatch(SOURCE, /liveVoiceEnabled/u);
	assert.doesNotMatch(SOURCE, /onToggleRealtimeVoice/u);
	assert.match(
		AGENT_PROFILE_SOURCE,
		/surface === "overlay" \? "shadow-2xl" : "shadow-sm"/u,
	);
	for (const source of [SOURCE, AGENT_PROFILE_SOURCE]) {
		assert.doesNotMatch(
			source,
			/shadow-\[0px_-2px_25px_rgba\(30,31,33,0\.08\)\]/u,
		);
	}
});

test("Jira Issue routes multi-agent flyouts through Agent List while Agent List owns Agent States", () => {
	assert.match(
		JIRA_ISSUE_SOURCE,
		/import \{ AgentList, type AgentListItem \} from "@\/components\/blocks\/agent-list";/u,
	);
	assert.match(JIRA_ISSUE_SOURCE, /<AgentList/u);
	assert.doesNotMatch(JIRA_ISSUE_SOURCE, /<AgentStates/u);
	assert.match(
		AGENT_LIST_SOURCE,
		/import \{[\s\S]*AgentStates,[\s\S]*\} from "@\/components\/blocks\/agent-states";/u,
	);
	assert.match(AGENT_LIST_SOURCE, /<AgentStates/u);
	assert.doesNotMatch(AGENT_LIST_SOURCE, /AgentProfileCard/u);
});
