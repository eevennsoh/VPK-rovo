"use client";

import {
	useCallback,
	useEffect,
	useRef,
	useState,
	type RefCallback,
	type RefObject,
} from "react";

import { hasTrailingContentUnderlap } from "@/components/blocks/jira-list/jira-list-horizontal-underlap";

export interface JiraListHorizontalUnderlapResult<T extends HTMLElement> {
	ref: RefCallback<T>;
}

export function useJiraListHorizontalUnderlap<T extends HTMLElement>(
	trailingInset: number,
	trailingOverlayRef: RefObject<HTMLElement | null> | undefined,
	onUnderlapChange?: (hasUnderlap: boolean) => void,
): JiraListHorizontalUnderlapResult<T> {
	const elementRef = useRef<T | null>(null);
	const lastUnderlapRef = useRef(false);
	const [element, setElement] = useState<T | null>(null);

	const updateUnderlap = useCallback(() => {
		const scrollport = elementRef.current;
		const trailingOverlay = trailingOverlayRef?.current;
		if (!scrollport || !trailingOverlay) {
			return;
		}

		const nextUnderlap = hasTrailingContentUnderlap({
			panelLeadingEdge: trailingOverlay.getBoundingClientRect().left,
			scrollLeft: scrollport.scrollLeft,
			scrollportLeft: scrollport.getBoundingClientRect().left,
			scrollWidth: scrollport.scrollWidth,
			trailingInset,
		});
		if (nextUnderlap !== lastUnderlapRef.current) {
			lastUnderlapRef.current = nextUnderlap;
			onUnderlapChange?.(nextUnderlap);
		}
	}, [onUnderlapChange, trailingInset, trailingOverlayRef]);

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
		window.addEventListener("resize", updateUnderlap);
		updateUnderlap();

		if (typeof ResizeObserver === "undefined") {
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
		const trailingOverlay = trailingOverlayRef?.current;
		if (trailingOverlay) {
			resizeObserver.observe(trailingOverlay);
		}

		return () => {
			element.removeEventListener("scroll", updateUnderlap);
			window.removeEventListener("resize", updateUnderlap);
			resizeObserver.disconnect();
		};
	}, [element, trailingOverlayRef, updateUnderlap]);

	return {
		ref,
	};
}
