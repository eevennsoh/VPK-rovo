"use client";

import { createContext, createElement, use, useEffect, useRef, type ReactNode } from "react";
import { animate, useMotionValue, useReducedMotion, type MotionValue } from "motion/react";
import { useTicker } from "motion-plus/react";

import { SCROLLING_ENTRANCE_SPRING } from "./data";

export interface ScrollingEntrance {
	/**
	 * ONE shared value for the whole scroller, animating `1` (perfectly stacked
	 * deck) to `0` (laid out list). Deliberately shared rather than per-card:
	 * the reference recording starts every card boundary on the same frame, so
	 * there is no stagger to model.
	 */
	collapse: MotionValue<number>;
	/**
	 * `will-change` hint, live only while the spring runs. Shared for the same
	 * reason, and cleared on completion so the compositor does not keep a layer
	 * per card for the life of the page.
	 */
	willChange: MotionValue<string>;
}

const ScrollingEntranceContext = createContext<ScrollingEntrance | null>(null);

/**
 * Owns the shared entrance state. Mount this ABOVE the `<Ticker>` — it cannot
 * call `useTicker()` itself, so the "when do we start" decision lives in
 * {@link ScrollingEntranceStarter}, which renders inside the ticker context.
 */
export function ScrollingEntranceProvider({ children }: Readonly<{ children: ReactNode }>) {
	const shouldReduceMotion = useReducedMotion();
	// Seeded during render, never in an effect. An effect-seeded `1` would paint
	// one frame of the fully laid-out list before the deck collapses — Ticker
	// un-hides its `<ul>` (opacity 0 -> 1) on the same commit that reports
	// `isMeasured`, so that frame would be visible.
	const collapse = useMotionValue(shouldReduceMotion === true ? 0 : 1);
	const willChange = useMotionValue("auto");
	return createElement(ScrollingEntranceContext, { value: { collapse, willChange } }, children);
}

export function useScrollingEntrance(): ScrollingEntrance {
	const entrance = use(ScrollingEntranceContext);
	if (entrance === null) {
		throw new Error("useScrollingEntrance must be called inside <ScrollingEntranceProvider>.");
	}
	return entrance;
}

/**
 * Headless starter. Render it as `<Ticker>`'s child so it sits inside
 * `TickerContext` and can read `isMeasured`.
 *
 * Gating on `isMeasured` is both necessary and sufficient. Before it, every
 * item's `start`/`end` is `0` and `containerLength` is `0`, so the fan would
 * collapse to nothing; and Ticker only measures once the container is in view,
 * so `isMeasured === true` already implies "in view".
 */
export function ScrollingEntranceStarter(): null {
	const { collapse, willChange } = useScrollingEntrance();
	const { isMeasured } = useTicker();
	const shouldReduceMotion = useReducedMotion();
	// Resizes re-run the same measurement commit with `isMeasured: true`, so the
	// "already played" latch has to be a ref rather than a derived boolean.
	const hasPlayedRef = useRef(false);

	useEffect(() => {
		if (hasPlayedRef.current || !isMeasured) return;
		hasPlayedRef.current = true;
		if (shouldReduceMotion === true) {
			// Freeze at the meaningful frame — the list simply appears laid out.
			// Drag and the loop stay available; only the entrance is removed.
			collapse.set(0);
			return;
		}
		willChange.set("transform, opacity");
		const controls = animate(collapse, 0, {
			...SCROLLING_ENTRANCE_SPRING,
			onComplete: () => {
				willChange.set("auto");
			},
		});
		return () => {
			controls.stop();
			willChange.set("auto");
		};
	}, [collapse, isMeasured, shouldReduceMotion, willChange]);

	return null;
}
