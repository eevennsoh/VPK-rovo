"use client";

import PullRequestIcon from "@atlaskit/icon/core/pull-request";

import type { JiraActivityEventEntry } from "@/components/blocks/jira-activity";
import {
	PersonLabel,
	StatusPill,
} from "@/components/blocks/jira-work-item/experimental-v2/components/detail-field-editors";
import { summarizePullRequestTagMetrics } from "@/components/blocks/jira-work-item/experimental-v2/lib/pull-request-phases";
import {
	useJiraWorkItemActions,
	useJiraWorkItemState,
} from "@/components/blocks/jira-work-item/experimental-v2/context-jira-work-item";
import { Icon } from "@/components/ui/icon";
import { Tag } from "@/components/ui/tag";

/**
 * Status + read-only PR Tag + Reported by under the editable title. Single
 * horizontal row: status pill, optional multi-metric Pull requests Tag
 * (display only — the interactive dropdown lives in ContextResources), and
 * inline "Reported by {name}" — wired to the same metadata draft as DetailsTab.
 */
export function ContextTitleMeta({
	pullRequestEntries = [],
}: Readonly<{
	pullRequestEntries?: readonly JiraActivityEventEntry[];
}>) {
	const { metadata } = useJiraWorkItemState();
	const actions = useJiraWorkItemActions();
	const trailingMetric = pullRequestEntries.length > 0
		? summarizePullRequestTagMetrics(pullRequestEntries)
		: [];
	const pullRequestsAriaLabel = trailingMetric.length > 0
		? `Pull requests. ${trailingMetric.map((metric) => (
			typeof metric === "object" ? metric.value : metric
		)).join(", ")}`
		: `Pull requests, ${pullRequestEntries.length}`;

	return (
		<div
			className="mt-2 flex items-center gap-4"
			data-jira-work-item-title-meta
		>
			<StatusPill
				onChange={(next) => actions.updateMetadata({ status: next })}
				value={metadata.status}
			/>
			{pullRequestEntries.length > 0 ? (
				<Tag
					aria-label={pullRequestsAriaLabel}
					data-jira-work-item-title-pull-requests
					role="group"
					elemBefore={
						<Icon
							aria-hidden
							render={<PullRequestIcon label="" size="small" />}
						/>
					}
					maxWidth="none"
					trailingMetric={trailingMetric}
				>
					Pull requests
				</Tag>
			) : null}
			{metadata.reporter ? (
				<PersonLabel
					person={metadata.reporter}
					prefix="Reported by"
					size="xs"
				/>
			) : (
				<span className="text-xs text-text-subtle">
					Reported by{" "}
					<span className="text-text-subtlest">Unassigned</span>
				</span>
			)}
		</div>
	);
}
