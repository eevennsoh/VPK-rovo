"use client";

import { useEffect, type RefObject } from "react";
import type { MotionValue } from "motion/react";

import { stackZIndex, type ScrollingStackOrder } from "./stack-layout";

/**
 * Applies a LIVE paint order to the ticker `<li>` that owns `ref`'s subtree.
 *
 * ## Why this is imperative
 *
 * `z-index` has to land on the `<li>`, not on our wrapper. Ticker gives every
 * item `position: relative` plus a `y` transform (`TickerItem.mjs`), and a
 * transform creates a stacking context — so the `<li>`s are the siblings whose
 * paint order is actually up for grabs, while a `z-index` on our wrapper would
 * only order it against nothing inside its own `<li>`.
 *
 * Ticker builds that `<li>` itself from `useTickerItem().props` and offers no
 * hook to merge extra style into it, so reaching for the node is the only way
 * short of switching the whole scroller to `itemSize="manual"` (which hands the
 * item element to us but also hands us Ticker's measurement contract). It is
 * safe: `TickerItem.mjs` never writes `zIndex`, so nothing upstream is fighting
 * us for the property.
 *
 * ## Why the layer is derived here rather than passed in
 *
 * The order has to track the loop, not the DOM (see {@link stackZIndex}), so it
 * changes while the list is moving. Taking it as a plain prop would mean a
 * React re-render of the card — and of the whole `AgentSession` subtree inside
 * it — every time a card wrapped, mid-drag.
 *
 * So the hook takes the raw loop position and calls {@link stackZIndex} inside
 * the subscription. Deriving it with a `useTransform` first LOOKED tidier and
 * silently broke the clones: a combined value publishes on Motion's own render
 * frame, so a copy whose loop position is written once on mount and then never
 * changes again — which is exactly a clone that has not reprojected yet — was
 * still reading the derived value's seed. Measured in-browser at
 * `viewportHeight` 720: all eight originals laddered correctly while all eight
 * clones sat at the seed layer, i.e. no paint order at all among them. Reading
 * `.get()` from a value this hook's own effect ordering guarantees is already
 * written has no such window.
 */
export function useStackOrder(
	ref: RefObject<HTMLElement | null>,
	order: ScrollingStackOrder,
	loopPosition: MotionValue<number>,
): void {
	useEffect(() => {
		const item = ref.current?.closest("li");
		if (!(item instanceof HTMLElement)) return;
		const previous = item.style.zIndex;
		const apply = (position: number) => {
			item.style.zIndex = String(stackZIndex(order, position));
		};
		// `useCardLoopPosition` seeds the value in an effect registered before
		// this one, so by here it is the card's real position, not the seed.
		apply(loopPosition.get());
		const unsubscribe = loopPosition.on("change", apply);
		return () => {
			unsubscribe();
			item.style.zIndex = previous;
		};
	}, [loopPosition, order, ref]);
}
