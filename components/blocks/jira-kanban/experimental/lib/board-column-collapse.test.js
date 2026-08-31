const assert = require("node:assert/strict");
const test = require("node:test");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");

const BOARD_SOURCE = readFileSync(
	join(__dirname, "../experimental-jira-kanban.tsx"),
	"utf8",
);
const PAGE_SOURCE = readFileSync(join(__dirname, "../page.tsx"), "utf8");

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

test("collapse survives a switch to the list or Pulse view", () => {
	// The page renders the board in a ternary beside Pulse and the list, so a
	// view switch unmounts it. Collapse is a deliberate viewer choice, so the
	// state lives above that branch and the board accepts it as controlled.
	assert.match(BOARD_SOURCE, /collapsedColumns\?: CollapsedBoardColumns;/u);
	assert.match(BOARD_SOURCE, /onCollapsedColumnsChange\?: \(collapsedColumns: CollapsedBoardColumns\) => void;/u);
	assert.match(BOARD_SOURCE, /const collapsedColumns = controlledCollapsedColumns \?\? uncontrolledCollapsedColumns;/u);
	// A controlled host stays the single source of truth.
	assert.match(BOARD_SOURCE, /if \(controlledCollapsedColumns === undefined\) \{/u);
	// The page that owns the view switch owns the state.
	assert.match(PAGE_SOURCE, /const \[collapsedColumns, setCollapsedColumns\] = useState\(\s*EMPTY_COLLAPSED_BOARD_COLUMNS,?\s*\)/u);
	assert.match(PAGE_SOURCE, /collapsedColumns=\{collapsedColumns\}/u);
	assert.match(PAGE_SOURCE, /onCollapsedColumnsChange=\{setCollapsedColumns\}/u);
});

test("the pinned session column shares the status columns' box model", () => {
	// Status columns carry a 2px transparent drop-target border, so the pinned
	// wrapper needs it too or the headers sit 2px apart and the gap runs short.
	assert.match(BOARD_SOURCE, /className="flex min-h-0 shrink-0 border-2 border-transparent ps-6"/u);
});
