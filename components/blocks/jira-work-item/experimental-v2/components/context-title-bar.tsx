"use client";

import { ContextEditableTitle } from "@/components/blocks/jira-work-item/experimental-v2/components/context-editable-header";

/**
 * Editable title at the top of the left Context column. The metadata rail owns
 * the adjacent right column, so both surfaces begin on the same body row.
 */
export function ContextTitleBar() {
	return (
		<div className="min-w-0" data-jira-work-item-title-column>
			<div className="min-w-0" data-jira-work-item-title>
				<ContextEditableTitle />
			</div>
		</div>
	);
}
