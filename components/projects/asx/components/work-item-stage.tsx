"use client";

import { useCallback, useState } from "react";

import type { AgentSessionsExperimentalPreset } from "@/components/blocks/agent-sessions";
import { ExperimentalAgentSessions } from "@/components/blocks/agent-sessions/experimental/experimental-agent-sessions";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";

const WORK_ITEM_STATES: readonly {
	label: string;
	value: AgentSessionsExperimentalPreset;
}[] = [
	{ label: "Empty", value: "empty" },
	{ label: "Filled", value: "filled" },
	{ label: "Agents running", value: "running" },
];

export interface WorkItemStageController {
	preset: AgentSessionsExperimentalPreset;
	launchId: number;
	selectPreset: (preset: AgentSessionsExperimentalPreset) => void;
}

export function useWorkItemStageController(): WorkItemStageController {
	const [preset, setPreset] = useState<AgentSessionsExperimentalPreset>("empty");
	const [launchId, setLaunchId] = useState(0);

	const selectPreset = useCallback((nextPreset: AgentSessionsExperimentalPreset): void => {
		setPreset(nextPreset);
		setLaunchId((currentLaunchId) => currentLaunchId + 1);
	}, []);

	return { preset, launchId, selectPreset };
}

export function WorkItemControls({
	controller,
}: Readonly<{ controller: WorkItemStageController }>): React.ReactElement {
	return (
		<ButtonGroup
			variant="connected"
			aria-label="Open a work item state"
			className="[&>[data-slot]~[data-slot]]:-ml-px [&>[data-slot]~[data-slot]]:border-l!"
		>
			{WORK_ITEM_STATES.map((option) => (
				<Button
					key={option.value}
					type="button"
					variant="outline"
					size="compact"
					aria-pressed={controller.preset === option.value}
					onClick={() => controller.selectPreset(option.value)}
					className="aria-pressed:z-10"
				>
					{option.label}
				</Button>
			))}
		</ButtonGroup>
	);
}

/** The experimental Agent Sessions work-item design with deterministic preset jumps. */
export function WorkItemStage({
	controller,
}: Readonly<{ controller: WorkItemStageController }>): React.ReactElement {
	return (
		<div className="relative left-1/2 flex h-full min-h-0 w-screen -translate-x-1/2 items-center justify-center">
			<ExperimentalAgentSessions
				key={controller.launchId}
				initialPreset={controller.preset}
				presentation="inline"
			/>
		</div>
	);
}
