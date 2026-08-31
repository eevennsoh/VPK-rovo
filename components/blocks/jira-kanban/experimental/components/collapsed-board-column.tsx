"use client";

import GrowHorizontalIcon from "@atlaskit/icon/core/grow-horizontal";
import ShrinkHorizontalIcon from "@atlaskit/icon/core/shrink-horizontal";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { token } from "@/lib/tokens";
import { cn } from "@/lib/utils";

import { BOARD_COLUMN_ACTION_REVEAL } from "../lib/board-column-action-reveal";

const COLLAPSED_HEAD_COUNT_AT_REST = cn(
	"pointer-events-none absolute inset-0 flex items-center justify-center",
	"text-xs font-normal text-text-subtlest",
	"transition-opacity duration-normal ease-out-practical",
	"group-hover/collapsed-column:opacity-0 group-has-[:focus-visible]/collapsed-column:opacity-0",
	"motion-reduce:transition-none",
);

/**
 * Hover/focus revealed control that collapses a column into its pill, or grows
 * the pill back into a column.
 */
export function BoardColumnResizeButton({
	className,
	collapsed,
	onToggle,
	title,
}: Readonly<{
	className?: string;
	collapsed: boolean;
	onToggle: () => void;
	title: string;
}>) {
	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger
					render={
						<Button
							aria-label={collapsed ? `Expand ${title} column` : `Collapse ${title} column`}
							className={cn("shrink-0 [writing-mode:horizontal-tb]", className)}
							onClick={onToggle}
							size="icon-compact"
							type="button"
							variant="ghost"
						/>
					}
				>
					<Icon
						className="text-icon-subtle"
						render={
							collapsed
								? <GrowHorizontalIcon label="" />
								: <ShrinkHorizontalIcon label="" />
						}
					/>
				</TooltipTrigger>
				<TooltipContent>{collapsed ? "Expand" : "Collapse"}</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
}

/**
 * The collapsed form of a board column: the count stays in the same header
 * row the expanded column uses (`space.100` below, `text-xs` tally), and the
 * title reads top-to-bottom inside the pill under that header. A number
 * painted on the pill is in the wrong place — it would sit inside the
 * bordered container instead of on the board surface next to `To do` / the
 * session count.
 *
 * The pill hugs its content rather than running the column's full height. A
 * status is a label, and a label stretched down a 700px board reads as an empty
 * lane with a caption at the top. The shell around it still stretches, so the
 * drop target keeps the full height every other column has. The Agent Session
 * column is the deliberate exception — it collapses into a rail of per-session
 * notches, which is content, and content needs the height.
 *
 * No `overflow-hidden` on the pill: the title carries its own `truncate`, and
 * the expand control lives in the header above, where the shell still clips
 * for the width transition.
 */
export function CollapsedBoardColumn({
	count,
	onExpand,
	title,
}: Readonly<{ count: number; onExpand: () => void; title: string }>) {
	return (
		<div className="flex w-full flex-col">
			<div
				className="group/collapsed-column w-full"
				style={{ paddingBottom: token("space.100") }}
			>
				<div className="relative flex h-6 w-full items-center justify-center">
					<span className={COLLAPSED_HEAD_COUNT_AT_REST}>
						{count}
					</span>
					<BoardColumnResizeButton
						className={cn(
							BOARD_COLUMN_ACTION_REVEAL,
							"group-hover/collapsed-column:pointer-events-auto group-hover/collapsed-column:opacity-100",
							"group-has-[:focus-visible]/collapsed-column:pointer-events-auto group-has-[:focus-visible]/collapsed-column:opacity-100",
						)}
						collapsed
						onToggle={onExpand}
						title={title}
					/>
				</div>
			</div>
			<div
				className="flex w-full flex-col items-center justify-center border border-border-disabled"
				style={{
					borderRadius: token("radius.large"),
					paddingBlock: token("space.150"),
				}}
			>
				<span className="min-h-0 truncate text-xs font-medium leading-4 text-text-subtle [writing-mode:vertical-rl]">
					{title}
				</span>
			</div>
		</div>
	);
}
