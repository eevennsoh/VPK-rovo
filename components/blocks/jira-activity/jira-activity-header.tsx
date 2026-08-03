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

import type { JiraActivityFilter, JiraActivitySortOrder } from "./jira-activity-types";

// The sort control reads as newest/oldest to the user; the underlying order is
// still ascending (oldest first) / descending (newest first).
const SORT_LINK_LABELS: Record<JiraActivitySortOrder, string> = {
	ascending: "Show oldest first",
	descending: "Show latest first",
};

/**
 * Feed header with an activity count and text-link sort control.
 */
export function JiraActivityHeader({
	count,
	sortOrder,
	onSortOrderChange,
	filter,
	onFilterChange,
}: Readonly<{
	count: number;
	sortOrder: JiraActivitySortOrder;
	onSortOrderChange: (next: JiraActivitySortOrder) => void;
	filter: JiraActivityFilter;
	onFilterChange: (next: JiraActivityFilter) => void;
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
		</div>
	);
}
