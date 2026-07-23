const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");

const WORKSPACE_SOURCE = readFileSync(
	join(__dirname, "jira-for-you-workspace.tsx"),
	"utf8",
);

test("unassigned items route to embedded canonical Agent Sessions", () => {
	assert.match(
		WORKSPACE_SOURCE,
		/type JiraForYouWorkspaceMode =[\s\S]*kind: "feed"[\s\S]*kind: "assigned-chat"[\s\S]*kind: "unassigned-agent-session"/u,
	);
	assert.match(
		WORKSPACE_SOURCE,
		/<JiraForYouAgentSessionsWorkspace[\s\S]*workItem=\{unassignedItemData\.workItem\}/u,
	);
	assert.doesNotMatch(WORKSPACE_SOURCE, /JiraForYouWorkItemDialog|dialogItem|Rovo Dev/u);
	assert.match(WORKSPACE_SOURCE, /onItemClick=\{\(item\) => handleItemActivate\(item, "row"\)\}/u);
	assert.match(WORKSPACE_SOURCE, /onView=\{\(item\) => handleItemActivate\(item, "view"\)\}/u);
});
