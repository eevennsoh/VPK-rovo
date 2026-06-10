"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactElement } from "react";
import CrossIcon from "@atlaskit/icon/core/cross";

import Triggers, { type AgentTriggerValue } from "@/components/blocks/triggers/page";
import { getAgentTriggerReadableLabel } from "@/components/blocks/triggers/data/trigger-catalog";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogTitle,
} from "@/components/ui/dialog";

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
 * Modal wrapper around the `<Triggers>` rule builder. Edits stay in a local draft
 * so Cancel discards and Save commits the rich `AgentTriggerValue[]` to the agent
 * config. Mirrors the conversation-starters dialog: header + body + Save/Cancel
 * footer, with the draft re-seeded on each open.
 */
export function AgentTriggersDialog({
	open,
	onOpenChange,
	triggerDefinitions,
	onSave,
	title,
	saveLabel,
}: Readonly<AgentTriggersDialogProps>): ReactElement {
	const seedRef = useRef<readonly AgentTriggerValue[]>(triggerDefinitions);
	seedRef.current = triggerDefinitions;

	const [draft, setDraft] = useState<readonly AgentTriggerValue[]>(triggerDefinitions);
	const wasOpen = useRef(open);

	// Re-seed the working draft each time the dialog transitions to open so a
	// prior Cancel can't leak stale edits into the next session.
	useEffect(() => {
		if (open && !wasOpen.current) {
			setDraft(seedRef.current);
		}
		wasOpen.current = open;
	}, [open]);

	// Connection is simulated against the draft (the source of truth inside the
	// modal) — not the parent config — so Cancel truly discards it.
	const handleConnect = useCallback((target: AgentTriggerValue) => {
		setDraft((prev) =>
			prev.map((trigger) =>
				trigger.id === target.id
					? { ...trigger, connectionState: "connecting" as const }
					: trigger,
			),
		);
	}, []);

	const handleSave = useCallback(() => {
		onSave(draft);
		onOpenChange(false);
	}, [draft, onOpenChange, onSave]);

	const resolvedSaveLabel = saveLabel ?? (triggerDefinitions.length > 0 ? "Save" : "Add");

	// A single-trigger modal reads as that trigger ("Every hour"); the multi /
	// empty case keeps the generic "Triggers" heading. An explicit title wins.
	const resolvedTitle =
		title ??
		(draft.length === 1 ? getAgentTriggerReadableLabel(draft[0]).trim() || "Trigger" : "Triggers");

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="gap-0 overflow-hidden p-0" showCloseButton={false} size="md">
				<div className="flex items-center justify-between gap-2 p-6">
					<DialogTitle className="text-xl font-semibold leading-6 text-text">
						{resolvedTitle}
					</DialogTitle>
					<DialogClose render={<Button aria-label="Close" size="icon" variant="ghost" />}>
						<CrossIcon label="" />
					</DialogClose>
				</div>

				<div className="px-6 pb-6">
					<Triggers
						triggers={draft}
						onTriggersChange={setDraft}
						onConnectTrigger={handleConnect}
					/>
				</div>

				<div className="flex items-center justify-end gap-2 border-t border-border bg-surface-overlay px-6 pt-4 pb-6">
					<Button onClick={() => onOpenChange(false)} type="button" variant="ghost">
						Cancel
					</Button>
					<Button onClick={handleSave} type="button">
						{resolvedSaveLabel}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
