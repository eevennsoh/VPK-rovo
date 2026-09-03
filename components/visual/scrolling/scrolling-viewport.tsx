"use client";

import { useMemo, useRef, useState } from "react";
import { Ticker } from "motion-plus/react";

import type { AgentSessionItem } from "@/components/blocks/agent-session";
import { JiraSessionFlyoutSuspensionProvider } from "@/components/blocks/product-sidebar/variants/jira-session-flyout";
import { cn } from "@/lib/utils";

import { SCROLLING_FADE_PX, SCROLLING_GAP_PX } from "./data";
import { ScrollingCard } from "./scrolling-card";
import {
	ScrollingOffsetBridge,
	type ScrollingTickerGeometry,
	type TickerOffset,
} from "./scrolling-offset-bridge";
import type {
	ScrollingDepth,
	ScrollingEntranceOrigin,
	ScrollingStackOrder,
} from "./stack-layout";
import { ScrollingEntranceStarter } from "./use-scrolling-entrance";
import { useScrollingDrag } from "./use-scrolling-drag";
import { useScrollingFocusScroll } from "./use-scrolling-focus";
import { useScrollingGestures } from "./use-scrolling-gestures";

export interface ScrollingProps {
	items?: readonly AgentSessionItem[];
	className?: string;
	/** Scrollport height in px. Keep it under the window — Ticker clamps to it. */
	viewportHeight?: number;
	/** Wheel/trackpad scrolling. Drag and the loop are always on. */
	wheel?: boolean;
	/**
	 * Where the collapsed deck sits before it unfurls, and therefore which way
	 * the list grows: `"centre"` opens symmetrically from the middle, `"top"`
	 * deals downward from the top edge, `"bottom"` deals upward from the bottom.
	 */
	entranceOrigin?: ScrollingEntranceOrigin;
	/** Which card paints on top wherever cards overlap. */
	stackOrder?: ScrollingStackOrder;
	/**
	 * Gradual scale-and-tuck for cards approaching a scrollport edge, so they
	 * slide under their neighbours into a deck instead of being clipped.
	 */
	depth?: ScrollingDepth;
}

/**
 * The scrollport itself. Split out from `<Scrolling>` only so the entrance
 * provider can sit above it — the shared collapse value has to be created
 * outside this subtree for every card and the starter to read one source.
 */
export function ScrollingViewport({
	className,
	depth,
	entranceOrigin,
	items,
	stackOrder,
	viewportHeight,
	wheel,
}: Readonly<Required<ScrollingProps>>) {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const geometryRef = useRef<ScrollingTickerGeometry | null>(null);
	const [offset, setOffset] = useState<TickerOffset | null>(null);
	const gestures = useScrollingGestures({ containerRef, offset, wheel });
	const dragProps = useScrollingDrag(offset);
	useScrollingFocusScroll({ containerRef, geometryRef, offset });
	// Ticker's remeasure effect depends on the `items` array identity; an inline
	// `.map()` would tear down and rebuild two ResizeObservers every render.
	const cards = useMemo(
		() =>
			items.map((item) => (
				<ScrollingCard
					depth={depth}
					entranceOrigin={entranceOrigin}
					item={item}
					key={item.id}
					stackOrder={stackOrder}
				/>
			)),
		[depth, entranceOrigin, items, stackOrder],
	);

	return (
		// Every card mounts a session flyout that opens on hover with no delay,
		// which in a drag scroller fires constantly. The repo's own escape hatch
		// redirects every trigger in the subtree to a dead handle.
		<JiraSessionFlyoutSuspensionProvider suspended>
			<div
				aria-label="Agent sessions"
				className={cn("relative w-full", className)}
				// Seeded here as well as in `use-scrolling-gestures.ts` so the
				// coarse-pointer `touch-action` override below matches from the
				// very first paint, before any effect has run. React writes it once
				// on mount and never touches it again (the prop never changes), so
				// it cannot fight the hook's imperative updates.
				data-engaged="false"
				ref={containerRef}
				role="region"
				style={{ height: viewportHeight }}
				{...gestures}
			>
				<p className="sr-only">
					A looping list of agent sessions. Drag it vertically to scroll, and release to
					throw it. To scroll with the wheel or trackpad, or to drag on a touch screen,
					first engage the list by tapping or clicking it, or by moving keyboard focus
					into it; press Escape, tap outside, or move the pointer away to hand scrolling
					back to the page. Tab steps through the actions on each session and the list
					scrolls to keep the focused action in view.
				</p>
				{/*
				 * Coarse pointers only, and only while disengaged. `touch-action`
				 * is latched by the compositor when a gesture STARTS, so the swipe
				 * that engages the list is necessarily spent on the page and the
				 * next one drags — without this hint that first "ignored" swipe is
				 * unexplained. Decorative: the `sr-only` copy above says the same
				 * thing to assistive tech, so announcing it twice would be noise.
				 */}
				<div
					aria-hidden="true"
					className="pointer-events-none absolute inset-x-0 bottom-2 z-10 flex justify-center opacity-0 duration-normal ease-out-practical transition-opacity motion-reduce:transition-none pointer-coarse:[[data-engaged=false]_&]:opacity-100"
				>
					<span className="rounded-full bg-bg-neutral-bold px-2 py-0.5 text-[11px] text-text-inverse">
						Tap, then drag
					</span>
				</div>
				<Ticker
					align="stretch"
					as="div"
					axis="y"
					// `p-1` reserves the 4px gutter the cards' outward focus rings
					// need: the root is `overflow: clip` on both axes, and clipping
					// happens at the padding box.
					//
					// No `touch-none`: Motion writes `touch-action: pan-x` inline for
					// `drag="y"` and inline wins, so the class was dead — and if it
					// ever won it would be WRONG, removing the one axis touch users
					// still have for panning the page. `cursor-grab` is the only
					// visible affordance that the surface is interactive at all.
					//
					// The `touch-pan-y!` override IS how the page keeps its scroll on
					// a touch device. An `!important` author rule is the one thing
					// that outranks Motion's non-important inline style, and it is
					// scoped to coarse pointers and to the disengaged state so the
					// engaged list still gets Motion's `pan-x` and its inertia throw.
					// Measured: flipping this rule re-routes the very next gesture
					// and leaves `drag`, `_dragY` and the absent `onDragEnd` — i.e.
					// Ticker's own momentum branch — completely untouched.
					className="h-full w-full cursor-grab select-none p-1 active:cursor-grabbing pointer-coarse:[[data-engaged=false]_&]:touch-pan-y!"
					fade={SCROLLING_FADE_PX}
					gap={SCROLLING_GAP_PX}
					itemSize="auto"
					items={cards}
					loop
					// Load-bearing, not decoration. We deliberately do NOT pass an
					// `offset` prop (see {@link TickerOffset}), so Ticker's auto-scroll
					// rAF stays wired up; `0` makes every one of its frames a no-op
					// write of the offset's own value, which never fights the drag
					// throw and never drifts the list.
					velocity={0}
					// `drag`/`_dragY`, plus the reduced-motion dead-stop handlers.
					// Spread last so nothing above can shadow them.
					{...dragProps}
				>
					{/* Both children sit inside TickerContext. */}
					<ScrollingOffsetBridge geometryRef={geometryRef} onOffset={setOffset} />
					{/* Starts the unfurl on `isMeasured`. */}
					<ScrollingEntranceStarter />
				</Ticker>
			</div>
		</JiraSessionFlyoutSuspensionProvider>
	);
}
