const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");

const ITEM_SOURCE = readFileSync(join(__dirname, "jira-for-you-item.tsx"), "utf8");

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
});
