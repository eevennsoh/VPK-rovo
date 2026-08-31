"use client";

import { useEffect, useMemo, useState } from "react";
import { useReducedMotion } from "motion/react";

import ArrowLeftIcon from "@atlaskit/icon/core/arrow-left";
import ShrinkHorizontalIcon from "@atlaskit/icon/core/shrink-horizontal";

import { isCodingAgentListItem } from "@/components/blocks/agent-list";
import { AGENT_SESSION_ITEMS, AgentSession } from "@/components/blocks/agent-session";
import type { AgentSessionItem } from "@/components/blocks/agent-session";
import { useHasVerticalOverflow } from "@/components/hooks/use-has-vertical-overflow";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollMaskEdgeOverlay } from "@/components/visual/scroll-mask";
import { token } from "@/lib/tokens";
import { cn } from "@/lib/utils";

import { AgentSessionColumnHiddenFooter } from "./agent-session-column-hidden-footer";
import { AgentSessionColumnRail } from "./agent-session-column-rail";
import type { AgentSessionColumnProps } from "./agent-session-column-types";
import { useAgentSessionColumnHidden } from "./use-agent-session-column-hidden";

/** Expanded column width in px. */
const AGENT_SESSION_COLUMN_WIDTH_PX = 280;

/**
 * Collapsed rail width in px. Matches the board's collapsed status pill so the
 * two sit on one rhythm; declared here rather than imported, because a shared
 * block must not reach into a kanban variant's internals.
 */
const AGENT_SESSION_COLUMN_COLLAPSED_WIDTH_PX = 32;

/**
 * Collapsing repositions the whole board to the right of it, so the width change
 * uses the bold in-place profile (`duration-medium` + `ease-in-out`) the status
 * columns use.
 */
const AGENT_SESSION_COLUMN_TRANSITION = "width var(--duration-medium) var(--ease-in-out)";

/**
 * The filled plane that holds the sessions.
 *
 * It wraps only the list, never the header: the header has to sit on the board
 * surface at the same inset and baseline as `To do` and `In progress`, so the
 * five column titles read as one row. Filling behind the header instead would
 * push this title 8px in and 8px down from its neighbours and make the column
 * look like a panel docked beside the board rather than a column of it.
 *
 * `relative overflow-hidden` keeps the edge fades positioned to this plane and
 * clipped to its radius, so they span the full backdrop rather than the inset
 * scrollport.
 */
const AGENT_SESSION_PLANE =
	"relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-bg-accent-gray-subtlest";

/** Matches `bg-bg-accent-gray-subtlest` so edge fades dissolve into the plane. */
const AGENT_SESSION_PLANE_FADE_COLOR = "var(--color-bg-accent-gray-subtlest)";

const AGENT_SESSION_PLANE_FADE_SIZE = "3rem";

/**
 * A kanban column of agent sessions that never became work items.
 *
 * The board's status columns are unfilled — they read as regions of the board
 * surface. This one fills the area *below its header* with
 * `bg-bg-accent-gray-subtlest`, because its contents are not on the board yet:
 * the filled plane is what says "outside the workflow" without needing a label
 * to explain it. The header stays outside that fill so it shares an inset and a
 * baseline with the status column titles. Everything below the header is the
 * Agent Session block verbatim, so a card's untracked-work flyout, captured
 * state, and resume gating behave identically here and in the standalone block.
 *
 * The column is a scrollport, so it reserves the 4px focus-ring gutter VPK's
 * widest ring needs (`-m-1 p-1`) rather than clipping a focused card's ring.
 *
 * It collapses like the status columns beside it, but not *into* the same thing:
 * a status pill is a rotated label, while this becomes a full-height rail of
 * per-session notches that still open the session flyout on hover. See
 * {@link AgentSessionColumnRail}.
 */
export function AgentSessionColumn({
	className,
	count,
	defaultCollapsed = false,
	emptyLabel = "No untracked sessions",
	items = AGENT_SESSION_ITEMS,
	listClassName,
	newItemIds,
	onCollapsedChange,
	onToggleVisibility,
	title = "Untracked work",
	...sessionProps
}: Readonly<AgentSessionColumnProps>) {
	const shouldReduceMotion = useReducedMotion();
	const [collapsed, setCollapsed] = useState(defaultCollapsed);
	const {
		closeHiddenView,
		hiddenCount,
		hiddenItems,
		openHiddenView,
		toggleHidden,
		view,
		visibleItems,
	} = useAgentSessionColumnHidden(items);
	const viewItems = view === "hidden" ? hiddenItems : visibleItems;
	const displayTitle = view === "hidden" ? "Hidden work" : title;
	// The rail and the card list have very different intrinsic widths, so the
	// overflow has to be clipped for the duration of the width transition. Any
	// longer and it would clip the 4px focus rings on the cards inside.
	const [isResizing, setIsResizing] = useState(false);
	const {
		ref: listRef,
		showBottomScrollMask,
		showTopScrollMask,
	} = useHasVerticalOverflow<HTMLDivElement>();
	const sessionCount = view === "hidden"
		? hiddenItems.length
		: (count ?? visibleItems.length);
	// Collapsing swaps the cards for the rail and back, which remounts them — and
	// a mount is exactly what re-arms an `initial` animation. The beat is meant to
	// fire once per arrival, so the column, which survives the toggle, remembers
	// which ids have already played. This is history, not derived state: nothing
	// in the current props can say whether a beat has already run.
	const [playedArrivalIds, setPlayedArrivalIds] = useState<ReadonlySet<string>>(
		() => new Set<string>(),
	);
	const arrivingItemIds = useMemo(() => {
		if (newItemIds === undefined || newItemIds.size === 0) {
			return undefined;
		}

		const arriving = new Set<string>();
		for (const id of newItemIds) {
			if (!playedArrivalIds.has(id)) {
				arriving.add(id);
			}
		}
		return arriving;
	}, [newItemIds, playedArrivalIds]);

	useEffect(() => {
		setPlayedArrivalIds((current) => {
			// Mirror `newItemIds` rather than accumulating, so an id the watermark
			// clears is forgotten and a later re-arrival of it animates again.
			const next = newItemIds === undefined
				? new Set<string>()
				: new Set<string>(newItemIds);
			const isUnchanged = next.size === current.size
				&& [...next].every((id: string) => current.has(id));
			return isUnchanged ? current : next;
		});
	}, [newItemIds]);
	// The rail's notches activate on the same terms the cards do: coding sessions
	// are always activatable, person rows only when `canViewItem` allows it.
	const canActivateNotch = (item: AgentSessionItem) =>
		isCodingAgentListItem(item) || (sessionProps.canViewItem?.(item) ?? true);
	const handleNotchView = sessionProps.onView === undefined
		? undefined
		: (item: AgentSessionItem) => {
			if (canActivateNotch(item)) {
				sessionProps.onView?.(item);
			}
		};

	const handleToggleCollapsed = () => {
		const nextCollapsed = !collapsed;
		if (!shouldReduceMotion) {
			setIsResizing(true);
		}
		if (nextCollapsed) {
			closeHiddenView();
		}
		setCollapsed(nextCollapsed);
		onCollapsedChange?.(nextCollapsed);
	};

	const handleToggleVisibility = (item: AgentSessionItem) => {
		toggleHidden(item);
		onToggleVisibility?.(item);
	};

	const handleTransitionEnd = (event: React.TransitionEvent<HTMLElement>) => {
		if (event.target === event.currentTarget && event.propertyName === "width") {
			setIsResizing(false);
		}
	};

	return (
		<section
			aria-label={`${displayTitle}, ${sessionCount} sessions`}
			className={cn(
				"group/session-column flex min-h-0 shrink-0 flex-col",
				collapsed || isResizing ? "overflow-hidden" : null,
				className,
			)}
			data-agent-session-column={title}
			data-collapsed={collapsed || undefined}
			onTransitionEnd={handleTransitionEnd}
			style={{
				transition: shouldReduceMotion ? "none" : AGENT_SESSION_COLUMN_TRANSITION,
				width: collapsed
					? `${AGENT_SESSION_COLUMN_COLLAPSED_WIDTH_PX}px`
					: `${AGENT_SESSION_COLUMN_WIDTH_PX}px`,
			}}
		>
			{collapsed ? (
				// Collapsed, there is no header to keep out of the fill — the rail's
				// head slot carries the count — so the plane runs the full height,
				// matching the full-height pill the status columns collapse into.
				<div
					className={AGENT_SESSION_PLANE}
					style={{
						borderRadius: token("radius.xlarge"),
					}}
				>
					<AgentSessionColumnRail
						arrivingItemIds={arrivingItemIds}
						capturedItemIds={sessionProps.capturedItemIds}
						getSuggestedWorkItemKey={sessionProps.getSuggestedWorkItemKey}
						getSuggestedWorkItemKeys={sessionProps.getSuggestedWorkItemKeys}
						items={visibleItems}
						newItemIds={newItemIds}
						onCreateWorkItem={sessionProps.onCreateWorkItem}
						onExpand={handleToggleCollapsed}
						onLinkWorkItem={sessionProps.onLinkWorkItem}
						onSubtasks={sessionProps.onSubtasks}
						onView={handleNotchView}
						sessionCount={sessionCount}
						title={title}
					/>
				</div>
			) : (
				<>
					<div
						className="flex min-w-0 items-center gap-1.5"
						style={{ paddingBottom: token("space.100") }}
					>
						{view === "hidden" ? (
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger
										render={
											<Button
												aria-label={`Back to ${title}`}
												className="shrink-0"
												onClick={closeHiddenView}
												size="icon-compact"
												type="button"
												variant="ghost"
											/>
										}
									>
										<Icon className="text-icon-subtle" render={<ArrowLeftIcon label="" />} />
									</TooltipTrigger>
									<TooltipContent>Back</TooltipContent>
								</Tooltip>
							</TooltipProvider>
						) : null}
						<span className="truncate text-xs font-medium leading-4 text-text-subtle">
							{displayTitle}
						</span>
						<span className="shrink-0 text-xs font-normal text-text-subtlest">
							{sessionCount}
						</span>
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger
									render={
										<Button
											aria-label={`Collapse ${title} column`}
											className={cn(
												"ms-auto shrink-0 opacity-0 transition-opacity duration-normal ease-out-practical",
												"group-hover/session-column:opacity-100",
												"group-has-[:focus-visible]/session-column:opacity-100",
												"motion-reduce:transition-none",
											)}
											onClick={handleToggleCollapsed}
											size="icon-compact"
											type="button"
											variant="ghost"
										/>
									}
								>
									<Icon className="text-icon-subtle" render={<ShrinkHorizontalIcon label="" />} />
								</TooltipTrigger>
								<TooltipContent>Collapse</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					</div>

					<div
						className={AGENT_SESSION_PLANE}
						style={{
							borderRadius: token("radius.xlarge"),
						}}
					>
						<div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
							<div
								ref={listRef}
								className="-m-1 min-h-0 min-w-0 flex-1 overflow-y-auto p-1"
							>
								{viewItems.length === 0 ? (
									<p className="text-xs text-text-subtlest">{emptyLabel}</p>
								) : (
									<AgentSession
										arrivingItemIds={arrivingItemIds}
										className={cn("gap-0", listClassName)}
										items={viewItems}
										newItemIds={newItemIds}
										{...sessionProps}
										onToggleVisibility={handleToggleVisibility}
										visibilityLabel={view === "hidden" ? "Show" : "Hide"}
									/>
								)}
							</div>
							{showTopScrollMask ? (
								<ScrollMaskEdgeOverlay
									color={AGENT_SESSION_PLANE_FADE_COLOR}
									edge="top"
									fadeSize={AGENT_SESSION_PLANE_FADE_SIZE}
								/>
							) : null}
							{showBottomScrollMask ? (
								<ScrollMaskEdgeOverlay
									color={AGENT_SESSION_PLANE_FADE_COLOR}
									edge="bottom"
									fadeSize={AGENT_SESSION_PLANE_FADE_SIZE}
								/>
							) : null}
						</div>
						{view === "active" && hiddenCount > 0 ? (
							<AgentSessionColumnHiddenFooter
								hiddenCount={hiddenCount}
								onOpen={openHiddenView}
							/>
						) : null}
					</div>
				</>
			)}
		</section>
	);
}

export { AgentSessionColumnRail } from "./agent-session-column-rail";
export type { AgentSessionColumnProps } from "./agent-session-column-types";
