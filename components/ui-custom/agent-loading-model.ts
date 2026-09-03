export type AgentLoadingStatus = "working" | "finished";

export interface AgentLoadingStateful {
	status: AgentLoadingStatus;
}

export interface AgentLoadingSlots<T> {
	front: T;
	back: T | null;
	hidden: T | null;
}

export function areAllAgentLoadingAgentsFinished(
	agents: readonly AgentLoadingStateful[],
): boolean {
	return agents.length > 0 && agents.every((agent) => agent.status === "finished");
}

export function shouldCycleAgentLoading(
	agents: readonly AgentLoadingStateful[],
): boolean {
	return agents.length > 1 && !areAllAgentLoadingAgentsFinished(agents);
}

export function getAgentLoadingSlots<T>(
	agents: readonly T[],
	frontIndex: number,
): AgentLoadingSlots<T> | null {
	if (agents.length < 2) return null;

	const normalizedIndex = ((frontIndex % agents.length) + agents.length) % agents.length;

	return {
		front: agents[normalizedIndex],
		back: agents.length > 1 ? agents[(normalizedIndex + 1) % agents.length] : null,
		hidden: agents.length > 2 ? agents[(normalizedIndex + 2) % agents.length] : null,
	};
}
