"use client";

import type { ReactElement } from "react";
import Triggers from "@/components/blocks/triggers/page";
import {
	DEFAULT_CONFIGURED_TRIGGER_VALUES,
	DEFAULT_NEEDS_CONNECTION_TRIGGER_VALUES,
	createAgentTriggerValue,
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
