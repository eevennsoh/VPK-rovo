"use client";

import type { ReactNode } from "react";

import { AiPlannerPanel, AiPlannerScope } from "@/components/blocks/jira-work-item/experimental-v6/components/ai-planner-panel";
import { ContextEditableDescription } from "@/components/blocks/jira-work-item/experimental-v6/components/context-editable-header";
import { WorkItemSection } from "@/components/blocks/jira-work-item/experimental-v6/components/work-item-section";
import { useJiraWorkItemMeta } from "@/components/blocks/jira-work-item/experimental-v6/context-jira-work-item";
import { usePublishSections } from "@/components/blocks/jira-work-item/experimental-v6/context-section-navigation";
import { buildWorkItemSectionTabs } from "@/components/blocks/jira-work-item/experimental-v6/lib/work-item-section-tabs";

/** Module constant: the work item's tab list never varies. */
const WORK_ITEM_SECTION_TABS = buildWorkItemSectionTabs({ guidedReview: null });

/**
 * Work-item body as one continuous scroll: description then activity.
 * Insights sits beside this body in `ContextPanel`, not as a stacked section.
 *
 * The activity slot arrives pre-wrapped in its own `WorkItemSection` because
 * the panel owns the filter/sort state that its heading row renders.
 */
export function WorkItemBody({
	activity,
}: Readonly<{
	activity: ReactNode;
}>) {
	const { initialPreset } = useJiraWorkItemMeta();
	usePublishSections(WORK_ITEM_SECTION_TABS);

	return (
		<div className="flex min-w-0 flex-col gap-4">
			{initialPreset === "blank" || initialPreset === "empty" ? (
				<WorkItemSection id="description" label="Description">
					<AiPlannerScope header={<AiPlannerPanel />}>
						<ContextEditableDescription />
					</AiPlannerScope>
				</WorkItemSection>
			) : null}
			{activity}
		</div>
	);
}
