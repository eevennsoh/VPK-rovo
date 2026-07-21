"use client";

import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";

import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

import type { JiraActivityFilter, JiraActivitySortOrder } from "./jira-activity-types";

// The sort control reads as newest/oldest to the user; the underlying order is
// still ascending (oldest first) / descending (newest first).
const SORT_LINK_LABELS: Record<JiraActivitySortOrder, string> = {
	ascending: "Show oldest first",
	descending: "Show latest first",
};

/**
 * Feed header: an activity count, a text-link sort control, and a full-width
 * rule. A chevron collapse button overlays the rule flush to its far-right end,
 * with six pixels of visual clearance on the left only. It reveals on section
 * hover and remains visible while the activity is collapsed.
 */
export function JiraActivityHeader({
	count,
	sortOrder,
	onSortOrderChange,
	filter,
	onFilterChange,
	collapsed,
	onCollapsedChange,
}: Readonly<{
	count: number;
	sortOrder: JiraActivitySortOrder;
	onSortOrderChange: (next: JiraActivitySortOrder) => void;
	filter: JiraActivityFilter;
	onFilterChange: (next: JiraActivityFilter) => void;
	collapsed: boolean;
	onCollapsedChange: (next: boolean) => void;
}>) {
	return (
		<div className="flex items-center gap-3">
			<div className="flex shrink-0 items-center gap-2 text-xs">
				<span className="font-semibold text-text-subtlest">
					{count} {count === 1 ? "Activity" : "Activities"}
				</span>
				<span aria-hidden className="text-text-subtlest">
					·
				</span>
				<DropdownMenu>
					<DropdownMenuTrigger
							render={
								<Button
									className="h-auto gap-1 border-0 bg-transparent px-0 text-xs font-normal text-text-subtlest [&_svg]:text-icon-subtlest hover:bg-transparent hover:text-text-subtlest hover:underline focus-visible:ring-0 aria-expanded:bg-transparent aria-expanded:text-text-subtlest aria-expanded:underline"
								size="compact"
								type="button"
								variant="ghost"
							/>
						}
					>
						{filter === "agents-only" ? "Show agents only" : SORT_LINK_LABELS[sortOrder]}
						<Icon aria-hidden render={<ChevronDownIcon label="" />} />
					</DropdownMenuTrigger>
					<DropdownMenuContent align="start" positionerClassName="z-[502]">
						<DropdownMenuRadioGroup
							onValueChange={(value) => {
								if (value === "agents-only") {
									onFilterChange("agents-only");
									return;
								}
								onFilterChange("all");
								onSortOrderChange(value as JiraActivitySortOrder);
							}}
							value={filter === "agents-only" ? filter : sortOrder}
						>
							<DropdownMenuRadioItem value="descending">
								Show latest first
							</DropdownMenuRadioItem>
							<DropdownMenuRadioItem value="ascending">
								Show oldest first
							</DropdownMenuRadioItem>
							<DropdownMenuRadioItem value="agents-only">
								Show agents only
							</DropdownMenuRadioItem>
						</DropdownMenuRadioGroup>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			{/* The button overlays one continuous separator without reserving a gap. */}
			<div className="relative h-6 min-w-2 flex-1">
				<div
					aria-hidden
					className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-border"
				/>
				<div
					className={cn(
						"invisible pointer-events-none absolute top-1/2 right-0 -translate-y-1/2 opacity-0 transition-opacity duration-fast ease-out-practical before:absolute before:inset-y-0 before:-inset-x-1.5 before:bg-surface before:content-[''] motion-reduce:transition-none",
						collapsed
							? "visible pointer-events-auto opacity-100"
							: "group-hover/jira-activity:visible group-hover/jira-activity:pointer-events-auto group-hover/jira-activity:opacity-100 group-focus-within/jira-activity:visible group-focus-within/jira-activity:pointer-events-auto group-focus-within/jira-activity:opacity-100",
					)}
				>
					<Button
						aria-expanded={!collapsed}
						aria-label={collapsed ? "Expand activity" : "Collapse activity"}
						className="relative z-10 bg-surface hover:bg-surface active:bg-surface aria-expanded:border-border aria-expanded:bg-surface aria-expanded:text-text-subtle aria-expanded:hover:bg-surface aria-expanded:active:bg-surface"
						onClick={() => onCollapsedChange(!collapsed)}
						size="icon-compact"
						type="button"
						variant="outline"
					>
						<Icon
							aria-hidden
							className={cn(
								"transition-transform duration-fast ease-out-practical motion-reduce:transition-none",
								collapsed && "rotate-180",
							)}
							render={<ChevronDownIcon label="" />}
						/>
					</Button>
				</div>
			</div>
		</div>
	);
}
