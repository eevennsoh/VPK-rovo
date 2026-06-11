"use client";

import { useState, type ReactElement } from "react";
import Triggers from "@/components/blocks/triggers/page";
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
	const [open, setOpen] = useState(false);

	function handleAddTrigger(providerId: AgentTriggerProviderId, eventId: string): void {
		const next = createAgentTriggerValue(providerId, eventId, triggers.length + 1);
		if (next) {
			setTriggers((prev) => [...prev, next]);
		}
	}

	function handleReorderTriggers(activeId: string, overId: string): void {
		setTriggers((prev) => {
			const from = prev.findIndex((trigger) => trigger.id === activeId);
			const to = prev.findIndex((trigger) => trigger.id === overId);
			if (from === -1 || to === -1) {
				return prev;
			}
			const next = prev.slice();
			const [moved] = next.splice(from, 1);
			next.splice(to, 0, moved);
			return next;
		});
	}

	function handleToggleTrigger(id: string, enabled: boolean): void {
		setTriggers((prev) =>
			prev.map((trigger) => (trigger.id === id ? { ...trigger, enabled } : trigger)),
		);
	}

	function handleDeleteTrigger(id: string): void {
		setTriggers((prev) => prev.filter((trigger) => trigger.id !== id));
	}

	return (
		<TriggersDemoFrame>
			<div className="flex justify-center">
				<Button onClick={() => setOpen(true)} type="button" variant="outline">
					Manage triggers
				</Button>
				<ManageTriggersDialog
					open={open}
					onOpenChange={setOpen}
					triggers={triggers}
					onAddTrigger={handleAddTrigger}
					onReorderTriggers={handleReorderTriggers}
					onToggleTrigger={handleToggleTrigger}
					onDeleteTrigger={handleDeleteTrigger}
					onEditTrigger={() => undefined}
				/>
			</div>
		</TriggersDemoFrame>
	);
}
