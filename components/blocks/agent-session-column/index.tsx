"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";

import GrowHorizontalIcon from "@atlaskit/icon/core/grow-horizontal";
import ShrinkHorizontalIcon from "@atlaskit/icon/core/shrink-horizontal";

import { isCodingAgentListItem } from "@/components/blocks/agent-list";
import { AGENT_SESSION_ITEMS, AgentSession } from "@/components/blocks/agent-session";
import type { AgentSessionItem } from "@/components/blocks/agent-session";
import { useHasVerticalOverflow } from "@/components/hooks/use-has-vertical-overflow";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollMaskEdgeOverlay } from "@/components/visual/scroll-mask";
import TextMorphing from "@/components/visual/text-morphing";
import type { TextMorphConfig } from "@/components/visual/text-morphing/data";
import { token } from "@/lib/tokens";
import { cn } from "@/lib/utils";

import { AgentSessionColumnHiddenFooter } from "./agent-session-column-hidden-footer";
import { AgentSessionColumnOverflowMenu } from "./agent-session-column-overflow-menu";
import { AgentSessionColumnRail } from "./agent-session-column-rail";
import type { AgentSessionColumnProps } from "./agent-session-column-types";
import { useAgentSessionColumnHidden } from "./use-agent-session-column-hidden";

/** Expanded column width in px. Exported so a host surface can size itself to match. */
export const AGENT_SESSION_COLUMN_WIDTH_PX = 280;

/**
 * Collapsed rail width in px. Matches the board's collapsed status pill so the
 * two sit on one rhythm; declared here rather than imported, because a shared
 * block must not reach into a kanban variant's internals. Exported for the same
 * reason the expanded width is: a host that animates around the column has to
 * read the two widths from their owner rather than restate them.
 */
export const AGENT_SESSION_COLUMN_COLLAPSED_WIDTH_PX = 32;

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
 * The list is the scrollport and sits flush in the fill — no padded gutter
 * around the cards. Expanded, the plane is a bordered well (`radius.xlarge`)
 * that clips cards, fades, and the hidden-work footer so they cannot paint
 * over the 1px stroke. Collapsed, the rail sits in the same fill without that
 * frame. Cards inside the well drop their outer outline and keep only
 * inter-row dividers.
 */
const AGENT_SESSION_PLANE =
	"relative flex min-h-0 min-w-0 flex-1 flex-col bg-surface";

const AGENT_SESSION_WELL = cn(
	AGENT_SESSION_PLANE,
	"overflow-hidden rounded-xl border border-solid border-border-disabled",
);

/**
 * Column-only: the well already draws the outer rectangle, so stacked cards
 * must not. First/last lose the edges that would double the well stroke;
 * neighbours keep a top border as the divider.
 */
const AGENT_SESSION_WELL_LIST = cn(
	"gap-0",
	"[&_article]:rounded-none [&_article]:border-x-0",
	"[&_li:first-child_article]:border-t-0",
	// Beats the card's `[li:last-child_&]:rounded-b-lg` so only the well curves.
	"[&_li:last-child_article]:rounded-none [&_li:last-child_article]:rounded-b-none [&_li:last-child_article]:border-b-0",
);

/**
 * Hover/focus swap on the collapsed header slot: the count at rest, the expand
 * control once the pointer or keyboard arrives. Both sit in the same 24px row
 * the expanded collapse control uses, so the number does not move.
 */
const HEADER_COUNT_AT_REST = cn(
	"pointer-events-none transition-opacity duration-normal ease-out-practical",
	"group-hover/session-column:opacity-0 group-has-[:focus-visible]/session-column:opacity-0",
	"motion-reduce:transition-none",
);

const HEADER_CONTROL_ON_REVEAL = cn(
	"opacity-0 transition-opacity duration-normal ease-out-practical",
	"group-hover/session-column:opacity-100 group-has-[:focus-visible]/session-column:opacity-100",
	"motion-reduce:transition-none",
);

/**
 * Expanded header actions: overflow + collapse, revealed together. Stay
 * painted while the overflow menu is open so the trigger does not vanish
 * under the portalled popup.
 */
const HEADER_ACTIONS_REVEAL = cn(
	"ms-auto flex shrink-0 items-center",
	HEADER_CONTROL_ON_REVEAL,
	"has-[[data-popup-open]]:opacity-100",
);

/**
 * Count morphing for the collapsed header.
 *
 * `slots` spins each digit behind a fade mask, which suits a value that changes
 * because work arrived rather than because the viewer acted. It also survives
 * the `+N` ↔ total swap: the `+` is a non-digit prefix that slides via layout
 * while the digits spin, so `4` → `+2` is one motion rather than a hard cut.
 *
 * `autoSize` eases the slot's width across that swap so the header never jumps.
 * `initial: false` keeps a column that mounts already collapsed from spinning
 * its count in on first paint. `TextMorphing` degrades to static text under
 * `prefers-reduced-motion`.
 */
const HEAD_COUNT_MORPH: TextMorphConfig = {
	variant: "slots",
	animation: "snappy",
	driftX: 0,
	driftY: 0,
	trend: 0,
	stagger: 0.02,
	initial: false,
	autoSize: true,
};

/** Matches `bg-surface` so edge fades dissolve into the plane. */
const AGENT_SESSION_PLANE_FADE_COLOR = "var(--color-surface)";

const AGENT_SESSION_PLANE_FADE_SIZE = "3rem";

/**
 * A kanban column of agent sessions that never became work items.
 *
 * The board's status columns are unfilled — they read as regions of the board
 * surface. This one still wraps the area *below its header* so the list and
 * edge fades share one column, but that plane is `bg-surface` — the same white
 * (or dark) board surface. Expanded, it is also a 1px well: the outer stroke
 * and `radius.xlarge` live on the plane so scroll masks cannot wash them out.
 * The header stays outside that plane so it shares an inset and a
 * baseline with the status column titles.
 * Everything below the header is the Agent Session block verbatim, so a card's
 * untracked-work flyout, captured state, and resume gating behave identically
 * here and in the standalone block.
 *
 * The list sits flush in the well and is the scrollport. Fades sit on the list
 * wrapper, already inside the well's padding box, so they stop at the inner
 * edge of the stroke.
 *
 * It collapses like the status columns beside it, but not *into* the same thing:
 * a status pill is a rotated label, while this becomes a full-height rail of
 * per-session notches that still open the session flyout on hover. See
 * {@link AgentSessionColumnRail}.
 *
 * Two capabilities exist for hosts that dock the column into their own surface
 * rather than stand it on the board: `collapsed` makes the rail state
 * controlled, and `chrome="none"` drops the expanded header so the surface can
 * own the title and actions. Both are generic options — the column knows
 * nothing about who is hosting it.
 */
export function AgentSessionColumn({
	chrome = "default",
	className,
	collapsed: collapsedProp,
	count,
	defaultCollapsed = false,
	emptyLabel = "No untracked sessions",
	items = AGENT_SESSION_ITEMS,
	listClassName,
	newItemIds,
	onCollapsedChange,
	onSelectedItemIdChange,
	onToggleVisibility,
	selectedItemId: selectedItemIdProp,
	title = "Untracked work",
	...sessionProps
}: Readonly<AgentSessionColumnProps>) {
	const shouldReduceMotion = useReducedMotion();
	// Collapse mirrors the selection contract below: the host owns the value
	// when it supplies one, and the column falls back to its own state
	// otherwise. Same idiom the board uses for `collapsedColumns`.
	const isCollapsedControlled = collapsedProp !== undefined;
	const [uncontrolledCollapsed, setUncontrolledCollapsed] = useState(defaultCollapsed);
	const collapsed = collapsedProp ?? uncontrolledCollapsed;
	// Collapse remounts `AgentSession`, so the column keeps the selected id the
	// same way it keeps arrival-beat history.
	const isSelectionControlled = selectedItemIdProp !== undefined;
	const [uncontrolledSelectedItemId, setUncontrolledSelectedItemId] = useState<string | null>(
		null,
	);
	const selectedItemId = isSelectionControlled ? selectedItemIdProp : uncontrolledSelectedItemId;
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
	const untrackedCount = count ?? visibleItems.length;
	const showWellFooter = view === "hidden" || hiddenCount > 0;
	const sessionCount = view === "hidden" ? hiddenItems.length : untrackedCount;
	const newCount = newItemIds === undefined
		? 0
		: visibleItems.reduce((total: number, item: AgentSessionItem) => (
			newItemIds.has(item.id) ? total + 1 : total
		), 0);
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
	// A controlled host can flip `collapsed` from its own affordance, which never
	// runs `handleToggleCollapsed`. React to the committed change so an external
	// collapse behaves like an internal one: clip the overflow for the width
	// transition, and leave the hidden view, which the rail cannot render.
	const lastCollapsedRef = useRef(collapsed);
	useEffect(() => {
		if (lastCollapsedRef.current === collapsed) {
			return;
		}
		lastCollapsedRef.current = collapsed;
		if (!shouldReduceMotion) {
			setIsResizing(true);
		}
		if (collapsed) {
			closeHiddenView();
		}
	}, [closeHiddenView, collapsed, shouldReduceMotion]);
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
		// Only own the state when the host has not claimed it, so a controlled
		// host stays the single source of truth.
		if (!isCollapsedControlled) {
			setUncontrolledCollapsed(nextCollapsed);
		}
		onCollapsedChange?.(nextCollapsed);
	};

	const handleToggleVisibility = (item: AgentSessionItem) => {
		toggleHidden(item);
		onToggleVisibility?.(item);
	};

	const handleSelectedItemIdChange = (itemId: string | null) => {
		if (!isSelectionControlled) {
			setUncontrolledSelectedItemId(itemId);
		}
		onSelectedItemIdChange?.(itemId);
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
			{collapsed || chrome === "default" ? (
				<div
					className="flex min-w-0 items-center gap-1.5"
					style={{ paddingBottom: token("space.100") }}
				>
					{collapsed ? (
						<div className="relative flex h-6 w-full min-w-0 items-center justify-center">
							<span
								aria-hidden="true"
								className={cn(
									"absolute inset-0 flex items-center justify-center text-xs",
									newCount > 0
										? "font-medium text-text-discovery"
										: "font-normal text-text-subtlest",
									HEADER_COUNT_AT_REST,
								)}
							>
								<TextMorphing
									config={HEAD_COUNT_MORPH}
									text={newCount > 0 ? `+${newCount}` : String(sessionCount)}
								/>
							</span>
							<span className="sr-only">
								{newCount > 0
									? `${sessionCount} sessions, ${newCount} newly synced`
									: `${sessionCount} sessions`}
							</span>
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger
										render={
											<Button
												aria-label={`Expand ${title} column`}
												className={HEADER_CONTROL_ON_REVEAL}
												onClick={handleToggleCollapsed}
												size="icon-compact"
												type="button"
												variant="ghost"
											/>
										}
									>
										<Icon className="text-icon-subtle" render={<GrowHorizontalIcon label="" />} />
									</TooltipTrigger>
									<TooltipContent>Expand</TooltipContent>
								</Tooltip>
							</TooltipProvider>
						</div>
					) : (
						<>
							<span className="truncate text-xs font-medium leading-4 text-text-subtle">
								{displayTitle}
							</span>
							<span className="shrink-0 text-xs font-normal text-text-subtlest">
								{sessionCount}
							</span>
							<div className={HEADER_ACTIONS_REVEAL}>
								<AgentSessionColumnOverflowMenu
									capturedItemIds={sessionProps.capturedItemIds}
									getSuggestedWorkItemKey={sessionProps.getSuggestedWorkItemKey}
									getSuggestedWorkItemKeys={sessionProps.getSuggestedWorkItemKeys}
									items={viewItems}
									onLinkWorkItem={sessionProps.onLinkWorkItem}
									title={title}
								/>
								<TooltipProvider>
									<Tooltip>
										<TooltipTrigger
											render={
												<Button
													aria-label={`Collapse ${title} column`}
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
						</>
					)}
				</div>
			) : null}

			<div className={collapsed ? AGENT_SESSION_PLANE : AGENT_SESSION_WELL}>
				{collapsed ? (
					<AgentSessionColumnRail
						arrivingItemIds={arrivingItemIds}
						capturedItemIds={sessionProps.capturedItemIds}
						getSuggestedWorkItemKey={sessionProps.getSuggestedWorkItemKey}
						getSuggestedWorkItemKeys={sessionProps.getSuggestedWorkItemKeys}
						highlightedItemId={sessionProps.highlightedItemId}
						items={visibleItems}
						newItemIds={newItemIds}
						onCreateWorkItem={sessionProps.onCreateWorkItem}
						onItemHover={sessionProps.onItemHover}
						onLinkWorkItem={sessionProps.onLinkWorkItem}
						onSubtasks={sessionProps.onSubtasks}
						onView={handleNotchView}
						sessionDrag={sessionProps.sessionDrag}
					/>
				) : (
					<>
						<div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
							{viewItems.length === 0 ? (
								<p className="text-xs text-text-subtlest">{emptyLabel}</p>
							) : (
								<div
									ref={listRef}
									className="min-h-0 min-w-0 flex-1 overflow-y-auto has-[:focus-visible]:overflow-visible"
								>
									<AgentSession
										arrivingItemIds={arrivingItemIds}
										className={cn(AGENT_SESSION_WELL_LIST, listClassName)}
										items={viewItems}
										newItemIds={newItemIds}
										{...sessionProps}
										onSelectedItemIdChange={handleSelectedItemIdChange}
										onToggleVisibility={handleToggleVisibility}
										selectedItemId={selectedItemId}
										visibilityLabel={view === "hidden" ? "Show" : "Hide"}
									/>
								</div>
							)}
							{showTopScrollMask || showBottomScrollMask ? (
								<div
									aria-hidden="true"
									className="pointer-events-none absolute inset-0"
								>
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
							) : null}
						</div>
						{showWellFooter ? (
							<AgentSessionColumnHiddenFooter
								count={view === "hidden" ? untrackedCount : hiddenCount}
								mode={view === "hidden" ? "back" : "hidden"}
								onClick={view === "hidden" ? closeHiddenView : openHiddenView}
								title={title}
							/>
						) : null}
					</>
				)}
			</div>
		</section>
	);
}

export { AgentSessionColumnRail } from "./agent-session-column-rail";
export type { AgentSessionColumnProps } from "./agent-session-column-types";
