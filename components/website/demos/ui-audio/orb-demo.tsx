"use client";

import { useState } from "react";
import { type AgentState, Orb } from "@/components/ui-audio/orb";
import { Button } from "@/components/ui/button";
import { DemoCard } from "./demo-data";

const ORB_STATES: Array<{ label: string; value: AgentState }> = [
	{ label: "Idle", value: null },
	{ label: "Listening", value: "listening" },
	{ label: "Talking", value: "talking" },
	{ label: "Thinking", value: "thinking" },
];

function OrbPreview() {
	const [state, setState] = useState<AgentState>(null);

	return (
		<DemoCard
			description="Interactive orb visualization with agent states"
			title="Agent Orbs"
		>
			<div className="flex justify-center">
				<div className="bg-bg-neutral relative h-32 w-32 rounded-full p-1 shadow-[inset_0_2px_8px_rgba(0,0,0,0.1)] dark:shadow-[inset_0_2px_8px_rgba(0,0,0,0.5)]">
					<div className="bg-surface h-full w-full overflow-hidden rounded-full shadow-[inset_0_0_12px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_0_12px_rgba(0,0,0,0.3)]">
						<Orb agentState={state} className="h-full w-full" />
					</div>
				</div>
			</div>
			<div className="flex flex-wrap justify-center gap-2">
				{ORB_STATES.map((option) => (
					<Button
						key={option.label}
						aria-pressed={state === option.value}
						onClick={() => {
							setState(option.value);
						}}
						size="default"
						variant={state === option.value ? "default" : "outline"}
					>
						{option.label}
					</Button>
				))}
			</div>
		</DemoCard>
	);
}

export default function OrbDemo() {
	return <OrbPreview />;
}

export function OrbDemoStates() {
	return <OrbPreview />;
}
