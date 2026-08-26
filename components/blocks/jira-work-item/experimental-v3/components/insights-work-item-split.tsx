"use client";

import {
	useCallback,
	useLayoutEffect,
	useRef,
	useState,
	type CSSProperties,
	type ReactNode,
} from "react";

import { WorkItemSidePanelResizeHandle } from "@/components/blocks/jira-work-item/experimental-v3/components/work-item-side-panel-resize-handle";
import { useSectionNavigation } from "@/components/blocks/jira-work-item/experimental-v3/context-section-navigation";
import {
	INSIGHTS_PANEL_DEFAULT_WIDTH_PX,
	INSIGHTS_PANEL_MIN_WIDTH_PX,
	resolveInsightsPanelMaxWidth,
} from "@/components/blocks/jira-work-item/experimental-v3/lib/layout-constants";
import { useSidebarResize } from "@/components/projects/rovo-core/hooks/use-sidebar-resize";

interface InsightsWorkItemSplitProps {
	insights: ReactNode;
	workItem: ReactNode;
}

/**
 * Wide-mode Insights | work item split. The handle is the same SidebarResizeHandle
 * used on the metadata rail: a 1px column with a hover/focus pill notch.
 */
export function InsightsWorkItemSplit({
	insights,
	workItem,
}: Readonly<InsightsWorkItemSplitProps>) {
	const { setWideScrollContainer } = useSectionNavigation();
	const splitRef = useRef<HTMLDivElement | null>(null);
	const [maxWidth, setMaxWidth] = useState(INSIGHTS_PANEL_DEFAULT_WIDTH_PX);
	const resize = useSidebarResize({
		defaultWidth: INSIGHTS_PANEL_DEFAULT_WIDTH_PX,
		direction: "ltr",
		maxWidth,
		minWidth: INSIGHTS_PANEL_MIN_WIDTH_PX,
		minWidthResistance: true,
	});
	const insightsStyle = {
		"--insights-panel-width": `${resize.sidebarWidth}px`,
	} as CSSProperties;

	useLayoutEffect(() => {
		const node = splitRef.current;
		if (!node) return;
		const syncMaxWidth = () => setMaxWidth(resolveInsightsPanelMaxWidth(node.clientWidth));
		syncMaxWidth();
		if (typeof ResizeObserver === "undefined") return;
		const observer = new ResizeObserver(syncMaxWidth);
		observer.observe(node);
		return () => observer.disconnect();
	}, []);

	const setWorkItemScrollRef = useCallback((element: HTMLDivElement | null) => {
		setWideScrollContainer(element);
	}, [setWideScrollContainer]);

	return (
		<div
			className="group/insights-split flex min-h-0 min-w-0 flex-1 flex-col gap-6 @[860px]/agentlayout:flex-row @[860px]/agentlayout:gap-0"
			data-insights-work-item-split
			ref={splitRef}
		>
			<div
				className="group/insights-panel relative flex min-h-0 min-w-0 flex-col @[860px]/agentlayout:w-[var(--insights-panel-width)] @[860px]/agentlayout:shrink-0 @[860px]/agentlayout:pr-6"
				data-insights-work-item-split-insights
				style={insightsStyle}
			>
				<div className="min-h-0 min-w-0 flex-1 @[860px]/agentlayout:overflow-y-auto @[860px]/agentlayout:overscroll-y-none">
					{insights}
				</div>
				<div className="hidden @[860px]/agentlayout:contents">
					<WorkItemSidePanelResizeHandle
						ariaLabel="Resize insights and work item"
						className="top-0! right-[calc(1.5rem-0.375rem)]! left-auto! bg-transparent! hover:bg-transparent! data-[active]:bg-transparent! focus-visible:bg-transparent! focus-visible:ring-0 group-hover/insights-panel:[&>div]:opacity-100 group-hover/insights-split:[&>div]:opacity-100"
						resize={resize}
						side="right"
						testId="jira-work-item-insights-resize-handle"
					/>
				</div>
			</div>
			<div
				className="flex min-h-0 min-w-0 flex-1 flex-col @[860px]/agentlayout:overflow-y-auto @[860px]/agentlayout:overscroll-y-none"
				data-insights-work-item-split-work-item
				ref={setWorkItemScrollRef}
			>
				{workItem}
			</div>
		</div>
	);
}
