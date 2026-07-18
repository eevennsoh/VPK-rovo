"use client";

import { token } from "@/lib/tokens";
import { ContextEditableTitle } from "@/components/blocks/agent-sessions/experimental/components/context-editable-header";
import { ContextTitleActions } from "@/components/blocks/agent-sessions/experimental/components/context-title-actions";

/**
 * Full-width title band beneath the breadcrumb header: the editable work-item
 * title (left) and the visual action cluster (right). Spanning the whole dialog
 * — rather than living inside the left content column — keeps the actions aligned
 * to the modal's right edge (under the breadcrumb controls) and above the
 * two-column body, so they can never collide with the metadata rail.
 */
export function ContextTitleBar() {
	return (
		<div
			className="flex items-center justify-between gap-3"
			style={{ paddingInline: token("space.300"), paddingBottom: token("space.200") }}
		>
			<div className="min-w-0 flex-1">
				<ContextEditableTitle />
			</div>
			<ContextTitleActions />
		</div>
	);
}
