"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface ToolbarOverflowResult {
	/** Attach to the flex container that lays out the foldable groups. */
	containerRef: (node: HTMLDivElement | null) => void;
	/**
	 * Number of leading groups (0..groupCount) that fit and should render
	 * inline. The remaining groups are "folded" into the overflow menu.
	 */
	visibleCount: number;
}

/**
 * Measures a horizontal toolbar whose foldable groups carry
 * `data-toolbar-group` and a single always-visible trailing anchor carrying
 * `data-toolbar-anchor` (the "+" button). It reports how many leading groups
 * fit before the anchor would be clipped.
 *
 * Caching strategy: each group's natural width is captured the first time it is
 * seen laid out at full size and remembered. This lets the hook compute fit in
 * BOTH directions — when the toolbar grows back, folded groups can return even
 * though they are currently hidden (and therefore zero-width) in the DOM.
 *
 * Mirrors `use-has-horizontal-overflow`: ResizeObserver on the container plus a
 * `window.resize` fallback and an SSR-safe initial state (everything visible).
 */
export function useToolbarOverflow(groupCount: number): ToolbarOverflowResult {
	const elementRef = useRef<HTMLDivElement | null>(null);
	const [element, setElement] = useState<HTMLDivElement | null>(null);
	const [visibleCount, setVisibleCount] = useState(groupCount);
	// index -> measured natural width in px (only updated while a group is visible).
	const groupWidthsRef = useRef<number[]>([]);

	const measure = useCallback(() => {
		const container = elementRef.current;
		if (!container) {
			setVisibleCount(groupCount);
			return;
		}

		const anchor = container.querySelector<HTMLElement>(
			"[data-toolbar-anchor]",
		);
		const anchorWidth = anchor ? anchor.offsetWidth : 0;
		const groups = Array.from(
			container.querySelectorAll<HTMLElement>("[data-toolbar-group]"),
		);

		// Cache the natural width of every currently-visible group. Hidden
		// groups report 0 and must fall back to their last known width.
		const widths = groupWidthsRef.current;
		groups.forEach((group, index) => {
			const isHidden = group.dataset.toolbarFolded === "true";
			if (!isHidden && group.offsetWidth > 0) {
				widths[index] = group.offsetWidth;
			}
		});

		// Reserve room for the always-visible anchor ("+" button).
		const budget = container.clientWidth - anchorWidth;

		let used = 0;
		let fit = 0;
		for (let index = 0; index < groupCount; index += 1) {
			const width = widths[index] ?? groups[index]?.offsetWidth ?? 0;
			used += width;
			if (used > budget) {
				break;
			}
			fit += 1;
		}

		setVisibleCount(Math.min(fit, groupCount));
	}, [groupCount]);

	const containerRef = useCallback(
		(node: HTMLDivElement | null) => {
			elementRef.current = node;
			setElement(node);
			if (node && typeof window !== "undefined") {
				window.requestAnimationFrame(measure);
			}
		},
		[measure],
	);

	useEffect(() => {
		if (!element) return undefined;

		if (typeof ResizeObserver === "undefined") {
			window.addEventListener("resize", measure);
			measure();
			return () => window.removeEventListener("resize", measure);
		}

		const resizeObserver = new ResizeObserver(() => measure());
		resizeObserver.observe(element);
		measure();

		return () => resizeObserver.disconnect();
	}, [element, measure]);

	return { containerRef, visibleCount };
}
