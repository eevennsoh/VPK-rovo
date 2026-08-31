"use client";

import { useCallback, useMemo, useState } from "react";

import {
	isCodingAgentListItem,
	toAgentSessionFlyoutItem,
} from "@/components/blocks/agent-list";
import {
	createJiraSessionFlyoutHandle,
	JiraSessionFlyoutSurface,
	JiraSessionFlyoutTrigger,
} from "@/components/blocks/product-sidebar/variants/jira-session-flyout";
import { cn } from "@/lib/utils";

import { AGENT_SESSION_ATTACHED_ITEMS, AGENT_SESSION_ITEMS } from "./data";
import { AgentSessionCard } from "./agent-session-card";
import { AgentSessionCompactCard } from "./agent-session-compact-card";
import {
	bindAgentSessionFlyoutActions,
	resolveAgentSessionWorkItemKey,
	toAgentSessionUntrackedWorkFlyoutItem,
} from "./agent-session-work-item";
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
 * Large sessions are solid uncaptured-work cards: the shared Agent List row
 * (identity, static stamp, viewer machine) sits on a single surface and reveals
 * the same hover/focus action pair Agent List rows use — Resume, plus a
 * Hide / Show eye where Agent List puts Archive. Work-item capture lives on the
 * shared untracked-work session flyout, the same surface
 * `components/blocks/agent-session-flyout` uses, so hovering a card offers
 * Link / Create / Add as a subtask without a footer chin. Medium detached keeps
 * that uncaptured relationship in the Jira Agents compact row and opens Create /
 * Add as a subtask from a click more menu. Medium attached
 * reuses the Jira Issue activity row and opens session details because its work
 * relationship already exists. Small is the collapsed-column identity notch.
 */
export function AgentSession({
	className,
	items: itemsProp,
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
	onItemHover,
	onSelectedItemIdChange,
	onToggleVisibility,
	onView,
	selectedItemId: selectedItemIdProp,
	sessionDrag,
	style,
	variant = "large",
	visibilityLabel,
}: Readonly<AgentSessionProps>) {
	const isAttached = variant === "medium-attached";
	const items = itemsProp ?? (isAttached ? AGENT_SESSION_ATTACHED_ITEMS : AGENT_SESSION_ITEMS);
	const isSelectionControlled = selectedItemIdProp !== undefined;
	const [uncontrolledSelectedItemId, setUncontrolledSelectedItemId] = useState<string | null>(
		null,
	);
	const selectedItemId = isSelectionControlled ? selectedItemIdProp : uncontrolledSelectedItemId;
	// Card-body activation is the only select/deselect path. Hover Resume / Hide
	// stay on their own controls so they cannot flip the highlight.
	const handleView = useCallback((item: AgentSessionItem) => {
		const nextId = selectedItemId === item.id ? null : item.id;
		if (!isSelectionControlled) {
			setUncontrolledSelectedItemId((current) => (current === item.id ? null : item.id));
		}
		onSelectedItemIdChange?.(nextId);
		// Deselect is not another view. Calling onView here would re-spotlight
		// the related issue and leave the board dimmed.
		if (nextId !== null) {
			onView?.(item);
		}
	}, [isSelectionControlled, onSelectedItemIdChange, onView, selectedItemId]);
	// The beat runs for arrivals the viewer has not seen yet; the mark stays on
	// every unreviewed id. A host that never unmounts the list can pass one set.
	const beatItemIds = arrivingItemIds ?? newItemIds;
	const arrivalDelays = useMemo(
		() => buildArrivalDelays(items, beatItemIds),
		[items, beatItemIds],
	);
	// One payload-aware flyout for the whole list, as Agent List and the
	// Agent Session flyout block do: the popup stays mounted and follows the
	// hovered card, so sliding down the list crossfades instead of remounting.
	const [flyoutHandle] = useState(createJiraSessionFlyoutHandle);
	const flyoutActions = useMemo(
		() => bindAgentSessionFlyoutActions(items, {
			capturedItemIds,
			onCreateWorkItem,
			onLinkWorkItem,
			onSubtasks,
		}),
		[capturedItemIds, items, onCreateWorkItem, onLinkWorkItem, onSubtasks],
	);

	return (
		<>
			<ul
				className={cn(
					"flex flex-col",
					variant === "large" ? "gap-0" : "gap-2",
					className,
				)}
				data-stack={variant === "large" ? "well" : undefined}
				data-variant={variant}
				style={style}
			>
				{items.map((item: AgentSessionItem) => {
					const itemOnView = isCodingAgentListItem(item)
						? onView === undefined
							? undefined
							: handleView
						: onView === undefined || (canViewItem !== undefined && !canViewItem(item))
							? undefined
							: handleView;

					const flyoutSession = isAttached
						? toAgentSessionFlyoutItem(item)
						: toAgentSessionUntrackedWorkFlyoutItem(
							item,
							resolveAgentSessionWorkItemKey(
								item,
								getSuggestedWorkItemKey,
								getSuggestedWorkItemKeys,
							),
						);

					if (variant === "large") {
						return (
							<AgentSessionCard
								arrivalDelaySeconds={arrivalDelays.get(item.id)}
								captured={capturedItemIds?.has(item.id) ?? false}
								flyoutHandle={flyoutHandle}
								flyoutSession={flyoutSession}
								getResumeCommand={getResumeCommand}
								isArriving={beatItemIds?.has(item.id) ?? false}
								isNew={newItemIds?.has(item.id) ?? false}
								isResumable={isResumable}
								isSelected={item.id === selectedItemId}
								item={item}
								key={item.id}
								onCopyResume={onCopyResume}
								onItemHover={onItemHover}
								onToggleVisibility={onToggleVisibility}
								onView={itemOnView}
								visibilityLabel={visibilityLabel}
							/>
						);
					}

					const compactCard = (
						<AgentSessionCompactCard
							flyout
							isArriving={beatItemIds?.has(item.id) ?? false}
							isNew={newItemIds?.has(item.id) ?? false}
							item={item}
							onAttach={onLinkWorkItem
								? () => onLinkWorkItem(
									item,
									resolveAgentSessionWorkItemKey(
										item,
										getSuggestedWorkItemKey,
										getSuggestedWorkItemKeys,
									),
								)
								: undefined}
							onCreateWorkItem={onCreateWorkItem}
							onSubtasks={onSubtasks}
							onView={itemOnView}
							sessionDrag={variant === "medium-detached" ? sessionDrag : undefined}
							variant={variant}
						/>
					);

					return variant === "medium-detached" ? (
						<li data-testid={"agent-session-row-" + item.id} key={item.id}>
							{compactCard}
						</li>
					) : (
						<JiraSessionFlyoutTrigger
							closeDelay={160}
							handle={flyoutHandle}
							key={item.id}
							render={<li data-testid={"agent-session-row-" + item.id} />}
							session={flyoutSession}
						>
							{compactCard}
						</JiraSessionFlyoutTrigger>
					);
				})}
			</ul>
			<JiraSessionFlyoutSurface
				capturedSessionIds={capturedItemIds}
				content={isAttached ? "details" : "untracked-work"}
				handle={flyoutHandle}
				onAddAsSubtask={flyoutActions.onAddAsSubtask}
				onCreateWorkItem={flyoutActions.onCreateWorkItem}
				onLinkWorkItem={flyoutActions.onLinkWorkItem}
			/>
		</>
	);
}

export { AGENT_SESSION_ATTACHED_ITEMS, AGENT_SESSION_ITEMS, AGENT_SESSION_MULTI_LINK_KEYS } from "./data";
export { AgentSessionCard } from "./agent-session-card";
export {
	bindAgentSessionFlyoutActions,
	resolveAgentSessionWorkItemKey,
	suggestedAgentSessionWorkItemKey,
	toAgentSessionUntrackedWorkFlyoutItem,
	toJiraIssueAgentActivityFromSession,
} from "./agent-session-work-item";
export type { AgentSessionItem, AgentSessionProps, AgentSessionVariant } from "./agent-session-types";
