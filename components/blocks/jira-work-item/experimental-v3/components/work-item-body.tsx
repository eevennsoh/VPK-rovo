"use client";

import type { ReactNode } from "react";

import type { EditorToolbarViewMode } from "@/components/blocks/editor-toolbar";
import { AiPlannerPanel, AiPlannerScope } from "@/components/blocks/jira-work-item/experimental-v3/components/ai-planner-panel";
import { ContextEditableDescription } from "@/components/blocks/jira-work-item/experimental-v3/components/context-editable-header";
import { WorkItemSection } from "@/components/blocks/jira-work-item/experimental-v3/components/work-item-section";
import { usePublishSections } from "@/components/blocks/jira-work-item/experimental-v3/context-section-navigation";
import { buildWorkItemSectionTabs } from "@/components/blocks/jira-work-item/experimental-v3/lib/work-item-section-tabs";

/** Module constant: the work item's tab list never varies. */
const WORK_ITEM_SECTION_TABS = buildWorkItemSectionTabs({ guidedReview: null });

/**
 * Work-item body as one continuous scroll: description then activity, both
 * anchor targets for the shared section nav.
 *
 * The activity slot arrives pre-wrapped in its own `WorkItemSection` because
 * the panel owns the filter/sort state that its heading row renders.
 */
export function WorkItemBody({
	activity,
	viewMode,
	onViewModeChange,
}: Readonly<{
	activity: ReactNode;
	viewMode: EditorToolbarViewMode;
	onViewModeChange: (mode: EditorToolbarViewMode) => void;
}>) {
	usePublishSections(WORK_ITEM_SECTION_TABS);

	return (
		<div className="flex min-w-0 flex-col gap-6">
			<WorkItemSection id="description" label="Description">
				<AiPlannerScope header={<AiPlannerPanel />}>
					<ContextEditableDescription
						viewMode={viewMode}
						onViewModeChange={onViewModeChange}
					/>
				</AiPlannerScope>
			</WorkItemSection>
			{activity}
		</div>
	);
}
