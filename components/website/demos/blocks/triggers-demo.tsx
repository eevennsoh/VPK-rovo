"use client";

import { useCallback, useState, type ReactElement } from "react";
import Triggers, {
	TriggerAutomationDialog,
} from "@/components/blocks/triggers/page";
import { ManageTriggersDialog } from "@/components/blocks/triggers/components/manage-triggers-dialog";
import { Button } from "@/components/ui/button";
import {
	DEFAULT_CONFIGURED_TRIGGER_VALUES,
	DEFAULT_NEEDS_CONNECTION_TRIGGER_VALUES,
	createAgentTriggerValue,
	type AgentTriggerProviderId,
	type AgentTriggerValue,
} from "@/components/blocks/triggers/data/trigger-catalog";

function withPrompt(
	trigger: AgentTriggerValue | null,
	prompt: string,
): AgentTriggerValue | null {
	return trigger ? { ...trigger, prompt } : null;
}

const CONFIGURED_TRIGGER_VALUES = DEFAULT_CONFIGURED_TRIGGER_VALUES.map((trigger, index) =>
	index === 0
		? { ...trigger, prompt: "Summarize the run and post the result to the team channel." }
		: trigger,
);

const MULTIPLE_TRIGGER_VALUES = [
	...CONFIGURED_TRIGGER_VALUES,
	withPrompt(
		createAgentTriggerValue("jira", "comment-added", 3),
		"Reply to the comment with a status update and next steps.",
	),
	createAgentTriggerValue("confluence", "page-updated", 4),
].filter(Boolean) as AgentTriggerValue[];

function TriggersDemoFrame({ children }: Readonly<{ children: ReactElement }>): ReactElement {
	return (
		<div className="flex items-start justify-center p-6">
			<div className="w-full max-w-[48rem]">{children}</div>
		</div>
	);
}

export default function TriggersDemo(): ReactElement {
	return (
		<TriggersDemoFrame>
			<Triggers />
		</TriggersDemoFrame>
	);
}

export function TriggersDemoEmpty(): ReactElement {
	return (
		<TriggersDemoFrame>
			<Triggers />
		</TriggersDemoFrame>
	);
}

export function TriggersDemoPicker(): ReactElement {
	return (
		<TriggersDemoFrame>
			<Triggers />
		</TriggersDemoFrame>
	);
}

export function TriggersDemoConfigured(): ReactElement {
	return (
		<TriggersDemoFrame>
			<Triggers defaultTriggers={CONFIGURED_TRIGGER_VALUES} />
		</TriggersDemoFrame>
	);
}

export function TriggersDemoMultiple(): ReactElement {
	return (
		<TriggersDemoFrame>
			<Triggers defaultTriggers={MULTIPLE_TRIGGER_VALUES} />
		</TriggersDemoFrame>
	);
}

export function TriggersDemoNeedsConnection(): ReactElement {
	return (
		<TriggersDemoFrame>
			<Triggers defaultTriggers={DEFAULT_NEEDS_CONNECTION_TRIGGER_VALUES} />
		</TriggersDemoFrame>
	);
}

export function TriggersDemoManage(): ReactElement {
	const [triggers, setTriggers] = useState<readonly AgentTriggerValue[]>(MULTIPLE_TRIGGER_VALUES);
	const [manageOpen, setManageOpen] = useState(true);
	const [automationOpen, setAutomationOpen] = useState(false);

	const handleAddTrigger = useCallback((providerId: AgentTriggerProviderId, eventId: string) => {
		setTriggers((current) => {
			const next = createAgentTriggerValue(providerId, eventId, current.length + 1);
			if (!next) {
				return current;
			}
			const sharedPrompt = current.find((trigger) => trigger.prompt?.trim())?.prompt ?? "";
			const automationName = current.find((trigger) => trigger.automationName?.trim())?.automationName ?? "";
			const enabled = current.find((trigger) => typeof trigger.enabled !== "undefined")?.enabled ?? true;
			return [
				...current,
				{
					...next,
					automationName,
					enabled,
					prompt: sharedPrompt,
				},
			];
		});
	}, []);

	const handleReorderTriggers = useCallback((activeId: string, overId: string) => {
		setTriggers((current) => {
			const from = current.findIndex((trigger) => trigger.id === activeId);
			const to = current.findIndex((trigger) => trigger.id === overId);
			if (from === -1 || to === -1) {
				return current;
			}
			const next = current.slice();
			const [moved] = next.splice(from, 1);
			next.splice(to, 0, moved);
			return next;
		});
	}, []);

	const handleToggleTrigger = useCallback((id: string, enabled: boolean) => {
		setTriggers((current) =>
			current.map((trigger) => (trigger.id === id ? { ...trigger, enabled } : trigger)),
		);
	}, []);

	const handleDeleteTrigger = useCallback((id: string) => {
		setTriggers((current) => current.filter((trigger) => trigger.id !== id));
	}, []);

	const handleEditTrigger = useCallback(() => {
		setManageOpen(false);
		setAutomationOpen(true);
	}, []);

	return (
		<TriggersDemoFrame>
			<div className="grid gap-3">
				<ButtonShell onClick={() => setManageOpen(true)} />
				<ManageTriggersDialog
					open={manageOpen}
					onOpenChange={setManageOpen}
					triggers={triggers}
					onAddTrigger={handleAddTrigger}
					onReorderTriggers={handleReorderTriggers}
					onToggleTrigger={handleToggleTrigger}
					onDeleteTrigger={handleDeleteTrigger}
					onEditTrigger={handleEditTrigger}
				/>
				<TriggerAutomationDialog
					open={automationOpen}
					onOpenChange={setAutomationOpen}
					triggers={triggers}
					onSave={setTriggers}
					title="Edit Automation"
				/>
			</div>
		</TriggersDemoFrame>
	);
}

function ButtonShell({ onClick }: Readonly<{ onClick: () => void }>): ReactElement {
	return (
		<Button className="w-fit" onClick={onClick} type="button" variant="outline">
			Manage trigger events
		</Button>
	);
}
