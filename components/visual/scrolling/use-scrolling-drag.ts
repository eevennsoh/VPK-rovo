"use client";

import { useMemo } from "react";
import { useReducedMotion } from "motion/react";

import type { TickerOffset } from "./scrolling-offset-bridge";

/**
 * The drag-related props handed to `<Ticker>`. Everything is optional because
 * WHICH keys are present is the whole mechanism — see {@link useScrollingDrag}.
 */
export interface ScrollingDragProps {
	drag?: "y";
	_dragY?: TickerOffset;
	onDragEnd?: () => void;
	onPointerDown?: () => void;
}

/**
 * Drag wiring for the scroller, and the reduced-motion guard on its throw.
 *
 * Two things are decided here, both by presence rather than by value:
 *
 * 1. **`drag` is withheld until `offset` exists.** The offset is round-tripped
 *    out of ticker context through `useState`, so it is `null` on the first
 *    render. Ticker only takes over the gesture when BOTH `drag` and its drag
 *    `MotionValue` are set (`index.mjs`: `if (!onDragEnd && drag &&
 *    dragMotionValue)`); with `drag="y"` and no `_dragY`, Motion instead drags
 *    the container ELEMENT itself, translating the whole scrollport. Gating the
 *    two together closes that window.
 * 2. **Reduced motion suppresses the inertia throw.** motion-plus gates only its
 *    auto-scroll rAF on reduced motion, never the drag-end throw, so a flick
 *    still sweeps the viewport — which `.agents/rules/motion-decisions.md`
 *    forbids. Ticker installs that throw only when NO `onDragEnd` was passed, so
 *    supplying our own is the entire fix. Because the same branch also installs
 *    Ticker's `onPointerDown`, we have to replace that too: its `jump` is what
 *    stops whatever animation is currently writing the offset and zeroes the
 *    tracked velocity so the drag starts from the value on screen.
 *
 * When reduced motion is OFF, neither handler is passed and Ticker keeps its own
 * momentum — passing `onDragEnd`, `onPointerDown` or `dragMomentum` there would
 * silently disable it.
 */
export function useScrollingDrag(offset: TickerOffset | null): ScrollingDragProps {
	const shouldReduceMotion = useReducedMotion() === true;
	return useMemo(() => {
		if (offset === null) return {};
		if (!shouldReduceMotion) return { _dragY: offset, drag: "y" };
		return {
			_dragY: offset,
			drag: "y",
			// A dead stop: the list rests exactly where the pointer left it.
			onDragEnd: () => {
				offset.stop();
			},
			onPointerDown: () => {
				offset.jump(offset.get());
			},
		};
	}, [offset, shouldReduceMotion]);
}
