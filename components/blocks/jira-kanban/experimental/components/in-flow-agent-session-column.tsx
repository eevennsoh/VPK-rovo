"use client";

import { useState, type CSSProperties, type PointerEvent, type ReactNode } from "react";
import { motion, useReducedMotion, type Variants } from "motion/react";

import {
	AgentSessionColumn,
	AGENT_SESSION_COLUMN_COLLAPSED_WIDTH_PX,
	AGENT_SESSION_COLUMN_WIDTH_PX,
	type AgentSessionColumnFrame,
	type AgentSessionColumnProps,
} from "@/components/blocks/agent-session-column";
import { JiraSessionFlyoutSuspensionProvider } from "@/components/blocks/product-sidebar/variants/jira-session-flyout";
import { cn } from "@/lib/utils";

const IN_FLOW_AGENT_SESSION_COLUMN_INSET_PX = 24;
const IN_FLOW_AGENT_SESSION_COLUMN_GAP_PX = 8;
// Centers the rail's 16px dot axis in the 26px visible gutter (24px inset + border).
const IN_FLOW_AGENT_SESSION_COLUMN_GUTTER_OFFSET_PX = -5;
const IN_FLOW_AGENT_SESSION_COLUMN_WIDTH_TRANSITION =
	"width var(--duration-normal) var(--ease-out-practical)";
const IN_FLOW_AGENT_SESSION_COLUMN_EXPANSION_TRANSITION =
	"width var(--duration-medium) var(--ease-in-out)";
const IN_FLOW_AGENT_SESSION_COLUMN_VARIANTS: Variants = {
	embedded: {
		transform: `translateX(${IN_FLOW_AGENT_SESSION_COLUMN_INSET_PX}px)`,
		transition: { duration: 0.15, ease: [0.4, 1, 0.6, 1] },
	},
	gutter: {
		transform: `translateX(${IN_FLOW_AGENT_SESSION_COLUMN_GUTTER_OFFSET_PX}px)`,
		transition: { duration: 0.1, ease: [0.6, 0, 0.8, 0.6] },
	},
};
const IN_FLOW_AGENT_SESSION_COLUMN_REDUCED_MOTION_VARIANTS: Variants = {
	embedded: { transform: `translateX(${IN_FLOW_AGENT_SESSION_COLUMN_INSET_PX}px)` },
	gutter: { transform: `translateX(${IN_FLOW_AGENT_SESSION_COLUMN_GUTTER_OFFSET_PX}px)` },
};

export interface InFlowAgentSessionColumnProps {
	agentSessionColumn: AgentSessionColumnProps;
	className?: string;
	columnFrame: AgentSessionColumnFrame;
	paddingBottom?: CSSProperties["paddingBottom"];
	paddingTop?: CSSProperties["paddingTop"];
	sessionFlyoutsSuspended: boolean;
	untrackedDropArmed: boolean;
}

function useInFlowAgentSessionColumnInteraction(
	onCollapsedChange: AgentSessionColumnProps["onCollapsedChange"],
) {
	const [isHovered, setIsHovered] = useState(false);
	const [isPersistentExpanded, setIsPersistentExpanded] = useState(false);

	const handlePointerEnter = (event: PointerEvent<HTMLDivElement>) => {
		if (event.pointerType !== "touch") {
			setIsHovered(true);
		}
	};

	const handlePointerLeave = (event: PointerEvent<HTMLDivElement>) => {
		if (event.pointerType !== "touch") {
			setIsHovered(false);
		}
	};

	const handleCollapsedChange = (collapsed: boolean) => {
		setIsPersistentExpanded(!collapsed);
		onCollapsedChange?.(collapsed);
	};

	return {
		handleCollapsedChange,
		handlePointerEnter,
		handlePointerLeave,
		isEmbedded: isHovered || isPersistentExpanded,
		isHovered,
		isPersistentExpanded,
	};
}

function InFlowAgentSessionColumnFootprint({
	columnWidthPx,
	isEmbedded,
	shouldReduceMotion,
}: Readonly<{
	columnWidthPx: number;
	isEmbedded: boolean;
	shouldReduceMotion: boolean | null;
}>) {
	const transition = shouldReduceMotion ? "none" : IN_FLOW_AGENT_SESSION_COLUMN_WIDTH_TRANSITION;
	const expansionTransition = shouldReduceMotion
		? "none"
		: IN_FLOW_AGENT_SESSION_COLUMN_EXPANSION_TRANSITION;

	return (
		<>
			<div
				aria-hidden="true"
				className="shrink-0"
				style={{
					transition,
					width: isEmbedded ? IN_FLOW_AGENT_SESSION_COLUMN_GAP_PX : 0,
				}}
			/>
			<div
				aria-hidden="true"
				className="shrink-0"
				style={{
					transition: expansionTransition,
					width: isEmbedded ? columnWidthPx : 0,
				}}
			/>
		</>
	);
}

function InFlowAgentSessionColumnSurface({
	agentSessionColumn,
	className,
	columnFrame,
	isEmbedded,
	isPersistentExpanded,
	onCollapsedChange,
	paddingBottom,
	paddingTop,
	shouldReduceMotion,
	untrackedDropArmed,
}: Readonly<InFlowAgentSessionColumnProps & {
	isEmbedded: boolean;
	isPersistentExpanded: boolean;
	onCollapsedChange: (collapsed: boolean) => void;
	shouldReduceMotion: boolean | null;
}>) {
	return (
		<motion.div
			animate={isEmbedded ? "embedded" : "gutter"}
			className={cn(
				"absolute inset-y-0 start-0 z-40 flex min-h-0 border-2 border-r-0",
				isEmbedded
					? "pointer-events-auto bg-surface"
					: "pointer-events-none bg-transparent",
				untrackedDropArmed ? "border-ring" : "border-transparent",
				className,
			)}
			data-board-agent-session-drop-zone="untracked"
			data-board-agent-session-target={untrackedDropArmed ? "untracked" : undefined}
			initial={false}
			style={{
				paddingTop,
				paddingBottom,
				willChange: shouldReduceMotion ? undefined : "transform",
			}}
			variants={shouldReduceMotion
				? IN_FLOW_AGENT_SESSION_COLUMN_REDUCED_MOTION_VARIANTS
				: IN_FLOW_AGENT_SESSION_COLUMN_VARIANTS}
		>
			<AgentSessionColumn
				{...agentSessionColumn}
				collapsed={!isPersistentExpanded}
				collapsedPresentation={isEmbedded ? "column" : "gutter"}
				columnFrame={columnFrame}
				onCollapsedChange={onCollapsedChange}
			/>
		</motion.div>
	);
}

/**
 * The Untracked rail rests in the page's leading gutter. Hover temporarily
 * returns that same compact timeline to the board's original 24px column inset;
 * it never swaps dots for cards. Only the column's expand control promotes the
 * full column, and that deliberate state persists after the pointer leaves.
 */
export function InFlowAgentSessionColumn({
	agentSessionColumn,
	className,
	columnFrame,
	paddingBottom,
	paddingTop,
	sessionFlyoutsSuspended,
	untrackedDropArmed,
}: Readonly<InFlowAgentSessionColumnProps>): ReactNode {
	const shouldReduceMotion = useReducedMotion();
	const {
		handleCollapsedChange,
		handlePointerEnter,
		handlePointerLeave,
		isEmbedded,
		isHovered,
		isPersistentExpanded,
	} = useInFlowAgentSessionColumnInteraction(agentSessionColumn.onCollapsedChange);
	const expandedWidthPx = agentSessionColumn.expandedWidthPx ?? AGENT_SESSION_COLUMN_WIDTH_PX;
	const columnWidthPx = isPersistentExpanded
		? expandedWidthPx
		: AGENT_SESSION_COLUMN_COLLAPSED_WIDTH_PX;

	return (
		<JiraSessionFlyoutSuspensionProvider
			suspended={sessionFlyoutsSuspended || (isHovered && !isPersistentExpanded)}
		>
			<div
				className="relative flex min-h-0 shrink-0 self-stretch"
				onPointerEnter={handlePointerEnter}
				onPointerLeave={handlePointerLeave}
			>
				{isEmbedded ? null : (
					<div
						aria-hidden="true"
						className="absolute inset-y-0 start-0 z-50"
						data-agent-session-column-hit-area=""
						onPointerEnter={handlePointerEnter}
						style={{ width: IN_FLOW_AGENT_SESSION_COLUMN_INSET_PX + 2 }}
					/>
				)}
				<InFlowAgentSessionColumnFootprint
					columnWidthPx={columnWidthPx}
					isEmbedded={isEmbedded}
					shouldReduceMotion={shouldReduceMotion}
				/>
				<InFlowAgentSessionColumnSurface
					agentSessionColumn={agentSessionColumn}
					className={className}
					columnFrame={columnFrame}
					isEmbedded={isEmbedded}
					isPersistentExpanded={isPersistentExpanded}
					onCollapsedChange={handleCollapsedChange}
					paddingBottom={paddingBottom}
					paddingTop={paddingTop}
					sessionFlyoutsSuspended={sessionFlyoutsSuspended}
					shouldReduceMotion={shouldReduceMotion}
					untrackedDropArmed={untrackedDropArmed}
				/>
			</div>
		</JiraSessionFlyoutSuspensionProvider>
	);
}
