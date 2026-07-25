"use client";

import { useCallback, useEffect, useRef, useState, type RefCallback } from "react";

export interface VerticalOverflowMetrics {
	clientHeight: number;
	maxHeight: number;
	scrollHeight: number;
	scrollTop: number;
}

export interface VerticalOverflowState {
	hasVerticalOverflow: boolean;
	hasReachedVerticalLimit: boolean;
	hasScrolledFromTop: boolean;
	hasScrolledToBottom: boolean;
	showTopScrollMask: boolean;
	showBottomScrollMask: boolean;
}

export interface HasVerticalOverflowResult<T extends HTMLElement> {
	hasVerticalOverflow: boolean;
	hasReachedVerticalLimit: boolean;
	hasScrolledFromTop: boolean;
	hasScrolledToBottom: boolean;
	ref: RefCallback<T>;
	showTopScrollMask: boolean;
	showBottomScrollMask: boolean;
}

const EMPTY_VERTICAL_OVERFLOW_STATE: VerticalOverflowState = {
	hasReachedVerticalLimit: false,
	hasScrolledFromTop: false,
	hasScrolledToBottom: true,
	hasVerticalOverflow: false,
	showBottomScrollMask: false,
	showTopScrollMask: false,
};

export function getVerticalOverflowState(metrics: VerticalOverflowMetrics | null): VerticalOverflowState {
	if (!metrics) {
		return EMPTY_VERTICAL_OVERFLOW_STATE;
	}

	const hasVerticalOverflow = metrics.scrollHeight - metrics.clientHeight > 1;
	const hasFiniteMaxHeight = Number.isFinite(metrics.maxHeight) && metrics.maxHeight > 0;
	const hasReachedVerticalLimit = hasFiniteMaxHeight && metrics.clientHeight >= metrics.maxHeight - 1;
	const hasScrolledFromTop = metrics.scrollTop > 1;
	const hasScrolledToBottom = metrics.scrollHeight - metrics.clientHeight - metrics.scrollTop <= 1;

	return {
		hasReachedVerticalLimit,
		hasScrolledFromTop,
		hasScrolledToBottom,
		hasVerticalOverflow,
		showBottomScrollMask: hasVerticalOverflow && !hasScrolledToBottom,
		showTopScrollMask: hasVerticalOverflow && hasScrolledFromTop,
	};
}

function getElementVerticalOverflowState(element: HTMLElement | null): VerticalOverflowState {
	if (!element) {
		return EMPTY_VERTICAL_OVERFLOW_STATE;
	}

	return getVerticalOverflowState({
		clientHeight: element.clientHeight,
		maxHeight: Number.parseFloat(getComputedStyle(element).maxHeight),
		scrollHeight: element.scrollHeight,
		scrollTop: element.scrollTop,
	});
}

function subscribeToVerticalOverflow(element: HTMLElement, updateScrollState: () => void): () => void {
	element.addEventListener("scroll", updateScrollState, { passive: true });

	if (typeof ResizeObserver === "undefined") {
		window.addEventListener("resize", updateScrollState);
		return () => {
			element.removeEventListener("scroll", updateScrollState);
			window.removeEventListener("resize", updateScrollState);
		};
	}

	const resizeObserver = new ResizeObserver(updateScrollState);
	const observeSubtree = (root: Element) => {
		resizeObserver.observe(root);
		for (const descendant of root.querySelectorAll("*")) {
			resizeObserver.observe(descendant);
		}
	};
	observeSubtree(element);

	const mutationObserver = typeof MutationObserver === "undefined"
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
}

export function useHasVerticalOverflow<T extends HTMLElement>(): HasVerticalOverflowResult<T> {
	const elementRef = useRef<T | null>(null);
	const [element, setElement] = useState<T | null>(null);
	const [hasVerticalOverflow, setHasVerticalOverflow] = useState(false);
	const [hasReachedVerticalLimit, setHasReachedVerticalLimit] = useState(false);
	const [hasScrolledFromTop, setHasScrolledFromTop] = useState(false);
	const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);

	const updateScrollState = useCallback(() => {
		const nextState = getElementVerticalOverflowState(elementRef.current);

		setHasVerticalOverflow(nextState.hasVerticalOverflow);
		setHasReachedVerticalLimit(nextState.hasReachedVerticalLimit);
		setHasScrolledFromTop(nextState.hasScrolledFromTop);
		setHasScrolledToBottom(nextState.hasScrolledToBottom);
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
		if (!element) return undefined;
		return subscribeToVerticalOverflow(element, updateScrollState);
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
