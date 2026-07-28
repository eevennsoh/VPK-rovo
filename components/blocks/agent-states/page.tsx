"use client";

import { useState } from "react";

import { AgentStates, type AgentStatesState } from "@/components/blocks/agent-states";
import { QUESTION_CARD_SINGLE_SELECT_DEMO } from "@/components/blocks/question-card/data/questions";
import { Button } from "@/components/ui/button";
import { getDeterministicAgentAvatarSrc } from "@/lib/agent-avatars";

const DEMO_STATES: readonly { label: string; value: AgentStatesState }[] = [
	{ label: "Working", value: "working" },
	{ label: "Needs input", value: "awaiting-input" },
	{ label: "Completed", value: "completed" },
];

export default function AgentStatesPage() {
	const [state, setState] = useState<AgentStatesState>("working");

	return (
		<div className="flex min-h-[360px] w-full flex-col items-center justify-center gap-6 bg-surface p-6">
			<div className="flex items-center gap-2">
				{DEMO_STATES.map((item) => (
					<Button
						aria-pressed={state === item.value}
						key={item.value}
						onClick={() => setState(item.value)}
						size="compact"
						variant={state === item.value ? "default" : "outline"}
					>
						{item.label}
					</Button>
				))}
			</div>
			<AgentStates
				agent={{
					avatarSrc: getDeterministicAgentAvatarSrc("service-impact-agent"),
					id: "service-impact-agent",
					name: "Service impact agent",
				}}
				initialElapsedSeconds={422}
				onSubmit={() => undefined}
				onView={() => undefined}
				question={QUESTION_CARD_SINGLE_SELECT_DEMO[0]}
				state={state}
			/>
		</div>
	);
}
