"use client";

import dynamic from "next/dynamic";

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
	{
		loading: () => (
			<div
				className="grid min-h-48 place-items-center p-6 text-sm text-text-subtle"
				data-jira-work-item-pull-request-detail-loading
				role="status"
			>
				Loading pull request details…
			</div>
		),
	},
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
	selectedPullRequestEntry,
	onDescriptionViewModeChange,
	onPullRequestBack,
}: Readonly<{
	descriptionViewMode: EditorToolbarViewMode;
	selectedPullRequestEntry: JiraActivityEventEntry | null;
	onDescriptionViewModeChange: (mode: EditorToolbarViewMode) => void;
	onPullRequestBack: () => void;
}>) {
	const selectedPullRequestKey = selectedPullRequestEntry?.pullRequest
		? getPullRequestIdentity(selectedPullRequestEntry.pullRequest)
		: selectedPullRequestEntry?.id;

	return (
		<section aria-label="Work item context" className="flex flex-col">
			{selectedPullRequestEntry ? (
				<PullRequestDetailView
					entry={selectedPullRequestEntry}
					key={selectedPullRequestKey}
					onBack={onPullRequestBack}
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
