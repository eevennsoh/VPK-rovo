"use client";

import { useState } from "react";

import type { AgentSessionsExperimentalPreset } from "@/components/blocks/agent-sessions";
import { ExperimentalAgentSessions } from "@/components/blocks/agent-sessions/experimental/experimental-agent-sessions";

const WORK_ITEM_STATES: readonly {
	label: string;
	value: AgentSessionsExperimentalPreset;
}[] = [
	{ label: "Empty", value: "empty" },
	{ label: "Filled", value: "filled" },
	{ label: "Agents running", value: "running" },
];

/** The experimental Agent Sessions work-item design with deterministic preset jumps. */
export function WorkItemStage(): React.ReactElement {
	const [preset, setPreset] = useState<AgentSessionsExperimentalPreset>("filled");
	const [isOpen, setIsOpen] = useState(false);
	const [launchId, setLaunchId] = useState(0);

	function openPreset(nextPreset: AgentSessionsExperimentalPreset): void {
		setPreset(nextPreset);
		setLaunchId((currentLaunchId) => currentLaunchId + 1);
		setIsOpen(true);
	}

	return (
		<div className="relative left-1/2 -mb-80 flex h-[calc(100dvh-6.5rem)] w-screen -translate-x-1/2 items-center justify-center pb-28">
			{isOpen ? null : (
				<div aria-label="Open a work item state" className="flex flex-wrap items-center justify-center gap-2" role="group">
					{WORK_ITEM_STATES.map((option) => (
						<button
							key={option.value}
							type="button"
							onClick={() => openPreset(option.value)}
							className="inline-flex h-6 shrink-0 items-center rounded-md border border-border bg-surface px-2.5 text-xs font-medium leading-4 text-text-subtle outline-none transition-[border-color,color,box-shadow] duration-fast ease-out hover:bg-bg-neutral-subtle-hovered active:bg-bg-neutral-subtle-pressed focus-visible:ring-3 focus-visible:ring-ring/50"
						>
							{option.label}
						</button>
					))}
				</div>
			)}
			<ExperimentalAgentSessions
				key={launchId}
				initialPreset={preset}
				onClose={() => setIsOpen(false)}
				open={isOpen}
			/>
		</div>
	);
}
