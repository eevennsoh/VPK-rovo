import type { ComponentDetail } from "@/app/data/component-detail-types";

export const AGENT_ASSIGNMENT_DETAIL: ComponentDetail = {
	description: "Reusable assigned-agent field with avatar status summaries, independently timed agent-specific activity sequences, View and Archive hover actions, and an in-place searchable agent selector.",
	importStatement: `import { AgentAssignment } from "@/components/blocks/agent-assignment";`,
	usage: `import { AgentAssignment } from "@/components/blocks/agent-assignment";

<AgentAssignment
  agents={availableAgents}
  assignedAgents={assignedAgents.map((agent) => ({
    ...agent,
    statusSequence: agent.toolCallLabels,
    statusCycleIntervalMs: 1800,
    statusCycleJitterMs: 1600,
  }))}
  onAssignedAgentIdsChange={setAssignedAgentIds}
  onAssignedAgentSelect={(agent) => openAgentSession(agent.id)}
/>`,
	props: [
		{
			name: "agents",
			type: "readonly AgentSelectorAgent[]",
			required: true,
			description: "Agents available in the searchable assignment selector.",
		},
		{
			name: "assignedAgents",
			type: "readonly AgentAssignmentAgent[]",
			required: true,
			description: "Controlled assigned agents. Give each agent its own statusSequence; the shared menu varies every dwell with statusCycleIntervalMs plus statusCycleJitterMs and staggers rows so agents do not advance in lockstep.",
		},
		{
			name: "onAgentAssign",
			type: "(agent: AgentSelectorAgent) => void",
			description: "Called when an unassigned agent is chosen, before the controlled id change. Use it to invoke the agent and create its running session.",
		},
		{
			name: "onAssignedAgentIdsChange",
			type: "(agentIds: readonly string[]) => void",
			required: true,
			description: "Called with the next assignment whenever an agent is added or removed.",
		},
		{
			name: "onAssignedAgentSelect",
			type: "(agent: AgentAssignmentAgent) => void",
			required: true,
			description: "Called when an assigned-agent row or its View action is activated, such as to open its session.",
		},
	],
};
