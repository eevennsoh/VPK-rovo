"use client";

import { useCallback, useEffect, useRef, useState, type RefCallback } from "react";

const HORIZONTAL_OVERFLOW_EDGE_THRESHOLD = 2;
// Matches the bento carousel `gap-3` (0.75rem) between cards.
const BENTO_CAROUSEL_GAP_PX = 12;

export interface HasHorizontalOverflowResult<T extends HTMLElement> {
	/** Attach to the horizontally scrolling element. */
	ref: RefCallback<T>;
	canScrollLeft: boolean;
	canScrollRight: boolean;
	/** Scroll by ~one card (measured at runtime) in the given direction. */
	scrollByDir: (direction: -1 | 1) => void;
	/** Jump back to the start (e.g. when the deck swaps). */
	scrollToStart: () => void;
}

/**
 * Tracks horizontal scroll position of an overflow-x element and reports whether
 * it can scroll further left/right. Mirrors `useHasVerticalOverflow` (scroll
 * listener + ResizeObserver on the element AND its children + SSR fallback + a
 * bare re-sync effect so it recomputes after the consumer re-renders or remounts
 * the deck). Shared by the studio and agent-config bento carousels.
 */
export function useHasHorizontalOverflow<T extends HTMLElement>(
	options?: Readonly<{ edgeThreshold?: number; reduceMotion?: boolean }>,
): HasHorizontalOverflowResult<T> {
	const edgeThreshold = options?.edgeThreshold ?? HORIZONTAL_OVERFLOW_EDGE_THRESHOLD;
	const reduceMotion = options?.reduceMotion ?? false;
	const elementRef = useRef<T | null>(null);
	const [canScrollLeft, setCanScrollLeft] = useState(false);
	const [canScrollRight, setCanScrollRight] = useState(false);

	const updateScrollState = useCallback(() => {
		const element = elementRef.current;
		if (!element) {
			setCanScrollLeft(false);
			setCanScrollRight(false);
			return;
		}

		const maxScrollLeft = element.scrollWidth - element.clientWidth;
		setCanScrollLeft(element.scrollLeft > edgeThreshold);
		setCanScrollRight(element.scrollLeft < maxScrollLeft - edgeThreshold);
	}, [edgeThreshold]);

	const ref = useCallback<RefCallback<T>>(
		(node) => {
			elementRef.current = node;
			updateScrollState();
			// Widths aren't laid out yet on first attach — recompute next frame.
			if (node && typeof window !== "undefined") {
				window.requestAnimationFrame(updateScrollState);
			}
		},
		[updateScrollState],
	);

	useEffect(() => {
		updateScrollState();
	});

	useEffect(() => {
		const element = elementRef.current;
		if (!element) return undefined;

		element.addEventListener("scroll", updateScrollState, { passive: true });

		if (typeof ResizeObserver === "undefined") {
			window.addEventListener("resize", updateScrollState);

			return () => {
				element.removeEventListener("scroll", updateScrollState);
				window.removeEventListener("resize", updateScrollState);
			};
		}

		const resizeObserver = new ResizeObserver(updateScrollState);
		resizeObserver.observe(element);

		for (const child of element.children) {
			resizeObserver.observe(child);
		}

		return () => {
			element.removeEventListener("scroll", updateScrollState);
			resizeObserver.disconnect();
		};
	}, [updateScrollState]);

	const scrollByDir = useCallback(
		(direction: -1 | 1) => {
			const element = elementRef.current;
			if (!element) return;

			const firstCard = element.firstElementChild as HTMLElement | null;
			const step = firstCard ? firstCard.offsetWidth + BENTO_CAROUSEL_GAP_PX : element.clientWidth;
			const previousScrollLeft = element.scrollLeft;

			element.scrollBy({ left: step * direction, behavior: reduceMotion ? "auto" : "smooth" });

			if (reduceMotion) {
				updateScrollState();
				return;
			}

			// Fallback: if smooth scroll was a no-op (interrupted/unsupported), jump instantly.
			window.setTimeout(() => {
				if (element.scrollLeft !== previousScrollLeft) return;
				element.scrollBy({ left: step * direction });
				updateScrollState();
			}, 150);
		},
		[reduceMotion, updateScrollState],
	);

	const scrollToStart = useCallback(() => {
		const element = elementRef.current;
		if (!element) return;
		element.scrollLeft = 0;
		updateScrollState();
	}, [updateScrollState]);

	return { ref, canScrollLeft, canScrollRight, scrollByDir, scrollToStart };
}
