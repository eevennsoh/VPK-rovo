import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

export type GooeyDemoDragPosition = Readonly<{ x: number; y: number }>;
type GooeyDemoDragBounds = Readonly<{ minX: number; maxX: number; minY: number; maxY: number }>;

/** Pinned upstream "Figma soft" surface treatment. Every layer is rendered
 * from the merged SVG silhouette so its ring and elevation morph with the goo.
 * `light-dark()` follows VPK's document color-scheme without duplicating DOM
 * borders on the interactive children. */
export const GOOEY_SOURCE_SHADOW = [
	"0 0 0 1px light-dark(transparent, rgba(255, 255, 255, 0.04)) inset",
	"0 1px 0 0 light-dark(transparent, rgba(255, 255, 255, 0.03)) inset",
	"0 0 0 1px rgba(0, 0, 0, 0.06)",
	"0 2px 6px 0 rgba(0, 0, 0, 0.05)",
	"0 4px 42px 0 light-dark(rgba(0, 0, 0, 0.06), rgba(0, 0, 0, 0.24))",
].join(", ");

function clampPosition(position: GooeyDemoDragPosition, bounds?: GooeyDemoDragBounds): GooeyDemoDragPosition {
	if (!bounds) return position;
	return {
		x: Math.min(bounds.maxX, Math.max(bounds.minX, position.x)),
		y: Math.min(bounds.maxY, Math.max(bounds.minY, position.y)),
	};
}

export function useGooeyDemoDrag(
	position: GooeyDemoDragPosition,
	onPositionChange: (position: GooeyDemoDragPosition) => void,
	bounds?: GooeyDemoDragBounds,
	onActivate?: () => void,
) {
	const [dragging, setDragging] = useState(false);
	const draggingRef = useRef(false);
	const movedRef = useRef(false);
	const originRef = useRef({ pointerX: 0, pointerY: 0, x: position.x, y: position.y });

	function onPointerDown(event: PointerEvent<HTMLElement>) {
		event.currentTarget.setPointerCapture(event.pointerId);
		draggingRef.current = true;
		movedRef.current = false;
		originRef.current = {
			pointerX: event.clientX,
			pointerY: event.clientY,
			x: position.x,
			y: position.y,
		};
		setDragging(true);
	}

	function onPointerMove(event: PointerEvent<HTMLElement>) {
		if (!draggingRef.current) return;
		const pointerDeltaX = event.clientX - originRef.current.pointerX;
		const pointerDeltaY = event.clientY - originRef.current.pointerY;
		if (Math.abs(pointerDeltaX) > 2 || Math.abs(pointerDeltaY) > 2) movedRef.current = true;
		onPositionChange(clampPosition({
			x: originRef.current.x + pointerDeltaX,
			y: originRef.current.y + pointerDeltaY,
		}, bounds));
	}

	function onPointerEnd(event: PointerEvent<HTMLElement>) {
		if (event.currentTarget.hasPointerCapture(event.pointerId)) {
			event.currentTarget.releasePointerCapture(event.pointerId);
		}
		draggingRef.current = false;
		setDragging(false);
	}

	function onClick() {
		if (movedRef.current) {
			movedRef.current = false;
			return;
		}
		onActivate?.();
	}

	function onKeyDown(event: KeyboardEvent<HTMLElement>) {
		const amount = event.shiftKey ? 10 : 2;
		const delta = {
			ArrowLeft: { x: -amount, y: 0 },
			ArrowRight: { x: amount, y: 0 },
			ArrowUp: { x: 0, y: -amount },
			ArrowDown: { x: 0, y: amount },
		}[event.key];
		if (!delta) return;
		event.preventDefault();
		onPositionChange(clampPosition({ x: position.x + delta.x, y: position.y + delta.y }, bounds));
	}

	return {
		position,
		dragging,
		bind: {
			onClick,
			onPointerDown,
			onPointerMove,
			onPointerUp: onPointerEnd,
			onPointerCancel: onPointerEnd,
			onKeyDown,
		},
	};
}
