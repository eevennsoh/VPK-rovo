"use client";

import type { CSSProperties, ReactNode } from "react";

import {
	AgentSessionColumn,
	type AgentSessionColumnProps,
} from "@/components/blocks/agent-session-column";
import { JiraSessionFlyoutSuspensionProvider } from "@/components/blocks/product-sidebar/variants/jira-session-flyout";
import { cn } from "@/lib/utils";

export interface InFlowAgentSessionColumnProps {
	agentSessionColumn: AgentSessionColumnProps;
	className?: string;
	paddingBottom?: CSSProperties["paddingBottom"];
	paddingTop?: CSSProperties["paddingTop"];
	sessionFlyoutsSuspended: boolean;
	untrackedDropArmed: boolean;
}

/**
 * The Untracked column as an in-flow sibling of board statuses or the work
 * items list. Top/left/bottom match the 2px drop-target box those surfaces
 * use so the headers share a baseline. No right border: a 2px stroke there
 * reads as a white seam on `bg-surface`. The column itself is the Untracked
 * drop zone.
 */
export function InFlowAgentSessionColumn({
	agentSessionColumn,
	className,
	paddingBottom,
	paddingTop,
	sessionFlyoutsSuspended,
	untrackedDropArmed,
}: Readonly<InFlowAgentSessionColumnProps>): ReactNode {
	return (
		<JiraSessionFlyoutSuspensionProvider suspended={sessionFlyoutsSuspended}>
			<div
				className={cn(
					"flex min-h-0 shrink-0 border-2 border-r-0 ps-6",
					untrackedDropArmed ? "border-ring" : "border-transparent",
					className,
				)}
				data-board-agent-session-drop-zone="untracked"
				data-board-agent-session-target={untrackedDropArmed ? "untracked" : undefined}
				style={{ paddingTop, paddingBottom }}
			>
				<AgentSessionColumn {...agentSessionColumn} />
			</div>
		</JiraSessionFlyoutSuspensionProvider>
	);
}
