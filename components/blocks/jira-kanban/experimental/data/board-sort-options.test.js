const assert = require("node:assert/strict");
const test = require("node:test");

const {
	BOARD_SORT_DEFAULT_ID,
	BOARD_SORT_OPTIONS,
	BOARD_SORT_ORDER_DEFAULT_ID,
	BOARD_SORT_ORDER_OPTIONS,
} = require("./board-sort-options.ts");

test("Display menu lists the production Jira sort fields in order", () => {
	assert.deepEqual(
		BOARD_SORT_OPTIONS.map((option) => option.label),
		["Rank", "Last updated", "Created", "Due date", "Priority", "Summary"],
	);
});

test("Display menu offers both sort directions", () => {
	assert.deepEqual(
		BOARD_SORT_ORDER_OPTIONS.map((option) => option.label),
		["Ascending", "Descending"],
	);
});

test("Display menu defaults resolve to real options", () => {
	assert.ok(BOARD_SORT_OPTIONS.some((option) => option.id === BOARD_SORT_DEFAULT_ID));
	assert.ok(BOARD_SORT_ORDER_OPTIONS.some((option) => option.id === BOARD_SORT_ORDER_DEFAULT_ID));
});
