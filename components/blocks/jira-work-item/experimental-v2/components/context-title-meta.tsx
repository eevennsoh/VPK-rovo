"use client";

import PullRequestIcon from "@atlaskit/icon/core/pull-request";

import {
	PersonLabel,
	StatusPill,
} from "@/components/blocks/jira-work-item/experimental-v2/components/detail-field-editors";
import {
	useJiraWorkItemActions,
	useJiraWorkItemState,
} from "@/components/blocks/jira-work-item/experimental-v2/context-jira-work-item";
import { useMetadataRail } from "@/components/blocks/jira-work-item/experimental-v2/context-metadata-rail";
import { usePanelLayout } from "@/components/blocks/jira-work-item/experimental-v2/context-panel-layout";
import { Icon } from "@/components/ui/icon";
import { Tag } from "@/components/ui/tag";

/**
 * Status + PR count + Reported by under the editable title. Single horizontal
 * row: status pill, optional pull-request Tag (opens the metadata-rail PR
 * list), and inline "Reported by {name}" — wired to the same metadata draft as
 * DetailsTab.
 */
export function ContextTitleMeta() {
	const { metadata } = useJiraWorkItemState();
	const actions = useJiraWorkItemActions();
	const { pullRequestCount, setPanelView } = useMetadataRail();
	const { metadataCollapsed, toggleMetadata } = usePanelLayout();

	const openPullRequestsPanel = () => {
		if (metadataCollapsed) {
			toggleMetadata();
		}
		setPanelView("pull-requests");
	};

	return (
		<div
			className="mt-2 flex items-center gap-4"
			data-jira-work-item-title-meta
		>
			<StatusPill
				onChange={(next) => actions.updateMetadata({ status: next })}
				value={metadata.status}
			/>
			{pullRequestCount > 0 ? (
				<Tag
					data-jira-work-item-title-pull-requests
					elemBefore={
						<Icon
							aria-hidden
							render={<PullRequestIcon label="" size="small" />}
						/>
					}
					onClick={openPullRequestsPanel}
				>
					{`${pullRequestCount} ${pullRequestCount === 1 ? "Pull request" : "Pull requests"}`}
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
