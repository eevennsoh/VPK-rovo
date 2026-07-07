"use client";

import { useCallback, useRef, useState, type PointerEvent, type RefObject } from "react";

// Pointer travel (px) beyond which a press is treated as a horizontal pan rather
// than a click. Below this, the press falls through to the card's `onClick`.
const DRAG_THRESHOLD = 5;

export interface UseDragScrollResult {
	/** True while an active pan exceeds the threshold — pauses the dock, shows grabbing cursor. */
	dragging: boolean;
	/**
	 * Set to `true` the moment a press becomes a pan and held until the next
	 * `pointerdown`. Card `onClick` handlers read `.current` to suppress the
	 * click that ends a drag.
	 */
	wasDraggedRef: RefObject<boolean>;
	onPointerDown: (event: PointerEvent<HTMLElement>) => void;
	onPointerMove: (event: PointerEvent<HTMLElement>) => void;
	onPointerUp: (event: PointerEvent<HTMLElement>) => void;
}

/**
 * Click-drag-to-pan for a horizontal scroll container. Uses pointer capture so a
 * pan keeps tracking outside the element, and a `wasDragged` flag so the drag
 * doesn't fire a card's click-to-expand. Native wheel / trackpad scrolling is
 * untouched.
 */
export function useDragScroll(
	scrollContainerRef: RefObject<HTMLElement | null>,
): UseDragScrollResult {
	const [dragging, setDragging] = useState(false);
	const wasDraggedRef = useRef(false);
	const activeRef = useRef(false);
	const startXRef = useRef(0);
	const startScrollLeftRef = useRef(0);

	const onPointerDown = useCallback(
		(event: PointerEvent<HTMLElement>) => {
			// Primary button only; leave middle/right-click and native wheel alone.
			if (event.button !== 0) return;
			const container = scrollContainerRef.current;
			if (!container) return;
			activeRef.current = true;
			// Reset on each fresh press so a prior pan doesn't swallow this click.
			wasDraggedRef.current = false;
			startXRef.current = event.clientX;
			startScrollLeftRef.current = container.scrollLeft;
			container.setPointerCapture(event.pointerId);
		},
		[scrollContainerRef],
	);

	const onPointerMove = useCallback(
		(event: PointerEvent<HTMLElement>) => {
			if (!activeRef.current) return;
			const container = scrollContainerRef.current;
			if (!container) return;
			const delta = event.clientX - startXRef.current;
			if (!wasDraggedRef.current && Math.abs(delta) > DRAG_THRESHOLD) {
				wasDraggedRef.current = true;
				setDragging(true);
			}
			if (wasDraggedRef.current) {
				container.scrollLeft = startScrollLeftRef.current - delta;
			}
		},
		[scrollContainerRef],
	);

	const onPointerUp = useCallback(
		(event: PointerEvent<HTMLElement>) => {
			if (!activeRef.current) return;
			activeRef.current = false;
			setDragging(false);
			const container = scrollContainerRef.current;
			if (container?.hasPointerCapture(event.pointerId)) {
				container.releasePointerCapture(event.pointerId);
			}
			// `wasDraggedRef` intentionally NOT reset here — the click that follows
			// pointerup must still see it. It resets on the next pointerdown.
		},
		[scrollContainerRef],
	);

	return { dragging, wasDraggedRef, onPointerDown, onPointerMove, onPointerUp };
}
