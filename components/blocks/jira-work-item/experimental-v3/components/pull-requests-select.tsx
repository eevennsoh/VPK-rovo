"use client";

import { useMemo } from "react";

import type { JiraActivityEventEntry } from "@/components/blocks/jira-activity";
import { toPanelPullRequestProps } from "@/components/blocks/jira-work-item/experimental-v3/components/pull-requests-panel";
import { NAV_LINK_CLASS } from "@/components/blocks/jira-work-item/experimental-v3/components/work-item-section-nav";
import {
	getPullRequestIdentity,
	JIRA_WORK_ITEM_CURRENT_USER,
} from "@/components/blocks/jira-work-item/experimental-v3/lib/jira-activity-adapter";
import {
	DEFAULT_PULL_REQUEST_SORT_MODE,
	sortPullRequestEntries,
} from "@/components/blocks/jira-work-item/experimental-v3/lib/pull-request-phases";
import { PullRequest } from "@/components/blocks/pull-request";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const TRIGGER_LABEL = "Pull requests";

function findPullRequestEntry(
	entries: readonly JiraActivityEventEntry[],
	identity: string | null,
): JiraActivityEventEntry | null {
	if (!identity) {
		return null;
	}

	return entries.find((entry) => (
		entry.pullRequest
		&& getPullRequestIdentity(entry.pullRequest) === identity
	)) ?? null;
}

export function PullRequestsSelect({
	entries,
	selectedIdentity,
	onSelectEntry,
}: Readonly<{
	entries: readonly JiraActivityEventEntry[];
	selectedIdentity: string | null;
	onSelectEntry: (entry: JiraActivityEventEntry) => void;
}>) {
	const orderedEntries = useMemo(
		() => sortPullRequestEntries(entries, DEFAULT_PULL_REQUEST_SORT_MODE, JIRA_WORK_ITEM_CURRENT_USER.name),
		[entries],
	);
	const pullRequestCount = orderedEntries.length;

	if (pullRequestCount === 0) {
		return null;
	}

	const triggerAriaLabel = selectedIdentity
		? TRIGGER_LABEL
		: `${TRIGGER_LABEL}. ${pullRequestCount}`;

	return (
		<div
			className="inline-flex h-full min-w-0 items-stretch"
			data-jira-work-item-resource-pull-requests-control
		>
			<Select
				value={selectedIdentity}
				onValueChange={(nextIdentity) => {
					if (typeof nextIdentity !== "string" || nextIdentity.length === 0) {
						return;
					}
					const entry = findPullRequestEntry(orderedEntries, nextIdentity);
					if (entry) {
						onSelectEntry(entry);
					}
				}}
			>
				<SelectTrigger
					aria-current={selectedIdentity ? "location" : undefined}
					aria-label={triggerAriaLabel}
					className={cn(
						NAV_LINK_CLASS,
						"data-placeholder:text-text-subtle [&>:last-child]:hidden",
					)}
					data-jira-work-item-resource-pull-requests
					variant="none"
				>
					<SelectValue className="min-w-0">
						{() => (
							<>
								<span className="truncate">
									{TRIGGER_LABEL}
								</span>
								<span
									className={cn(
										selectedIdentity ? "text-text-selected" : "text-text-subtlest",
									)}
								>
									{pullRequestCount}
								</span>
							</>
						)}
					</SelectValue>
				</SelectTrigger>
				<SelectContent
					align="start"
					alignItemWithTrigger={false}
					aria-label="Pull requests"
					className="w-[min(28rem,var(--available-width))] max-w-[var(--available-width)] rounded-xl p-1"
					data-jira-work-item-resource-pull-requests-menu
					positionerClassName="z-[502]"
				>
					<SelectGroup className="flex flex-col gap-0.5">
						{orderedEntries.map((entry) => {
							const pullRequest = entry.pullRequest;
							const item = toPanelPullRequestProps(entry);
							if (!pullRequest || !item) return null;
							const identity = getPullRequestIdentity(pullRequest);
							return (
								<SelectItem
									key={identity}
									className="group/pr-option h-auto min-h-0 p-0 data-[highlighted]:bg-transparent data-selected:bg-transparent data-selected:data-highlighted:bg-transparent data-selected:data-[highlighted]:bg-transparent active:bg-transparent data-selected:active:bg-transparent"
									data-jira-work-item-pull-request-card={pullRequest.number}
									data-jira-work-item-pull-request-identity={identity}
									showIndicator={false}
									textClassName="w-full min-w-0 whitespace-normal"
									value={identity}
								>
									<PullRequest
										{...item}
										className="pointer-events-none min-w-0 max-w-full w-full rounded-lg border-transparent transition-[background-color] duration-normal ease-out-practical group-data-[highlighted]/pr-option:bg-surface-hovered"
									/>
								</SelectItem>
							);
						})}
					</SelectGroup>
				</SelectContent>
			</Select>
		</div>
	);
}
