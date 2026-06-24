"use client";

import { useCallback, useEffect, useRef, useState, type RefCallback } from "react";

export interface HasVerticalOverflowResult<T extends HTMLElement> {
	hasVerticalOverflow: boolean;
	hasReachedVerticalLimit: boolean;
	hasScrolledFromTop: boolean;
	hasScrolledToBottom: boolean;
	ref: RefCallback<T>;
	showTopScrollMask: boolean;
	showBottomScrollMask: boolean;
}

export function useHasVerticalOverflow<T extends HTMLElement>(): HasVerticalOverflowResult<T> {
	const elementRef = useRef<T | null>(null);
	const [element, setElement] = useState<T | null>(null);
	const [hasVerticalOverflow, setHasVerticalOverflow] = useState(false);
	const [hasReachedVerticalLimit, setHasReachedVerticalLimit] = useState(false);
	const [hasScrolledFromTop, setHasScrolledFromTop] = useState(false);
	const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);

	const updateScrollState = useCallback(() => {
		const element = elementRef.current;
		const maxHeight = element ? Number.parseFloat(getComputedStyle(element).maxHeight) : Number.NaN;
		const hasFiniteMaxHeight = Number.isFinite(maxHeight) && maxHeight > 0;

		setHasVerticalOverflow(element ? element.scrollHeight - element.clientHeight > 1 : false);
		setHasReachedVerticalLimit(element ? hasFiniteMaxHeight && element.clientHeight >= maxHeight - 1 : false);
		setHasScrolledFromTop(element ? element.scrollTop > 1 : false);
		setHasScrolledToBottom(
			element ? element.scrollHeight - element.clientHeight - element.scrollTop <= 1 : true,
		);
	}, []);

	const ref = useCallback<RefCallback<T>>(
		(node) => {
			elementRef.current = node;
			setElement(node);
			updateScrollState();
			// Layout can settle after a rich text editor or virtualized list attaches.
			// Recompute once the browser has applied final dimensions.
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
		if (!element) return undefined;

		element.addEventListener("scroll", updateScrollState, { passive: true });

		if (typeof ResizeObserver === "undefined") {
			window.addEventListener("resize", updateScrollState);

			return () => {
				element.removeEventListener("scroll", updateScrollState);
				window.removeEventListener("resize", updateScrollState);
			};
		}

		// Observe the scrollport plus every descendant: the content that drives
		// overflow can be nested several levels deep (e.g. an async rich-text
		// editor that reflows after mount), so observing only direct children
		// misses size changes and the mask never appears. A MutationObserver
		// keeps the ResizeObserver attached to nodes added later.
		const resizeObserver = new ResizeObserver(updateScrollState);
		const observeSubtree = (root: Element) => {
			resizeObserver.observe(root);
			for (const descendant of root.querySelectorAll("*")) {
				resizeObserver.observe(descendant);
			}
		};
		observeSubtree(element);

		const mutationObserver =
			typeof MutationObserver === "undefined"
				? null
				: new MutationObserver((mutations) => {
						for (const mutation of mutations) {
							for (const node of mutation.addedNodes) {
								if (node instanceof Element) {
									observeSubtree(node);
								}
							}
						}
						updateScrollState();
					});
		mutationObserver?.observe(element, { childList: true, subtree: true });

		return () => {
			element.removeEventListener("scroll", updateScrollState);
			resizeObserver.disconnect();
			mutationObserver?.disconnect();
		};
	}, [element, updateScrollState]);

	return {
		hasVerticalOverflow,
		hasReachedVerticalLimit,
		hasScrolledFromTop,
		hasScrolledToBottom,
		ref,
		showTopScrollMask: hasVerticalOverflow && hasScrolledFromTop,
		showBottomScrollMask: hasVerticalOverflow && !hasScrolledToBottom,
	};
}
