"use client";

import { useEffect, useRef, type RefObject } from "react";
import {
	useMotionValue,
	useReducedMotion,
	useSpring,
	useTransform,
	type MotionValue,
} from "motion/react";

// macOS-dock proximity magnification. A single pointer-x MotionValue is tracked
// at the track level; each card derives its scale from the DISTANCE between the
// pointer and the card's CACHED center. Per repo perf rule the center is cached
// on layout events (scroll / resize / ResizeObserver) and never re-measured
// inside the per-frame transform.

// Falloff radius (px) on each side of a card's center where magnification ramps.
const DOCK_FALLOFF = 160;
// Peak scale reached when the pointer sits exactly over a card's center.
const DOCK_PEAK_SCALE = 1.25;
// Spring smoothing of the continuous, pointer-driven scale (the dock idiom —
// distinct from the discrete enter/exit transition recipes).
const DOCK_SPRING = { mass: 0.1, stiffness: 170, damping: 14 } as const;

/**
 * Create the shared pointer-x tracker for one dock. Set it from the track's
 * `onPointerMove` (`clientX`) and reset it to `Infinity` on `pointerleave` AND
 * while dragging — an infinite distance parks every card at rest scale.
 */
export function useDockPointer(): MotionValue<number> {
	return useMotionValue<number>(Number.POSITIVE_INFINITY);
}

export interface UseDockScaleOptions {
	/** Shared pointer-x MotionValue from `useDockPointer`. */
	pointerX: MotionValue<number>;
	/** The card element whose center drives the magnification. */
	cardRef: RefObject<HTMLElement | null>;
	/** The scroll container; its `scroll` events invalidate the cached center. */
	scrollContainerRef: RefObject<HTMLElement | null>;
	/** When true (e.g. dragging), pin the scale to 1 without tearing down springs. */
	disabled?: boolean;
}

/**
 * Derive one card's dock scale from the shared pointer position. Returns a
 * MotionValue suitable for `style={{ scale }}`. Reduced motion (or `disabled`)
 * pins the scale to a static 1.
 */
export function useDockScale({
	pointerX,
	cardRef,
	scrollContainerRef,
	disabled = false,
}: Readonly<UseDockScaleOptions>): MotionValue<number> {
	const shouldReduceMotion = useReducedMotion();
	const inert = disabled || (shouldReduceMotion ?? false);

	// Cached viewport center-x of this card. It is written only on layout events
	// (resize / scroll / ResizeObserver) and read only inside the per-frame
	// useTransform callback below — we never call getBoundingClientRect per frame.
	const centerRef = useRef(Number.POSITIVE_INFINITY);

	useEffect(() => {
		const measure = () => {
			const rect = cardRef.current?.getBoundingClientRect();
			centerRef.current = rect ? rect.x + rect.width / 2 : Number.POSITIVE_INFINITY;
		};
		measure();

		const container = scrollContainerRef.current;
		window.addEventListener("resize", measure);
		container?.addEventListener("scroll", measure, { passive: true });

		let resizeObserver: ResizeObserver | undefined;
		if (typeof ResizeObserver !== "undefined") {
			resizeObserver = new ResizeObserver(measure);
			if (cardRef.current) resizeObserver.observe(cardRef.current);
			if (container) resizeObserver.observe(container);
		}

		return () => {
			window.removeEventListener("resize", measure);
			container?.removeEventListener("scroll", measure);
			resizeObserver?.disconnect();
		};
	}, [cardRef, scrollContainerRef]);

	// Function form: reads the MotionValue inside a callback (never during
	// render). Recomputes whenever `pointerX` changes.
	const distance = useTransform(() => pointerX.get() - centerRef.current);
	const scaleTarget = useTransform(
		distance,
		[-DOCK_FALLOFF, 0, DOCK_FALLOFF],
		[1, DOCK_PEAK_SCALE, 1],
	);
	const smoothed = useSpring(scaleTarget, DOCK_SPRING);

	// A static MotionValue for the inert path — both hooks always run, so this is
	// a stable selection between two values, not a conditional hook call.
	const rest = useMotionValue(1);
	return inert ? rest : smoothed;
}
