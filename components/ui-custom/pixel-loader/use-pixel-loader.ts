"use client";

/**
 * Hooks backing `PixelLoader`. Split out of the component so the render stays
 * presentational.
 */

import { useEffect, useState } from "react";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/**
 * SSR-safe `prefers-reduced-motion: reduce` listener.
 *
 * `PixelLoader` needs this in JS rather than the usual `motion-reduce:`
 * utility: each of the nine cells carries a different `animation-delay`, so the
 * animation has to be an inline style — and inline styles outrank any class,
 * which would make `motion-reduce:animate-none` silently do nothing.
 *
 * Mirrors the implementation in `components/ui-custom/twg-loader`.
 */
export function usePrefersReducedMotion(): boolean {
	const [reduced, setReduced] = useState(false);

	useEffect(() => {
		const mql = window.matchMedia(REDUCED_MOTION_QUERY);
		const update = () => setReduced(mql.matches);
		update();
		mql.addEventListener("change", update);
		return () => mql.removeEventListener("change", update);
	}, []);

	return reduced;
}

/** How often the elapsed readout repaints. One decimal place needs 100ms. */
const TICK_MS = 100;

/** `"12.3s"` under a minute, `"1m 05.0s"` past it. Zero-padded so the width is stable. */
function formatElapsed(elapsedMs: number): string {
	const totalSeconds = elapsedMs / 1000;
	if (totalSeconds < 60) {
		return `${totalSeconds.toFixed(1)}s`;
	}
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;
	return `${minutes}m ${seconds.toFixed(1).padStart(4, "0")}s`;
}

/**
 * Live elapsed-time readout for one mounted timer session.
 *
 * Derives from a `performance.now()` start stamp rather than incrementing a
 * counter, so a throttled or backgrounded tab does not accumulate drift.
 */
export function useElapsed(): string {
	const [elapsedMs, setElapsedMs] = useState(0);

	useEffect(() => {
		const startedAt = performance.now();
		const tick = () => setElapsedMs(performance.now() - startedAt);
		tick();
		const timer = setInterval(tick, TICK_MS);
		return () => clearInterval(timer);
	}, []);

	return formatElapsed(elapsedMs);
}
