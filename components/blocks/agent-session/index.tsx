"use client";

import { useCallback } from "react";

import { isCodingAgentListItem } from "@/components/blocks/agent-list";
import { cn } from "@/lib/utils";

import { AGENT_SESSION_ITEMS } from "./data";
import { AgentSessionCard } from "./agent-session-card";
import { suggestedAgentSessionWorkItemKey } from "./agent-session-work-item";
import type {
	AgentSessionItem,
	AgentSessionProps,
} from "./agent-session-types";

/**
 * Local coding sessions that never became work items.
 *
 * Each session is a dashed uncaptured-work card: the shared Agent List row
 * (identity, static stamp, viewer machine) sits in a sunken body, and the chin
 * below it offers Link to work item, Create work item, Copy resume command, and
 * dismiss. There is no hover flyout — the chin owns every action, so the row
 * renders with `hideHoverActions` and the card never needs a popup surface.
 */
export function AgentSession({
	className,
	items = AGENT_SESSION_ITEMS,
	canViewItem,
	capturedItemIds,
	getResumeCommand,
	getSuggestedWorkItemKey,
	isResumable,
	onCopyResume,
	onCreateWorkItem,
	onDismiss,
	onLinkWorkItem,
	onView,
}: Readonly<AgentSessionProps>) {
	// Coding rows stay activatable regardless of `canViewItem`: resuming a
	// session the viewer owns is never a permission question, and the host still
	// decides what activation does by supplying (or omitting) `onView`.
	const handleCodingView = useCallback((item: AgentSessionItem) => {
		onView?.(item);
	}, [onView]);

	return (
		<ul className={cn("flex flex-col gap-2", className)}>
			{items.map((item: AgentSessionItem) => (
				<AgentSessionCard
					captured={capturedItemIds?.has(item.id) ?? false}
					getResumeCommand={getResumeCommand}
					isResumable={isResumable}
					item={item}
					key={item.id}
					onCopyResume={onCopyResume}
					onCreateWorkItem={onCreateWorkItem === undefined ? undefined : () => onCreateWorkItem(item)}
					onDismiss={onDismiss === undefined ? undefined : () => onDismiss(item)}
					onLinkWorkItem={onLinkWorkItem === undefined ? undefined : () => onLinkWorkItem(item)}
					onView={
						isCodingAgentListItem(item)
							? handleCodingView
							: onView === undefined || (canViewItem !== undefined && !canViewItem(item))
								? undefined
								: onView
					}
					suggestedWorkItemKey={getSuggestedWorkItemKey?.(item) ?? suggestedAgentSessionWorkItemKey(item)}
				/>
			))}
		</ul>
	);
}

export { AGENT_SESSION_ITEMS } from "./data";
export { AgentSessionCard } from "./agent-session-card";
export { suggestedAgentSessionWorkItemKey } from "./agent-session-work-item";
export type { AgentSessionItem, AgentSessionProps } from "./agent-session-types";
