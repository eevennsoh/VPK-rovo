/**
 * Board View menu source contracts.
 *
 * Split out of `pulse/pulse-source-contracts.test.js`: these assertions are
 * about the board header's View settings menu, not about Pulse, and keeping
 * them there pushed that suite past the repo's 1000-line file-size budget.
 * Reads sources directly rather than borrowing the Pulse harness, which is
 * scoped to the Pulse tree.
 */

const assert = require("node:assert/strict");
const { test } = require("node:test");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");

const EXPERIMENTAL_DIR = join(__dirname, "..");
const EXPERIMENTAL_HEADER_SOURCE = readFileSync(
	join(EXPERIMENTAL_DIR, "experimental-board-header.tsx"),
	"utf8",
);

/** Executable text only, so a comment naming a banned token cannot fail a scan. */
function withoutComments(source) {
	return source.replace(/\/\*[\s\S]*?\*\//gu, "").replace(/\/\/[^\n]*/gu, "");
}

test("Experimental board header opens the production View picker without changing the board", () => {
	const viewMenu = readFileSync(join(EXPERIMENTAL_DIR, "components", "board-view-menu.tsx"), "utf8");
	const groupOptions = readFileSync(join(EXPERIMENTAL_DIR, "data", "board-group-options.ts"), "utf8");
	const sortOptions = readFileSync(join(EXPERIMENTAL_DIR, "data", "board-sort-options.ts"), "utf8");
	const viewOptions = readFileSync(join(EXPERIMENTAL_DIR, "data", "board-view-options.ts"), "utf8");
	assert.match(EXPERIMENTAL_HEADER_SOURCE, /<BoardViewMenu compact=\{compact\} surfaceLabel=\{surfaceLabel\} \/>/u);
	assert.doesNotMatch(
		EXPERIMENTAL_HEADER_SOURCE,
		/aria-disabled[\s\S]*Configure \$\{surfaceLabel\} view/u,
	);
	// Trigger reads as the configure affordance Jira uses for View settings.
	assert.match(viewMenu, /import CustomizeIcon from "@atlaskit\/icon\/core\/customize"/u);
	assert.match(viewMenu, /render=\{<CustomizeIcon label="" \/>\}/u);
	// ...and it is the ONLY place that glyph appears in the control row. The
	// header's old board-settings button did the same job and rendered the same
	// sliders icon, so the row carried it twice until the View menu replaced it.
	assert.doesNotMatch(EXPERIMENTAL_HEADER_SOURCE, /CustomizeIcon/u);
	assert.doesNotMatch(EXPERIMENTAL_HEADER_SOURCE, /\$\{surfaceTitle\} settings/u);
	assert.match(viewMenu, /aria-label=\{`Configure \$\{surfaceLabel\} view`\}/u);
	assert.match(viewMenu, /\{compact \? null : "View"\}/u);
	assert.doesNotMatch(viewMenu, /aria-disabled/u);
	// Every dimension sits behind its own submenu so the top level stays scannable.
	// Single-select dimensions keep their radio group inline...
	for (const [trigger, list] of [
		["Group by", "BOARD_GROUP_OPTIONS"],
		["Sort by", "BOARD_SORT_OPTIONS"],
		["Hide done work items", "BOARD_HIDE_DONE_OPTIONS"],
		["Column size", "BOARD_COLUMN_SIZE_OPTIONS"],
	]) {
		assert.match(
			viewMenu,
			new RegExp(`<DropdownMenuSubTrigger>[\\s\\S]*?${trigger}[\\s\\S]*?</DropdownMenuSubTrigger>[\\s\\S]*?${list}\\.map`, "u"),
			`${trigger} should open a submenu rendering ${list}`,
		);
	}
	// ...while the show/hide dimensions are the same control over different
	// lists, so they route through one shared submenu instead of four copies.
	for (const [label, list] of [
		["Columns", "BOARD_COLUMN_OPTIONS"],
		["PR state", "BOARD_PR_STATE_OPTIONS"],
		["Agent", "BOARD_AGENT_STATE_OPTIONS"],
		["Show fields", "BOARD_FIELD_OPTIONS"],
	]) {
		assert.match(
			viewMenu,
			new RegExp(`<VisibilityToggleSubmenu\\s+checkedIds=\\{[A-Za-z]+\\}\\s+label="${label}"\\s+onToggle=\\{[^}]+\\}\\s+options=\\{${list}\\}`, "u"),
			`${label} should render through the shared visibility submenu with ${list}`,
		);
	}
	assert.equal(
		viewMenu.match(/<DropdownMenuCheckboxItem/gu).length,
		1,
		"checkbox rows should be defined once, in the shared submenu",
	);
	assert.match(viewMenu, /<DropdownMenuLabel>Order<\/DropdownMenuLabel>[\s\S]*BOARD_SORT_ORDER_OPTIONS\.map/u);
	// PR state and Agent sit in their own section between grouping/sorting and
	// column/card chrome, so they scan as a pair instead of trailing Columns.
	assert.match(
		viewMenu,
		/<DropdownMenuSubTrigger>Sort by<\/DropdownMenuSubTrigger>[\s\S]*<DropdownMenuSeparator \/>[\s\S]*label="PR state"[\s\S]*label="Agent"[\s\S]*<DropdownMenuSeparator \/>[\s\S]*Column size[\s\S]*Hide done work items[\s\S]*label="Columns"[\s\S]*label="Show fields"/u,
	);
	assert.match(
		groupOptions,
		/"Agent"[\s\S]*"Assignee"[\s\S]*"Atlassian Project"[\s\S]*"Epic"[\s\S]*"Labels"[\s\S]*"Priority"[\s\S]*"Subtask"/u,
	);
	assert.match(
		sortOptions,
		/"Rank"[\s\S]*"Last updated"[\s\S]*"Created"[\s\S]*"Due date"[\s\S]*"Priority"[\s\S]*"Summary"/u,
	);
	assert.match(
		viewOptions,
		/"Never"[\s\S]*"1 day"[\s\S]*"7 days"[\s\S]*"14 days"[\s\S]*"30 days"[\s\S]*"60 days"/u,
	);
	// Rows are checkboxes, and a locked row stays on the way Jira locks Summary.
	assert.match(viewMenu, /<DropdownMenuCheckboxItem[\s\S]*checked=\{checkedIds\.has\(option\.id\)\}[\s\S]*disabled=\{option\.locked\}/u);
	assert.match(viewOptions, /id: "summary", label: "Summary", shown: true, locked: true/u);
	// Column visibility is the board's own status phases, owned by the block
	// rather than imported from a consuming project, and distinct from the
	// Column *size* list it sits beside.
	assert.match(
		viewOptions,
		/"To do"[\s\S]*"In progress"[\s\S]*"In review"[\s\S]*"Done"/u,
	);
	assert.doesNotMatch(viewOptions, /from "@\/components\/projects/u);
	// PR and agent state read as lifecycles, not alphabetised lists.
	assert.match(
		viewOptions,
		/"Open"[\s\S]*"Draft"[\s\S]*"Queued"[\s\S]*"Merged"[\s\S]*"Closed"/u,
	);
	assert.match(
		viewOptions,
		/"Idle"[\s\S]*"Working"[\s\S]*"Needs permission"[\s\S]*"Ready for review"[\s\S]*"Failed"/u,
	);
	// Every list is CONTROLLED, seeded from the shared defaults. Base UI unmounts
	// a submenu's contents on close and the whole popup on dismiss, so an
	// uncontrolled `defaultValue`/`defaultChecked` row rebuilds from the default
	// on reopen and silently discards the click. State lives in BoardViewMenu,
	// which stays mounted with the trigger.
	for (const seed of [
		"BOARD_GROUP_DEFAULT_ID",
		"BOARD_SORT_DEFAULT_ID",
		"BOARD_SORT_ORDER_DEFAULT_ID",
		"BOARD_HIDE_DONE_DEFAULT_ID",
		"BOARD_COLUMN_SIZE_DEFAULT_ID",
	]) {
		assert.match(
			viewMenu,
			new RegExp(`useState<string>\\(${seed}\\)`, "u"),
			`${seed} should seed hoisted state, not an uncontrolled default`,
		);
	}
	assert.doesNotMatch(withoutComments(viewMenu), /defaultValue=|defaultChecked=/u);
	assert.equal(
		withoutComments(viewMenu).match(/<DropdownMenuRadioGroup/gu).length,
		withoutComments(viewMenu).match(/onValueChange=/gu).length,
		"every radio group should be controlled",
	);
	// Each checkbox list keeps its own set, so two lists sharing an option id
	// cannot toggle each other.
	assert.equal(withoutComments(viewMenu).match(/useState\(\(\) =>\s*toShownIds\(/gu).length, 4);
	// Self-contained: the menu takes no board data and hands nothing back, so a
	// row moves this menu's indicator and never re-groups or re-sorts the board.
	assert.match(viewMenu, /interface BoardViewMenuProps \{\s*compact\?: boolean;\s*surfaceLabel\?: string;\s*\}/u);
	// A single-section submenu is already named by its sub-trigger, so it carries
	// no group label — the name moves to `aria-label` so the radio group keeps an
	// accessible name. Only the two-section Sort by submenu still labels sections.
	for (const label of ["Hide done work items after", "Column size"]) {
		assert.doesNotMatch(
			viewMenu,
			new RegExp(`<DropdownMenuLabel>${label}</DropdownMenuLabel>`, "u"),
			`${label} repeats its sub-trigger and should not be a group label`,
		);
		assert.match(viewMenu, new RegExp(`aria-label="${label}"`, "u"), `${label} lost its accessible name`);
	}
	assert.equal(
		viewMenu.match(/<DropdownMenuLabel>/gu).length,
		2,
		"only the two-section Sort by submenu should carry group labels",
	);
	// Ticks sit at the trailing edge so every label left-aligns flush.
	assert.equal(
		viewMenu.match(/indicatorPlacement="end"/gu).length,
		6,
		"every radio and checkbox list should place its indicator at the end",
	);
	// The Sort by submenu shows all eight rows at once instead of scrolling, but
	// still yields to a short viewport via `--available-height` inside the min().
	assert.match(
		viewMenu,
		/<DropdownMenuSubContent className="max-h-\[min\(24rem,var\(--available-height,24rem\)\)\]">/u,
	);
});
