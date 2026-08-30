"use client";

import { useMemo, useState } from "react";
import { useReducedMotion } from "motion/react";

import ShrinkHorizontalIcon from "@atlaskit/icon/core/shrink-horizontal";

import { isCodingAgentListItem } from "@/components/blocks/agent-list";
import { AGENT_SESSION_ITEMS, AgentSession } from "@/components/blocks/agent-session";
import type { AgentSessionItem } from "@/components/blocks/agent-session";
import { useHasVerticalOverflow } from "@/components/hooks/use-has-vertical-overflow";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { buildScrollMaskStyle } from "@/components/visual/scroll-mask/lib";
import { token } from "@/lib/tokens";
import { cn } from "@/lib/utils";

import { AgentSessionColumnRail } from "./agent-session-column-rail";
import type { AgentSessionColumnProps } from "./agent-session-column-types";

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
 * The sunken plane that holds the sessions.
 *
 * It wraps only the list, never the header: the header has to sit on the board
 * surface at the same inset and baseline as `To do` and `In progress`, so the
 * five column titles read as one row. Filling behind the header instead would
 * push this title 8px in and 8px down from its neighbours and make the column
 * look like a panel docked beside the board rather than a column of it.
 */
const AGENT_SESSION_PLANE = "flex min-h-0 min-w-0 flex-1 flex-col bg-surface-sunken";

/**
 * A kanban column of agent sessions that never became work items.
 *
 * The board's status columns are unfilled — they read as regions of the board
 * surface. This one fills the area *below its header* with `surface-sunken`,
 * because its contents are not on the board yet: the sunken plane is what says
 * "outside the workflow" without needing a label to explain it. The header stays
 * outside that fill so it shares an inset and a baseline with the status column
 * titles. Everything below the header is the Agent Session block verbatim, so a
 * card's chin, captured state, and resume gating behave identically here and in
 * the standalone block.
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
	title = "Untracked work",
	...sessionProps
}: Readonly<AgentSessionColumnProps>) {
	const shouldReduceMotion = useReducedMotion();
	const [collapsed, setCollapsed] = useState(defaultCollapsed);
	// The rail and the card list have very different intrinsic widths, so the
	// overflow has to be clipped for the duration of the width transition. Any
	// longer and it would clip the 4px focus rings on the cards inside.
	const [isResizing, setIsResizing] = useState(false);
	const {
		ref: listRef,
		showBottomScrollMask,
		showTopScrollMask,
	} = useHasVerticalOverflow<HTMLDivElement>();
	const listStyle = useMemo(
		() => buildScrollMaskStyle({
			fadeBottom: showBottomScrollMask,
			fadeSize: "3rem",
			fadeTop: showTopScrollMask,
		}),
		[showBottomScrollMask, showTopScrollMask],
	);
	const sessionCount = count ?? items.length;
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
		setCollapsed(nextCollapsed);
		onCollapsedChange?.(nextCollapsed);
	};

	const handleTransitionEnd = (event: React.TransitionEvent<HTMLElement>) => {
		if (event.target === event.currentTarget && event.propertyName === "width") {
			setIsResizing(false);
		}
	};

	return (
		<section
			aria-label={`${title}, ${sessionCount} sessions`}
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
						padding: token("space.050"),
					}}
				>
					<AgentSessionColumnRail
						items={items}
						newItemIds={newItemIds}
						onExpand={handleToggleCollapsed}
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
						<span className="truncate text-xs font-medium leading-4 text-text-subtle">
							{title}
						</span>
						<span className="shrink-0 text-xs font-normal text-text-subtlest">
							{sessionCount}
						</span>
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger
									render={
										<Button
											aria-expanded
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
								<TooltipContent>Collapse column</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					</div>

					<div
						className={AGENT_SESSION_PLANE}
						style={{
							borderRadius: token("radius.xlarge"),
							padding: token("space.100"),
						}}
					>
						<div
							ref={listRef}
							className="-m-1 min-h-0 min-w-0 flex-1 overflow-y-auto p-1"
							style={listStyle}
						>
							{items.length === 0 ? (
								<p className="text-xs text-text-subtlest">{emptyLabel}</p>
							) : (
								<AgentSession className={listClassName} items={items} newItemIds={newItemIds} {...sessionProps} />
							)}
						</div>
					</div>
				</>
			)}
		</section>
	);
}

export { AgentSessionColumnRail } from "./agent-session-column-rail";
export type { AgentSessionColumnProps } from "./agent-session-column-types";
