"use client";

import { useCallback, useEffect, useRef, useState, type RefCallback } from "react";

export interface HasVerticalOverflowResult<T extends HTMLElement> {
	hasVerticalOverflow: boolean;
	hasScrolledFromTop: boolean;
	ref: RefCallback<T>;
	showTopScrollMask: boolean;
}

export function useHasVerticalOverflow<T extends HTMLElement>(): HasVerticalOverflowResult<T> {
	const elementRef = useRef<T | null>(null);
	const [hasVerticalOverflow, setHasVerticalOverflow] = useState(false);
	const [hasScrolledFromTop, setHasScrolledFromTop] = useState(false);

	const updateScrollState = useCallback(() => {
		const element = elementRef.current;

		setHasVerticalOverflow(element ? element.scrollHeight - element.clientHeight > 1 : false);
		setHasScrolledFromTop(element ? element.scrollTop > 1 : false);
	}, []);

	const ref = useCallback<RefCallback<T>>(
		(node) => {
			elementRef.current = node;
			updateScrollState();
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

	return {
		hasVerticalOverflow,
		hasScrolledFromTop,
		ref,
		showTopScrollMask: hasVerticalOverflow && hasScrolledFromTop,
	};
}
