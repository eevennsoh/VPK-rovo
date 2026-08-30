const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");

const INDEX_SOURCE = readFileSync(join(__dirname, "index.tsx"), "utf8");
const TYPES_SOURCE = readFileSync(join(__dirname, "agent-session-column-types.ts"), "utf8");
const PAGE_SOURCE = readFileSync(join(__dirname, "page.tsx"), "utf8");
const BOARD_SOURCE = readFileSync(
	join(__dirname, "../jira-kanban/experimental-v2/experimental-v2-jira-kanban.tsx"),
	"utf8",
);
const BOARD_PAGE_SOURCE = readFileSync(
	join(__dirname, "../jira-kanban/experimental-v2/page.tsx"),
	"utf8",
);
const RAIL_SOURCE = readFileSync(
	join(__dirname, "../jira-kanban/experimental/pulse/components/pulse-rail.tsx"),
	"utf8",
);
const SESSIONS_SOURCE = readFileSync(
	join(__dirname, "../jira-kanban/experimental/pulse/lib/pulse-sessions.ts"),
	"utf8",
);
const DEMO_SOURCE = readFileSync(
	join(__dirname, "../../website/demos/blocks/agent-session-column-demo.tsx"),
	"utf8",
);
const REGISTRY_SOURCE = readFileSync(
	join(__dirname, "../../website/registry/blocks.ts"),
	"utf8",
);
const DETAIL_SOURCE = readFileSync(
	join(__dirname, "../../../app/data/details/blocks/agent-session-column.ts"),
	"utf8",
);
const MANIFEST_SOURCE = readFileSync(
	join(__dirname, "../../../app/data/component-manifest.ts"),
	"utf8",
);

test("the column is a sunken surface, unlike the board's unfilled status columns", () => {
	assert.match(INDEX_SOURCE, /bg-surface-sunken/u);
	// Sunken is the whole point of the column, so it must not be reachable only
	// through a caller-supplied class.
	assert.doesNotMatch(INDEX_SOURCE, /className=\{cn\(\s*className/u);
	assert.match(INDEX_SOURCE, /borderRadius: token\("radius\.xlarge"\)/u);
});

test("card rendering is delegated to the Agent Session block, never re-implemented", () => {
	assert.match(INDEX_SOURCE, /import \{ AGENT_SESSION_ITEMS, AgentSession \} from "@\/components\/blocks\/agent-session"/u);
	assert.match(INDEX_SOURCE, /<AgentSession\b/u);
	// No forked card chrome: the dashed border and chin belong to the card.
	assert.doesNotMatch(INDEX_SOURCE, /border-dashed|UncapturedWorkChin|AgentListRow/u);
});

test("the header count defaults to the rendered sessions and can be overridden", () => {
	assert.match(INDEX_SOURCE, /const sessionCount = count \?\? items\.length;/u);
	assert.match(TYPES_SOURCE, /count\?: number;/u);
});

test("the scrollport reserves the focus-ring gutter instead of clipping a focused card", () => {
	assert.match(INDEX_SOURCE, /-m-1 min-h-0 min-w-0 flex-1 overflow-y-auto p-1/u);
	assert.match(INDEX_SOURCE, /buildScrollMaskStyle/u);
	assert.match(INDEX_SOURCE, /useHasVerticalOverflow/u);
});

test("an empty column says so rather than rendering an empty list", () => {
	assert.match(INDEX_SOURCE, /items\.length === 0/u);
	assert.match(INDEX_SOURCE, /emptyLabel = "No untracked sessions"/u);
});

test("the v2 board pins the column outside its horizontal scrollport", () => {
	assert.match(BOARD_SOURCE, /agentSessionColumn\?: AgentSessionColumnProps;/u);
	// Pinned, so it precedes the <section> scrollport rather than joining the
	// boardColumns map inside it.
	const columnIndex = BOARD_SOURCE.indexOf("<AgentSessionColumn {...agentSessionColumn} />");
	const sectionIndex = BOARD_SOURCE.indexOf("<section");
	assert.ok(columnIndex > 0, "expected the board to render the pinned column");
	assert.ok(columnIndex < sectionIndex, "expected the pinned column before the scrollport");
	// The pinned column supplies the board's left inset, so the scroll row drops
	// to the inter-column gap and every column keeps one rhythm.
	assert.match(BOARD_SOURCE, /agentSessionColumn \? "ps-2" : "ps-6"/u);
	// Both share the scrollport's vertical padding so the headers share a baseline.
	assert.match(BOARD_SOURCE, /className="flex min-h-0 shrink-0 ps-6"\s*style=\{\{ paddingTop, paddingBottom \}\}/u);
});

test("the board column and the Insights rail share one loose-work adapter", () => {
	assert.match(SESSIONS_SOURCE, /export function toPulseSessionHandlers\(/u);
	assert.match(RAIL_SOURCE, /toPulseSessionHandlers/u);
	assert.match(BOARD_PAGE_SOURCE, /toPulseSessionHandlers/u);
	// The rail must not keep a hand-rolled copy beside the shared one.
	assert.doesNotMatch(RAIL_SOURCE, /const sessionById = /u);
});

test("the board column commits through the same captured set as Insights", () => {
	assert.match(BOARD_PAGE_SOURCE, /capturedItemIds: capturedLooseWorkIds,/u);
	assert.match(BOARD_PAGE_SOURCE, /onCapture: handleCaptureLooseWork,/u);
	// One fixture list, read through the same day/scope filter the rail reads.
	assert.match(BOARD_PAGE_SOURCE, /looseWork: pulseTimeline\.looseWork,/u);
	// The header's assignee filter narrows the status columns, so it narrows
	// this column too — routed through the roster boundary, because only some
	// assignee ids name a session member. Behaviour lives in pulse-sessions.test.js.
	assert.match(
		BOARD_PAGE_SOURCE,
		/filterPulseLooseWorkByMember\(pulseTimeline\.looseWork, pulseMemberId\)/u,
	);
});

test("the block is registered in the catalog", () => {
	assert.match(MANIFEST_SOURCE, /blockComponent\("agent-session-column", "Agent Session Column"\)/u);
	assert.match(REGISTRY_SOURCE, /"agent-session-column": dynamic\(/u);
	assert.match(DEMO_SOURCE, /@\/components\/blocks\/agent-session-column\/page/u);
	assert.match(DETAIL_SOURCE, /export const AGENT_SESSION_COLUMN_DETAIL/u);
	assert.match(PAGE_SOURCE, /<AgentSessionColumn/u);
});
