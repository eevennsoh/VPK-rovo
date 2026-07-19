"use client";

import { ContextEditableDescription } from "@/components/blocks/agent-sessions/experimental/components/context-editable-header";
import { AiPlannerPanel, AiPlannerScope } from "@/components/blocks/agent-sessions/experimental/components/ai-planner-panel";
import { ContextResources } from "@/components/blocks/agent-sessions/experimental/components/context-resources";

/**
 * Context section of the experimental work item: compact AI Planner status, then
 * the resource rows and editable description. The editable title and its action
 * cluster live in the full-width `ContextTitleBar` above the two-column body, not
 * here. While a plan awaits confirmation, a one-shot highlighted scope and
 * elevated floating prompt connect the refinement controls to the fields Rovo
 * populated.
 */
export function ContextPanel() {
	return (
		<section aria-label="Work item context" className="flex flex-col gap-3">
			<AiPlannerScope header={<AiPlannerPanel />}>
				<ContextResources />
				<ContextEditableDescription />
			</AiPlannerScope>
		</section>
	);
}
