import type {
	KeyboardEvent as ReactKeyboardEvent,
	MouseEvent,
	PointerEvent as ReactPointerEvent,
} from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { clamp } from "@/lib/utils";

const COLLAPSE_THRESHOLD_OFFSET = 40;
const COLLAPSE_VISUAL_MIN_WIDTH = 80;
const KEYBOARD_RESIZE_STEP = 10;

interface UseSidebarResizeOptions {
	defaultWidth: number;
	maxWidth: number;
	minWidth: number;
	onCollapse?: () => void;
	/**
	 * Drag direction that grows the panel.
	 * - "ltr" (default): handle on the right of a left-anchored panel; drag right → grow.
	 * - "rtl": handle on the left of a right-anchored panel; drag left → grow.
	 */
	direction?: "ltr" | "rtl";
}

interface UseSidebarResizeResult {
	isResizeHandleHovered: boolean;
	isResizing: boolean;
	maxWidth: number;
	onResizeHandleDoubleClick: (event: MouseEvent) => void;
	onResizeHandleKeyDown: (event: ReactKeyboardEvent) => void;
	onResizeHandlePointerDown: (event: ReactPointerEvent) => void;
	onResizeHandlePointerEnter: () => void;
	onResizeHandlePointerLeave: () => void;
	minWidth: number;
	sidebarWidth: number;
	willCollapse: boolean;
}

export function useSidebarResize({
	defaultWidth,
	maxWidth,
	minWidth,
	onCollapse,
	direction = "ltr",
}: UseSidebarResizeOptions): UseSidebarResizeResult {
	const deltaSign = direction === "rtl" ? -1 : 1;
	const [sidebarWidth, setSidebarWidth] = useState(defaultWidth);
	const [isResizing, setIsResizing] = useState(false);
	const [isResizeHandleHovered, setIsResizeHandleHovered] = useState(false);
	const [willCollapse, setWillCollapse] = useState(false);
	const startXRef = useRef(0);
	const startWidthRef = useRef(defaultWidth);
	const lastValidWidthRef = useRef(defaultWidth);
	const willCollapseRef = useRef(false);
	const collapseThreshold = minWidth - COLLAPSE_THRESHOLD_OFFSET;

	const onResizeHandlePointerEnter = useCallback(() => {
		setIsResizeHandleHovered(true);
	}, []);

	const onResizeHandlePointerLeave = useCallback(() => {
		setIsResizeHandleHovered(false);
	}, []);

	const onResizeHandleDoubleClick = useCallback(
		(event: MouseEvent) => {
			event.preventDefault();
			event.stopPropagation();
			setSidebarWidth(defaultWidth);
			lastValidWidthRef.current = defaultWidth;
			willCollapseRef.current = false;
			setWillCollapse(false);
		},
		[defaultWidth],
	);

	const onResizeHandlePointerDown = useCallback(
		(event: ReactPointerEvent) => {
			event.preventDefault();
			startXRef.current = event.clientX;
			startWidthRef.current = sidebarWidth;
			willCollapseRef.current = false;
			setWillCollapse(false);
			setIsResizing(true);
			(event.target as HTMLElement).setPointerCapture(event.pointerId);
		},
		[sidebarWidth],
	);

	const onResizeHandleKeyDown = useCallback(
		(event: ReactKeyboardEvent) => {
			let nextWidth: number;

			switch (event.key) {
				case "ArrowLeft":
					nextWidth = sidebarWidth - KEYBOARD_RESIZE_STEP * deltaSign;
					break;
				case "ArrowRight":
					nextWidth = sidebarWidth + KEYBOARD_RESIZE_STEP * deltaSign;
					break;
				case "Home":
					nextWidth = minWidth;
					break;
				case "End":
					nextWidth = maxWidth;
					break;
				default:
					return;
			}

			event.preventDefault();
			event.stopPropagation();
			const clampedWidth = clamp(nextWidth, minWidth, maxWidth);
			setSidebarWidth(clampedWidth);
			lastValidWidthRef.current = clampedWidth;
			willCollapseRef.current = false;
			setWillCollapse(false);
		},
		[deltaSign, maxWidth, minWidth, sidebarWidth],
	);

	useEffect(() => {
		if (!isResizing) {
			return;
		}

		const handlePointerMove = (event: PointerEvent) => {
			const delta = (event.clientX - startXRef.current) * deltaSign;
			const rawWidth = startWidthRef.current + delta;
			const shouldCollapse = rawWidth < collapseThreshold;
			willCollapseRef.current = shouldCollapse;
			setWillCollapse(shouldCollapse);

			if (shouldCollapse) {
				setSidebarWidth(Math.max(rawWidth, COLLAPSE_VISUAL_MIN_WIDTH));
			} else {
				setSidebarWidth(clamp(rawWidth, minWidth, maxWidth));
			}
		};

		const handlePointerUp = (event: PointerEvent) => {
			if (willCollapseRef.current && onCollapse) {
				setSidebarWidth(lastValidWidthRef.current);
				onCollapse();
			} else {
				const finalDelta = (event.clientX - startXRef.current) * deltaSign;
				const finalWidth = clamp(startWidthRef.current + finalDelta, minWidth, maxWidth);
				lastValidWidthRef.current = finalWidth;
				setSidebarWidth(finalWidth);
			}
			willCollapseRef.current = false;
			setWillCollapse(false);
			setIsResizing(false);
		};

		document.addEventListener("pointermove", handlePointerMove);
		document.addEventListener("pointerup", handlePointerUp);
		return () => {
			document.removeEventListener("pointermove", handlePointerMove);
			document.removeEventListener("pointerup", handlePointerUp);
		};
	}, [collapseThreshold, deltaSign, isResizing, maxWidth, minWidth, onCollapse]);

	useEffect(() => {
		if (!isResizing && sidebarWidth >= minWidth) {
			lastValidWidthRef.current = sidebarWidth;
		}
	}, [isResizing, minWidth, sidebarWidth]);

	return {
		isResizeHandleHovered,
		isResizing,
		maxWidth,
		onResizeHandleDoubleClick,
		onResizeHandleKeyDown,
		onResizeHandlePointerDown,
		onResizeHandlePointerEnter,
		onResizeHandlePointerLeave,
		minWidth,
		sidebarWidth,
		willCollapse,
	};
}
