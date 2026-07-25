import type { RefObject } from "react";
import { resolveRovoAppScrollAnchorLayout } from "@/components/projects/rovo-core/lib/rovo-app-scroll-anchor";

const ROVO_APP_SCROLL_ANCHOR_SELECTOR = "[data-rovo-app-scroll-anchor='true']";

export function computeRovoAppAnchorScrollTop(
	defaultTargetTop: number,
	scrollElement: HTMLElement,
	scrollSpacerRef: RefObject<HTMLDivElement | null>,
): number {
	const scrollAnchorElement = scrollElement.querySelector<HTMLElement>(ROVO_APP_SCROLL_ANCHOR_SELECTOR);
	if (!scrollAnchorElement) {
		if (scrollSpacerRef.current) {
			scrollSpacerRef.current.style.height = "0px";
		}
		return defaultTargetTop;
	}

	const scrollRect = scrollElement.getBoundingClientRect();
	const scrollAnchorRect = scrollAnchorElement.getBoundingClientRect();
	const { spacerHeight, targetScrollTop } = resolveRovoAppScrollAnchorLayout({
		anchorOffsetTop: scrollAnchorRect.top - scrollRect.top,
		clientHeight: scrollElement.clientHeight,
		currentSpacerHeight: scrollSpacerRef.current?.offsetHeight ?? 0,
		defaultTargetTop,
		scrollHeight: scrollElement.scrollHeight,
		scrollTop: scrollElement.scrollTop,
	});

	if (scrollSpacerRef.current) {
		scrollSpacerRef.current.style.height = `${spacerHeight}px`;
	}

	return targetScrollTop;
}
