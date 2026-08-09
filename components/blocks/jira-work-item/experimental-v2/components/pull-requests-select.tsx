"use client";

import { useMemo } from "react";

import PullRequestIcon from "@atlaskit/icon/core/pull-request";

import type { JiraActivityEventEntry } from "@/components/blocks/jira-activity";
import { toPanelPullRequestProps } from "@/components/blocks/jira-work-item/experimental-v2/components/pull-requests-panel";
import {
	getPullRequestIdentity,
	JIRA_WORK_ITEM_CURRENT_USER,
} from "@/components/blocks/jira-work-item/experimental-v2/lib/jira-activity-adapter";
import {
	DEFAULT_PULL_REQUEST_SORT_MODE,
	sortPullRequestEntries,
} from "@/components/blocks/jira-work-item/experimental-v2/lib/pull-request-phases";
import { PullRequest } from "@/components/blocks/pull-request";
import { Icon } from "@/components/ui/icon";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Tag } from "@/components/ui/tag";

const TRIGGER_LABEL = "Review pull request";

/**
 * ContextResources Select for pull requests. Trigger label stays generic;
 * each option is a Pull Request block card. The active filter is a removable
 * Tag beside the control. Selecting an option opens PR detail in the
 * description column.
 */
export function PullRequestsSelect({
	entries,
	selectedIdentity,
	onSelectEntry,
	onClearSelection,
}: Readonly<{
	entries: readonly JiraActivityEventEntry[];
	selectedIdentity: string | null;
	onSelectEntry: (entry: JiraActivityEventEntry) => void;
	onClearSelection: () => void;
}>) {
	const orderedEntries = useMemo(
		() => sortPullRequestEntries(entries, DEFAULT_PULL_REQUEST_SORT_MODE, JIRA_WORK_ITEM_CURRENT_USER.name),
		[entries],
	);

	if (orderedEntries.length === 0) {
		return null;
	}

	const selectedEntry = orderedEntries.find((entry) => (
		entry.pullRequest
		&& getPullRequestIdentity(entry.pullRequest) === selectedIdentity
	)) ?? null;
	const selectedNumber = selectedEntry?.pullRequest?.number;
	const selectedTagLabel = typeof selectedNumber === "number" ? `#${selectedNumber}` : null;

	return (
		<div
			className="inline-flex min-w-0 flex-wrap items-center gap-2"
			data-jira-work-item-resource-pull-requests-control
		>
			<Select
				value={selectedIdentity}
				onValueChange={(nextIdentity) => {
					if (typeof nextIdentity !== "string" || nextIdentity.length === 0) {
						return;
					}
					const entry = orderedEntries.find((candidate) => (
						candidate.pullRequest
						&& getPullRequestIdentity(candidate.pullRequest) === nextIdentity
					));
					if (entry) {
						onSelectEntry(entry);
					}
				}}
			>
				<SelectTrigger
					aria-label={TRIGGER_LABEL}
					data-jira-work-item-resource-pull-requests
				>
					<span
						aria-hidden
						className="inline-flex size-4 shrink-0 items-center justify-center"
						data-icon="inline-start"
					>
						<Icon render={<PullRequestIcon label="" size="small" />} />
					</span>
					<SelectValue>{() => TRIGGER_LABEL}</SelectValue>
				</SelectTrigger>
				<SelectContent
					align="start"
					alignItemWithTrigger={false}
					aria-label="Pull requests"
					className="w-[min(28rem,var(--available-width))] max-w-[var(--available-width)] p-2"
					data-jira-work-item-resource-pull-requests-menu
					positionerClassName="z-[502]"
				>
					<SelectGroup className="flex flex-col gap-2">
						{orderedEntries.map((entry) => {
							const pullRequest = entry.pullRequest;
							const item = toPanelPullRequestProps(entry);
							if (!pullRequest || !item) return null;
							const identity = getPullRequestIdentity(pullRequest);
							const selected = identity === selectedIdentity;
							return (
								<SelectItem
									key={identity}
									className="h-auto min-h-0 items-start gap-2 p-1 pr-8 data-selected:bg-transparent data-selected:data-highlighted:bg-bg-neutral-subtle-hovered data-selected:active:bg-bg-neutral-subtle-pressed [&>[data-slot=select-item-indicator]]:top-3"
									data-jira-work-item-pull-request-card={pullRequest.number}
									data-jira-work-item-pull-request-identity={identity}
									data-selected={selected ? "true" : undefined}
									textClassName="w-full min-w-0 whitespace-normal"
									value={identity}
								>
									{/*
									 * Display-only card (no onActivate): SelectItem owns
									 * activation so we avoid nested interactive controls.
									 */}
									<PullRequest
										{...item}
										className="min-w-0 max-w-full w-full"
										selected={selected}
									/>
								</SelectItem>
							);
						})}
					</SelectGroup>
				</SelectContent>
			</Select>
			{selectedTagLabel ? (
				<Tag
					data-jira-work-item-resource-pull-request-filter
					removeButtonLabel="Remove"
					onRemove={onClearSelection}
				>
					{selectedTagLabel}
				</Tag>
			) : null}
		</div>
	);
}
