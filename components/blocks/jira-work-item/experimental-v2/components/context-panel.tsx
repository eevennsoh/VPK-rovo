"use client";

import type { EditorToolbarViewMode } from "@/components/blocks/editor-toolbar";
import type { JiraActivityEventEntry } from "@/components/blocks/jira-activity";
import { ContextEditableDescription } from "@/components/blocks/jira-work-item/experimental-v2/components/context-editable-header";
import { AiPlannerPanel, AiPlannerScope } from "@/components/blocks/jira-work-item/experimental-v2/components/ai-planner-panel";
import { ContextResources } from "@/components/blocks/jira-work-item/experimental-v2/components/context-resources";
import type { CodingAgentId } from "@/components/blocks/jira-work-item/experimental-v2/components/context-title-actions";
import { PullRequestDetailView } from "@/components/blocks/jira-work-item/experimental-v2/components/pull-request-detail/pull-request-detail-view";
import {
	ContextTitleBar,
	WorkItemKeyCopy,
} from "@/components/blocks/jira-work-item/experimental-v2/components/context-title-bar";

/**
 * Full-width heading for the experimental work item. The title and action row
 * sit above the description/details grid so neither shares a row with metadata.
 */
export function ContextHeader({
	descriptionViewMode,
	outputs,
	primaryCodingAgentId,
	pullRequestSelected,
	onDescriptionViewModeChange,
}: Readonly<{
	descriptionViewMode: EditorToolbarViewMode;
	outputs?: readonly string[];
	primaryCodingAgentId?: CodingAgentId;
	pullRequestSelected: boolean;
	onDescriptionViewModeChange: (mode: EditorToolbarViewMode) => void;
}>) {
	return (
		<header className="flex min-w-0 flex-col gap-4" data-jira-work-item-context-header>
			<div className="flex min-w-0 flex-col items-start gap-1" data-jira-work-item-title-block>
				<WorkItemKeyCopy />
				<ContextTitleBar />
			</div>
			<div className="flex min-w-0 flex-col" data-jira-work-item-header-actions>
				<ContextResources
					descriptionViewMode={descriptionViewMode}
					outputs={outputs}
					primaryCodingAgentId={primaryCodingAgentId}
					pullRequestSelected={pullRequestSelected}
					onDescriptionViewModeChange={onDescriptionViewModeChange}
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
	return (
		<section aria-label="Work item context" className="flex flex-col">
			{selectedPullRequestEntry ? (
				<PullRequestDetailView entry={selectedPullRequestEntry} onBack={onPullRequestBack} />
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
