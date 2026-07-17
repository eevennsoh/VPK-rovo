const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");

const ITEM_SOURCE = readFileSync(join(__dirname, "jira-for-you-item.tsx"), "utf8");
const DATA_SOURCE = readFileSync(join(__dirname, "data.ts"), "utf8");
const STATUS_SOURCE = readFileSync(join(__dirname, "jira-for-you-status.tsx"), "utf8");

test("CRM analytics activity summarizes each agent status", () => {
	assert.match(
		DATA_SOURCE,
		/id: "crm-analytics-dashboard"[\s\S]*agents: \[READINESS_AGENT, REVIEWER_AGENT, FEEDBACK_AGENT\][\s\S]*status: "1 Awaiting user response, 2 In progress"/,
	);
});

test("every In progress row exposes the stop action", () => {
	const inProgressSection = DATA_SOURCE.match(
		/id: "in-progress"[\s\S]*?\n\t\},\n\t\{\n\t\tid: "to-do"/,
	)?.[0];

	assert.ok(inProgressSection);
	assert.equal(inProgressSection.match(/isRunning: true/g)?.length, 3);
});

test("every row has a read-only Jira status lozenge", () => {
	assert.equal(DATA_SOURCE.match(/jiraStatus: /g)?.length, 10);
	assert.match(ITEM_SOURCE, /<ItemActions[\s\S]*<JiraForYouStatusLozenge value=\{item\.jiraStatus\} \/>/);
	assert.match(STATUS_SOURCE, /<Lozenge variant=\{STATUS_VARIANTS\[value\]\}>\{value\}<\/Lozenge>/);
	assert.doesNotMatch(STATUS_SOURCE, /DropdownMenu|onChange|LozengeDropdownTrigger/);
	assert.match(STATUS_SOURCE, /"Human review": "warning"/);
	assert.match(STATUS_SOURCE, /"In progress": "information"/);
	assert.match(STATUS_SOURCE, /"In review": "information"/);
	assert.match(STATUS_SOURCE, /"To do": "neutral"/);
	assert.match(STATUS_SOURCE, /Done: "success"/);
});

test("Jira For You rows place agent activity before issue metadata", () => {
	assert.match(
		ITEM_SOURCE,
		/\{item\.title\}[\s\S]*<span className="flex w-full min-w-0 items-center gap-1 text-xs text-text-subtlest">[\s\S]*<AgentAvatarCluster agents=\{item\.agents\} \/>[\s\S]*\{item\.status\}[\s\S]*<MetadataDot \/>[\s\S]*\{meta\.label\}[\s\S]*\{item\.issueKey\}[\s\S]*\{item\.spaceName\}/,
	);
});

test("Jira For You sparkle action opens the shared Jira issue generative menu", () => {
	assert.match(
		ITEM_SOURCE,
		/import \{ JiraIssueGenerativeActionMenu \} from "@\/components\/blocks\/jira-issue\/generative-action-menu";/,
	);
	assert.match(
		ITEM_SOURCE,
		/const generativeTrigger = \([\s\S]*aria-label="Ask Rovo about this work item"[\s\S]*<GenerativeIndicatorIcon label="" \/>[\s\S]*<JiraIssueGenerativeActionMenu[\s\S]*issue=\{\{ issueKey: item\.issueKey, summary: item\.title \}\}[\s\S]*triggerElement=\{generativeTrigger\}/,
	);
	assert.match(ITEM_SOURCE, /onClick=\{\(event\) => event\.stopPropagation\(\)\}/);
	assert.match(
		ITEM_SOURCE,
		/has-\[button\[aria-expanded=true\]\]:pointer-events-auto has-\[button\[aria-expanded=true\]\]:opacity-100/,
		"the For You row actions should remain visible while the generative menu is open",
	);
	assert.match(ITEM_SOURCE, /data-slot="jira-for-you-actions"/);
	assert.match(ITEM_SOURCE, /group-has-\[\[data-slot=jira-for-you-row-button\]:hover\]:pointer-events-auto/);
	assert.match(ITEM_SOURCE, /group-has-\[\[data-slot=jira-for-you-row-button\]:focus-visible\]:pointer-events-auto/);
	assert.doesNotMatch(ITEM_SOURCE, /group-focus-within/);
	assert.match(ITEM_SOURCE, /absolute top-1\/2 right-0 flex -translate-y-1\/2 items-center gap-1 opacity-0/);
	assert.doesNotMatch(ITEM_SOURCE, /bg-linear-to-l|from-bg-neutral-subtle-hovered|to-transparent/);
});
