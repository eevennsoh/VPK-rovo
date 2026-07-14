"use client";

import { useCallback, useEffect, useRef, type RefObject } from "react";

export interface UseFitTextOptions {
	/** Smallest font size (px) to try. */
	min?: number;
	/** Largest font size (px) to try. */
	max?: number;
	/** Search precision (px). Smaller = finer fit, more measurement passes. */
	precision?: number;
	/** Additional text elements that should mirror the fitted font size. */
	syncTextRefs?: readonly RefObject<HTMLElement | null>[];
}

export interface UseFitTextResult<C extends HTMLElement, T extends HTMLElement> {
	/** Callback ref for the box the text must fit inside (its content area = available space). */
	containerRef: (node: C | null) => void;
	/** Attach to the text element whose font size is scaled to fill the container. */
	textRef: RefObject<T | null>;
}

/**
 * Scale a text element's font size up to the largest value where it still fits — in
 * BOTH width and height — inside its container, letting the text wrap onto multiple
 * lines. The container is attached via a CALLBACK ref so the fit re-runs every time
 * the element mounts, and again on container resize (ResizeObserver) or when the
 * `text` changes.
 *
 * The dock's magnification scales cards via CSS transform, which does NOT change
 * layout size, so hovering never triggers a re-fit. Font size is written imperatively
 * (no re-render) to keep the binary search cheap.
 */
export function useFitText<C extends HTMLElement = HTMLDivElement, T extends HTMLElement = HTMLSpanElement>(
	text: string,
	{ min = 6, max = 200, precision = 0.5, syncTextRefs = [] }: Readonly<UseFitTextOptions> = {},
): UseFitTextResult<C, T> {
	const textRef = useRef<T | null>(null);
	const containerElementRef = useRef<C | null>(null);
	const observerRef = useRef<ResizeObserver | null>(null);

	const fit = useCallback(() => {
		const container = containerElementRef.current;
		const element = textRef.current;
		if (!container || !element || text.length === 0) return;

		const availableWidth = container.clientWidth;
		const availableHeight = container.clientHeight;
		if (availableWidth === 0 || availableHeight === 0) return;

		const applyFontSize = (size: number) => {
			const fontSize = `${size}px`;
			element.style.fontSize = fontSize;
			for (const syncedRef of syncTextRefs) {
				if (syncedRef.current) syncedRef.current.style.fontSize = fontSize;
			}
		};

		// Binary-search the largest font size that fits both axes. `best` tracks the
		// last size known to fit so we never leave the text overflowing.
		let low = min;
		let high = max;
		let best = min;
		while (high - low > precision) {
			const mid = (low + high) / 2;
			applyFontSize(mid);
			const fits =
				element.scrollWidth <= availableWidth && element.scrollHeight <= availableHeight;
			if (fits) {
				best = mid;
				low = mid;
			} else {
				high = mid;
			}
		}
		applyFontSize(best);
	}, [text, min, max, precision, syncTextRefs]);

	const containerRef = useCallback(
		(node: C | null) => {
			observerRef.current?.disconnect();
			observerRef.current = null;
			containerElementRef.current = node;
			if (node) {
				const observer = new ResizeObserver(fit);
				observer.observe(node);
				observerRef.current = observer;
				// The ResizeObserver's first callback is async; fit now so a fresh mount
				// (initial render or morph-back re-mount) never flashes the default size.
				fit();
			}
		},
		[fit],
	);

	useEffect(() => () => observerRef.current?.disconnect(), []);

	return { containerRef, textRef };
}
