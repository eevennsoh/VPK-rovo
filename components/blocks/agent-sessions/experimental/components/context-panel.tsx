"use client";

import { ContextEditableDescription, ContextEditableTitle } from "@/components/blocks/agent-sessions/experimental/components/context-editable-header";
import { AiPlannerPanel, AiPlannerScope } from "@/components/blocks/agent-sessions/experimental/components/ai-planner-panel";
import { ContextResources } from "@/components/blocks/agent-sessions/experimental/components/context-resources";

/**
 * Context section of the experimental work item: an editable title, compact AI
 * Planner status, then the resource rows and editable description. While a plan
 * awaits confirmation, a one-shot highlighted scope and elevated floating
 * prompt connect the refinement controls to the fields Rovo populated.
 */
export function ContextPanel() {
	return (
		<section aria-label="Work item context" className="flex flex-col gap-3">
			<ContextEditableTitle />
			<AiPlannerScope header={<AiPlannerPanel />}>
				<div className="flex flex-col gap-1">
					<ContextResources />
				</div>
				<div aria-hidden className="h-px bg-border" />
				<div className="flex flex-col gap-1">
					<span className="px-0.5 text-xs font-semibold leading-4 text-text-subtlest">Description</span>
					<ContextEditableDescription />
				</div>
			</AiPlannerScope>
		</section>
	);
}
