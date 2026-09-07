const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");

const INDEX_SOURCE = readFileSync(join(__dirname, "index.tsx"), "utf8");
const ARRIVAL_HOOK_SOURCE = readFileSync(
	join(__dirname, "use-agent-session-user-notch-arrival.ts"),
	"utf8",
);
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
const PAGE_SOURCE = readFileSync(join(__dirname, "page.tsx"), "utf8");
const PANEL_DEMO_SOURCE = readFileSync(
	join(__dirname, "agent-session-column-panel-demo.tsx"),
	"utf8",
);
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
const DETAIL_SOURCE = readFileSync(
	join(__dirname, "../../../app/data/details/blocks/agent-session-column.ts"),
	"utf8",
);

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
	assert.match(CARD_SOURCE, /<span className="sr-only">Newly synced, not yet reviewed<\/span>/u);
	assert.match(CARD_SOURCE, /size-1\.5 -translate-y-1\/2 rounded-full bg-icon-discovery/u);
	assert.match(CARD_SOURCE, /absolute left-1\.5 top-1\/2/u);
	assert.doesNotMatch(CARD_SOURCE, /top-1\.5/u);
	assert.match(RAIL_COLUMN_SOURCE, /backgroundColor: AGENT_SESSION_NOTCH_TONE\.rest/u);
	assert.doesNotMatch(
		RAIL_COLUMN_SOURCE,
		/backgroundColor: isNew\s*\? AGENT_SESSION_NOTCH_TONE\.selected/u,
	);
	// A reviewed session rests as a quiet dot; hover and keyboard focus reveal
	// the same human face used by the expanded card, capped at 12x12.
	assert.match(RAIL_COLUMN_SOURCE, /size-3[^"\n]*rounded-full object-cover/u);
	assert.match(RAIL_COLUMN_SOURCE, /group-hover\/notch:opacity-100/u);
	assert.match(RAIL_COLUMN_SOURCE, /group-has-\[:focus-visible\]\/notch:opacity-100/u);
	assert.match(RAIL_COLUMN_SOURCE, /avatarSrc=\{visibleIdentity\.avatarSrc\}/u);
	assert.match(RAIL_COLUMN_SOURCE, /toAgentSessionVisibleIdentity\(item\)/u);
	// State is spoken, not painted — no per-lifecycle hue on the dot.
	assert.doesNotMatch(RAIL_COLUMN_SOURCE, /bg-icon-warning|bg-icon-information/u);
	// Arrival recolours the same solid frame rather than replacing the border.
	assert.doesNotMatch(CARD_SOURCE, /dash-4-2/u);
	// Reduced motion drops the beat and keeps the mark. The beat is keyed on
	// `isArriving`, never on `isNew` — see the one-shot test below.
	assert.match(CARD_SOURCE, /const shouldPlayArrival = isArriving && !shouldReduceMotion;/u);
	assert.match(ARRIVAL_HOOK_SOURCE, /const shouldPlayArrival = isArriving && !shouldReduceMotion;/u);
	assert.match(ARRIVAL_HOOK_SOURCE, /AGENT_SESSION_USER_NOTCH_ARRIVAL_HIDE_MS/u);
	assert.match(ARRIVAL_HOOK_SOURCE, /AGENT_SESSION_USER_NOTCH_ARRIVAL_COMPLETE_MS/u);
	// A settled card must not replay its entrance on an unrelated re-render.
	assert.match(CARD_SOURCE, /initial=\{shouldPlayArrival \? \{ opacity: 0, y: AGENT_SESSION_ARRIVAL_OFFSET_PX \} : false\}/u);
});

test("colour never carries newness on its own", () => {
	assert.match(CARD_SOURCE, /<span className="sr-only">Newly synced, not yet reviewed<\/span>/u);
	assert.match(RAIL_COLUMN_SOURCE, /isNew \? ", newly synced" : ""/u);
	// The collapsed header answers "how many did I miss" for notches below the
	// fold, and the spoken form keeps the total the visible `+N` gives up.
	assert.match(INDEX_SOURCE, /\$\{sessionCount\} sessions, \$\{newCount\} newly synced/u);
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
	// The rail's avatar arrival reuses hover's face, then fades back to the rest
	// dot. Scale-from-zero stays only for notches with no face to reveal.
	assert.match(RAIL_COLUMN_SOURCE, /initial=\{shouldPlayScaleArrival \? \{ scale: 0 \} : false\}/u);
	assert.match(RAIL_COLUMN_SOURCE, /animate=\{shouldPlayScaleArrival \? \{ scale: 1 \} : undefined\}/u);
	assert.match(RAIL_COLUMN_SOURCE, /showAvatar \? "opacity-100 scale-100"/u);
	assert.match(ARRIVAL_MOTION_SOURCE, /lingerMs: 400/u);
	assert.match(ARRIVAL_MOTION_SOURCE, /enterMs: 150/u);
	assert.match(ARRIVAL_MOTION_SOURCE, /exitMs: 100/u);
	assert.match(
		RAIL_COLUMN_SOURCE,
		/arrivalExiting\s*\n?\s*\? "transition-\[opacity,scale\] duration-fast ease-in"/u,
	);
	assert.doesNotMatch(NOTCH_MAGNIFY_SOURCE, /newRest: 8/u);
	assert.doesNotMatch(RAIL_COLUMN_SOURCE, /toAgentSessionUserNotchDiameter\(value, isNew\)/u);
	assert.match(RAIL_COLUMN_SOURCE, /useAgentSessionUserNotchArrival/u);
	assert.match(RAIL_COLUMN_SOURCE, /data-arrival-reveal=\{arrivalReveal \|\| undefined\}/u);
	assert.match(DETAIL_SOURCE, /briefly reveal the same human avatar/u);
	assert.doesNotMatch(DETAIL_SOURCE, /resting at 8px/u);
	assert.doesNotMatch(RAIL_COLUMN_SOURCE, /scale: \[/u);
	assert.doesNotMatch(RAIL_COLUMN_SOURCE, /times:/u);
	// Arriving notches push the ones below them down instead of teleporting.
	// The scrollport stays a plain `ul` so mask-image can fade the marks;
	// layout lives on each notch, not on a Motion scroll host.
	assert.match(RAIL_COLUMN_SOURCE, /layout=\{shouldReduceMotion \? false : "position"\}/u);
	assert.doesNotMatch(RAIL_COLUMN_SOURCE, /layoutScroll/u);
});

test("the panel demo drives an arrival through the Panel wrap", () => {
	assert.match(PANEL_DEMO_SOURCE, /ARRIVAL_BATCHES/u);
	const newIdUses = PANEL_DEMO_SOURCE.match(/newItemIds=\{newIds\}/gu) ?? [];
	assert.equal(newIdUses.length, 1, "expected the panel column to receive the arrivals");
	// Arrivals prepend, matching the entrance that starts above the list.
	assert.match(PANEL_DEMO_SOURCE, /\[\.\.\.batch, \.\.\.currentItems\]/u);
	// Reviewing decays the mark, standing in for the watermark advancing.
	assert.match(PANEL_DEMO_SOURCE, /handleMarkReviewed/u);
	// Sync / Mark reviewed / Reset stay on the panel variant only.
	assert.match(PANEL_DEMO_SOURCE, /Sync new work/u);
	assert.doesNotMatch(PAGE_SOURCE, /Sync new work/u);
	// Updaters stay pure: no sibling setState from inside one.
	assert.doesNotMatch(PANEL_DEMO_SOURCE, /setSyncedBatches\(\(/u);
	assert.match(DETAIL_SOURCE, /name: "newItemIds"/u);
});

test("the arrival target survives until Motion finishes, then stays one-shot", () => {
	// Collapsing swaps the cards for the rail and back, remounting them — and a
	// mount re-arms `initial`. The column survives the toggle, so it owns the
	// history of which ids have already played; the two branches only render it.
	assert.match(INDEX_SOURCE, /const \[playedArrivalIds, setPlayedArrivalIds\]/u);
	assert.match(INDEX_SOURCE, /if \(!playedArrivalIds\.has\(id\)\)/u);
	// Do not eagerly mirror every new id into played history. That removes the
	// card's animate target one effect after mount and strands it at opacity 0.
	assert.doesNotMatch(INDEX_SOURCE, /new Set<string>\(newItemIds\)/u);
	assert.match(INDEX_SOURCE, /const handleArrivalComplete = useCallback/u);
	assert.match(CARD_SOURCE, /onAnimationComplete=\{handleArrivalComplete\}/u);
	assert.match(NOTCH_MARK_SOURCE, /onAnimationComplete=\{handleArrivalComplete\}/u);
	// Both branches report completion and keep the beat set distinct from the mark.
	assert.match(
		INDEX_SOURCE,
		/<AgentSessionColumnRail[\s\S]{0,400}?onArrivalComplete=\{handleArrivalComplete\}/u,
	);
	assert.match(
		INDEX_SOURCE,
		/<AgentSession[\s\S]{0,400}?onArrivalComplete=\{handleArrivalComplete\}/u,
	);
	assert.match(SESSION_TYPES_SOURCE, /arrivingItemIds\?: ReadonlySet<string>;/u);
	assert.match(SESSION_TYPES_SOURCE, /onArrivalComplete\?: \(itemId: string\) => void;/u);
	// Defaulting to the mark keeps a host that never unmounts the list correct.
	assert.match(SESSION_INDEX_SOURCE, /const beatItemIds = arrivingItemIds \?\? newItemIds;/u);
});
