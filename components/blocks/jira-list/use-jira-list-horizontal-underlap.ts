"use client";

import { useCallback, useEffect, useRef, useState, type RefCallback } from "react";

import { hasTrailingContentUnderlap } from "@/components/blocks/jira-list/jira-list-horizontal-underlap";

export interface JiraListHorizontalUnderlapResult<T extends HTMLElement> {
	ref: RefCallback<T>;
}

export function useJiraListHorizontalUnderlap<T extends HTMLElement>(
	trailingInset: number,
	onUnderlapChange?: (hasUnderlap: boolean) => void,
): JiraListHorizontalUnderlapResult<T> {
	const elementRef = useRef<T | null>(null);
	const lastUnderlapRef = useRef(false);
	const [element, setElement] = useState<T | null>(null);

	const updateUnderlap = useCallback(() => {
		const node = elementRef.current;
		if (node === null) {
			return;
		}

		const nextUnderlap = hasTrailingContentUnderlap({
			clientWidth: node.clientWidth,
			scrollLeft: node.scrollLeft,
			scrollWidth: node.scrollWidth,
			trailingInset,
		});
		if (nextUnderlap !== lastUnderlapRef.current) {
			lastUnderlapRef.current = nextUnderlap;
			onUnderlapChange?.(nextUnderlap);
		}
	}, [onUnderlapChange, trailingInset]);

	const ref = useCallback<RefCallback<T>>((node) => {
		elementRef.current = node;
		setElement(node);
		updateUnderlap();
		if (node !== null) {
			window.requestAnimationFrame(updateUnderlap);
		}
	}, [updateUnderlap]);

	useEffect(() => {
		if (element === null) {
			return undefined;
		}

		element.addEventListener("scroll", updateUnderlap, { passive: true });

		if (typeof ResizeObserver === "undefined") {
			window.addEventListener("resize", updateUnderlap);
			return () => {
				element.removeEventListener("scroll", updateUnderlap);
				window.removeEventListener("resize", updateUnderlap);
			};
		}

		const resizeObserver = new ResizeObserver(updateUnderlap);
		resizeObserver.observe(element);
		if (element.firstElementChild !== null) {
			resizeObserver.observe(element.firstElementChild);
		}

		return () => {
			element.removeEventListener("scroll", updateUnderlap);
			resizeObserver.disconnect();
		};
	}, [element, updateUnderlap]);

	return {
		ref,
	};
}
