"use client";

import type { ReactElement } from "react";

import {
	TriggerConfigAutomationDialog,
	type AgentAutomationRule,
} from "@/components/blocks/triggers/page";

export interface AgentTriggersDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** Automation rule the draft is reset to each time the dialog opens. */
	automationRule: AgentAutomationRule;
	/** Commits the edited draft when the user saves. */
	onSave: (automationRule: AgentAutomationRule) => void;
	title?: string;
	saveLabel?: string;
}

/**
 * Studio wrapper around the shared automation modal. The shared block owns the
 * draft state so Cancel discards edits and Save commits the complete trigger
 * array with one shared prompt/name/active state.
 */
export function AgentTriggersDialog({
	automationRule,
	open,
	onOpenChange,
	onSave,
	title,
	saveLabel,
}: Readonly<AgentTriggersDialogProps>): ReactElement {
	return (
		<TriggerConfigAutomationDialog
			automationRule={automationRule}
			open={open}
			onOpenChange={onOpenChange}
			onSave={onSave}
			title={title}
			saveLabel={saveLabel ?? "Save"}
		/>
	);
}
