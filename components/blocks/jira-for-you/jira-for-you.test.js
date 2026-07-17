const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");

const ITEM_SOURCE = readFileSync(join(__dirname, "jira-for-you-item.tsx"), "utf8");
const DATA_SOURCE = readFileSync(join(__dirname, "data.ts"), "utf8");

test("CRM analytics activity summarizes each agent status", () => {
	assert.match(
		DATA_SOURCE,
		/id: "crm-analytics-dashboard"[\s\S]*agents: \[READINESS_AGENT, REVIEWER_AGENT, FEEDBACK_AGENT\][\s\S]*status: "1 Awaiting user response, 2 In progress"/,
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
});
