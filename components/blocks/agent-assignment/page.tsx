"use client";

import { useState } from "react";

import { ROVO_AGENT_SELECTOR_AGENTS } from "@/app/data/directory/agents";
import {
	AgentAssignment,
	type AgentAssignmentAgent,
} from "@/components/blocks/agent-assignment";

const INITIAL_ASSIGNED_AGENT_IDS = ROVO_AGENT_SELECTOR_AGENTS.slice(0, 2).map((agent) => agent.id);

const DEMO_AGENT_STATUSES: Readonly<Record<string, {
	intervalMs: number;
	jitterMs: number;
	labels: readonly string[];
}>> = {
	"github-copilot": {
		intervalMs: 1700,
		jitterMs: 1900,
		labels: ["Inspecting changed files", "Tracing affected call sites", "Checking the proposed patch"],
	},
	"release-notes-drafter": {
		intervalMs: 2300,
		jitterMs: 1700,
		labels: ["Reading merged work items", "Grouping customer-facing changes", "Drafting the release summary"],
	},
};

function getDemoAgentStatus(agent: Pick<AgentAssignmentAgent, "id" | "name">) {
	return DEMO_AGENT_STATUSES[agent.id] ?? {
		intervalMs: 2000,
		jitterMs: 1800,
		labels: [
			`Reading context assigned to ${agent.name}`,
			`Running ${agent.name}'s connected tools`,
			`Preparing ${agent.name}'s next update`,
		],
	};
}

export default function AgentAssignmentPage() {
	const [assignedAgentIds, setAssignedAgentIds] = useState<readonly string[]>(INITIAL_ASSIGNED_AGENT_IDS);
	const assignedAgents = assignedAgentIds.flatMap((agentId): AgentAssignmentAgent[] => {
		const agent = ROVO_AGENT_SELECTOR_AGENTS.find((candidate) => candidate.id === agentId);
		if (!agent) {
			return [];
		}
		const demoStatus = getDemoAgentStatus(agent);
		return [{
			...agent,
			status: demoStatus.labels[0],
			statusSequence: demoStatus.labels,
			statusCycleIntervalMs: demoStatus.intervalMs,
			statusCycleJitterMs: demoStatus.jitterMs,
			statusLabel: "Running",
		}];
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
