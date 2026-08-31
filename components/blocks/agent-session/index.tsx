"use client";

import { useCallback, useMemo } from "react";

import { isCodingAgentListItem } from "@/components/blocks/agent-list";
import { cn } from "@/lib/utils";

import { AGENT_SESSION_ITEMS } from "./data";
import { AgentSessionCard } from "./agent-session-card";
import { AgentSessionCompactCard } from "./agent-session-compact-card";
import { suggestedAgentSessionWorkItemKey } from "./agent-session-work-item";
import type {
	AgentSessionItem,
	AgentSessionProps,
} from "./agent-session-types";

/**
 * Past this many arrivals the group lands together instead of stepping in.
 * Eight staggered cards is half a second of competing focal points, which is
 * the opposite of the one-focal-point rule the beat exists to serve.
 */
const ARRIVAL_STAGGER_LIMIT = 4;

/** Seconds between staggered arrivals. */
const ARRIVAL_STAGGER_SECONDS = 0.06;

/**
 * Arrival order for the ids in `newItemIds`, as a delay in seconds.
 *
 * Keyed by id rather than list index so the delay follows the card if the host
 * re-sorts, and so a card that is not new never carries one at all.
 */
function buildArrivalDelays(
	items: readonly AgentSessionItem[],
	newItemIds: ReadonlySet<string> | undefined,
): ReadonlyMap<string, number> {
	if (newItemIds === undefined || newItemIds.size === 0) {
		return new Map<string, number>();
	}

	const arrivals = items.filter((item: AgentSessionItem) => newItemIds.has(item.id));
	const shouldStagger = arrivals.length <= ARRIVAL_STAGGER_LIMIT;

	return new Map(arrivals.map((item: AgentSessionItem, index: number) => [
		item.id,
		shouldStagger ? index * ARRIVAL_STAGGER_SECONDS : 0,
	]));
}

/**
 * Local coding sessions that never became work items.
 *
 * Large sessions are dashed uncaptured-work cards: the shared Agent List row
 * (identity, static stamp, viewer machine) sits in a sunken body and reveals
 * the same hover/focus action pair Agent List rows use — Resume, plus a
 * show/hide eye where Agent List puts Archive. The chin below owns the work
 * item actions: one Link to work item row per candidate key, each with its own
 * trailing Create work item and Subtasks icons. There is no hover flyout, so the
 * card never needs a popup surface. Medium follows the Jira Agents compact row;
 * Small is the identity notch left behind by a collapsed session column.
 */
export function AgentSession({
	className,
	items = AGENT_SESSION_ITEMS,
	arrivingItemIds,
	canViewItem,
	capturedItemIds,
	getResumeCommand,
	getSuggestedWorkItemKey,
	getSuggestedWorkItemKeys,
	isResumable,
	newItemIds,
	onCopyResume,
	onCreateWorkItem,
	onLinkWorkItem,
	onSubtasks,
	onToggleVisibility,
	onView,
	variant = "large",
}: Readonly<AgentSessionProps>) {
	// Coding rows ignore `canViewItem`: resuming a session the viewer owns is not
	// a permission question. They still require `onView`, because a read-only
	// host must not receive a focusable no-op body.
	const handleCodingView = useCallback((item: AgentSessionItem) => {
		onView?.(item);
	}, [onView]);
	// The beat runs for arrivals the viewer has not seen yet; the mark stays on
	// every unreviewed id. A host that never unmounts the list can pass one set.
	const beatItemIds = arrivingItemIds ?? newItemIds;
	const arrivalDelays = useMemo(
		() => buildArrivalDelays(items, beatItemIds),
		[items, beatItemIds],
	);

	return (
		<ul className={cn("flex flex-col gap-2", className)} data-variant={variant}>
			{items.map((item: AgentSessionItem) => {
				const itemOnView = isCodingAgentListItem(item)
					? onView === undefined
						? undefined
						: handleCodingView
					: onView === undefined || (canViewItem !== undefined && !canViewItem(item))
						? undefined
						: onView;

				return variant === "large" ? (
					<AgentSessionCard
						arrivalDelaySeconds={arrivalDelays.get(item.id)}
						captured={capturedItemIds?.has(item.id) ?? false}
						getResumeCommand={getResumeCommand}
						isArriving={beatItemIds?.has(item.id) ?? false}
						isNew={newItemIds?.has(item.id) ?? false}
						isResumable={isResumable}
						item={item}
						key={item.id}
						onCopyResume={onCopyResume}
						onCreateWorkItem={onCreateWorkItem === undefined ? undefined : () => onCreateWorkItem(item)}
						onLinkWorkItem={onLinkWorkItem === undefined ? undefined : (workItemKey) => onLinkWorkItem(item, workItemKey)}
						onSubtasks={onSubtasks === undefined ? undefined : () => onSubtasks(item)}
						onToggleVisibility={onToggleVisibility}
						onView={itemOnView}
						suggestedWorkItemKey={getSuggestedWorkItemKey?.(item) ?? suggestedAgentSessionWorkItemKey(item)}
						suggestedWorkItemKeys={getSuggestedWorkItemKeys?.(item)}
					/>
				) : (
					<li data-testid={"agent-session-row-" + item.id} key={item.id}>
						<AgentSessionCompactCard
							isArriving={beatItemIds?.has(item.id) ?? false}
							isNew={newItemIds?.has(item.id) ?? false}
							item={item}
							onView={itemOnView}
							variant={variant}
						/>
					</li>
				);
			})}
		</ul>
	);
}

export { AGENT_SESSION_ITEMS, AGENT_SESSION_MULTI_LINK_KEYS } from "./data";
export { AgentSessionCard } from "./agent-session-card";
export { suggestedAgentSessionWorkItemKey } from "./agent-session-work-item";
export type { AgentSessionItem, AgentSessionProps, AgentSessionVariant } from "./agent-session-types";
