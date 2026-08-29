"use client";

import { useEffect, useRef, useState } from "react";

import type { AgentAssignmentStatusKind } from "@/components/blocks/agent-assignment/components/agent-assignment";
import { SONNER_TOAST_AUTO_DISMISS_MS } from "@/components/ui/sonner";

export const ASSIGNED_AGENT_ATTENTION_TOOLTIP_MS = SONNER_TOAST_AUTO_DISMISS_MS;

export function isAssignedAgentAttentionKind(kind: AgentAssignmentStatusKind): boolean {
	return kind === "needs-input" || kind === "finished";
}

export function resolveAssignedAgentAttentionEnterId(
	agents: readonly { id: string; statusKind: AgentAssignmentStatusKind }[],
	previousKinds: ReadonlyMap<string, AgentAssignmentStatusKind>,
): {
	changedIds: readonly string[];
	enterId: string | null;
	nextKinds: Map<string, AgentAssignmentStatusKind>;
} {
	const nextKinds = new Map(previousKinds);
	let enterId: string | null = null;
	const seen = new Set<string>();
	const changedIds: string[] = [];

	for (const agent of agents) {
		seen.add(agent.id);
		const previousKind = nextKinds.get(agent.id);
		nextKinds.set(agent.id, agent.statusKind);
		if (previousKind !== undefined && previousKind !== agent.statusKind) {
			changedIds.push(agent.id);
		}
		if (isAssignedAgentAttentionKind(agent.statusKind) && previousKind !== agent.statusKind) {
			enterId = agent.id;
		}
	}

	for (const id of nextKinds.keys()) {
		if (!seen.has(id)) {
			nextKinds.delete(id);
			changedIds.push(id);
		}
	}

	return { changedIds, enterId, nextKinds };
}

export function acknowledgeAssignedAgentAttention(
	current: ReadonlySet<string>,
	agentId: string,
	statusKind: AgentAssignmentStatusKind,
): ReadonlySet<string> {
	if (!isAssignedAgentAttentionKind(statusKind) || current.has(agentId)) {
		return current;
	}

	const next = new Set(current);
	next.add(agentId);
	return next;
}

export function clearAcknowledgedAssignedAgentIds(
	current: ReadonlySet<string>,
	changedIds: readonly string[],
): ReadonlySet<string> {
	if (changedIds.length === 0) {
		return current;
	}

	let changed = false;
	const next = new Set(current);
	for (const id of changedIds) {
		if (next.delete(id)) {
			changed = true;
		}
	}

	return changed ? next : current;
}

export function useAssignedAgentAttention(
	agents: readonly { id: string; statusKind: AgentAssignmentStatusKind }[],
	menuOpen: boolean,
): {
	acknowledgeAttention: (agentId: string) => void;
	attentionAgentId: string | null;
	isAttentionAcknowledged: (agentId: string) => boolean;
} {
	const [activeId, setActiveId] = useState<string | null>(null);
	const [acknowledgedIds, setAcknowledgedIds] = useState<ReadonlySet<string>>(() => new Set());
	const previousKindsRef = useRef<Map<string, AgentAssignmentStatusKind>>(new Map());
	const attentionGenerationRef = useRef(0);

	useEffect(() => {
		const { changedIds, enterId, nextKinds } = resolveAssignedAgentAttentionEnterId(
			agents,
			previousKindsRef.current,
		);
		previousKindsRef.current = nextKinds;
		setAcknowledgedIds((current) => clearAcknowledgedAssignedAgentIds(current, changedIds));

		if (menuOpen) {
			attentionGenerationRef.current += 1;
			setActiveId(null);
			return;
		}

		if (enterId) {
			attentionGenerationRef.current += 1;
			setActiveId(enterId);
			return;
		}

		setActiveId((current) => {
			if (!current) {
				return null;
			}
			const stillAttention = agents.some((agent) => (
				agent.id === current && isAssignedAgentAttentionKind(agent.statusKind)
			));
			return stillAttention ? current : null;
		});
	}, [agents, menuOpen]);

	useEffect(() => {
		if (!activeId || menuOpen) {
			return undefined;
		}

		const generation = attentionGenerationRef.current;
		const timeoutId = window.setTimeout(() => {
			if (attentionGenerationRef.current === generation) {
				setActiveId(null);
			}
		}, ASSIGNED_AGENT_ATTENTION_TOOLTIP_MS);

		return () => {
			window.clearTimeout(timeoutId);
		};
	}, [activeId, menuOpen]);

	const acknowledgeAttention = (agentId: string) => {
		const agent = agents.find((candidate) => candidate.id === agentId);
		if (!agent) {
			return;
		}
		setAcknowledgedIds((current) => (
			acknowledgeAssignedAgentAttention(current, agentId, agent.statusKind)
		));
	};

	return {
		acknowledgeAttention,
		attentionAgentId: menuOpen ? null : activeId,
		isAttentionAcknowledged: (agentId: string) => acknowledgedIds.has(agentId),
	};
}

export function useAssignedAgentAttentionId(
	agents: readonly { id: string; statusKind: AgentAssignmentStatusKind }[],
	menuOpen: boolean,
): string | null {
	return useAssignedAgentAttention(agents, menuOpen).attentionAgentId;
}
