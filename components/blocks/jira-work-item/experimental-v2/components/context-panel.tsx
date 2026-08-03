"use client";

import { useState } from "react";

import type { EditorToolbarViewMode } from "@/components/blocks/editor-toolbar";
import { ContextEditableDescription } from "@/components/blocks/jira-work-item/experimental-v2/components/context-editable-header";
import { AiPlannerPanel, AiPlannerScope } from "@/components/blocks/jira-work-item/experimental-v2/components/ai-planner-panel";
import { ContextResources } from "@/components/blocks/jira-work-item/experimental-v2/components/context-resources";
import type { CodingAgentId } from "@/components/blocks/jira-work-item/experimental-v2/components/context-title-actions";
import { ContextTitleBar } from "@/components/blocks/jira-work-item/experimental-v2/components/context-title-bar";

/**
 * Context section of the experimental work item: editable title, compact AI
 * Planner status, then the resource rows and editable description. The action
 * cluster shares the resource-button row below. While a plan awaits confirmation,
 * a one-shot highlighted scope and
 * elevated floating prompt connect the refinement controls to the fields Rovo
 * populated.
 */
export function ContextPanel({
	outputs,
	primaryCodingAgentId,
}: Readonly<{ outputs?: readonly string[]; primaryCodingAgentId?: CodingAgentId }>) {
	const [descriptionViewMode, setDescriptionViewMode] = useState<EditorToolbarViewMode>("rendered");

	return (
		<section aria-label="Work item context" className="flex flex-col gap-2">
			<ContextTitleBar />
			<AiPlannerScope header={<AiPlannerPanel />}>
				<ContextResources
					descriptionViewMode={descriptionViewMode}
					outputs={outputs}
					primaryCodingAgentId={primaryCodingAgentId}
					onDescriptionViewModeChange={setDescriptionViewMode}
				/>
				<ContextEditableDescription
					viewMode={descriptionViewMode}
					onViewModeChange={setDescriptionViewMode}
				/>
			</AiPlannerScope>
		</section>
	);
}
