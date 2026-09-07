const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");

const INDEX_SOURCE = readFileSync(join(__dirname, "index.tsx"), "utf8");
const TYPES_SOURCE = readFileSync(join(__dirname, "agent-session-column-types.ts"), "utf8");
const IN_FLOW_COLUMN_SOURCE = readFileSync(
	join(__dirname, "../jira-kanban/experimental/components/in-flow-agent-session-column.tsx"),
	"utf8",
);
const BOARD_SOURCE = readFileSync(
	join(__dirname, "../jira-kanban/experimental-v2/experimental-v2-jira-kanban.tsx"),
	"utf8",
);

test("the v2 board pins the column outside its horizontal scrollport", () => {
	assert.match(BOARD_SOURCE, /agentSessionColumn\?: AgentSessionColumnProps;/u);
	const columnIndex = BOARD_SOURCE.indexOf("<InFlowAgentSessionColumn");
	const sectionIndex = BOARD_SOURCE.indexOf("<section");
	assert.ok(columnIndex > 0, "expected the board to render the pinned column");
	assert.ok(columnIndex < sectionIndex, "expected the pinned column before the scrollport");
	assert.doesNotMatch(BOARD_SOURCE, /agentSessionColumn \? "ps-2" : "ps-6"/u);
	assert.match(BOARD_SOURCE, /"flex min-h-full w-max min-w-full items-stretch ps-6"/u);
	assert.match(BOARD_SOURCE, /columnFrame=\{chrome\.headerFrame\}/u);
});

test("the in-flow host previews the compact rail before a click pins the full column", () => {
	assert.match(IN_FLOW_COLUMN_SOURCE, /const \[isHovered, setIsHovered\] = useState\(false\)/u);
	assert.match(IN_FLOW_COLUMN_SOURCE, /const \[isPersistentExpanded, setIsPersistentExpanded\] = useState\(false\)/u);
	assert.match(IN_FLOW_COLUMN_SOURCE, /setIsPersistentExpanded\(!collapsed\)/u);
	assert.match(IN_FLOW_COLUMN_SOURCE, /collapsed=\{!isPersistentExpanded\}/u);
	assert.match(IN_FLOW_COLUMN_SOURCE, /const isEmbedded = isHovered \|\| isPersistentExpanded/u);
	assert.match(IN_FLOW_COLUMN_SOURCE, /collapsedPresentation=\{isEmbedded \? "column" : "gutter"\}/u);
	assert.match(IN_FLOW_COLUMN_SOURCE, /IN_FLOW_AGENT_SESSION_COLUMN_GAP_PX = 8/u);
	assert.match(IN_FLOW_COLUMN_SOURCE, /width: isEmbedded \? IN_FLOW_AGENT_SESSION_COLUMN_GAP_PX : 0/u);
	assert.match(IN_FLOW_COLUMN_SOURCE, /width: isEmbedded \? columnWidthPx : 0/u);
	assert.doesNotMatch(IN_FLOW_COLUMN_SOURCE, /handlePointerEnter[\s\S]{0,250}?onCollapsedChange/u);
});

test("the entire visible gutter is a hover target without covering To do", () => {
	assert.match(IN_FLOW_COLUMN_SOURCE, /data-agent-session-column-hit-area=""/u);
	assert.match(IN_FLOW_COLUMN_SOURCE, /absolute inset-y-0 start-0 z-50/u);
	assert.match(IN_FLOW_COLUMN_SOURCE, /width: IN_FLOW_AGENT_SESSION_COLUMN_INSET_PX \+ 2/u);
	assert.match(
		IN_FLOW_COLUMN_SOURCE,
		/isEmbedded[\s\S]{0,100}?\? "pointer-events-auto bg-surface"[\s\S]{0,100}?: "pointer-events-none bg-transparent"/u,
	);
});

test("the gutter omits the visible count but keeps the compact rail top-aligned", () => {
	assert.match(TYPES_SOURCE, /collapsedPresentation\?: "column" \| "gutter";/u);
	assert.match(INDEX_SOURCE, /const isGutterCollapsed = collapsed && collapsedPresentation === "gutter"/u);
	assert.doesNotMatch(INDEX_SOURCE, /isGutterCollapsed \? "justify-center" : null/u);
	assert.match(INDEX_SOURCE, /const gutterHeader = \(/u);
	assert.match(INDEX_SOURCE, /style=\{resolveCollapsedHeaderStyle\(layout\)\}/u);
	assert.doesNotMatch(
		INDEX_SOURCE.match(/const gutterHeader = \([\s\S]*?\n\t\);/u)?.[0] ?? "",
		/<TextMorphing/u,
	);
	assert.match(INDEX_SOURCE, /isGutterCollapsed \? gutterHeader : collapsedHeader/u);
	assert.match(INDEX_SOURCE, /isGutterCollapsed \? "bg-transparent" : null/u);
});

test("flyouts stay suspended throughout the transient compact hover-preview", () => {
	assert.doesNotMatch(IN_FLOW_COLUMN_SOURCE, /isEmbeddingTransition/u);
	assert.match(
		IN_FLOW_COLUMN_SOURCE,
		/JiraSessionFlyoutSuspensionProvider[\s\S]{0,120}?suspended=\{sessionFlyoutsSuspended \|\| \(isHovered && !isPersistentExpanded\)\}/u,
	);
});

test("the gutter preview moves into the old in-flow inset with Motion", () => {
	assert.match(IN_FLOW_COLUMN_SOURCE, /import \{ motion, useReducedMotion, type Variants \} from "motion\/react";/u);
	assert.match(IN_FLOW_COLUMN_SOURCE, /<motion\.div/u);
	assert.match(IN_FLOW_COLUMN_SOURCE, /IN_FLOW_AGENT_SESSION_COLUMN_INSET_PX = 24/u);
	assert.match(IN_FLOW_COLUMN_SOURCE, /IN_FLOW_AGENT_SESSION_COLUMN_GUTTER_OFFSET_PX = -5/u);
	assert.match(IN_FLOW_COLUMN_SOURCE, /animate=\{isEmbedded \? "embedded" : "gutter"\}/u);
	assert.match(IN_FLOW_COLUMN_SOURCE, /transform: `translateX\(\$\{IN_FLOW_AGENT_SESSION_COLUMN_INSET_PX\}px\)`/u);
	assert.match(IN_FLOW_COLUMN_SOURCE, /willChange: shouldReduceMotion \? undefined : "transform"/u);
	assert.doesNotMatch(IN_FLOW_COLUMN_SOURCE, /animate=\{\{ width:/u);
});
