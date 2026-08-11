"use client";

import type { JiraActivityEventEntry } from "@/components/blocks/jira-activity";
import type { MetadataRailView } from "@/components/blocks/jira-work-item/experimental-v2/lib/metadata-rail-view";
import {
	resolvePullRequestDetailData,
	type PullRequestReviewer,
} from "@/components/blocks/jira-work-item/experimental-v2/lib/pull-request-detail-data";
import { applyCurrentReviewerStatus } from "@/components/blocks/jira-work-item/experimental-v2/lib/pull-request-review-submit";

import { PullRequestActivityPanel } from "./pull-request-activity-panel";
import { PullRequestDetailsRail } from "./pull-request-details-rail";

/**
 * Dynamically loaded PR rail body. Both views remain mounted so local Activity
 * ordering survives tab changes; inactive controls are hidden and inert.
 */
export function PullRequestContextRail({
	activePanelView,
	currentReviewerStatus,
	entry,
	onFixCheck,
}: Readonly<{
	activePanelView: MetadataRailView;
	currentReviewerStatus?: PullRequestReviewer["status"];
	entry: JiraActivityEventEntry;
	onFixCheck?: () => void;
}>) {
	const resolved = resolvePullRequestDetailData(entry);
	const data = resolved
		? {
			...resolved,
			reviewers: applyCurrentReviewerStatus(resolved.reviewers, currentReviewerStatus),
		}
		: null;

	if (!data) {
		return (
			<div className="px-3 text-sm text-text-subtle" data-jira-work-item-pull-request-rail-unavailable>
				Pull request details are unavailable.
			</div>
		);
	}

	return (
		<div data-jira-work-item-pull-request-context-rail>
			<div
				hidden={activePanelView !== "details"}
				inert={activePanelView !== "details" ? true : undefined}
			>
				<PullRequestDetailsRail data={data} onFixCheck={onFixCheck} />
			</div>
			<div
				hidden={activePanelView !== "activity"}
				inert={activePanelView !== "activity" ? true : undefined}
			>
				<PullRequestActivityPanel activity={data.activity} />
			</div>
		</div>
	);
}
