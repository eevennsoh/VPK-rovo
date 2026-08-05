"use client";

import { Fragment } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuShortcut,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ChevronRightIcon from "@atlaskit/icon/core/chevron-right";
import ShowMoreHorizontalIcon from "@atlaskit/icon/core/show-more-horizontal";

type OverflowMenuEntry = Readonly<{
	label: string;
	/** Single-key Jira accelerator, rendered as a trailing keycap. */
	shortcut?: string;
	/** Trailing count, used for the watcher tally moved out of the header. */
	count?: number;
	/**
	 * Shows the trailing "has more" chevron without wiring up a flyout. Keeps the
	 * Jira affordance visible for rows whose nested surface is not built yet.
	 */
	chevron?: boolean;
	/** Nested destinations. Presence turns the row into a submenu trigger. */
	submenu?: readonly string[];
}>;

/**
 * Work-item overflow actions, grouped the way Jira renders them. Each inner
 * array is one visually separated group, so the dividers are derived from the
 * group boundaries and can never drift out of sync with the rows.
 *
 * The first group holds the restriction, watcher, and share actions that used
 * to sit as icon buttons in the header row; folding them in here keeps the
 * breadcrumb row down to the overflow, collapse, and close controls.
 */
const OVERFLOW_MENU_GROUPS: readonly (readonly OverflowMenuEntry[])[] = [
	[{ label: "Permission" }, { label: "Watch", count: 1 }, { label: "Share" }],
	[{ label: "Give feedback" }],
	[
		{ label: "Log work", shortcut: "Q" },
		{ label: "Add flag" },
		{ label: "Stop watching", shortcut: "W" },
		{ label: "Add vote" },
		{ label: "Select cover", chevron: true },
	],
	[{ label: "Classify work item" }],
	[{ label: "Clone" }, { label: "Move" }, { label: "Add parent" }],
	[{ label: "Connect Slack channel" }],
	[{ label: "Print" }, { label: "Export to", submenu: ["Excel", "Word", "XML"] }],
];

/** Trailing slot for a row: a keycap, a count badge, a chevron, or nothing. */
function overflowMenuItemElemAfter(entry: OverflowMenuEntry) {
	if (entry.shortcut) {
		return <DropdownMenuShortcut>{entry.shortcut}</DropdownMenuShortcut>;
	}

	if (entry.count !== undefined) {
		return <Badge>{entry.count}</Badge>;
	}

	return entry.chevron ? <ChevronRightIcon label="" size="small" /> : undefined;
}

/**
 * Overflow ("…") menu for the experimental v2 work-item header. The dialog
 * paints at z-[500]/[501], so the positioners are lifted above it the same way
 * the Open in menu does — otherwise the popup mounts behind the modal surface.
 */
export function ExperimentalHeaderOverflowMenu() {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<Button aria-label="Actions" size="icon" variant="ghost">
						<ShowMoreHorizontalIcon label="" />
					</Button>
				}
			/>
			{/*
			 * The shared popup caps itself at 328px, which would hide roughly a
			 * third of these rows behind a scroll. This menu is a flat list of
			 * work-item actions, so it opens to its full height and only falls
			 * back to scrolling when the viewport itself is the constraint.
			 */}
			<DropdownMenuContent
				align="end"
				className="max-h-[var(--available-height)]"
				positionerClassName="z-[502]"
			>
				{OVERFLOW_MENU_GROUPS.map((group, groupIndex) => (
					<Fragment key={group[0].label}>
						{groupIndex > 0 ? <DropdownMenuSeparator /> : null}
						<DropdownMenuGroup>
							{group.map((entry) =>
								entry.submenu ? (
									<DropdownMenuSub key={entry.label}>
										<DropdownMenuSubTrigger>{entry.label}</DropdownMenuSubTrigger>
										<DropdownMenuSubContent positionerClassName="z-[503]">
											{entry.submenu.map((option) => (
												<DropdownMenuItem key={option}>{option}</DropdownMenuItem>
											))}
										</DropdownMenuSubContent>
									</DropdownMenuSub>
								) : (
									<DropdownMenuItem key={entry.label} elemAfter={overflowMenuItemElemAfter(entry)}>
										{entry.label}
									</DropdownMenuItem>
								),
							)}
						</DropdownMenuGroup>
					</Fragment>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
