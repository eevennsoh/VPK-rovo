"use client";

import dynamic from "next/dynamic";
import type { ReactNode, RefObject } from "react";

import type { EditorToolbarViewMode } from "@/components/blocks/editor-toolbar";
import type { JiraActivityEventEntry } from "@/components/blocks/jira-activity";
import type { InlineReviewComment } from "@/components/blocks/code-review/lib/inline-comments";
import { WorkItemBody } from "@/components/blocks/jira-work-item/experimental-v3/components/work-item-body";
import { getPullRequestIdentity } from "@/components/blocks/jira-work-item/experimental-v3/lib/jira-activity-adapter";
import type { PullRequestActivity } from "@/components/blocks/jira-work-item/experimental-v3/lib/pull-request-detail-data";
import type { PullRequestHeaderSubmitReviewAction } from "@/components/blocks/pull-request-header";

const PullRequestDetailView = dynamic(
	() => import("@/components/blocks/jira-work-item/experimental-v3/components/pull-request-detail/pull-request-detail-view")
		.then((module) => module.PullRequestDetailView),
);

/**
 * Body of the experimental work item: one continuous scroll flow whose sections
 * are the anchor targets for the section nav in the dialog header band.
 *
 * Selecting a pull request swaps the whole stack for the pull-request one,
 * which keeps the same leading Description and Activity sections and appends
 * Guide and Files when the review is guided. While a plan awaits confirmation,
 * a one-shot highlighted scope and elevated floating prompt connect the
 * refinement controls to the fields Rovo populated.
 */
export function ContextPanel({
	activity,
	descriptionViewMode,
	onPullRequestChapterReviewedChange,
	onPullRequestInlineCommentsChange,
	pullRequestApprovalState,
	pullRequestInlineComments,
	pullRequestReviewedChapterIds,
	scrollContainerRef,
	selectedPullRequestEntry,
	submittedReviewActivity,
	submitReviewAction,
	onDescriptionViewModeChange,
}: Readonly<{
	/** Pre-wrapped in its own `WorkItemSection` by the activity panel. */
	activity: ReactNode;
	descriptionViewMode: EditorToolbarViewMode;
	onPullRequestChapterReviewedChange?: (identity: string, chapterId: string, reviewed: boolean) => void;
	onPullRequestInlineCommentsChange?: (
		identity: string,
		comments: readonly InlineReviewComment[],
	) => void;
	pullRequestApprovalState?: "available" | "approved";
	pullRequestInlineComments?: readonly InlineReviewComment[];
	pullRequestReviewedChapterIds?: ReadonlySet<string>;
	scrollContainerRef: RefObject<HTMLElement | null>;
	selectedPullRequestEntry: JiraActivityEventEntry | null;
	/** Reviews submitted this session, appended to the pull request's feed. */
	submittedReviewActivity?: readonly PullRequestActivity[];
	submitReviewAction?: PullRequestHeaderSubmitReviewAction;
	onDescriptionViewModeChange: (mode: EditorToolbarViewMode) => void;
}>) {
	const selectedPullRequestKey = selectedPullRequestEntry?.pullRequest
		? getPullRequestIdentity(selectedPullRequestEntry.pullRequest)
		: selectedPullRequestEntry?.id;

	return (
		<section aria-label="Work item context" className="flex flex-col">
			{selectedPullRequestEntry ? (
				<PullRequestDetailView
					approvalState={pullRequestApprovalState}
					entry={selectedPullRequestEntry}
					initialInlineComments={pullRequestInlineComments}
					key={selectedPullRequestKey}
					onChapterReviewedChange={onPullRequestChapterReviewedChange}
					onInlineCommentsChange={onPullRequestInlineCommentsChange}
					reviewedChapterIds={pullRequestReviewedChapterIds}
					scrollContainerRef={scrollContainerRef}
					submittedReviewActivity={submittedReviewActivity}
					submitReviewAction={submitReviewAction}
				/>
			) : (
				<WorkItemBody
					activity={activity}
					viewMode={descriptionViewMode}
					onViewModeChange={onDescriptionViewModeChange}
				/>
			)}
		</section>
	);
}
