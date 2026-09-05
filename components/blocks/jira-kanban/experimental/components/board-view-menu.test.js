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
const EXPERIMENTAL_PAGE_SOURCE = readFileSync(
	join(EXPERIMENTAL_DIR, "page.tsx"),
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
	assert.match(
		EXPERIMENTAL_HEADER_SOURCE,
		/<BoardViewMenu\s+compact=\{compact\}\s+onShownSessionStateIdsChange=\{onShownSessionStateIdsChange\}\s+onShowUntrackedChange=\{onShowUntrackedChange\}\s+shownSessionStateIds=\{shownSessionStateIds\}\s+showUntracked=\{showUntracked\}\s+simpleViews=\{simpleViews\}\s+surfaceLabel=\{surfaceLabel\}\s+\/>/u,
	);
	assert.doesNotMatch(
		EXPERIMENTAL_HEADER_SOURCE,
		/aria-disabled[\s\S]*Configure \$\{surfaceLabel\} view/u,
	);
	// Trigger uses ADS Group (grouping data) with the View label.
	assert.match(viewMenu, /import GroupIcon from "@atlaskit\/icon-lab\/core\/group"/u);
	assert.match(viewMenu, /import AiAgentIcon from "@atlaskit\/icon\/core\/ai-agent"/u);
	assert.match(viewMenu, /import DevicesIcon from "@atlaskit\/icon\/core\/devices"/u);
	assert.match(viewMenu, /import CloudIcon from "@atlaskit\/icon-lab\/core\/cloud"/u);
	assert.match(viewMenu, /render=\{<GroupIcon label="" \/>\}/u);
	// The far-right Customize control is a different job (board chrome, not the
	// picker) and stays `aria-disabled` until a real configure capability exists.
	assert.match(EXPERIMENTAL_HEADER_SOURCE, /import CustomizeIcon from "@atlaskit\/icon\/core\/customize"/u);
	assert.match(
		EXPERIMENTAL_HEADER_SOURCE,
		/showCustomizeControl \? \(\s*<Button aria-disabled aria-label="Customize" size="icon" variant="outline">/u,
	);
	assert.doesNotMatch(EXPERIMENTAL_HEADER_SOURCE, /\$\{surfaceTitle\} settings/u);
	assert.match(viewMenu, /aria-label=\{`Configure \$\{surfaceLabel\} view`\}/u);
	assert.match(viewMenu, /\{compact \? null : "View"\}/u);
	assert.doesNotMatch(viewMenu, /aria-disabled/u);
	assert.match(viewMenu, /simpleViews\?: boolean;/u);
	assert.match(viewMenu, /const \{ designVariants \} = useDesignVariants\(\);/u);
	assert.match(
		viewMenu,
		/const showSimpleViewSettings = simpleViews \?\? designVariants\["simple-views"\];/u,
	);
	assert.match(
		viewMenu,
		/const resolvedColumnSizeId = showSimpleViewSettings \? columnSizeId : BOARD_COLUMN_SIZE_DEFAULT_ID;/u,
	);
	assert.match(
		viewMenu,
		/const resolvedHideDoneId = showSimpleViewSettings \? hideDoneId : BOARD_HIDE_DONE_DEFAULT_ID;/u,
	);
	assert.match(
		viewMenu,
		/const resolvedShownFieldIds = showSimpleViewSettings \? shownFieldIds : DEFAULT_SHOWN_FIELD_IDS;/u,
	);
	assert.match(
		viewMenu,
		/useEffect\(\(\) => \{[\s\S]*if \(showSimpleViewSettings\) \{\s*return;\s*\}\s*setColumnSizeId\(BOARD_COLUMN_SIZE_DEFAULT_ID\);\s*setHideDoneId\(BOARD_HIDE_DONE_DEFAULT_ID\);\s*setShownFieldIds\(toShownIds\(BOARD_FIELD_OPTIONS\)\);\s*\}, \[showSimpleViewSettings\]\);/u,
	);
	// Every dimension sits behind its own submenu so the top level stays scannable.
	// Single-select dimensions keep their radio group inline...
	for (const [trigger, list] of [
		["Group by", "BOARD_GROUP_OPTIONS"],
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
	// lists, so they route through one shared submenu instead of three copies.
	// Pull request and Agent pass icon maps. Show fields stays label-only.
	for (const [label, list] of [
		["Pull request", "BOARD_PR_STATE_OPTIONS"],
		["Agent", "BOARD_AGENT_STATE_OPTIONS"],
		["Show fields", "BOARD_FIELD_OPTIONS"],
	]) {
		assert.match(
			viewMenu,
			new RegExp(`<VisibilityToggleSubmenu\\s+checkedIds=\\{[A-Za-z]+\\}\\s+(?:icons=\\{[A-Z_]+\\}\\s+)?label="${label}"\\s+onToggle=\\{[^}]+\\}\\s+options=\\{${list}\\}`, "u"),
			`${label} should render through the shared visibility submenu with ${list}`,
		);
	}
	assert.equal(
		viewMenu.match(/<DropdownMenuCheckboxItem/gu).length,
		1,
		"checkbox rows should be defined once, in the shared submenu",
	);
	assert.doesNotMatch(withoutComments(viewMenu), /Sort by|BOARD_SORT_|label="Columns"|BOARD_COLUMN_OPTIONS/u);
	// Pull request and Agent lead the menu, then grouping. Column/card chrome is
	// Simple views only, so default mode cannot keep a stale Column size / Hide
	// done / Show fields choice after the checkbox is turned off.
	assert.match(
		viewMenu,
		/<VisibilityToggleSubmenu[\s\S]*label="Pull request"[\s\S]*label="Agent"[\s\S]*<DropdownMenuSeparator \/>[\s\S]*<DropdownMenuSubTrigger>Group by<\/DropdownMenuSubTrigger>[\s\S]*\{showSimpleViewSettings \? \([\s\S]*Column size[\s\S]*Hide done work items[\s\S]*label="Show fields"[\s\S]*\) : null\}/u,
	);
	assert.match(viewMenu, /value=\{resolvedColumnSizeId\}/u);
	assert.match(viewMenu, /value=\{resolvedHideDoneId\}/u);
	assert.match(viewMenu, /checkedIds=\{resolvedShownFieldIds\}/u);
	assert.match(
		groupOptions,
		/"Agent"[\s\S]*"Assignee"[\s\S]*"Atlassian Project"[\s\S]*"Epic"[\s\S]*"Labels"[\s\S]*"Priority"[\s\S]*"Subtask"/u,
	);
	assert.match(
		groupOptions,
		/export const BOARD_GROUP_DEFAULT_ID = "" as const/u,
		"Group by should seed an empty selection so no dimension starts checked",
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
		/"Working"[\s\S]*"Needs input"[\s\S]*"Finished"[\s\S]*"Untracked"/u,
	);
	assert.match(
		viewOptions,
		/"All"[\s\S]*"Cloud"[\s\S]*"Local"/u,
	);
	assert.match(viewOptions, /export const BOARD_AGENT_HOST_DEFAULT_ID: BoardAgentHostId = "all"/u);
	assert.match(viewOptions, /return `Show \$\{hostId\} agents`/u);
	// Untracked is the absence of a session, so the shared submenu draws a
	// divider above any row that opts in with `separatorBefore`.
	assert.match(
		viewOptions,
		/id: "untracked", label: "Untracked", shown: true, separatorBefore: true/u,
	);
	assert.match(viewMenu, /option\.separatorBefore \? <DropdownMenuSeparator \/> : null/u);
	assert.doesNotMatch(viewOptions, /"Idle"/u);
	// PR and Agent state keep literal ids so each icon map is keyed by a union.
	// An unmapped state is a type error, not a row that quietly loses its glyph.
	assert.match(
		viewOptions,
		/export const BOARD_PR_STATE_OPTIONS = \[[\s\S]*?\] as const satisfies readonly BoardVisibilityOption\[\];/u,
		"BOARD_PR_STATE_OPTIONS must keep literal ids for the icon map's key union",
	);
	// State rows carry a leading glyph, tinted through the ADS `color` prop —
	// ADS ships its icon CSS unlayered, so a Tailwind text utility on the same
	// svg silently loses. Untracked uses the empty-task glyph in subtlest.
	const prIcons = viewMenu.match(/const PR_STATE_ICONS = \{[\s\S]*?\} as const satisfies Record</u);
	assert.ok(prIcons, "PR_STATE_ICONS should be a Record keyed by the option id union");
	for (const entry of ["open", "draft", "queued", "merged", "closed"]) {
		assert.match(prIcons[0], new RegExp(`\\n\\t${entry}: \\{ glyph: \\w+Icon, color: token\\("color\\.icon[.\\w]*"\\) \\},`, "u"));
	}
	assert.match(prIcons[0], /draft: \{ glyph: PullRequestIcon, color: token\("color\.icon\.subtlest"\) \}/u);
	const agentIcons = viewMenu.match(/const AGENT_STATE_ICONS = \{[\s\S]*?\} as const satisfies Record</u);
	assert.ok(agentIcons, "AGENT_STATE_ICONS should be a Record keyed by the session-state id union");
	assert.match(agentIcons[0], /working: \{ glyph: TaskInProgressIcon, color: token\("color\.icon\.subtlest"\) \}/u);
	assert.match(agentIcons[0], /"needs-input": \{ glyph: QuestionCircleFilledIcon, color: token\("color\.icon\.information"\) \}/u);
	assert.match(agentIcons[0], /finished: \{ glyph: StatusSuccessIcon, color: token\("color\.icon\.success"\) \}/u);
	assert.match(agentIcons[0], /untracked: \{ glyph: TaskToDoIcon, color: token\("color\.icon\.subtlest"\) \}/u);
	assert.doesNotMatch(withoutComments(viewMenu), /<Icon[^>]*className="text-icon/u);
	// Every list is CONTROLLED, seeded from the shared defaults. Base UI unmounts
	// a submenu's contents on close and the whole popup on dismiss, so an
	// uncontrolled `defaultValue`/`defaultChecked` row rebuilds from the default
	// on reopen and silently discards the click. State lives in BoardViewMenu,
	// which stays mounted with the trigger.
	for (const seed of [
		"BOARD_GROUP_DEFAULT_ID",
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
	assert.equal(withoutComments(viewMenu).match(/useState\(\(\) =>\s*toShownIds\(/gu).length, 3);
	// Agent rows the board can lift: Working / Needs input / Finished hide
	// matching activity chrome, and Untracked hides proximity sessions. They
	// never re-group the columns.
	assert.match(viewMenu, /showUntracked\?: boolean;/u);
	assert.match(viewMenu, /onShowUntrackedChange\?: \(showUntracked: boolean\) => void;/u);
	assert.match(viewMenu, /shownSessionStateIds\?: ReadonlySet<BoardAgentSessionStateId>;/u);
	assert.match(viewMenu, /onShownSessionStateIdsChange\?: \(shownSessionStateIds: Set<BoardAgentSessionStateId>\) => void;/u);
	assert.match(viewMenu, /if \(id === "untracked" && isUntrackedControlled\)/u);
	assert.match(viewMenu, /onShowUntrackedChange\(!showUntracked\);/u);
	assert.match(viewMenu, /isBoardAgentSessionStateId\(id\)/u);
	assert.match(viewMenu, /onShownSessionStateIdsChange\(next\);/u);
	assert.match(viewMenu, /toggleIn\(setShownAgentStateIds\)\(id\);/u);
	assert.doesNotMatch(viewMenu, /onShowWorkingChange|onShowNeedsInputChange|onShowFinishedChange/u);
	assert.match(EXPERIMENTAL_PAGE_SOURCE, /const \[showUntracked, setShowUntracked\] = useState\(defaultShowUntracked\)/u);
	assert.match(EXPERIMENTAL_PAGE_SOURCE, /onShowUntrackedChange=\{setShowUntracked\}/u);
	assert.match(EXPERIMENTAL_PAGE_SOURCE, /showUntracked=\{showUntracked\}/u);
	assert.match(EXPERIMENTAL_PAGE_SOURCE, /shownSessionStateIds=\{shownSessionStateIds\}/u);
	assert.match(EXPERIMENTAL_PAGE_SOURCE, /onShownSessionStateIdsChange=\{setShownSessionStateIds\}/u);
	assert.match(
		EXPERIMENTAL_PAGE_SOURCE,
		/filterJiraKanbanColumnsByAgentSessionState\(\s*filterJiraKanbanColumnsByAssignee\(boardColumns, selectedAssigneeIds\),\s*shownSessionStateIds,\s*\)/u,
	);
	assert.match(EXPERIMENTAL_HEADER_SOURCE, /showUntracked\?: boolean;/u);
	assert.match(EXPERIMENTAL_HEADER_SOURCE, /onShowUntrackedChange\?: \(showUntracked: boolean\) => void;/u);
	assert.match(EXPERIMENTAL_HEADER_SOURCE, /shownSessionStateIds\?: ReadonlySet<BoardAgentSessionStateId>;/u);
	assert.match(EXPERIMENTAL_HEADER_SOURCE, /onShownSessionStateIdsChange\?: \(shownSessionStateIds: Set<BoardAgentSessionStateId>\) => void;/u);
	// A single-section submenu is already named by its sub-trigger, so it carries
	// no group label — the name moves to `aria-label` so the radio group keeps an
	// accessible name.
	for (const label of ["Hide done work items after", "Column size", "Show agents"]) {
		assert.doesNotMatch(
			viewMenu,
			new RegExp(`<DropdownMenuLabel>${label}</DropdownMenuLabel>`, "u"),
			`${label} repeats its sub-trigger and should not be a group label`,
		);
		assert.match(viewMenu, new RegExp(`aria-label="${label}"`, "u"), `${label} lost its accessible name`);
	}
	assert.equal(
		viewMenu.match(/<DropdownMenuLabel>/gu)?.length ?? 0,
		0,
		"no submenu should carry group labels after Sort by was removed",
	);
	// Ticks sit at the trailing edge so every label left-aligns flush.
	assert.equal(
		viewMenu.match(/indicatorPlacement="end"/gu).length,
		5,
		"every radio and checkbox list should place its indicator at the end",
	);
	// Host scope is its own section above Untracked: a nested All / Cloud / Local
	// picker whose trigger label follows the selection.
	assert.match(viewMenu, /index === firstSeparatedIndex \? children : null/u);
	assert.match(
		viewMenu,
		/<VisibilityToggleSubmenu[\s\S]*label="Agent"[\s\S]*options=\{BOARD_AGENT_STATE_OPTIONS\}[\s\S]*>\s*<DropdownMenuSeparator \/>\s*<AgentHostFilterSubmenu/u,
	);
	assert.match(viewMenu, /const hostIcon = AGENT_HOST_ICONS\[hostId\]/u);
	assert.match(
		viewMenu,
		/<DropdownMenuSubTrigger>\s*<MenuLeadingIcon icon=\{hostIcon\} \/>\s*\{boardAgentHostFilterLabel\(hostId\)\}/u,
	);
	assert.match(viewMenu, /function MenuLeadingIcon\(/u);
	assert.match(viewMenu, /size="small"/u);
	assert.match(viewMenu, /className="size-3 \[&_svg\]:size-3!"/u);
	assert.equal(
		viewMenu.match(/<MenuLeadingIcon icon=\{/gu).length,
		3,
		"PR, Agent, and host-scope rows should share the 12px leading icon",
	);
	assert.match(viewMenu, /useState<BoardAgentHostId>\(BOARD_AGENT_HOST_DEFAULT_ID\)/u);
	assert.match(viewMenu, /BOARD_AGENT_HOST_OPTIONS\.map/u);
	assert.match(viewMenu, /aria-label="Show agents"/u);
	const hostIcons = viewMenu.match(/const AGENT_HOST_ICONS = \{[\s\S]*?\} as const satisfies Record</u);
	assert.ok(hostIcons, "AGENT_HOST_ICONS should be a Record keyed by the host id union");
	assert.match(hostIcons[0], /all: \{ glyph: AiAgentIcon, color: token\("color\.icon\.subtle"\) \}/u);
	assert.match(hostIcons[0], /cloud: \{ glyph: CloudIcon, color: token\("color\.icon\.subtle"\) \}/u);
	assert.match(hostIcons[0], /local: \{ glyph: DevicesIcon, color: token\("color\.icon\.subtle"\) \}/u);
});
