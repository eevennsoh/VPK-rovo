const assert = require("node:assert/strict");
const test = require("node:test");

const {
	BOARD_COLUMN_COLLAPSED_WIDTH_PX,
	BOARD_COLUMN_WIDTH_PX,
	EMPTY_COLLAPSED_BOARD_COLUMNS,
	getBoardColumnOuterWidthPx,
	isBoardColumnCollapsed,
	toggleCollapsedBoardColumn,
} = require("./board-column-collapse.ts");

test("toggling an expanded column collapses it without mutating the previous set", () => {
	const collapsed = toggleCollapsedBoardColumn(EMPTY_COLLAPSED_BOARD_COLUMNS, "In progress");

	assert.equal(isBoardColumnCollapsed(collapsed, "In progress"), true);
	assert.equal(EMPTY_COLLAPSED_BOARD_COLUMNS.size, 0);
});

test("toggling a collapsed column expands it again", () => {
	const collapsed = toggleCollapsedBoardColumn(EMPTY_COLLAPSED_BOARD_COLUMNS, "In progress");
	const expanded = toggleCollapsedBoardColumn(collapsed, "In progress");

	assert.equal(isBoardColumnCollapsed(expanded, "In progress"), false);
	assert.equal(isBoardColumnCollapsed(collapsed, "In progress"), true);
});

test("collapse state is per column", () => {
	let collapsed = toggleCollapsedBoardColumn(EMPTY_COLLAPSED_BOARD_COLUMNS, "In progress");
	collapsed = toggleCollapsedBoardColumn(collapsed, "Done");
	collapsed = toggleCollapsedBoardColumn(collapsed, "In progress");

	assert.equal(isBoardColumnCollapsed(collapsed, "In progress"), false);
	assert.equal(isBoardColumnCollapsed(collapsed, "Done"), true);
	assert.equal(isBoardColumnCollapsed(collapsed, "To do"), false);
});

test("outer width reserves the transparent drop-target border on both edges", () => {
	assert.equal(getBoardColumnOuterWidthPx(false), BOARD_COLUMN_WIDTH_PX + 4);
	assert.equal(getBoardColumnOuterWidthPx(true), BOARD_COLUMN_COLLAPSED_WIDTH_PX + 4);
	assert.equal(getBoardColumnOuterWidthPx(false), 280);
	assert.equal(getBoardColumnOuterWidthPx(true), 36);
});
