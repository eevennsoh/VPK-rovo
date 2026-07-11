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
	onPointerLeave: (event: PointerEvent<HTMLElement>) => void;
	onLostPointerCapture: (event: PointerEvent<HTMLElement>) => void;
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

	const clearWasDraggedAfterClick = useCallback(() => {
		if (!wasDraggedRef.current) return;
		// Clear the drag flag AFTER the trailing synthetic click (which must
		// still bail), but before any later interaction. Without this async
		// reset the flag would linger until the next pointerdown and swallow a
		// keyboard (Enter/Space) activation of a card — pointer drags that end
		// over a gap never produce a click to consume it.
		if (typeof requestAnimationFrame !== "undefined") {
			requestAnimationFrame(() => {
				wasDraggedRef.current = false;
			});
			return;
		}
		wasDraggedRef.current = false;
	}, []);

	const resetActivePress = useCallback(
		(pointerId: number) => {
			activeRef.current = false;
			setDragging(false);
			const container = scrollContainerRef.current;
			if (container?.hasPointerCapture(pointerId)) {
				container.releasePointerCapture(pointerId);
			}
			clearWasDraggedAfterClick();
		},
		[clearWasDraggedAfterClick, scrollContainerRef],
	);

	const onPointerDown = useCallback(
		(event: PointerEvent<HTMLElement>) => {
			// Primary button only; leave middle/right-click and native wheel alone.
			if (event.button !== 0) return;
			// Mouse/trackpad only — touch (and pen) keep the browser's native
			// momentum scroll of the overflow-x container; manually writing
			// scrollLeft would fight it and jitter.
			if (event.pointerType !== "mouse") return;
			const container = scrollContainerRef.current;
			if (!container) return;
			activeRef.current = true;
			// Reset on each fresh press so a prior pan doesn't swallow this click.
			wasDraggedRef.current = false;
			startXRef.current = event.clientX;
			startScrollLeftRef.current = container.scrollLeft;
			// NOTE: capture is deliberately NOT taken here. A container holding
			// pointer capture also receives the follow-up `click`, which would steal
			// it from the pressed card and break click-to-expand. We capture lazily
			// in onPointerMove only once the press becomes a real pan.
		},
		[scrollContainerRef],
	);

	const onPointerMove = useCallback(
		(event: PointerEvent<HTMLElement>) => {
			if (!activeRef.current) return;
			if ((event.buttons & 1) !== 1) {
				resetActivePress(event.pointerId);
				return;
			}
			const container = scrollContainerRef.current;
			if (!container) return;
			const delta = event.clientX - startXRef.current;
			if (!wasDraggedRef.current && Math.abs(delta) > DRAG_THRESHOLD) {
				wasDraggedRef.current = true;
				setDragging(true);
				// Now that it's a genuine pan, capture so tracking continues even if
				// the pointer leaves the strip. Clicks never reach this branch.
				container.setPointerCapture(event.pointerId);
			}
			if (wasDraggedRef.current) {
				container.scrollLeft = startScrollLeftRef.current - delta;
			}
		},
		[resetActivePress, scrollContainerRef],
	);

	const onPointerUp = useCallback(
		(event: PointerEvent<HTMLElement>) => {
			if (!activeRef.current) return;
			resetActivePress(event.pointerId);
		},
		[resetActivePress],
	);

	const onPointerLeave = useCallback(
		(event: PointerEvent<HTMLElement>) => {
			if (!activeRef.current || wasDraggedRef.current) return;
			resetActivePress(event.pointerId);
		},
		[resetActivePress],
	);

	const onLostPointerCapture = useCallback(
		(event: PointerEvent<HTMLElement>) => {
			if (!activeRef.current) return;
			resetActivePress(event.pointerId);
		},
		[resetActivePress],
	);

	return {
		dragging,
		wasDraggedRef,
		onPointerDown,
		onPointerMove,
		onPointerUp,
		onPointerLeave,
		onLostPointerCapture,
	};
}
