"use client";

import dynamic from "next/dynamic";
import type { RefObject } from "react";

import type { EditorToolbarViewMode } from "@/components/blocks/editor-toolbar";
import type { JiraActivityEventEntry } from "@/components/blocks/jira-activity";
import { ContextEditableDescription } from "@/components/blocks/jira-work-item/experimental-v2/components/context-editable-header";
import { AiPlannerPanel, AiPlannerScope } from "@/components/blocks/jira-work-item/experimental-v2/components/ai-planner-panel";
import { ContextResources } from "@/components/blocks/jira-work-item/experimental-v2/components/context-resources";
import type { CodingAgentId } from "@/components/blocks/jira-work-item/experimental-v2/components/context-title-actions";
import { getPullRequestIdentity } from "@/components/blocks/jira-work-item/experimental-v2/lib/jira-activity-adapter";

const PullRequestDetailView = dynamic(
	() => import("@/components/blocks/jira-work-item/experimental-v2/components/pull-request-detail/pull-request-detail-view")
		.then((module) => module.PullRequestDetailView),
);

/**
 * Left-column anchor chrome (sibling above the description scrollport). The
 * editable title lives in the dialog header band with breadcrumbs; this header
 * owns the ContextResources row (`+` / Open in Claude / pull-requests Select /
 * description toolbar). Title meta also hosts a multi-metric PR Tag. Mirrors
 * MetadataRailToggle on the right column.
 */
export function ContextHeader({
	descriptionViewMode,
	outputs,
	primaryCodingAgentId,
	pullRequestEntries,
	pullRequestSelected,
	selectedPullRequestIdentity,
	onDescriptionViewModeChange,
	onPullRequestSelect,
	onPullRequestClear,
}: Readonly<{
	descriptionViewMode: EditorToolbarViewMode;
	outputs?: readonly string[];
	primaryCodingAgentId?: CodingAgentId;
	pullRequestEntries: readonly JiraActivityEventEntry[];
	pullRequestSelected: boolean;
	selectedPullRequestIdentity: string | null;
	onDescriptionViewModeChange: (mode: EditorToolbarViewMode) => void;
	onPullRequestSelect: (entry: JiraActivityEventEntry) => void;
	onPullRequestClear: () => void;
}>) {
	return (
		<header className="shrink-0" data-jira-work-item-context-header>
			<div data-jira-work-item-header-actions>
				<ContextResources
					descriptionViewMode={descriptionViewMode}
					outputs={outputs}
					primaryCodingAgentId={primaryCodingAgentId}
					pullRequestEntries={pullRequestEntries}
					pullRequestSelected={pullRequestSelected}
					selectedPullRequestIdentity={selectedPullRequestIdentity}
					onDescriptionViewModeChange={onDescriptionViewModeChange}
					onPullRequestClear={onPullRequestClear}
					onPullRequestSelect={onPullRequestSelect}
				/>
			</div>
		</header>
	);
}

/**
 * Description section of the experimental work item. While a plan awaits confirmation,
 * a one-shot highlighted scope and
 * elevated floating prompt connect the refinement controls to the fields Rovo
 * populated.
 */
export function ContextPanel({
	descriptionViewMode,
	onPullRequestApprove,
	pullRequestApprovalState,
	scrollContainerRef,
	selectedPullRequestEntry,
	onDescriptionViewModeChange,
}: Readonly<{
	descriptionViewMode: EditorToolbarViewMode;
	onPullRequestApprove?: (identity: string) => void;
	pullRequestApprovalState?: "available" | "approved";
	scrollContainerRef: RefObject<HTMLElement | null>;
	selectedPullRequestEntry: JiraActivityEventEntry | null;
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
					key={selectedPullRequestKey}
					onApprove={onPullRequestApprove}
					scrollContainerRef={scrollContainerRef}
				/>
			) : (
				<AiPlannerScope header={<AiPlannerPanel />}>
					<ContextEditableDescription
						viewMode={descriptionViewMode}
						onViewModeChange={onDescriptionViewModeChange}
					/>
				</AiPlannerScope>
			)}
		</section>
	);
}
