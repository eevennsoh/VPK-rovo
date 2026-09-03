"use client";

import { useMemo, useRef } from "react";
import { motion, useTransform } from "motion/react";
import { useTicker, useTickerItem } from "motion-plus/react";

import { AgentSession, type AgentSessionItem } from "@/components/blocks/agent-session";

import {
	SCROLLING_DEPTH_LIFT_PX,
	SCROLLING_DEPTH_MIN_SCALE,
	SCROLLING_DEPTH_ZONE_PX,
} from "./data";
import { FAN_OPACITY_INPUT, fanOffset, fanOpacity } from "./lib";
import {
	depthGate,
	depthLift,
	depthProgress,
	depthScale,
	fanAnchor,
	fansIn,
	type ScrollingDepth,
	type ScrollingEntranceOrigin,
	type ScrollingStackOrder,
} from "./stack-layout";
import { useCardLoopPosition, useCardTop } from "./use-card-top";
import { useScrollingEntrance } from "./use-scrolling-entrance";
import { useStackOrder } from "./use-stack-order";

/**
 * Scaling toward the edge a card is tucking into, so it slides UNDER its
 * neighbour rather than shrinking away from the list. Static per configuration,
 * never per frame — swapping the origin mid-tuck would visibly jump the card.
 */
const DEPTH_ORIGIN: Record<ScrollingDepth, string | undefined> = {
	both: "50% 50%",
	bottom: "50% 100%",
	none: undefined,
};

/**
 * Collapse below which the depth tail is allowed to start, i.e. the knot where
 * the entrance's own opacity ramp finishes. Holding the tail behind it is what
 * keeps `opacity` and `scale` from ever animating at the same time; see
 * {@link depthGate} and the note on the wrapper's `style` below.
 */
const DEPTH_TAIL_HOLD_ABOVE = FAN_OPACITY_INPUT[1];

export interface ScrollingCardProps {
	item: AgentSessionItem;
	/** Where the collapsed deck sits before it unfurls. */
	entranceOrigin: ScrollingEntranceOrigin;
	/** Which card paints on top while cards overlap. */
	stackOrder: ScrollingStackOrder;
	/** Which scrollport edges get the scale-and-tuck tail. */
	depth: ScrollingDepth;
}

/**
 * One ticker item: a single detached, fully rounded agent-session card, the
 * shared fan-out entrance, and the depth tail.
 *
 * Both transforms live on the wrapper `<div>`, never on the `<li>` — Ticker owns
 * the `<li>`'s `y` (its loop reprojection) and the `<ul>`'s `y` (the scroll
 * offset), and writing either would fight the scroller. The one thing that MUST
 * live on the `<li>` is the paint order; see {@link useStackOrder}.
 */
export function ScrollingCard({
	depth,
	entranceOrigin,
	item,
	stackOrder,
}: Readonly<ScrollingCardProps>) {
	const { collapse, willChange } = useScrollingEntrance();
	const { containerLength, gap, inset, totalItemLength } = useTicker();
	const { cloneIndex, end, start } = useTickerItem();
	const wrapperRef = useRef<HTMLDivElement | null>(null);
	// `cloneIndex` is set to the ITEM index for clones, so index 0 is a real
	// clone. Branch on `undefined`, never on falsiness — Ticker does the same.
	const isClone = cloneIndex !== undefined;

	// `start`/`end` are measured against the `<ul>`, whose content box starts
	// `inset` (the container's padding-top) below the container's top edge, so
	// every list-space landmark is shifted by `inset` to reach scrollport space.
	const safeInset = Number.isFinite(inset) ? inset : 0;
	const cardHeight = Number.isFinite(end - start) ? Math.max(end - start, 0) : 0;
	// One loop period. `totalItemLength` and `gap` are plain numbers on the
	// ticker context, so reading them here crosses no runtime boundary.
	const pitch = totalItemLength + gap;
	// Scrollport space, so no `- safeInset` correction: the card centre fed to
	// `fanOffset` below is now scrollport-space too. Arithmetically identical to
	// the old list-space pair, and correct for a reprojected copy as well.
	const anchor = fanAnchor(entranceOrigin, containerLength, cardHeight);

	// `cardTop` is Ticker's own `renderedOffset + start + projection`: the card's
	// LAYOUT position, excluding this wrapper's transform. Reading the laid-out
	// position rather than the visual one is deliberate — feeding a value back
	// through the transform that produced it is the self-damping feedback loop
	// documented in `use-magnetic-proximity.ts`.
	//
	// The dependency array is LOAD-BEARING, not a style preference. Ticker's
	// values belong to motion 12 while this file imports motion 13 (see
	// `scrolling-offset-bridge.ts`), and the zero-argument
	// `useTransform(() => … tickerValue.get())` discovers its dependencies
	// through motion-dom's module-level `collectMotionValues` singleton — so a
	// motion 12 `.get()` registers with motion-dom 12's singleton, which
	// motion-dom 13 never reads. That form collected only `collapse` (a motion
	// 13 value), so the depth tail recomputed during the entrance and then
	// FROZE: cards kept the scale they happened to have when the unfurl ended,
	// no matter where they later scrolled to. Verified in-browser — after a
	// 280px drag every scale was byte-identical while the cards had moved a
	// third of the scrollport, and a forced React re-render snapped them all to
	// the correct values. Listing the values explicitly subscribes via
	// `.on("change")`, which is duck-typed and therefore crosses the runtime
	// split safely. `useCardTop` isolates and documents that one crossing.
	const cardTop = useCardTop();

	// Which copies fan is decided per frame from the card's live position, NOT
	// from `isClone`: at every viewport height where Ticker clones, the copies
	// standing in the scrollport at `offset === 0` are the CLONES, and gating on
	// clone-ness ran the whole unfurl off screen. See {@link fansIn}. A copy
	// admitted just past an edge is clipped by the scrollport, so this can never
	// read as a denser deck than intended.
	const fanY = useTransform([cardTop, collapse], ([top, collapsed]: number[]) => {
		// Settled: short-circuit so the steady state costs nothing per frame,
		// and so a gate flip during a later drag is provably invisible.
		if (collapsed <= 0) return 0;
		const portTop = top + safeInset;
		if (!fansIn(portTop, cardHeight, containerLength, pitch)) return 0;
		return fanOffset(collapsed, portTop + cardHeight / 2, anchor);
	});
	const opacity = useTransform([cardTop, collapse], ([top, collapsed]: number[]) => {
		if (collapsed <= 0) return 1;
		if (!fansIn(top + safeInset, cardHeight, containerLength, pitch)) return 1;
		return fanOpacity(collapsed);
	});

	// Signed progress into an edge zone, computed once and shared by the tuck and
	// the shrink so they cannot drift apart.
	const tail = useTransform([cardTop, collapse], ([top, collapsed]: number[]) => {
		if (depth === "none") return 0;
		const raw = depthProgress(
			top + cardHeight / 2 + safeInset,
			containerLength,
			SCROLLING_DEPTH_ZONE_PX,
			depth,
		);
		// Ramp the tail in only once the entrance's opacity ramp has finished,
		// so no more than two properties are ever in flight; see `depthGate`.
		return raw * depthGate(collapsed, DEPTH_TAIL_HOLD_ABOVE);
	});

	const y = useTransform(() => fanY.get() + depthLift(tail.get(), SCROLLING_DEPTH_LIFT_PX));
	const scale = useTransform(() => depthScale(tail.get(), SCROLLING_DEPTH_MIN_SCALE));

	// Paint order has to land on Ticker's `<li>`, which it builds itself, and it
	// has to follow the LOOP rather than the static item index — the index
	// ladder resets once per period and paints one adjacent pair inverted
	// wherever the depth tail has made them overlap. See {@link stackZIndex}.
	const loopPosition = useCardLoopPosition();
	useStackOrder(wrapperRef, stackOrder, loopPosition);

	// A single-item list makes the card's `<li>` both `:first-child` and
	// `:last-child`, which is what turns the fused well into a detached card
	// with all four radii and a full border — with zero edits to the block.
	const listItems = useMemo(() => [item], [item]);

	return (
		<motion.div
			// The raised surface lives here, not on the card's `<article>`, which
			// rests at `bg-transparent`. Painting it on the wrapper keeps the
			// block's own hover (`bg-surface-hovered`) and selected
			// (`bg-bg-accent-blue-subtlest`) fills on top instead of fighting them
			// in the cascade — the wrapper box coincides with the article's, so
			// the radius matches the card's own `rounded-lg`.
			className="w-full min-w-0 rounded-lg bg-surface-raised"
			// Clone `<li>`s are `aria-hidden` but their always-tab-order hover
			// actions are not, which would be an aria-hidden-focusable violation.
			// Clones carry `clone-item`, not `ticker-item`, so Ticker's own
			// keyboard navigation never queries them and this costs nothing.
			inert={isClone}
			ref={wrapperRef}
			// At most TWO properties animate at any one moment, which is what
			// `.agents/rules/motion-decisions.md` caps a transition at — and it
			// is enforced, not merely hoped for. `y` is always one of them. The
			// other is `opacity` for the first stretch of the entrance and
			// `scale` after it, and the handover is the hard knot in
			// `depthGate(collapse, DEPTH_TAIL_HOLD_ABOVE)`: above the knot the
			// gate is exactly 0, so `scale` is exactly 1; below it `opacity` has
			// already finished and is pinned at 1 for the rest of the
			// component's life.
			//
			// This USED to be untrue. With the tail gated on a plain
			// `1 - collapse` ramp, `scale` started moving on the first frame of
			// the unfurl while `opacity` was still ramping, so the shipped
			// default (`depth="bottom"`) animated `y` + `opacity` + `scale`
			// together for roughly the first 45% of the entrance — three
			// properties, over budget. Note that the tail's own `progress` is
			// derived from the card's LAID-OUT position, which the fan does not
			// move, so a card whose home is in the edge zone had a genuinely
			// non-trivial scale to animate throughout, not a rounding error.
			style={{
				opacity,
				scale,
				transformOrigin: DEPTH_ORIGIN[depth],
				// Not gated on `isClone` any more: a clone is exactly as likely to
				// be the copy that runs the unfurl (see {@link fansIn}). The hint
				// is live only while the ~600ms spring runs — `use-scrolling-
				// entrance.ts` sets it back to `auto` on completion — so this does
				// not leave a compositor layer per card for the life of the page.
				willChange,
				y,
			}}
		>
			{/*
			 * No `onView`: activation would fire on the click that terminates a
			 * drag. No `arrivingItemIds` / `newItemIds` either, which leaves the
			 * block's built-in arrival beat at `initial={false}` / `animate=
			 * {undefined}` so it cannot fight this entrance. No `sessionDrag`,
			 * which would install pointer handlers that fight Ticker's drag.
			 */}
			<AgentSession
				// The card's own `[li:not(:last-child)_&]:border-b-0` compiles to a
				// DESCENDANT selector, so Ticker's `<li class="ticker-item">` — never
				// `:last-child` once clones follow it — strips the bottom stroke off
				// every detached card. Re-assert it from the list this block actually
				// owns: `.cls li:last-child article` is (0,2,2) and beats the block's
				// (0,2,1), and this single-item `<li>` genuinely IS `:last-child`.
				// Same shape and same target as `AGENT_SESSION_WELL_LIST` in
				// `components/blocks/agent-session-column/index.tsx`.
				className="w-full min-w-0 [&_li:last-child_article]:border-b"
				items={listItems}
				variant="large"
			/>
		</motion.div>
	);
}
