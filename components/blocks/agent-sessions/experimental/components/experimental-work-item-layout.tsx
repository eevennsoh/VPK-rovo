"use client";

import { useMemo, type ReactNode } from "react";

import { useAgentSessionsState } from "@/components/blocks/agent-sessions/experimental/context-agent-sessions";
import { usePanelLayout } from "@/components/blocks/agent-sessions/experimental/context-panel-layout";
import { useHasVerticalOverflow } from "@/components/hooks/use-has-vertical-overflow";
import { buildScrollMaskStyle } from "@/components/visual/scroll-mask/lib";

interface ExperimentalWorkItemLayoutProps {
	context: ReactNode;
	activity: ReactNode;
	metadata: ReactNode;
	composer: ReactNode;
}

/**
 * Responsive 4-slot layout for the experimental work item dialog body.
 *
 * Wide (container >= 860px): two scroll columns. The left column is a flex column
 * whose Context + Activity stack scrolls (`flex-1 overflow-y-auto`) while the
 * `composer` appears in a `shrink-0` footer after planner review, pinned to the
 * bottom of that column so it stays visible as the activity feed scrolls. The
 * right rail (clamp 320-408px) holds Metadata and scrolls independently.
 *
 * Narrow (< 860px): the columns collapse (`display: contents`) into a single
 * scroll flow ordered Context -> Activity -> Metadata -> Composer via
 * `order`. The composer becomes `sticky bottom-0` on a translucent, blurred dock so
 * it stays visible at the bottom of the single scroll. The wide Context + Activity
 * scrollport adds a bottom fade only while more content remains below. The same order
 * values also keep each wide column stacked correctly, so no slot is rendered twice.
 *
 * Container-query driven (not viewport) so it reacts to the dialog's actual
 * body width rather than the screen.
 */
export function ExperimentalWorkItemLayout({
	context,
	activity,
	metadata,
	composer,
}: Readonly<ExperimentalWorkItemLayoutProps>) {
	const { planner } = useAgentSessionsState();
	const { metadataCollapsed } = usePanelLayout();
	const showStickyComposer = planner.status === "inactive" || planner.status === "applied";
	const { ref: leftScrollRef, showBottomScrollMask } = useHasVerticalOverflow<HTMLDivElement>();
	const leftScrollMaskStyle = useMemo(
		() => buildScrollMaskStyle({ fadeTop: false, fadeBottom: showBottomScrollMask }),
		[showBottomScrollMask],
	);

	return (
		<div className="@container/agentlayout h-full min-h-0 min-w-0">
			<div
				className="flex h-full min-h-0 min-w-0 flex-col gap-6 overflow-y-auto p-6 @[860px]/agentlayout:grid @[860px]/agentlayout:gap-0 @[860px]/agentlayout:overflow-hidden @[860px]/agentlayout:p-0"
				style={{
					gridTemplateColumns: metadataCollapsed
						? "minmax(0, 1fr)"
						: "minmax(0, 1fr) clamp(320px, 34vw, 408px)",
				}}
			>
				<div className="contents @[860px]/agentlayout:flex @[860px]/agentlayout:min-h-0 @[860px]/agentlayout:min-w-0 @[860px]/agentlayout:flex-col">
					<div
						ref={leftScrollRef}
						className="contents @[860px]/agentlayout:flex @[860px]/agentlayout:min-h-0 @[860px]/agentlayout:min-w-0 @[860px]/agentlayout:flex-1 @[860px]/agentlayout:flex-col @[860px]/agentlayout:gap-6 @[860px]/agentlayout:overflow-y-auto @[860px]/agentlayout:px-6 @[860px]/agentlayout:pb-6"
						data-agent-sessions-scroll-region
						style={leftScrollMaskStyle}
					>
						<div className="order-1 min-w-0">{context}</div>
						<div className="order-2 min-w-0">{activity}</div>
					</div>
					{showStickyComposer ? (
						<div
							className="order-5 min-w-0 sticky bottom-0 z-10 bg-background px-4 pt-3 pb-4 @[860px]/agentlayout:static @[860px]/agentlayout:shrink-0 @[860px]/agentlayout:px-6 @[860px]/agentlayout:py-4"
							data-agent-sessions-composer-dock
						>
							{composer}
						</div>
					) : null}
				</div>
				{metadataCollapsed ? null : (
					<div className="contents @[860px]/agentlayout:flex @[860px]/agentlayout:min-h-0 @[860px]/agentlayout:min-w-0 @[860px]/agentlayout:flex-col @[860px]/agentlayout:gap-4 @[860px]/agentlayout:overflow-y-auto @[860px]/agentlayout:pr-6 @[860px]/agentlayout:pb-8 @[860px]/agentlayout:pl-2">
						<div className="order-3 min-w-0">{metadata}</div>
					</div>
				)}
			</div>
		</div>
	);
}
