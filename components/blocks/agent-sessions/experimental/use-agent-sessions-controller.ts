"use client";

// oxlint-disable react-doctor/exhaustive-deps -- The metronome effect intentionally
// re-subscribes only when the running gate flips, not on every state change.

import { useCallback, useEffect, useMemo, useReducer } from "react";
import { useReducedMotion } from "motion/react";

import {
	AGENT_SESSIONS_TICK_MS,
	agentSessionsReducer,
	hasRunningSession,
	hydratePreset,
	type AgentSessionsAction,
	type AgentSessionInvocationSource,
	type AgentSessionsPreset,
	type AgentSessionsState,
	type ContextLinkedItem,
} from "@/components/blocks/agent-sessions/data/session-state";
import { isPlannerProcessing, type AgentPlannerMetadata } from "@/components/blocks/agent-sessions/data/planner-state";
import type { WorkItemAttachment, WorkItemChildItem, WorkItemData } from "@/app/contexts/context-work-item-modal";
import type { ThirdPartyLogoName } from "@/components/ui/data/logo-third-party-data";

export { AGENT_SESSIONS_TICK_MS };

interface AgentSessionsAgentInput {
	id: string;
	name: string;
	avatarSrc?: string;
	brandName?: ThirdPartyLogoName;
}

export interface AgentSessionsActions {
	launchSession(agent: AgentSessionsAgentInput, command?: string, title?: string): void;
	invokeAgent(
		agent: AgentSessionsAgentInput,
		source: AgentSessionInvocationSource,
		command?: string,
	): void;
	replySession(sessionId: string, text: string): void;
	addComment(text: string): void;
	openSession(sessionId: string | null): void;
	openGeneralSession(): void;
	/** Launcher entry: reopen the latest session, else create a general one. */
	openLatestOrCreateGeneralSession(): void;
	/** Prefill the floating session composer (e.g. from a Context next step). */
	setComposerPrefill(text: string): void;
	clearComposerPrefill(): void;
	addContextResource(
		kind: "attachment" | "subtask" | "link",
		item: WorkItemAttachment | WorkItemChildItem | ContextLinkedItem,
	): void;
	removeContextResource(kind: "attachment" | "subtask" | "link", id: string): void;
	editContextText(field: "title" | "description", value: string): void;
	refreshGeneratedContext(): void;
	applyPlannerProposal(): void;
	rejectPlannerProposal(): void;
	refinePlannerProposal(prompt: string): void;
	updateMetadata(patch: Partial<AgentPlannerMetadata>): void;
	reset(): void;
}

export interface AgentSessionsController {
	state: AgentSessionsState;
	actions: AgentSessionsActions;
}

interface AgentSessionsInit {
	initialState?: AgentSessionsState;
	preset: AgentSessionsPreset;
	workItem: WorkItemData;
}

function initState({ initialState, preset, workItem }: AgentSessionsInit): AgentSessionsState {
	return initialState ?? hydratePreset(preset, workItem);
}

export function useAgentSessionsController(
	initialPreset: AgentSessionsPreset,
	workItem: WorkItemData,
	active = true,
	initialState?: AgentSessionsState,
): AgentSessionsController {
	const [state, dispatch] = useReducer(agentSessionsReducer, { initialState, preset: initialPreset, workItem }, initState);
	const shouldReduceMotion = useReducedMotion();
	const isRunning = hasRunningSession(state) || isPlannerProcessing(state.planner);
	const isFrozenRunningDemo = state.preset === "running";

	// Metronome: while the surface is active (open) AND a session or planner task
	// is processing, advance the pure timer engine on a fixed cadence. Gating on
	// `active` keeps preset sessions pristine until the viewer opens the surface.
	// The seeded "running" demo remains frozen after opening so each session stays
	// steerable. Reduced motion collapses continuous progress to an instant settle
	// for the other presets.
	useEffect(() => {
		if (!active || !isRunning || isFrozenRunningDemo) return undefined;
		if (shouldReduceMotion) {
			dispatch({ type: "settle-running" });
			return undefined;
		}
		const interval = window.setInterval(() => {
			dispatch({ type: "tick", deltaMs: AGENT_SESSIONS_TICK_MS });
		}, AGENT_SESSIONS_TICK_MS);
		return () => window.clearInterval(interval);
	}, [active, isFrozenRunningDemo, isRunning, shouldReduceMotion]);

	const run = useCallback((action: AgentSessionsAction) => dispatch(action), []);

	const actions = useMemo<AgentSessionsActions>(
		() => ({
			launchSession: (agent, command, title) =>
				run({
					type: "launch-session",
					agentId: agent.id,
					agentName: agent.name,
					agentAvatarSrc: agent.avatarSrc,
					agentBrandName: agent.brandName,
					command,
					title,
				}),
			invokeAgent: (agent, source, command) =>
				run({
					type: "invoke-agent",
					source,
					agentId: agent.id,
					agentName: agent.name,
					agentAvatarSrc: agent.avatarSrc,
					agentBrandName: agent.brandName,
					command,
				}),
			replySession: (sessionId, text) => run({ type: "reply-session", sessionId, text }),
			addComment: (text) => run({ type: "add-comment", text }),
			openSession: (sessionId) => run({ type: "set-active-session", sessionId }),
			openGeneralSession: () => run({ type: "open-general-session" }),
			openLatestOrCreateGeneralSession: () => run({ type: "open-latest-or-general" }),
			setComposerPrefill: (text) => run({ type: "set-composer-prefill", text }),
			clearComposerPrefill: () => run({ type: "clear-composer-prefill" }),
			addContextResource: (kind, item) => {
				if (kind === "attachment") {
					run({ type: "add-context-resource", kind, item: item as WorkItemAttachment });
				} else if (kind === "subtask") {
					run({ type: "add-context-resource", kind, item: item as WorkItemChildItem });
				} else {
					run({ type: "add-context-resource", kind, item: item as ContextLinkedItem });
				}
			},
			removeContextResource: (kind, id) => run({ type: "remove-context-resource", kind, id }),
			editContextText: (field, value) => run({ type: "edit-context-text", field, value }),
			refreshGeneratedContext: () => run({ type: "refresh-generated-context" }),
			applyPlannerProposal: () => run({ type: "apply-planner-proposal" }),
			rejectPlannerProposal: () => run({ type: "reject-planner-proposal" }),
			refinePlannerProposal: (prompt) => run({ type: "refine-planner-proposal", prompt }),
			updateMetadata: (patch) => run({ type: "edit-metadata", patch }),
			reset: () => run({ type: "reset", workItem }),
		}),
		[run, workItem],
	);

	return { state, actions };
}
