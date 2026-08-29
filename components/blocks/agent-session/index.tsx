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
 * (identity, static stamp, viewer machine) sits in a sunken body and reveals
 * the same hover/focus action pair Agent List rows use — Resume, plus a
 * show/hide eye where Agent List puts Archive. The chin below owns the work
 * item actions: one Link to work item row per candidate key, each with its own
 * trailing Create work item and Subtasks icons. There is no hover flyout, so the
 * card never needs a popup surface.
 */
export function AgentSession({
	className,
	items = AGENT_SESSION_ITEMS,
	canViewItem,
	capturedItemIds,
	getResumeCommand,
	getSuggestedWorkItemKey,
	getSuggestedWorkItemKeys,
	isResumable,
	onCopyResume,
	onCreateWorkItem,
	onLinkWorkItem,
	onSubtasks,
	onToggleVisibility,
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
					onLinkWorkItem={onLinkWorkItem === undefined ? undefined : (workItemKey) => onLinkWorkItem(item, workItemKey)}
					onSubtasks={onSubtasks === undefined ? undefined : () => onSubtasks(item)}
					onToggleVisibility={onToggleVisibility}
					onView={
						isCodingAgentListItem(item)
							? handleCodingView
							: onView === undefined || (canViewItem !== undefined && !canViewItem(item))
								? undefined
								: onView
					}
					suggestedWorkItemKey={getSuggestedWorkItemKey?.(item) ?? suggestedAgentSessionWorkItemKey(item)}
					suggestedWorkItemKeys={getSuggestedWorkItemKeys?.(item)}
				/>
			))}
		</ul>
	);
}

export { AGENT_SESSION_ITEMS, AGENT_SESSION_MULTI_LINK_KEYS } from "./data";
export { AgentSessionCard } from "./agent-session-card";
export { suggestedAgentSessionWorkItemKey } from "./agent-session-work-item";
export type { AgentSessionItem, AgentSessionProps } from "./agent-session-types";
