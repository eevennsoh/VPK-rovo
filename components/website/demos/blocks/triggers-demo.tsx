"use client";

import type { ReactElement } from "react";
import Triggers from "@/components/blocks/triggers/page";
import {
	DEFAULT_CONFIGURED_TRIGGER_VALUES,
	DEFAULT_NEEDS_CONNECTION_TRIGGER_VALUES,
	createAgentTriggerValue,
	type AgentTriggerValue,
} from "@/components/blocks/triggers/data/trigger-catalog";

const MULTIPLE_TRIGGER_VALUES = [
	...DEFAULT_CONFIGURED_TRIGGER_VALUES,
	createAgentTriggerValue("jira", "comment-added", 3),
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
			<Triggers defaultPickerOpen />
		</TriggersDemoFrame>
	);
}

export function TriggersDemoConfigured(): ReactElement {
	return (
		<TriggersDemoFrame>
			<Triggers defaultTriggers={DEFAULT_CONFIGURED_TRIGGER_VALUES} />
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
