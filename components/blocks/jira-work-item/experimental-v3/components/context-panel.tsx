"use client";

import dynamic from "next/dynamic";
import { useCallback, useLayoutEffect, type ReactNode, type RefObject } from "react";

import type { JiraActivityEventEntry } from "@/components/blocks/jira-activity";
import type { InlineReviewComment } from "@/components/blocks/code-review/lib/inline-comments";
import type { JiraInsightSource } from "@/components/blocks/jira-insights";
import { InsightsPanel } from "@/components/blocks/jira-work-item/experimental-v3/components/insights-panel";
import { WorkItemBody } from "@/components/blocks/jira-work-item/experimental-v3/components/work-item-body";
import { useJiraWorkItemActions } from "@/components/blocks/jira-work-item/experimental-v3/context-jira-work-item";
import { useMetadataRail } from "@/components/blocks/jira-work-item/experimental-v3/context-metadata-rail";
import { useSectionNavigation } from "@/components/blocks/jira-work-item/experimental-v3/context-section-navigation";
import { getPullRequestIdentity } from "@/components/blocks/jira-work-item/experimental-v3/lib/jira-activity-adapter";
import type { PullRequestActivity } from "@/components/blocks/jira-work-item/experimental-v3/lib/pull-request-detail-data";
import type { PullRequestHeaderSubmitReviewAction } from "@/components/blocks/pull-request-header";

const PullRequestDetailView = dynamic(
	() => import("@/components/blocks/jira-work-item/experimental-v3/components/pull-request-detail/pull-request-detail-view")
		.then((module) => module.PullRequestDetailView),
);

export function ContextPanel({
	activity,
	hasInsights,
	onOpenPullRequestIdentity,
	onPullRequestChapterReviewedChange,
	onPullRequestInlineCommentsChange,
	pullRequestApprovalState,
	pullRequestInlineComments,
	pullRequestReviewedChapterIds,
	scrollContainerRef,
	selectedPullRequestEntry,
	submittedReviewActivity,
	submitReviewAction,
}: Readonly<{
	/** Pre-wrapped in its own `WorkItemSection` by the activity panel. */
	activity: ReactNode;
	hasInsights: boolean;
	onOpenPullRequestIdentity?: (identity: string) => void;
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
}>) {
	const { clearInsights, insightsSelected, selectSection } = useSectionNavigation();
	const actions = useJiraWorkItemActions();
	const { requestRevealLatestActivity } = useMetadataRail();
	const selectedPullRequestKey = selectedPullRequestEntry?.pullRequest
		? getPullRequestIdentity(selectedPullRequestEntry.pullRequest)
		: selectedPullRequestEntry?.id;

	useLayoutEffect(() => {
		if (selectedPullRequestEntry) {
			clearInsights();
		}
	}, [clearInsights, selectedPullRequestEntry]);

	const handleInsightSourceSelect = useCallback((source: JiraInsightSource) => {
		if (source.kind === "work-item-section") {
			selectSection(source.sectionId);
			return;
		}
		if (source.kind === "activity-entry") {
			selectSection("activity");
			requestRevealLatestActivity(source.entryId);
			return;
		}
		if (source.kind === "agent-session") {
			actions.openSession(source.sessionId);
			return;
		}
		if (source.kind === "pull-request") {
			onOpenPullRequestIdentity?.(source.identity);
		}
	}, [actions, onOpenPullRequestIdentity, requestRevealLatestActivity, selectSection]);

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
			) : insightsSelected ? (
				<InsightsPanel hasInsights={hasInsights} onSourceSelect={handleInsightSourceSelect} />
			) : (
				<WorkItemBody activity={activity} />
			)}
		</section>
	);
}
