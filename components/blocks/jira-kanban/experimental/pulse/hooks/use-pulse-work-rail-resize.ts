"use client";

import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";

import {
	PULSE_WORK_RAIL_DEFAULT_WIDTH_PX,
	PULSE_WORK_RAIL_MIN_WIDTH_PX,
	resolvePulseWorkRailMaxWidth,
} from "@/components/blocks/jira-kanban/experimental/pulse/lib/pulse-layout";
import { useSidebarResize } from "@/components/projects/rovo-core/hooks/use-sidebar-resize";

export function usePulseWorkRailResize() {
	const railRef = useRef<HTMLDivElement | null>(null);
	const [railMaxWidth, setRailMaxWidth] = useState(PULSE_WORK_RAIL_DEFAULT_WIDTH_PX);
	const railResize = useSidebarResize({
		defaultWidth: PULSE_WORK_RAIL_DEFAULT_WIDTH_PX,
		direction: "rtl",
		maxWidth: railMaxWidth,
		minWidth: PULSE_WORK_RAIL_MIN_WIDTH_PX,
		minWidthResistance: true,
	});
	const style = {
		"--pulse-work-rail-width": `${railResize.sidebarWidth}px`,
	} as CSSProperties;

	useLayoutEffect(() => {
		const node = railRef.current;
		const container = node?.parentElement;
		if (!container) return;
		const syncMaxWidth = () => setRailMaxWidth(resolvePulseWorkRailMaxWidth(container.clientWidth));
		syncMaxWidth();
		if (typeof ResizeObserver === "undefined") return;
		const observer = new ResizeObserver(syncMaxWidth);
		observer.observe(container);
		return () => observer.disconnect();
	}, []);

	return { railRef, railResize, style };
}
