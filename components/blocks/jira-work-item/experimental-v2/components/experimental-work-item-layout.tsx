"use client";

import { useMemo, type CSSProperties, type ReactNode, type Ref } from "react";
import { AnimatePresence, motion, useReducedMotion, type Variants } from "motion/react";

import { useJiraWorkItemState } from "@/components/blocks/jira-work-item/experimental-v2/context-jira-work-item";
import {
	METADATA_CONTENT_COLLAPSE_TRANSITION,
	METADATA_CONTENT_EXPAND_TRANSITION,
	METADATA_CONTENT_REDUCED_MOTION_TRANSITION,
} from "@/components/blocks/jira-work-item/experimental-v2/context-panel-layout-motion";
import { usePanelLayout } from "@/components/blocks/jira-work-item/experimental-v2/context-panel-layout";
import { METADATA_PANEL_WIDTH } from "@/components/blocks/jira-work-item/experimental-v2/lib/layout-constants";
import { useHasVerticalOverflow } from "@/components/hooks/use-has-vertical-overflow";
import {
	buildScrollMaskBlurLayerStyles,
	buildScrollMaskStyle,
	SCROLL_MASK_DEFAULT_FADE_SIZE,
} from "@/components/visual/scroll-mask/lib";
import { cn } from "@/lib/utils";

interface ExperimentalWorkItemLayoutProps {
	header: ReactNode;
	context: ReactNode;
	metadata: ReactNode;
	composer: ReactNode;
	fillContainer?: boolean;
}

const NARROW_BOTTOM_SCROLL_MASK_BLUR_LAYERS = buildScrollMaskBlurLayerStyles("bottom");

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
 * Wide-column body scroll mask: chrome sits above the scrollport. Top + bottom
 * progressive masks still run on the scrollport so scrolled content fades at
 * the chrome/body seam (replacing StickyRowScrollFade on in-scroll sticky).
 */
function useColumnScrollMask() {
	const {
		ref,
		showBottomScrollMask,
		showTopScrollMask,
	} = useHasVerticalOverflow<HTMLDivElement>();
	const style = useMemo(
		() => buildScrollMaskStyle({
			fadeTop: showTopScrollMask,
			fadeBottom: showBottomScrollMask,
		}),
		[showBottomScrollMask, showTopScrollMask],
	);
	return { ref, style } as const;
}

/**
 * Left-column shell: anchor chrome (ContextResources) is a non-scrolling
 * sibling above a flex-1 description scrollport. Narrow mode uses `contents`
 * so chrome/body flatten into the page order flow via `order`.
 */
function DescriptionColumnShell({
	chrome,
	children,
	scrollRef,
	style,
	bodyStyle,
}: Readonly<{
	chrome: ReactNode;
	children: ReactNode;
	scrollRef: Ref<HTMLDivElement>;
	style?: CSSProperties;
	bodyStyle?: CSSProperties;
}>) {
	return (
		<div
			className="order-2 contents @[860px]/agentlayout:flex @[860px]/agentlayout:min-h-0 @[860px]/agentlayout:min-w-0 @[860px]/agentlayout:flex-1 @[860px]/agentlayout:flex-col"
			data-jira-work-item-column-shell
		>
			{/*
			 * Anchor chrome outside the overflow scrollport — buttons never
			 * compete with description stacking. Wide pb-7 on the resource row
			 * keeps description top aligned with the Details column body.
			 */}
			<div
				className="order-1 shrink-0 @[860px]/agentlayout:px-6 @[860px]/agentlayout:pt-6"
				data-jira-work-item-column-chrome
			>
				{chrome}
			</div>
			<div
				ref={scrollRef}
				className="order-2 contents @[860px]/agentlayout:relative @[860px]/agentlayout:block @[860px]/agentlayout:min-h-0 @[860px]/agentlayout:min-w-0 @[860px]/agentlayout:flex-1 @[860px]/agentlayout:overflow-y-auto @[860px]/agentlayout:px-6 @[860px]/agentlayout:pb-6"
				data-jira-work-item-scroll-region
				style={style}
			>
				<div
					className="min-w-0 @[860px]/agentlayout:mx-auto @[860px]/agentlayout:flex @[860px]/agentlayout:w-full @[860px]/agentlayout:flex-col @[860px]/agentlayout:gap-y-6"
					data-jira-work-item-column-body
					style={bodyStyle}
				>
					{children}
				</div>
			</div>
		</div>
	);
}

/**
 * Responsive layout for the experimental work item dialog body.
 *
 * Sits under the dialog header band (breadcrumbs + title). Wide
 * (container >= 860px): two columns with chrome *above* a flex-1 body
 * scrollport (progressive top + bottom masks on the scrollport), plus an
 * optional left composer footer. Left: ContextResources chrome + description
 * scroll; right: Details/Activity toggle chrome + metadata scroll (440px).
 * Toggle reveals via `group/metadata-rail` hover on the rail body (plus self
 * hover / `:focus-visible` on the toggle) — not body `:focus-within`.
 *
 * Narrow (< 860px): the columns collapse (`display: contents`) into a single
 * scroll flow ordered Resources -> Context -> Metadata -> Composer via `order`.
 * The composer becomes `sticky bottom-0` on a translucent, blurred dock so it
 * stays visible at the bottom of the single scroll. That outer scrollport owns
 * a matching progressive bottom mask while more content remains below. The same
 * order values also keep each wide column stacked correctly, so no slot is
 * rendered twice.
 *
 * Container-query driven (not viewport) so it reacts to the dialog's actual
 * body width rather than the screen.
 */
export function ExperimentalWorkItemLayout({
	header,
	context,
	metadata,
	composer,
	fillContainer = false,
}: Readonly<ExperimentalWorkItemLayoutProps>) {
	const { planner } = useJiraWorkItemState();
	const { metadataCollapsed } = usePanelLayout();
	const shouldReduceMotion = useReducedMotion() ?? false;
	const showStickyComposer = planner.status === "inactive" || planner.status === "applied";
	const {
		ref: narrowScrollRef,
		showBottomScrollMask: showNarrowBottomScrollMask,
	} = useHasVerticalOverflow<HTMLDivElement>();
	const { ref: leftScrollRef, style: leftScrollMaskStyle } = useColumnScrollMask();
	const contentLayoutTransition = shouldReduceMotion
		? METADATA_CONTENT_REDUCED_MOTION_TRANSITION
		: metadataCollapsed
			? METADATA_CONTENT_COLLAPSE_TRANSITION
			: METADATA_CONTENT_EXPAND_TRANSITION;
	const contentStyle = {
		"--metadata-panel-offset": metadataCollapsed ? "0px" : METADATA_PANEL_WIDTH,
	} as CSSProperties;
	const constrainedColumnStyle = {
		maxWidth: metadataCollapsed ? "800px" : "100%",
	} as CSSProperties;
	const contentColumnStyle = fillContainer ? undefined : constrainedColumnStyle;
	const innerColumnStyle = fillContainer ? constrainedColumnStyle : undefined;

	return (
		<div className="@container/agentlayout group/metadata-rail h-full min-h-0 min-w-0">
			<div
				ref={narrowScrollRef}
				className="flex h-full min-h-0 min-w-0 flex-col gap-6 overflow-y-auto p-6 data-[fill-container]:pb-0 @[860px]/agentlayout:relative @[860px]/agentlayout:grid @[860px]/agentlayout:grid-cols-1 @[860px]/agentlayout:grid-rows-[minmax(0,1fr)] @[860px]/agentlayout:gap-0 @[860px]/agentlayout:overflow-hidden @[860px]/agentlayout:p-0"
				data-fill-container={fillContainer ? "" : undefined}
			>
				{/* Description-scope hover group: left column only (not metadata). */}
				<div className="group/description-scope contents">
					<div
						className="contents @[860px]/agentlayout:flex @[860px]/agentlayout:min-h-0 @[860px]/agentlayout:min-w-0 @[860px]/agentlayout:flex-1 @[860px]/agentlayout:flex-col @[860px]/agentlayout:[grid-area:1/1] @[860px]/agentlayout:[margin-right:var(--metadata-panel-offset)] motion-reduce:transition-none"
						style={contentStyle}
					>
						<motion.div
							className="contents @[860px]/agentlayout:mx-auto @[860px]/agentlayout:flex @[860px]/agentlayout:min-h-0 @[860px]/agentlayout:w-full @[860px]/agentlayout:flex-1 @[860px]/agentlayout:flex-col motion-reduce:transition-none"
							data-jira-work-item-content-column
							layout={shouldReduceMotion ? false : "position"}
							style={contentColumnStyle}
							transition={contentLayoutTransition}
						>
							<DescriptionColumnShell
								chrome={header}
								scrollRef={leftScrollRef}
								style={leftScrollMaskStyle}
								bodyStyle={innerColumnStyle}
							>
								{context}
							</DescriptionColumnShell>
							{showStickyComposer ? (
								<div
									className="order-5 min-w-0 sticky bottom-0 z-10 bg-transparent px-4 pt-3 pb-4 @[860px]/agentlayout:static @[860px]/agentlayout:shrink-0 @[860px]/agentlayout:px-0 @[860px]/agentlayout:pt-4 @[860px]/agentlayout:pb-6"
									data-jira-work-item-composer-dock
								>
									{showNarrowBottomScrollMask ? (
										<div
											aria-hidden
											className="pointer-events-none absolute inset-x-0 bottom-full @[860px]/agentlayout:hidden"
											data-jira-work-item-narrow-scroll-mask
											style={{ height: SCROLL_MASK_DEFAULT_FADE_SIZE }}
										>
											{NARROW_BOTTOM_SCROLL_MASK_BLUR_LAYERS.map((layerStyle, index) => (
												<div key={index} style={layerStyle} />
											))}
											<div className="absolute inset-0 bg-linear-to-b from-transparent to-background" />
										</div>
									) : null}
									<div
										className="contents @[860px]/agentlayout:mx-auto @[860px]/agentlayout:block @[860px]/agentlayout:w-full @[860px]/agentlayout:px-6"
										style={innerColumnStyle}
									>
										{composer}
									</div>
								</div>
							) : null}
						</motion.div>
					</div>
				</div>
				<AnimatePresence initial={false}>
					{metadataCollapsed ? null : (
						<motion.div
							animate="open"
							className={cn(
								"order-3 min-w-0",
								// Column shell (not the scrollport): toggle chrome is a
								// shrink-0 sibling above the rail body scroll inside MetadataRail.
								// Stays a real box in narrow (not `contents`) so order-3 keeps
								// Resources → Context → Metadata → Composer.
								"@[860px]/agentlayout:z-20 @[860px]/agentlayout:flex @[860px]/agentlayout:w-[440px] @[860px]/agentlayout:min-h-0 @[860px]/agentlayout:flex-col @[860px]/agentlayout:justify-self-end @[860px]/agentlayout:self-stretch @[860px]/agentlayout:overflow-hidden @[860px]/agentlayout:pr-6 @[860px]/agentlayout:pt-6 @[860px]/agentlayout:[grid-area:1/1]",
							)}
							exit="closed"
							id="experimental-work-item-metadata-panel"
							initial="closed"
							style={{
								willChange: shouldReduceMotion ? undefined : "transform",
							}}
							variants={shouldReduceMotion ? REDUCED_MOTION_METADATA_PANEL_VARIANTS : METADATA_PANEL_VARIANTS}
						>
							{/* min-h-0 flex-1: keep the chrome→scrollport height chain intact. */}
							<div className="flex min-h-0 min-w-0 flex-1 flex-col" data-jira-work-item-metadata-slot>
								{metadata}
							</div>
						</motion.div>
					)}
				</AnimatePresence>
			</div>
		</div>
	);
}
