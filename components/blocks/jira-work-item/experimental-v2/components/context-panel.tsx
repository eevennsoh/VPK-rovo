"use client";

import type { EditorToolbarViewMode } from "@/components/blocks/editor-toolbar";
import { JiraActivityEvent } from "@/components/blocks/jira-activity/jira-activity-event";
import { SESSION_EPOCH_MS } from "@/components/blocks/jira-work-item/data/session-fixtures";
import { ContextEditableDescription } from "@/components/blocks/jira-work-item/experimental-v2/components/context-editable-header";
import { AiPlannerPanel, AiPlannerScope } from "@/components/blocks/jira-work-item/experimental-v2/components/ai-planner-panel";
import { ContextResources } from "@/components/blocks/jira-work-item/experimental-v2/components/context-resources";
import type { CodingAgentId } from "@/components/blocks/jira-work-item/experimental-v2/components/context-title-actions";
import { ContextTitleBar, WorkItemKeyCopy } from "@/components/blocks/jira-work-item/experimental-v2/components/context-title-bar";
import { useJiraWorkItem } from "@/components/blocks/jira-work-item/experimental-v2/context-jira-work-item";
import { selectLatestPullRequestEntry } from "@/components/blocks/jira-work-item/experimental-v2/lib/jira-activity-adapter";

/**
 * Full-width heading for the experimental work item. The title and action row
 * sit above the description/details grid so neither shares a row with metadata.
 */
export function ContextHeader({
	descriptionViewMode,
	outputs,
	primaryCodingAgentId,
	onDescriptionViewModeChange,
}: Readonly<{
	descriptionViewMode: EditorToolbarViewMode;
	outputs?: readonly string[];
	primaryCodingAgentId?: CodingAgentId;
	onDescriptionViewModeChange: (mode: EditorToolbarViewMode) => void;
}>) {
	const { state, meta } = useJiraWorkItem();
	const latestPullRequestEntry = selectLatestPullRequestEntry(
		meta.activityEvents,
		SESSION_EPOCH_MS + state.elapsedMs,
	);

	return (
		<header className="flex min-w-0 flex-col gap-4" data-jira-work-item-context-header>
			<div className="flex min-w-0 flex-col items-start gap-1" data-jira-work-item-title-block>
				<WorkItemKeyCopy />
				<ContextTitleBar />
				{latestPullRequestEntry ? (
					<div
						className="min-w-0 @[860px]/agentlayout:mr-[var(--metadata-panel-offset)]"
						data-jira-work-item-header-pull-request
					>
						<JiraActivityEvent entry={latestPullRequestEntry} />
					</div>
				) : null}
			</div>
			<div className="flex min-w-0 flex-col" data-jira-work-item-header-actions>
				<ContextResources
					descriptionViewMode={descriptionViewMode}
					outputs={outputs}
					primaryCodingAgentId={primaryCodingAgentId}
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
	onDescriptionViewModeChange,
}: Readonly<{
	descriptionViewMode: EditorToolbarViewMode;
	onDescriptionViewModeChange: (mode: EditorToolbarViewMode) => void;
}>) {
	return (
		<section aria-label="Work item context" className="flex flex-col">
			<AiPlannerScope header={<AiPlannerPanel />}>
				<ContextEditableDescription
					viewMode={descriptionViewMode}
					onViewModeChange={onDescriptionViewModeChange}
				/>
			</AiPlannerScope>
		</section>
	);
}
