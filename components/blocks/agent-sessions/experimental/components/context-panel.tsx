"use client";

import { ContextEditableDescription, ContextEditableTitle } from "@/components/blocks/agent-sessions/experimental/components/context-editable-header";
import { ContextResources } from "@/components/blocks/agent-sessions/experimental/components/context-resources";
import { ContextSummary } from "@/components/blocks/agent-sessions/experimental/components/context-summary";

/**
 * Context section of the experimental work item: an editable title, then the
 * generated read-only summary (TL;DR + next steps) ABOVE the editable
 * description, then the empty-to-filled resource rows. Every child reads its own
 * data + actions from the foundation hooks, so this composition takes no props.
 */
export function ContextPanel() {
	return (
		<section aria-label="Work item context" className="flex flex-col gap-3">
			<ContextEditableTitle />
			<ContextSummary />
			<div className="flex flex-col gap-1">
				<span className="px-0.5 text-xs font-semibold leading-4 text-text-subtlest">Description</span>
				<ContextEditableDescription />
			</div>
			<div className="flex flex-col gap-1">
				<span className="px-0.5 text-xs font-semibold leading-4 text-text-subtlest">Details</span>
				<ContextResources />
			</div>
		</section>
	);
}
