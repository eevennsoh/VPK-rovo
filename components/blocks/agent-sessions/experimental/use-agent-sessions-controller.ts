"use client";

// oxlint-disable react-doctor/exhaustive-deps -- The metronome effect intentionally
// re-subscribes only when the running gate flips, not on every state change.

import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import { useReducedMotion } from "motion/react";

import {
	AGENT_SESSIONS_TICK_MS,
	agentSessionsReducer,
	hasRunningSession,
	hydratePreset,
	type AgentSessionsAction,
	type AgentSessionsPreset,
	type AgentSessionsState,
	type ContextLinkedItem,
} from "@/components/blocks/agent-sessions/data/session-state";
import type { WorkItemAttachment, WorkItemChildItem } from "@/app/contexts/context-work-item-modal";

export { AGENT_SESSIONS_TICK_MS };

export interface AgentSessionsActions {
	launchSession(agent: { id: string; name: string; avatarSrc?: string }, command?: string): void;
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
	reset(): void;
}

export interface AgentSessionsController {
	state: AgentSessionsState;
	actions: AgentSessionsActions;
}

function initState(preset: AgentSessionsPreset): AgentSessionsState {
	return hydratePreset(preset);
}

export function useAgentSessionsController(
	initialPreset: AgentSessionsPreset,
	active = true,
): AgentSessionsController {
	const [state, dispatch] = useReducer(agentSessionsReducer, initialPreset, initState);
	const previousPresetRef = useRef(initialPreset);
	const shouldReduceMotion = useReducedMotion();
	const isRunning = hasRunningSession(state);

	// ASX chooses a deterministic preset before opening a work item. Keep the
	// mounted controller in sync when that launch choice changes.
	useEffect(() => {
		if (previousPresetRef.current === initialPreset) return;
		previousPresetRef.current = initialPreset;
		dispatch({ type: "hydrate-preset", preset: initialPreset });
	}, [initialPreset]);

	// Metronome: while the surface is active (open) AND any session is running,
	// advance the pure timer engine on a fixed cadence. Gating on `active` keeps
	// preset sessions pristine until the viewer opens the surface — the docs
	// "running" launcher must not tick down to waiting/completed while its dialog
	// is still closed. Reduced motion collapses continuous progress to an instant
	// settle so state transitions still convey information without animation.
	useEffect(() => {
		if (!active || !isRunning) return undefined;
		if (shouldReduceMotion) {
			dispatch({ type: "settle-running" });
			return undefined;
		}
		const interval = window.setInterval(() => {
			dispatch({ type: "tick", deltaMs: AGENT_SESSIONS_TICK_MS });
		}, AGENT_SESSIONS_TICK_MS);
		return () => window.clearInterval(interval);
	}, [active, isRunning, shouldReduceMotion]);

	const run = useCallback((action: AgentSessionsAction) => dispatch(action), []);

	const actions = useMemo<AgentSessionsActions>(
		() => ({
			launchSession: (agent, command) =>
				run({ type: "launch-session", agentId: agent.id, agentName: agent.name, agentAvatarSrc: agent.avatarSrc, command }),
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
			reset: () => run({ type: "reset" }),
		}),
		[run],
	);

	return { state, actions };
}
