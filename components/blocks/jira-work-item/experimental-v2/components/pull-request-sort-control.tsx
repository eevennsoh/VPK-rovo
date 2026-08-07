"use client";

import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";

import type { PullRequestSortMode } from "@/components/blocks/jira-work-item/experimental-v2/lib/pull-request-phases";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/ui/icon";

/** Trigger keeps Activity's short "Show …" form; menu items drop the prefix. */
const SORT_TRIGGER_LABELS: Record<PullRequestSortMode, string> = {
	"by-me": "Show by me",
	"latest-activity": "Show latest activity",
	"newest-created": "Show newest created",
	"oldest-created": "Show oldest created",
	"largest-change": "Show largest change",
};

const SORT_MENU_LABELS: Record<PullRequestSortMode, string> = {
	"by-me": "By me",
	"latest-activity": "Latest activity",
	"newest-created": "Newest created",
	"oldest-created": "Oldest created",
	"largest-change": "Largest change",
};

const SORT_MENU_ORDER: readonly PullRequestSortMode[] = [
	"by-me",
	"latest-activity",
	"newest-created",
	"oldest-created",
	"largest-change",
];

/**
 * Text-link dropdown for Pull requests panel ordering. Same chrome as
 * `JiraActivityViewControl`, but a dedicated mode list so Activity's
 * Activity Latest/Oldest/Agents/Needs input/Comments control stays unchanged.
 */
export function PullRequestSortControl({
	sortMode,
	onSortModeChange,
	menuAlign = "start",
}: Readonly<{
	sortMode: PullRequestSortMode;
	onSortModeChange: (next: PullRequestSortMode) => void;
	/** Menu alignment relative to the trigger. Prefer `end` when the control sits on the far right. */
	menuAlign?: "start" | "end";
}>) {
	return (
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
				{SORT_TRIGGER_LABELS[sortMode]}
				<Icon aria-hidden render={<ChevronDownIcon label="" />} />
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align={menuAlign}
				className="w-auto min-w-0"
				positionerClassName="z-[502]"
			>
				<DropdownMenuRadioGroup
					onValueChange={(value) => {
						onSortModeChange(value as PullRequestSortMode);
					}}
					value={sortMode}
				>
					{SORT_MENU_ORDER.map((mode) => (
						<DropdownMenuRadioItem key={mode} value={mode}>
							{SORT_MENU_LABELS[mode]}
						</DropdownMenuRadioItem>
					))}
				</DropdownMenuRadioGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
