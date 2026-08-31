const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");

const INDEX_SOURCE = readFileSync(join(__dirname, "index.tsx"), "utf8");
const RAIL_COLUMN_SOURCE = readFileSync(join(__dirname, "agent-session-column-rail.tsx"), "utf8");
const NOTCH_MARK_SOURCE = readFileSync(
	join(__dirname, "../agent-session/agent-session-notch.tsx"),
	"utf8",
);
const ARRIVAL_MOTION_SOURCE = readFileSync(
	join(__dirname, "../agent-session/agent-session-arrival-motion.ts"),
	"utf8",
);
const TYPES_SOURCE = readFileSync(join(__dirname, "agent-session-column-types.ts"), "utf8");
const PAGE_SOURCE = readFileSync(join(__dirname, "page.tsx"), "utf8");
const CARD_SOURCE = readFileSync(
	join(__dirname, "../agent-session/agent-session-card.tsx"),
	"utf8",
);
const SESSION_INDEX_SOURCE = readFileSync(
	join(__dirname, "../agent-session/index.tsx"),
	"utf8",
);
const SESSION_TYPES_SOURCE = readFileSync(
	join(__dirname, "../agent-session/agent-session-types.ts"),
	"utf8",
);
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

test("the fill starts below the header, so the title shares the status columns' baseline", () => {
	// The header has to sit on the board surface at the same inset and baseline
	// as `To do`. Filling the <section> itself would put the title inside the
	// grey and push it 8px in and 8px down from every other column title.
	assert.doesNotMatch(INDEX_SOURCE, /<section[\s\S]*?className=\{cn\(\s*"[^"]*bg-surface-sunken/u);
	assert.doesNotMatch(INDEX_SOURCE, /"group\/session-column[^"]*bg-surface-sunken/u);
	// The fill is a plane the header is a sibling of, not an ancestor of.
	assert.match(INDEX_SOURCE, /const AGENT_SESSION_PLANE = "[^"]*bg-surface-sunken[^"]*";/u);
	// The section carries no padding of its own either — that would inset the
	// header just as surely as the fill would.
	assert.doesNotMatch(INDEX_SOURCE, /padding: collapsed \?/u);
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
	// Both share the scrollport's vertical padding *and* the 2px transparent
	// drop-target border each status column carries, so the headers share a
	// baseline and every pair of column contents shares one gap.
	assert.match(BOARD_SOURCE, /className="flex min-h-0 shrink-0 border-2 border-transparent ps-6"\s*style=\{\{ paddingTop, paddingBottom \}\}/u);
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

test("collapsing swaps the cards for the notch rail, not for a rotated label", () => {
	// A status column collapses into a `writing-mode: vertical-rl` pill. This one
	// must not: its contents are live sessions, so it collapses into the rail.
	assert.doesNotMatch(INDEX_SOURCE, /writing-mode/u);
	assert.doesNotMatch(RAIL_COLUMN_SOURCE, /writing-mode/u);
	assert.match(INDEX_SOURCE, /collapsed \? \(\s*(?:\/\/[^\n]*\n\s*)*<div[\s\S]{0,400}?<AgentSessionColumnRail/u);
	// Collapsed there is no header to keep clear of the fill, so the plane runs
	// the full height like the pill the status columns collapse into.
	assert.match(INDEX_SOURCE, /padding: token\("space\.050"\)/u);
	// 32px matches the board's collapsed status pill so the two share a rhythm.
	assert.match(INDEX_SOURCE, /AGENT_SESSION_COLUMN_COLLAPSED_WIDTH_PX = 32/u);
	// Declared locally: a shared block must not import a kanban variant's lib.
	assert.doesNotMatch(INDEX_SOURCE, /jira-kanban\/experimental/u);
	assert.doesNotMatch(RAIL_COLUMN_SOURCE, /jira-kanban\/experimental/u);
});

test("each notch opens the shared session flyout rather than a forked preview", () => {
	assert.match(
		RAIL_COLUMN_SOURCE,
		/import \{ AgentSessionNotchMark \} from "@\/components\/blocks\/agent-session\/agent-session-notch";/u,
	);
	assert.match(RAIL_COLUMN_SOURCE, /<AgentSessionNotchMark/u);
	assert.match(
		RAIL_COLUMN_SOURCE,
		/from "@\/components\/blocks\/product-sidebar\/variants\/jira-session-flyout"/u,
	);
	assert.match(RAIL_COLUMN_SOURCE, /<JiraSessionFlyoutTrigger/u);
	// One payload-aware surface for the whole rail, as Agent List does, so
	// sliding down the notches crossfades instead of remounting a card each time.
	assert.match(RAIL_COLUMN_SOURCE, /const \[flyoutHandle\] = useState\(createJiraSessionFlyoutHandle\);/u);
	assert.match(RAIL_COLUMN_SOURCE, /<JiraSessionFlyoutSurface handle=\{flyoutHandle\} \/>/u);
	// The row model already maps onto the flyout payload; no local conversion.
	assert.match(RAIL_COLUMN_SOURCE, /session=\{toAgentSessionFlyoutItem\(item\)\}/u);
});

test("a notch is reachable and legible without a pointer", () => {
	// Keyboard focus opens the flyout through the trigger's focus-visible path,
	// so the notch has to be a real focusable control with a ring and a name.
	assert.match(RAIL_COLUMN_SOURCE, /<button/u);
	assert.match(RAIL_COLUMN_SOURCE, /focus-visible:ring-2/u);
	assert.match(RAIL_COLUMN_SOURCE, /\$\{item\.title\} — \$\{NOTCH_STATE_LABEL\[item\.state\]\}/u);
	// Colour alone never carries the state.
	assert.match(RAIL_COLUMN_SOURCE, /const NOTCH_STATE_LABEL: Record<AgentListState, string>/u);
	// The expand control stays in the tab order while faded, and unfades on
	// keyboard focus — `hidden` would drop it out of reach entirely.
	assert.doesNotMatch(RAIL_COLUMN_SOURCE, /group-hover\/session-rail:block/u);
	assert.match(RAIL_COLUMN_SOURCE, /group-has-\[:focus-visible\]\/session-rail:opacity-100/u);
});

test("collapsed motion is tokenised and honours reduced motion", () => {
	// The width change repositions the whole board, so it takes the bold
	// in-place profile; the notch swell is a list-item interaction.
	assert.match(INDEX_SOURCE, /width var\(--duration-medium\) var\(--ease-in-out\)/u);
	assert.match(INDEX_SOURCE, /transition: shouldReduceMotion \? "none" : AGENT_SESSION_COLUMN_TRANSITION/u);
	assert.match(NOTCH_MARK_SOURCE, /duration-xxshort ease-out-practical/u);
	assert.match(NOTCH_MARK_SOURCE, /motion-reduce:transition-none/u);
	// Hover swells the rule by transform, never by animating its width. The
	// group is the row and the button inside it takes focus, so keyboard parity
	// needs `group-has-[:focus-visible]` — `group-focus-visible` never matches.
	assert.match(NOTCH_MARK_SOURCE, /group-hover\/notch:scale-x-\[1\.6\]/u);
	assert.match(NOTCH_MARK_SOURCE, /group-has-\[:focus-visible\]\/notch:scale-x-\[1\.6\]/u);
	assert.doesNotMatch(NOTCH_MARK_SOURCE, /group-focus-visible\/notch:/u);
	// Clipping is scoped to the resize, so a focused card's ring is never cut.
	assert.match(INDEX_SOURCE, /collapsed \|\| isResizing \? "overflow-hidden" : null/u);
	assert.match(INDEX_SOURCE, /event\.propertyName === "width"/u);
});

test("the collapsed rail is opt-in state the column owns", () => {
	assert.match(TYPES_SOURCE, /defaultCollapsed\?: boolean;/u);
	assert.match(TYPES_SOURCE, /onCollapsedChange\?: \(collapsed: boolean\) => void;/u);
	// The change callback must not fire from inside a state updater.
	assert.doesNotMatch(INDEX_SOURCE, /setCollapsed\(\(/u);
	assert.match(PAGE_SOURCE, /defaultCollapsed/u);
	assert.match(DETAIL_SOURCE, /name: "defaultCollapsed"/u);
});

test("newly synced work reaches both the cards and the rail", () => {
	// One set, threaded to both forms — a collapsed column must not go quiet
	// about arrivals just because it has no cards to mark.
	assert.match(INDEX_SOURCE, /<AgentSessionColumnRail[\s\S]{0,400}?newItemIds=\{newItemIds\}/u);
	assert.match(INDEX_SOURCE, /<AgentSession[^>]*newItemIds=\{newItemIds\}/u);
	// Destructured rather than left in `...sessionProps`, or the rail could not
	// see it.
	assert.match(INDEX_SOURCE, /^\tnewItemIds,$/mu);
	assert.match(SESSION_TYPES_SOURCE, /newItemIds\?: ReadonlySet<string>;/u);
});

test("an arrival is a transient beat plus a mark that outlives it", () => {
	// The mark is the load-bearing half: it has to survive a backgrounded tab, a
	// collapsed column, and reduced motion, so it is never the animation alone.
	assert.match(CARD_SOURCE, /isNew \? "border-border-discovery" : "border-border-disabled"/u);
	assert.match(NOTCH_MARK_SOURCE, /isNew \? NOTCH_EMPHASIS : NOTCH_AT_REST/u);
	// A reviewed notch rests quiet and lights up on hover or focus; a new one is
	// already lit, so "new" reuses the hover vocabulary instead of adding one.
	assert.match(NOTCH_MARK_SOURCE, /const NOTCH_EMPHASIS = "scale-x-\[1\.6\] bg-icon";/u);
	assert.match(NOTCH_MARK_SOURCE, /"bg-icon-subtlest",/u);
	assert.match(NOTCH_MARK_SOURCE, /group-hover\/notch:bg-icon/u);
	assert.match(NOTCH_MARK_SOURCE, /group-has-\[:focus-visible\]\/notch:bg-icon/u);
	// State is spoken, not painted — no per-lifecycle hue at 12x2px.
	assert.doesNotMatch(RAIL_COLUMN_SOURCE, /bg-icon-warning|bg-icon-information/u);
	// The dash is load-bearing too — it means "uncaptured" — so the arrival
	// recolours it rather than replacing the border style.
	assert.match(CARD_SOURCE, /border border-dashed/u);
	// Reduced motion drops the beat and keeps the mark. The beat is keyed on
	// `isArriving`, never on `isNew` — see the one-shot test below.
	assert.match(CARD_SOURCE, /const shouldPlayArrival = isArriving && !shouldReduceMotion;/u);
	assert.match(NOTCH_MARK_SOURCE, /const shouldPlayArrival = isArriving && !shouldReduceMotion;/u);
	// A settled card must not replay its entrance on an unrelated re-render.
	assert.match(CARD_SOURCE, /initial=\{shouldPlayArrival \? \{ opacity: 0, y: AGENT_SESSION_ARRIVAL_OFFSET_PX \} : false\}/u);
});

test("colour never carries newness on its own", () => {
	assert.match(CARD_SOURCE, /<span className="sr-only">Newly synced, not yet reviewed<\/span>/u);
	assert.match(RAIL_COLUMN_SOURCE, /isNew \? ", newly synced" : ""/u);
	// The rail's head answers "how many did I miss" for notches below the fold,
	// and the spoken form keeps the total the visible `+N` gives up.
	assert.match(RAIL_COLUMN_SOURCE, /\$\{sessionCount\} sessions, \$\{newCount\} newly synced/u);
});

test("the head count rolls through the shared Text Morphing slots effect", () => {
	// Reused, never re-implemented: the rail must not hand-roll a digit animation.
	assert.match(RAIL_COLUMN_SOURCE, /import TextMorphing from "@\/components\/visual\/text-morphing"/u);
	assert.match(RAIL_COLUMN_SOURCE, /<TextMorphing\s+config=\{HEAD_COUNT_MORPH\}/u);
	assert.match(RAIL_COLUMN_SOURCE, /variant: "slots"/u);
	// `autoSize` eases the slot's width across the `+N` ↔ total swap, so the
	// notches below it never jump.
	assert.match(RAIL_COLUMN_SOURCE, /autoSize: true/u);
	// A rail that mounts already collapsed must not spin its count in.
	assert.match(RAIL_COLUMN_SOURCE, /initial: false/u);
	// The renderer sets its own `aria-label`; the wrapper's `aria-hidden` has to
	// suppress it so the sibling `sr-only` stays the single spoken source.
	assert.match(RAIL_COLUMN_SOURCE, /aria-hidden="true"[\s\S]{0,400}?<TextMorphing/u);
	// `text` must be a string — `sessionCount` is a number.
	assert.match(RAIL_COLUMN_SOURCE, /String\(sessionCount\)/u);
});

test("arrival motion is tokenised, capped, and spatially anchored", () => {
	// duration-slow + bold ease-out: the flag recipe, because an arrival is a
	// notification of work showing up.
	assert.match(ARRIVAL_MOTION_SOURCE, /duration: 0\.25,\s*ease: \[0, 0\.4, 0, 1\]/u);
	// Enters from above, where sync lives; two properties, never three.
	assert.match(ARRIVAL_MOTION_SOURCE, /AGENT_SESSION_ARRIVAL_OFFSET_PX = -8/u);
	// Past the cap the group lands together instead of stepping in.
	assert.match(SESSION_INDEX_SOURCE, /ARRIVAL_STAGGER_LIMIT = 4/u);
	assert.match(SESSION_INDEX_SOURCE, /shouldStagger \? index \* ARRIVAL_STAGGER_SECONDS : 0/u);
	// The rail's arrival grows from the centre to full size — no overshoot
	// keyframes, and no second property competing with the scale.
	assert.match(NOTCH_MARK_SOURCE, /initial=\{shouldPlayArrival \? \{ scaleX: 0 \} : false\}/u);
	assert.match(NOTCH_MARK_SOURCE, /animate=\{shouldPlayArrival \? \{ scaleX: 1 \} : undefined\}/u);
	assert.doesNotMatch(NOTCH_MARK_SOURCE, /scaleX: \[/u);
	assert.doesNotMatch(NOTCH_MARK_SOURCE, /times:/u);
	// Arriving notches push the ones below them down instead of teleporting, and
	// the scrollport is declared so the slide starts from the right place.
	assert.match(RAIL_COLUMN_SOURCE, /layout=\{shouldReduceMotion \? false : true\}/u);
	assert.match(RAIL_COLUMN_SOURCE, /layoutScroll/u);
});

test("the demo drives an arrival through both forms at once", () => {
	assert.match(PAGE_SOURCE, /ARRIVAL_BATCHES/u);
	// One shared set across the expanded and collapsed columns, so one click
	// shows both treatments.
	const newIdUses = PAGE_SOURCE.match(/newItemIds=\{newIds\}/gu) ?? [];
	assert.equal(newIdUses.length, 2, "expected both demo columns to receive the arrivals");
	// Arrivals prepend, matching the entrance that starts above the list.
	assert.match(PAGE_SOURCE, /\[\.\.\.batch, \.\.\.currentItems\]/u);
	// Reviewing decays the mark, standing in for the watermark advancing.
	assert.match(PAGE_SOURCE, /handleMarkReviewed/u);
	// Updaters stay pure: no sibling setState from inside one.
	assert.doesNotMatch(PAGE_SOURCE, /setSyncedBatches\(\(/u);
	assert.match(DETAIL_SOURCE, /name: "newItemIds"/u);
});

test("the arrival beat stays one-shot across a collapse toggle", () => {
	// Collapsing swaps the cards for the rail and back, remounting them — and a
	// mount re-arms `initial`. The column survives the toggle, so it owns the
	// history of which ids have already played; the two branches only render it.
	assert.match(INDEX_SOURCE, /const \[playedArrivalIds, setPlayedArrivalIds\]/u);
	assert.match(INDEX_SOURCE, /if \(!playedArrivalIds\.has\(id\)\)/u);
	// Mirrored, not accumulated, so a cleared id can legitimately arrive again.
	assert.match(INDEX_SOURCE, /Mirror `newItemIds` rather than accumulating/u);
	assert.match(INDEX_SOURCE, /return isUnchanged \? current : next;/u);
	// Both branches get the beat set and the mark set, and they are distinct.
	assert.match(INDEX_SOURCE, /<AgentSessionColumnRail[\s\S]{0,200}?arrivingItemIds=\{arrivingItemIds\}/u);
	assert.match(INDEX_SOURCE, /<AgentSession[\s\S]{0,200}?arrivingItemIds=\{arrivingItemIds\}/u);
	assert.match(SESSION_TYPES_SOURCE, /arrivingItemIds\?: ReadonlySet<string>;/u);
	// Defaulting to the mark keeps a host that never unmounts the list correct.
	assert.match(SESSION_INDEX_SOURCE, /const beatItemIds = arrivingItemIds \?\? newItemIds;/u);
});
