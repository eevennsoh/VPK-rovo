"use client";

import { type ReactNode } from "react";

interface ExperimentalWorkItemLayoutProps {
	context: ReactNode;
	activity: ReactNode;
	sessions: ReactNode;
	metadata: ReactNode;
	composer: ReactNode;
}

/**
 * Responsive 5-slot layout for the experimental work item dialog body.
 *
 * Wide (container >= 860px): two scroll columns. The left column is a flex column
 * whose Context + Activity stack scrolls (`flex-1 overflow-y-auto`) while the
 * `composer` sits in a `shrink-0` footer pinned to the bottom of that column, so it
 * stays visible as the activity feed scrolls. The right rail (clamp 320-408px)
 * stacks Sessions above Metadata and scrolls independently.
 *
 * Narrow (< 860px): the columns collapse (`display: contents`) into a single
 * scroll flow ordered Context -> Sessions -> Activity -> Metadata -> Composer via
 * `order`. The composer becomes `sticky bottom-0` with an opaque background so it
 * stays visible at the bottom of the single scroll. The same order values also keep
 * each wide column stacked correctly, so no slot is rendered twice.
 *
 * Container-query driven (not viewport) so it reacts to the dialog's actual
 * body width rather than the screen.
 */
export function ExperimentalWorkItemLayout({
	context,
	activity,
	sessions,
	metadata,
	composer,
}: Readonly<ExperimentalWorkItemLayoutProps>) {
	return (
		<div className="@container/agentlayout h-full min-h-0 min-w-0">
			<div
				className="flex h-full min-h-0 min-w-0 flex-col gap-6 overflow-y-auto p-6 @[860px]/agentlayout:grid @[860px]/agentlayout:gap-0 @[860px]/agentlayout:overflow-hidden @[860px]/agentlayout:p-0"
				style={{ gridTemplateColumns: "minmax(0, 1fr) clamp(320px, 34vw, 408px)" }}
			>
				<div className="contents @[860px]/agentlayout:flex @[860px]/agentlayout:min-h-0 @[860px]/agentlayout:min-w-0 @[860px]/agentlayout:flex-col">
					<div className="contents @[860px]/agentlayout:flex @[860px]/agentlayout:min-h-0 @[860px]/agentlayout:min-w-0 @[860px]/agentlayout:flex-1 @[860px]/agentlayout:flex-col @[860px]/agentlayout:gap-6 @[860px]/agentlayout:overflow-y-auto @[860px]/agentlayout:px-6 @[860px]/agentlayout:pb-6">
						<div className="order-1 min-w-0">{context}</div>
						<div className="order-3 min-w-0">{activity}</div>
					</div>
					<div className="order-5 min-w-0 sticky bottom-0 z-10 bg-surface-overlay px-4 pt-3 pb-4 @[860px]/agentlayout:static @[860px]/agentlayout:shrink-0 @[860px]/agentlayout:border-t @[860px]/agentlayout:border-border @[860px]/agentlayout:bg-surface-overlay @[860px]/agentlayout:px-6 @[860px]/agentlayout:py-4">
						{composer}
					</div>
				</div>
				<div className="contents @[860px]/agentlayout:flex @[860px]/agentlayout:min-h-0 @[860px]/agentlayout:min-w-0 @[860px]/agentlayout:flex-col @[860px]/agentlayout:gap-4 @[860px]/agentlayout:overflow-y-auto @[860px]/agentlayout:pt-1 @[860px]/agentlayout:pr-6 @[860px]/agentlayout:pb-8 @[860px]/agentlayout:pl-2">
					<div className="order-2 min-w-0">{sessions}</div>
					<div className="order-4 min-w-0">{metadata}</div>
				</div>
			</div>
		</div>
	);
}
