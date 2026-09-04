"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import {
	AgentAvatarVisual,
	type AgentAvatarVisualProps,
} from "@/components/ui-custom/agent-avatar-visual";
import {
	areAllAgentLoadingAgentsFinished,
	getAgentLoadingSlots,
	shouldCycleAgentLoading,
	type AgentLoadingStatus,
} from "@/components/ui-custom/agent-loading-model";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

const AGENT_LOADING_HOLD_MS = 2_000;
const AGENT_LOADING_SWAP_MS = 150; // duration-normal

type AgentLoadingAvatar = Omit<
	AgentAvatarVisualProps,
	"avatarClassName" | "children" | "label" | "sizePx" | "status"
>;

export interface AgentLoadingAgent {
	id: string;
	name: string;
	status: AgentLoadingStatus;
	avatar: AgentLoadingAvatar;
}

export interface AgentLoadingProps {
	agents: readonly AgentLoadingAgent[];
	/** Optional visible status copy rendered beside the cycling agents. */
	label?: ReactNode;
	/** Overrides the derived live-region announcement. */
	"aria-label"?: string;
	/** Set false when an enclosing control already announces the agent state. */
	announce?: boolean;
	className?: string;
}

type AgentLoadingSlot = "front" | "back" | "hidden";

function AgentLoadingAvatar({
	agent,
	slot,
}: Readonly<{ agent: AgentLoadingAgent; slot: AgentLoadingSlot }>) {
	return (
		<span aria-hidden="true" data-agent-loading-slot={slot}>
			<AgentAvatarVisual
				{...agent.avatar}
				avatarClassName="size-4"
				label={undefined}
				loading={agent.avatar.loading ?? "eager"}
				sizePx={16}
			/>
		</span>
	);
}

function getAgentLoadingAnnouncement(
	agents: readonly AgentLoadingAgent[],
	finished: boolean,
): string {
	const countLabel = `${agents.length} ${agents.length === 1 ? "agent" : "agents"}`;
	const stateLabel = finished ? "finished" : "working";
	const names = agents.map((agent) => agent.name).filter(Boolean).join(", ");

	return [`${countLabel} ${stateLabel}`, names].filter(Boolean).join(". ");
}

function AgentLoadingAnnouncementText({
	announce,
	customLabel,
	announcement,
}: Readonly<{ announce: boolean; customLabel?: string; announcement: string }>) {
	if (!announce || customLabel) return null;

	return <span className="sr-only">{announcement}. </span>;
}

/**
 * A compact agent-presence indicator harvested from the wiv-v2 TeamEU Ferris
 * visual. Multiple agents rotate through front, back, and hidden slots until
 * every agent reaches the finished state.
 */
export function AgentLoading({
	agents,
	label,
	"aria-label": ariaLabel,
	announce = true,
	className,
}: Readonly<AgentLoadingProps>) {
	const reduceMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
	const [frontAgentId, setFrontAgentId] = useState<string | null>(
		() => agents[0]?.id ?? null,
	);
	const [activeSwapKey, setActiveSwapKey] = useState<string | null>(null);
	const agentsRef = useRef(agents);
	const agentStateKey = useMemo(
		() => JSON.stringify(agents.map((agent) => [agent.id, agent.status])),
		[agents],
	);
	const finished = areAllAgentLoadingAgentsFinished(agents);
	const canCycle = shouldCycleAgentLoading(agents) && !reduceMotion;
	const resolvedFrontIndex = Math.max(
		0,
		agents.findIndex((agent) => agent.id === frontAgentId),
	);
	const slots = getAgentLoadingSlots(agents, resolvedFrontIndex);
	const isSwapping = canCycle && activeSwapKey === agentStateKey;

	useEffect(() => {
		agentsRef.current = agents;
	}, [agents]);

	useEffect(() => {
		if (!canCycle) return undefined;

		let holdTimer = 0;
		let swapTimer = 0;
		let cancelled = false;

		const cycle = () => {
			setActiveSwapKey(agentStateKey);
			swapTimer = window.setTimeout(() => {
				if (cancelled) return;
				setFrontAgentId((currentId) => {
					const currentAgents = agentsRef.current;
					if (currentAgents.length === 0) return null;
					const currentIndex = currentAgents.findIndex((agent) => agent.id === currentId);
					const nextIndex = (Math.max(0, currentIndex) + 1) % currentAgents.length;
					return currentAgents[nextIndex]?.id ?? null;
				});
				setActiveSwapKey(null);
				holdTimer = window.setTimeout(cycle, AGENT_LOADING_HOLD_MS);
			}, AGENT_LOADING_SWAP_MS);
		};

		holdTimer = window.setTimeout(cycle, AGENT_LOADING_HOLD_MS);

		return () => {
			cancelled = true;
			window.clearTimeout(holdTimer);
			window.clearTimeout(swapTimer);
		};
	}, [agentStateKey, canCycle]);

	if (!slots) return null;

	const announcement = ariaLabel ?? getAgentLoadingAnnouncement(agents, finished);

	return (
		<span
			aria-label={announce ? ariaLabel : undefined}
			aria-live={announce ? "polite" : undefined}
			className={cn("inline-flex min-w-0 items-center gap-2", className)}
			role={announce ? "status" : undefined}
		>
			<AgentLoadingAnnouncementText
				announce={announce}
				announcement={announcement}
				customLabel={ariaLabel}
			/>
			<span
				aria-hidden="true"
				className="agent-loading"
				data-cycling={agents.length > 2 ? "true" : undefined}
				data-swapping={canCycle && isSwapping ? "true" : undefined}
			>
				{slots.hidden ? (
					<AgentLoadingAvatar agent={slots.hidden} slot="hidden" />
				) : null}
				{slots.back ? <AgentLoadingAvatar agent={slots.back} slot="back" /> : null}
				<AgentLoadingAvatar agent={slots.front} slot="front" />
			</span>
			{label ? (
				<span className="min-w-0 self-center whitespace-nowrap text-sm text-text">
					{label}
				</span>
			) : null}
		</span>
	);
}
