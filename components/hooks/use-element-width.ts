"use client";

import { useState, useEffect, useRef, type RefObject } from "react";

/**
 * Tracks the rendered width available to a component.
 *
 * Attach the returned ref to the component root to measure its own width via
 * ResizeObserver — use this for components that do not span the full viewport
 * (e.g. anything rendered inside a panel, split view, or docs preview frame),
 * where window.innerWidth overstates the available room and causes overlap.
 *
 * If the ref is never attached, the hook falls back to the viewport width, so
 * full-width consumers get the same value they would from a window-width hook
 * without any extra wiring.
 *
 * Returns 0 until first measured (and during SSR) to avoid hydration mismatches.
 */
export function useElementWidth<T extends HTMLElement>(): readonly [RefObject<T | null>, number] {
	const ref = useRef<T>(null);
	const [width, setWidth] = useState(0);

	useEffect(() => {
		const element = ref.current;
		if (element) {
			const observer = new ResizeObserver((entries) => {
				for (const entry of entries) {
					setWidth(entry.contentRect.width);
				}
			});
			observer.observe(element);
			setWidth(element.getBoundingClientRect().width);
			return () => observer.disconnect();
		}

		// No element attached — behave like a window-width hook.
		const handleResize = () => setWidth(window.innerWidth);
		handleResize();
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	return [ref, width] as const;
}
