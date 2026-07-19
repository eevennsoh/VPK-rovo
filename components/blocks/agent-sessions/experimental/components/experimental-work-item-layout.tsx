"use client";

import { useMemo, type CSSProperties, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion, type Variants } from "motion/react";

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

const METADATA_PANEL_WIDTH = "clamp(320px, 34vw, 408px)";

const METADATA_PANEL_VARIANTS: Variants = {
	closed: {
		transform: "translateX(100%)",
		transition: { duration: 0.2, ease: [0.6, 0, 0.8, 0.6] }, // duration-medium + ease-in
	},
	open: {
		transform: "translateX(0%)",
		transition: { duration: 0.25, ease: [0, 0.4, 0, 1] }, // duration-slow + ease-out
	},
};

const REDUCED_MOTION_METADATA_PANEL_VARIANTS: Variants = {
	closed: { transform: "translateX(0%)", transition: { duration: 0 } },
	open: { transform: "translateX(0%)", transition: { duration: 0 } },
};

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
	const shouldReduceMotion = useReducedMotion();
	const showStickyComposer = planner.status === "inactive" || planner.status === "applied";
	const { ref: leftScrollRef, showBottomScrollMask } = useHasVerticalOverflow<HTMLDivElement>();
	const leftScrollMaskStyle = useMemo(
		() => buildScrollMaskStyle({ fadeTop: false, fadeBottom: showBottomScrollMask }),
		[showBottomScrollMask],
	);
	const contentStyle = {
		"--metadata-panel-offset": metadataCollapsed ? "0px" : METADATA_PANEL_WIDTH,
		transition: shouldReduceMotion
			? undefined
			: metadataCollapsed
				? "margin-right var(--duration-medium) var(--ease-in)"
				: "margin-right var(--duration-slow) var(--ease-in-out)",
	} as CSSProperties;
	const contentColumnStyle = {
		maxWidth: metadataCollapsed ? "800px" : "100%",
		transition: shouldReduceMotion
			? undefined
			: metadataCollapsed
				? "max-width var(--duration-medium) var(--ease-in)"
				: "max-width var(--duration-slow) var(--ease-in-out)",
	} as CSSProperties;

	return (
		<div className="@container/agentlayout h-full min-h-0 min-w-0">
			<div
				className="flex h-full min-h-0 min-w-0 flex-col gap-6 overflow-y-auto p-6 @[860px]/agentlayout:relative @[860px]/agentlayout:gap-0 @[860px]/agentlayout:overflow-hidden @[860px]/agentlayout:p-0"
			>
				<div
					className="contents @[860px]/agentlayout:flex @[860px]/agentlayout:min-h-0 @[860px]/agentlayout:min-w-0 @[860px]/agentlayout:flex-1 @[860px]/agentlayout:flex-col @[860px]/agentlayout:[margin-right:var(--metadata-panel-offset)] motion-reduce:transition-none"
					style={contentStyle}
				>
					<div
						ref={leftScrollRef}
						className="contents @[860px]/agentlayout:flex @[860px]/agentlayout:min-h-0 @[860px]/agentlayout:min-w-0 @[860px]/agentlayout:flex-1 @[860px]/agentlayout:flex-col @[860px]/agentlayout:overflow-y-auto @[860px]/agentlayout:pb-6"
						data-agent-sessions-scroll-region
						style={leftScrollMaskStyle}
					>
						<div
							className="contents @[860px]/agentlayout:mx-auto @[860px]/agentlayout:flex @[860px]/agentlayout:w-full @[860px]/agentlayout:flex-col @[860px]/agentlayout:gap-6 @[860px]/agentlayout:px-6 motion-reduce:transition-none"
							data-agent-sessions-content-column
							style={contentColumnStyle}
						>
							<div className="order-1 min-w-0">{context}</div>
							<div className="order-2 min-w-0">{activity}</div>
						</div>
					</div>
					{showStickyComposer ? (
						<div
							className="order-5 min-w-0 sticky bottom-0 z-10 bg-background px-4 pt-3 pb-4 @[860px]/agentlayout:static @[860px]/agentlayout:shrink-0 @[860px]/agentlayout:px-0 @[860px]/agentlayout:py-4"
							data-agent-sessions-composer-dock
						>
							<div
								className="contents @[860px]/agentlayout:mx-auto @[860px]/agentlayout:block @[860px]/agentlayout:w-full @[860px]/agentlayout:px-6 motion-reduce:transition-none"
								style={contentColumnStyle}
							>
								{composer}
							</div>
						</div>
					) : null}
				</div>
				<AnimatePresence initial={false}>
					{metadataCollapsed ? null : (
						<motion.div
							animate="open"
							className="order-3 min-w-0 @[860px]/agentlayout:absolute @[860px]/agentlayout:inset-y-0 @[860px]/agentlayout:right-0 @[860px]/agentlayout:z-20 @[860px]/agentlayout:flex @[860px]/agentlayout:w-[clamp(320px,34vw,408px)] @[860px]/agentlayout:flex-col @[860px]/agentlayout:gap-4 @[860px]/agentlayout:overflow-y-auto @[860px]/agentlayout:pr-6 @[860px]/agentlayout:pb-8 @[860px]/agentlayout:pl-2"
							exit="closed"
							id="experimental-work-item-metadata-panel"
							initial="closed"
							style={{ willChange: shouldReduceMotion ? undefined : "transform" }}
							variants={shouldReduceMotion ? REDUCED_MOTION_METADATA_PANEL_VARIANTS : METADATA_PANEL_VARIANTS}
						>
							<div className="min-w-0">{metadata}</div>
						</motion.div>
					)}
				</AnimatePresence>
			</div>
		</div>
	);
}
