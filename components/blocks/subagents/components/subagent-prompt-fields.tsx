"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

// Trigger + Condition fields shown under the agent config when a subagent prompt
// is selected. Rendered via `AgentConfigFields`' `compactFooterBefore` slot by
// both the standalone subagents demo and the studio agent config panel.
export function SubagentPromptFields({
	condition,
	idPrefix,
	onConditionChange,
	onTriggerNameChange,
	triggerName,
}: Readonly<{
	condition: string;
	idPrefix: string;
	onConditionChange: (value: string) => void;
	onTriggerNameChange: (value: string) => void;
	triggerName: string;
}>) {
	const triggerId = `${idPrefix}-trigger`;
	const conditionId = `${idPrefix}-condition`;

	return (
		<div className="shrink-0 border-t border-border bg-surface py-4">
			<div className="grid gap-y-2 md:grid-cols-[8rem_minmax(0,1fr)] md:gap-x-5">
				<label
					className="pt-1.5 text-xs font-semibold leading-4 text-text-subtlest"
					htmlFor={triggerId}
				>
					Trigger
				</label>
				<Input
					id={triggerId}
					placeholder="Placeholder"
					value={triggerName}
					onChange={(event) => onTriggerNameChange(event.currentTarget.value)}
				/>
				<label
					className="pt-2 text-xs font-semibold leading-4 text-text-subtlest"
					htmlFor={conditionId}
				>
					Condition
				</label>
				<Textarea
					id={conditionId}
					className="min-h-[74px]"
					placeholder="Describe the situation that should trigger this subagent."
					value={condition}
					onChange={(event) => onConditionChange(event.currentTarget.value)}
				/>
			</div>
		</div>
	);
}
