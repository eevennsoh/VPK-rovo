const assert = require("node:assert/strict");
const test = require("node:test");

const { BOARD_GROUP_OPTIONS } = require("./board-group-options.ts");

test("Group picker lists the production Jira dimensions in order", () => {
	assert.deepEqual(
		BOARD_GROUP_OPTIONS.map((option) => option.label),
		["Agent", "Assignee", "Atlassian Project", "Epic", "Labels", "Priority", "Subtask"],
	);
});
