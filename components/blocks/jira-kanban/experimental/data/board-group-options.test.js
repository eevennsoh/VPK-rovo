const assert = require("node:assert/strict");
const test = require("node:test");

const { BOARD_GROUP_DEFAULT_ID, BOARD_GROUP_OPTIONS } = require("./board-group-options.ts");

test("Group picker lists the production Jira dimensions in order", () => {
	assert.deepEqual(
		BOARD_GROUP_OPTIONS.map((option) => option.label),
		["Agent", "Assignee", "Atlassian Project", "Epic", "Labels", "Priority", "Subtask"],
	);
});

test("Group picker default resolves to a real dimension", () => {
	assert.ok(BOARD_GROUP_OPTIONS.some((option) => option.id === BOARD_GROUP_DEFAULT_ID));
});
