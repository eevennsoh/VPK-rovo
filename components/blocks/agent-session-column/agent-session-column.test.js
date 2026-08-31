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
const NOTCH_MAGNIFY_SOURCE = readFileSync(
	join(__dirname, "../agent-session/agent-session-notch-magnify.ts"),
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

test("the column is a filled accent-gray plane, unlike the board's unfilled status columns", () => {
	assert.match(INDEX_SOURCE, /bg-bg-accent-gray-subtlest/u);
	// The fill is the whole point of the column, so it must not be reachable only
	// through a caller-supplied class.
	assert.doesNotMatch(INDEX_SOURCE, /className=\{cn\(\s*className/u);
	assert.match(INDEX_SOURCE, /borderRadius: token\("radius\.xlarge"\)/u);
});

test("the fill starts below the header, so the title shares the status columns' baseline", () => {
	// The header has to sit on the board surface at the same inset and baseline
	// as `To do`. Filling the <section> itself would put the title inside the
	// grey and push it 8px in and 8px down from every other column title.
	assert.doesNotMatch(INDEX_SOURCE, /<section[\s\S]*?className=\{cn\(\s*"[^"]*bg-bg-accent-gray-subtlest/u);
	assert.doesNotMatch(INDEX_SOURCE, /"group\/session-column[^"]*bg-bg-accent-gray-subtlest/u);
	// The fill is a plane the header is a sibling of, not an ancestor of.
	assert.match(INDEX_SOURCE, /bg-bg-accent-gray-subtlest/u);
	assert.match(INDEX_SOURCE, /const AGENT_SESSION_PLANE =/u);
	// The section carries no padding of its own either — that would inset the
	// header just as surely as the fill would.
	assert.doesNotMatch(INDEX_SOURCE, /padding: collapsed \?/u);
});

test("card rendering is delegated to the Agent Session block, never re-implemented", () => {
	assert.match(INDEX_SOURCE, /import \{ AGENT_SESSION_ITEMS, AgentSession \} from "@\/components\/blocks\/agent-session"/u);
	assert.match(INDEX_SOURCE, /<AgentSession\b/u);
	// No forked card chrome: the dashed border and flyout belong to the card.
	assert.doesNotMatch(INDEX_SOURCE, /border-dashed|UncapturedWorkChin|AgentListRow/u);
});

test("the header count defaults to the rendered sessions and can be overridden", () => {
	assert.match(INDEX_SOURCE, /const sessionCount = count \?\? items\.length;/u);
	assert.match(TYPES_SOURCE, /count\?: number;/u);
});

test("the scrollport reserves the focus-ring gutter instead of clipping a focused card", () => {
	assert.match(INDEX_SOURCE, /-m-1 min-h-0 min-w-0 flex-1 overflow-y-auto p-1/u);
	assert.match(INDEX_SOURCE, /useHasVerticalOverflow/u);
});

test("edge fades sit on the column plane so they span the full backdrop width", () => {
	// Mask-image on the inset scrollport left a gutter (padding + scrollbar track)
	// where cards stayed sharp. Overlays are positioned to the plane instead.
	assert.match(INDEX_SOURCE, /ScrollMaskEdgeOverlay/u);
	assert.match(INDEX_SOURCE, /AGENT_SESSION_PLANE_FADE_COLOR = "var\(--color-bg-accent-gray-subtlest\)"/u);
	assert.match(INDEX_SOURCE, /showTopScrollMask \? \(/u);
	assert.match(INDEX_SOURCE, /showBottomScrollMask \? \(/u);
	assert.match(INDEX_SOURCE, /edge="top"/u);
	assert.match(INDEX_SOURCE, /edge="bottom"/u);
	assert.doesNotMatch(INDEX_SOURCE, /buildScrollMaskStyle/u);
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
	// this column too. Golden Journeys aliases board assignees onto session
	// members before the loose-work filter runs.
	assert.match(BOARD_PAGE_SOURCE, /agentSessionAssigneeIdAliases\?: Readonly<Record<string, string>>;/u);
	assert.match(
		BOARD_PAGE_SOURCE,
		/toPulseMemberId\(\s*selectedAssigneeIds,\s*PULSE_MEMBER_IDS,\s*agentSessionAssigneeIdAliases,\s*\)/u,
	);
	assert.match(
		BOARD_PAGE_SOURCE,
		/filterPulseLooseWorkByMember\(pulseTimeline\.looseWork, agentSessionMemberId\)/u,
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
	assert.doesNotMatch(NOTCH_MARK_SOURCE, /jira-kanban\/experimental/u);
	assert.doesNotMatch(NOTCH_MAGNIFY_SOURCE, /jira-kanban\/experimental/u);
});

test("column resize buttons swap icons without using selected button state", () => {
	assert.match(INDEX_SOURCE, /aria-label=\{`Collapse \$\{title\} column`\}/u);
	assert.match(INDEX_SOURCE, /<ShrinkHorizontalIcon/u);
	assert.match(INDEX_SOURCE, /<TooltipContent>Collapse<\/TooltipContent>/u);
	assert.match(RAIL_COLUMN_SOURCE, /aria-label=\{`Expand \$\{title\} column`\}/u);
	assert.match(RAIL_COLUMN_SOURCE, /<GrowHorizontalIcon/u);
	assert.match(RAIL_COLUMN_SOURCE, /<TooltipContent>Expand<\/TooltipContent>/u);
	assert.doesNotMatch(INDEX_SOURCE, /<TooltipContent>Collapse column<\/TooltipContent>/u);
	assert.doesNotMatch(RAIL_COLUMN_SOURCE, /<TooltipContent>Expand column<\/TooltipContent>/u);
	assert.doesNotMatch(INDEX_SOURCE, /\baria-(?:expanded|pressed)(?:\s|=)/u);
	assert.doesNotMatch(RAIL_COLUMN_SOURCE, /\baria-(?:expanded|pressed)(?:\s|=)/u);
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
	// The dock's fade in and out are tokenised as resolved cubic-beziers, because
	// Motion cannot read `var()`: duration-normal + ease-out-practical arriving,
	// and the shorter duration-fast + ease-in leaving, as every exit is.
	assert.match(NOTCH_MAGNIFY_SOURCE, /AGENT_SESSION_NOTCH_MAGNIFY_IN = \{\s*duration: 0\.15,\s*ease: \[0\.4, 1, 0\.6, 1\]/u);
	assert.match(NOTCH_MAGNIFY_SOURCE, /AGENT_SESSION_NOTCH_MAGNIFY_OUT = \{\s*duration: 0\.1,\s*ease: \[0\.6, 0, 0\.8, 0\.6\]/u);
	// A slope that tracks the cursor is ambient motion, so reduced motion drops
	// the dock outright rather than shortening it — the marks then fall back to
	// their own row's hover, which resolves instantly.
	assert.match(RAIL_COLUMN_SOURCE, /const isDocked = shouldReduceMotion !== true;/u);
	assert.match(RAIL_COLUMN_SOURCE, /proximity=\{isDocked \? \{/u);
	// A mark with no rail behind it keeps the transform hover it has always had.
	// The group is the row and the button inside it takes focus, so keyboard
	// parity needs `group-has-[:focus-visible]` — `group-focus-visible` never
	// matches.
	assert.match(NOTCH_MARK_SOURCE, /group-hover\/notch:scale-x-\[1\.6\]/u);
	assert.match(NOTCH_MARK_SOURCE, /group-has-\[:focus-visible\]\/notch:scale-x-\[1\.6\]/u);
	assert.doesNotMatch(NOTCH_MARK_SOURCE, /group-focus-visible\/notch:/u);
	// Clipping is scoped to the resize, so a focused card's ring is never cut.
	assert.match(INDEX_SOURCE, /collapsed \|\| isResizing \? "overflow-hidden" : null/u);
	assert.match(INDEX_SOURCE, /event\.propertyName === "width"/u);
});

test("the resting notch alpha stays pinned to the plane it is painted on", () => {
	// The mark is one element carrying two named colours: `color.icon` at an
	// alpha chosen so it resolves to `color.icon.subtlest` over the plane behind
	// it. That makes the constant a function of the plane's fill, and a fill
	// change would silently leave every resting notch the wrong grey. Pin the two
	// together here — the arithmetic itself is covered in
	// `agent-session-notch-magnify.test.ts`.
	assert.match(INDEX_SOURCE, /const AGENT_SESSION_PLANE =\s*\n?\s*"[^"]*bg-bg-accent-gray-subtlest/u);
	assert.match(NOTCH_MAGNIFY_SOURCE, /color\.background\.accent\.gray\.subtlest/u);
	assert.match(NOTCH_MAGNIFY_SOURCE, /rest: 0\.66,/u);
	// The old sunken plane must not linger in the rationale.
	assert.doesNotMatch(NOTCH_MAGNIFY_SOURCE, /elevation\.surface\.sunken/u);
});

test("the rail is one dock, so notches swell by distance rather than per row", () => {
	// The whole point of the effect: the notch nearest the cursor is the longest
	// and its neighbours taper off, which only works if one owner holds the
	// pointer position for every mark. A hover handler per notch cannot express
	// a distance.
	assert.match(RAIL_COLUMN_SOURCE, /function useNotchDock\(itemCount: number, enabled: boolean\)/u);
	assert.match(RAIL_COLUMN_SOURCE, /<motion\.ul[\s\S]{0,600}?onPointerMove=\{isDocked \? dock\.handlePointerMove : undefined\}/u);
	assert.match(RAIL_COLUMN_SOURCE, /onPointerLeave=\{isDocked \? dock\.handlePointerLeave : undefined\}/u);
	// Motion values, never React state: a rail of marks re-rendering on every
	// mouse pixel would stall the column.
	assert.match(RAIL_COLUMN_SOURCE, /const pointerY = useMotionValue\(AGENT_SESSION_NOTCH_POINTER_AWAY\);/u);
	assert.match(NOTCH_MARK_SOURCE, /useTransform\(\[pointerY, magnify\]/u);
	assert.doesNotMatch(RAIL_COLUMN_SOURCE, /useState[^\n]*hoveredNotch/u);
	// Centres are measured in the list's content space, so scrolling moves the
	// pointer through them instead of invalidating them.
	assert.match(RAIL_COLUMN_SOURCE, /rect\.top - listRect\.top \+ list\.scrollTop \+ rect\.height \/ 2/u);
	assert.match(RAIL_COLUMN_SOURCE, /onScroll=\{isDocked \? dock\.handleScroll : undefined\}/u);
	// An arrival slides its neighbours over a quarter second; the slope has to
	// pick up the new geometry rather than keep pointing at the old rows.
	assert.match(RAIL_COLUMN_SOURCE, /\}, \[enabled, itemCount, measure\]\);/u);
	// Touch has no hover, and docking under a finger would fight the scroll.
	assert.match(RAIL_COLUMN_SOURCE, /event\.pointerType === "touch"/u);
	// The parked pointer is finite — an Infinity poisons a motion value for good.
	assert.match(NOTCH_MAGNIFY_SOURCE, /AGENT_SESSION_NOTCH_POINTER_AWAY = -1;/u);
	// Peak length is the rail's own channel: 32px less the plane's 4px padding.
	assert.match(NOTCH_MAGNIFY_SOURCE, /peak: 24,/u);
});

test("length carries proximity, colour carries selection — one notch, not the slope", () => {
	// Darkening every notch in proportion to its distance turned the swell into
	// one grey gradient and lost the mark actually under the pointer inside it.
	// Length still tapers across neighbours; the darker `color.icon` lands on the
	// selected notch alone and everything else holds `color.icon.subtlest`.
	assert.match(NOTCH_MARK_SOURCE, /const width = useTransform\(falloff,/u);
	assert.match(NOTCH_MARK_SOURCE, /const opacity = useTransform\(\[nearestIndex, magnify\]/u);
	assert.match(NOTCH_MARK_SOURCE, /nearest === index \? amount : 0/u);
	assert.doesNotMatch(NOTCH_MARK_SOURCE, /const opacity = useTransform\(falloff,/u);
	// Selection is the rail's to resolve: a mark cannot know it is the nearest.
	assert.match(RAIL_COLUMN_SOURCE, /const nearestIndex = useMotionValue\(AGENT_SESSION_NOTCH_NO_NEAREST\);/u);
	assert.match(RAIL_COLUMN_SOURCE, /nearestIndex\.set\(toNearestAgentSessionNotchIndex\(centersRef\.current, offset\)\)/u);
	assert.match(RAIL_COLUMN_SOURCE, /nearestIndex: dock\.nearestIndex,/u);
	// Nearest wins outright, so the pointer always belongs to exactly one notch —
	// a half-pitch threshold would leave dead gaps between sliding rows.
	assert.match(NOTCH_MAGNIFY_SOURCE, /export function toNearestAgentSessionNotchIndex\(/u);
	assert.match(NOTCH_MAGNIFY_SOURCE, /AGENT_SESSION_NOTCH_NO_NEAREST = -1;/u);
	// The handover between notches is a state change, so CSS cross-fades it at
	// the list-item interaction profile. Width stays off that transition — it
	// tracks the pointer per frame and must not lag a beat behind it.
	assert.match(NOTCH_MARK_SOURCE, /bg-icon transition-opacity duration-fast ease-out-practical motion-reduce:transition-none/u);
	// Colour drains on the same beat as the swell, not a frame ahead of it.
	assert.match(
		RAIL_COLUMN_SOURCE,
		/animate\(magnify, 0, AGENT_SESSION_NOTCH_MAGNIFY_OUT\)\.then\(\(\) => \{[\s\S]{0,200}?nearestIndex\.set\(AGENT_SESSION_NOTCH_NO_NEAREST\)/u,
	);
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
	assert.match(CARD_SOURCE, /border-dashed border-border-discovery/u);
	assert.match(CARD_SOURCE, /border-dashed border-border-disabled/u);
	assert.match(CARD_SOURCE, /border-solid border-border/u);
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
	assert.match(CARD_SOURCE, /border-dashed/u);
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
