"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";

import { ROVO_AGENT_SELECTOR_AGENTS } from "@/app/data/directory/agents";
import {
	AgentAssignment,
	type AgentAssignmentAgent,
} from "@/components/blocks/agent-assignment";
import { CyclingByline } from "@/components/ui-custom/chain-of-thought";

const INITIAL_ASSIGNED_AGENT_IDS = ROVO_AGENT_SELECTOR_AGENTS.slice(0, 2).map((agent) => agent.id);

function DemoAgentActivity({ agentName }: Readonly<{ agentName: string }>) {
	const shouldReduceMotion = Boolean(useReducedMotion());
	const [index, setIndex] = useState(0);
	const activities = [
		`Reviewing context with ${agentName}`,
		`Planning the next steps with ${agentName}`,
		`Working through the request with ${agentName}`,
	];

	useEffect(() => {
		if (shouldReduceMotion) {
			return;
		}
		const intervalId = window.setInterval(() => setIndex((value) => value + 1), 2_200);
		return () => window.clearInterval(intervalId);
	}, [shouldReduceMotion]);

	return (
		<CyclingByline className="menu-row-title text-text-subtlest">
			{activities[index % activities.length]}
		</CyclingByline>
	);
}

export default function AgentAssignmentPage() {
	const [assignedAgentIds, setAssignedAgentIds] = useState<readonly string[]>(INITIAL_ASSIGNED_AGENT_IDS);
	const assignedAgents = assignedAgentIds.flatMap((agentId): AgentAssignmentAgent[] => {
		const agent = ROVO_AGENT_SELECTOR_AGENTS.find((candidate) => candidate.id === agentId);
		return agent ? [{
			...agent,
			status: <DemoAgentActivity agentName={agent.name} />,
			statusLabel: "Running",
		}] : [];
	});

	return (
		<div className="w-80 rounded-xl bg-surface-raised p-4 shadow-lg">
			<div className="grid grid-cols-[5rem_minmax(0,1fr)] items-center gap-2">
				<span className="text-sm text-text-subtle">Agents</span>
				<AgentAssignment
					agents={ROVO_AGENT_SELECTOR_AGENTS}
					assignedAgents={assignedAgents}
					onAssignedAgentIdsChange={setAssignedAgentIds}
					onAssignedAgentSelect={() => undefined}
				/>
			</div>
		</div>
	);
}

export { AgentAssignment } from "@/components/blocks/agent-assignment";
export type { AgentAssignmentAgent, AgentAssignmentProps } from "@/components/blocks/agent-assignment";
