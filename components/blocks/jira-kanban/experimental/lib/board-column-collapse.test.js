const assert = require("node:assert/strict");
const test = require("node:test");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");

const BOARD_SOURCE = readFileSync(
	join(__dirname, "../experimental-jira-kanban.tsx"),
	"utf8",
);
const IN_FLOW_SOURCE = readFileSync(
	join(__dirname, "../components/in-flow-agent-session-column.tsx"),
	"utf8",
);
const COLLAPSED_COLUMN_SOURCE = readFileSync(
	join(__dirname, "../components/collapsed-board-column.tsx"),
	"utf8",
);
const V2_BOARD_SOURCE = readFileSync(
	join(__dirname, "../../experimental-v2/experimental-v2-jira-kanban.tsx"),
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
	assert.match(
		PAGE_SOURCE,
		/<ExperimentalJiraKanbanBoardHeader[\s\S]*boardColumns=\{boardColumns\}[\s\S]*collapsedColumns=\{collapsedColumns\}[\s\S]*onCollapsedColumnsChange=\{setCollapsedColumns\}/u,
	);
});

test("the resize button swaps its icon without using selected button state", () => {
	const resizeButtonStart = COLLAPSED_COLUMN_SOURCE.indexOf("function BoardColumnResizeButton");
	const resizeButtonEnd = COLLAPSED_COLUMN_SOURCE.indexOf("/**", resizeButtonStart);
	const resizeButtonSource = COLLAPSED_COLUMN_SOURCE.slice(resizeButtonStart, resizeButtonEnd);

	assert.match(resizeButtonSource, /collapsed\s*\?\s*<GrowHorizontalIcon/u);
	assert.match(resizeButtonSource, /:\s*<ShrinkHorizontalIcon/u);
	assert.match(
		resizeButtonSource,
		/aria-label=\{collapsed \? `Expand \$\{title\} column` : `Collapse \$\{title\} column`\}/u,
	);
	assert.match(
		resizeButtonSource,
		/<TooltipContent>\{collapsed \? "Expand" : "Collapse"\}<\/TooltipContent>/u,
	);
	assert.doesNotMatch(resizeButtonSource, /"Expand column"|"Collapse column"/u);
	assert.doesNotMatch(resizeButtonSource, /aria-(?:expanded|pressed)=/u);
});

test("the pinned session column shares the status columns' box model", () => {
	// Status columns carry a 2px transparent drop-target border, so the pinned
	// wrapper keeps top/left/bottom or the headers sit 2px apart. It drops the
	// right edge — a 2px stroke there reads as a white seam against `bg-surface`.
	// The column itself is the Untracked drop zone; the ring lights when armed.
	assert.match(
		IN_FLOW_SOURCE,
		/className=\{cn\(\s*"flex min-h-0 shrink-0 border-2 border-r-0 ps-6",\s*untrackedDropArmed \? "border-ring" : "border-transparent",\s*className,\s*\)\}/u,
	);
	assert.match(IN_FLOW_SOURCE, /data-board-agent-session-drop-zone="untracked"/u);
});

test("a collapsed status pill hugs its label while the shell keeps the drop lane", () => {
	const pillStart = COLLAPSED_COLUMN_SOURCE.indexOf("function CollapsedBoardColumn");
	const pillEnd = COLLAPSED_COLUMN_SOURCE.length;
	assert.ok(pillStart !== -1, "expected to find CollapsedBoardColumn");
	const pillSource = COLLAPSED_COLUMN_SOURCE.slice(pillStart, pillEnd);

	// A status is a label. Stretched down a 700px board it reads as an empty
	// lane with a caption on top, so the pill sizes to its own content. The
	// Agent Session column is the deliberate exception — it collapses into a
	// rail of notches, which is content, and keeps `h-full`.
	assert.doesNotMatch(pillSource, /(?:^|[^-\w])h-full\b/u);
	// The shell around it still stretches, so a collapsed column is as easy to
	// drop onto as an expanded one. `min-h-full` on the row is the shell, not
	// the pill — do not treat that as the pill stretching.
	assert.match(BOARD_SOURCE, /className=\{cn\(\s*"flex min-h-full w-max min-w-full items-stretch"/u);

	// The expand control's focus ring extends 3px past a 24px button, which is
	// exactly the 30px inside this 32px pill's border. Clipping to the padding
	// box slices the ring flat on both sides, and nothing in the pill can
	// overflow anyway — the title carries its own `truncate`.
	assert.doesNotMatch(pillSource, /overflow-hidden/u);
	assert.match(pillSource, /min-h-0 truncate/u);
	// The shell still clips for the width transition, which is what that
	// `overflow-hidden` was ever needed for.
	assert.match(BOARD_SOURCE, /collapsed \|\| isResizing \? "overflow-hidden" : "overflow-visible"/u);
});

test("caption chrome keeps the collapsed count above the pill border", () => {
	const captionStart = COLLAPSED_COLUMN_SOURCE.indexOf('case "caption":');
	const enclosedStart = COLLAPSED_COLUMN_SOURCE.indexOf('case "enclosed":');
	assert.ok(captionStart !== -1, "expected a caption branch");
	assert.ok(enclosedStart > captionStart, "expected enclosed after caption");
	const captionSource = COLLAPSED_COLUMN_SOURCE.slice(captionStart, enclosedStart);

	assert.match(captionSource, /paddingBottom: chrome\.captionPaddingBottom/u);
	assert.match(COLLAPSED_COLUMN_SOURCE, /relative flex h-6 w-full items-center justify-center/u);
	const countRowIndex = captionSource.indexOf("{countRow}");
	const pillClassIndex = captionSource.indexOf("chrome.pillClassName");
	const writingModeIndex = COLLAPSED_COLUMN_SOURCE.indexOf("[writing-mode:vertical-rl]");
	assert.ok(
		countRowIndex > 0 && pillClassIndex > countRowIndex,
		"expected the count above the pill paint",
	);
	assert.ok(writingModeIndex > 0, "expected the rotated title");
	assert.match(captionSource, /style=\{pillStyle\}/u);
	assert.match(captionSource, /flex-col items-center justify-center/u);
	assert.doesNotMatch(captionSource, /paddingBlockStart: token\("space\.150"\)/u);
	assert.doesNotMatch(captionSource, /paddingBlockEnd: token\("space\.050"\)/u);
});

test("enclosed chrome puts the collapsed count inside the framed box", () => {
	const enclosedStart = COLLAPSED_COLUMN_SOURCE.indexOf('case "enclosed":');
	assert.ok(enclosedStart !== -1, "expected an enclosed branch");
	const enclosedSource = COLLAPSED_COLUMN_SOURCE.slice(enclosedStart);

	const pillClassIndex = enclosedSource.indexOf("chrome.pillClassName");
	const countRowIndex = enclosedSource.indexOf("{countRow}");
	const titleIndex = enclosedSource.indexOf("{titleLabel}");
	assert.ok(pillClassIndex > 0, "expected pill paint on the framed box");
	assert.ok(
		countRowIndex > pillClassIndex,
		"expected the count inside the framed box",
	);
	assert.ok(
		titleIndex > countRowIndex,
		"expected the rotated title after the count, still inside the box",
	);
	assert.match(enclosedSource, /paddingBlock: chrome\.pillPaddingBlock/u);
	assert.match(enclosedSource, /paddingTop: chrome\.countPaddingTop/u);
	assert.ok(
		enclosedSource.indexOf("paddingTop: chrome.countPaddingTop") < countRowIndex,
		"expected the expanded-header inset above the count",
	);
	assert.ok(
		enclosedSource.indexOf("paddingBlock: chrome.pillPaddingBlock") > countRowIndex,
		"expected title padding below the count so the number shares Untracked's 24px slot",
	);
	assert.doesNotMatch(enclosedSource, /captionPaddingBottom/u);
	assert.doesNotMatch(enclosedSource, /overflow-hidden/u);
	assert.match(COLLAPSED_COLUMN_SOURCE, /chrome: KanbanCollapsedChromeStyles/u);
	assert.match(COLLAPSED_COLUMN_SOURCE, /headerFrame: AgentSessionColumnFrame/u);
	assert.match(
		BOARD_SOURCE,
		/chrome=\{chrome\.collapsed\}[\s\S]*headerFrame=\{chrome\.headerFrame\}/u,
	);
	assert.match(BOARD_SOURCE, /data-kanban-column-chrome=\{columnChrome\}/u);
});

test("experimental-v2 reuses the shared collapsed column and threads chrome", () => {
	assert.match(
		V2_BOARD_SOURCE,
		/from "\.\.\/experimental\/components\/collapsed-board-column"/u,
		"experimental-v2 must reuse the extracted collapsed column, not fork another copy",
	);
	assert.match(
		V2_BOARD_SOURCE,
		/chrome=\{chrome\.collapsed\}[\s\S]*headerFrame=\{chrome\.headerFrame\}/u,
	);
	assert.match(V2_BOARD_SOURCE, /data-kanban-column-chrome=\{columnChrome\}/u);
	assert.doesNotMatch(V2_BOARD_SOURCE, /function CollapsedBoardColumn/u);
});
