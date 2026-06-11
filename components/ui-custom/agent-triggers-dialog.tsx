"use client";

import type { ReactElement } from "react";

import {
	TriggerAutomationDialog,
	type AgentTriggerValue,
} from "@/components/blocks/triggers/page";

export interface AgentTriggersDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** Seed definitions the draft is reset to each time the dialog opens. */
	triggerDefinitions: readonly AgentTriggerValue[];
	/** Commits the edited draft when the user saves. */
	onSave: (triggers: readonly AgentTriggerValue[]) => void;
	title?: string;
	saveLabel?: string;
}

/**
 * Studio wrapper around the shared automation modal. The shared block owns the
 * draft state so Cancel discards edits and Save commits the complete trigger
 * array with one shared prompt/name/active state.
 */
export function AgentTriggersDialog({
	open,
	onOpenChange,
	triggerDefinitions,
	onSave,
	title,
	saveLabel,
}: Readonly<AgentTriggersDialogProps>): ReactElement {
	return (
		<TriggerAutomationDialog
			open={open}
			onOpenChange={onOpenChange}
			triggers={triggerDefinitions}
			onSave={onSave}
			title={title}
			saveLabel={saveLabel ?? "Save"}
		/>
	);
}
