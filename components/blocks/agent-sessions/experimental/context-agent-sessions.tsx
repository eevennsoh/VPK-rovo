"use client";

import { createContext, use, useMemo, type ReactNode } from "react";

import {
	selectActiveSession,
	selectActivityEvents,
	selectContextStatus,
	selectOrderedSessions,
	selectWorkingCount,
	type ActivityEvent,
	type AgentSession,
	type AgentSessionsContextStatus,
	type AgentSessionsPreset,
	type AgentSessionsState,
} from "@/components/blocks/agent-sessions/data/session-state";
import type { WorkItemData } from "@/app/contexts/context-work-item-modal";
import {
	useAgentSessionsController,
	type AgentSessionsActions,
} from "@/components/blocks/agent-sessions/experimental/use-agent-sessions-controller";

export interface AgentSessionsMeta {
	initialPreset: AgentSessionsPreset;
	workItem: WorkItemData;
	contextStatus: AgentSessionsContextStatus;
	activeSession: AgentSession | null;
	orderedSessions: AgentSession[];
	workingCount: number;
	activityEvents: ActivityEvent[];
}

export interface AgentSessionsContextValue {
	state: AgentSessionsState;
	actions: AgentSessionsActions;
	meta: AgentSessionsMeta;
}

const AgentSessionsContext = createContext<AgentSessionsContextValue | null>(null);

interface AgentSessionsProviderProps {
	children: ReactNode;
	initialPreset: AgentSessionsPreset;
	workItem: WorkItemData;
	/** Whether the surface is open/visible; gates the running metronome so preset
	 * sessions stay pristine until the viewer opens the surface. */
	active?: boolean;
}

export function AgentSessionsProvider({ children, initialPreset, workItem, active = true }: Readonly<AgentSessionsProviderProps>) {
	const { state, actions } = useAgentSessionsController(initialPreset, active);

	const meta = useMemo<AgentSessionsMeta>(
		() => ({
			initialPreset,
			workItem,
			contextStatus: selectContextStatus(state),
			activeSession: selectActiveSession(state),
			orderedSessions: selectOrderedSessions(state),
			workingCount: selectWorkingCount(state),
			activityEvents: selectActivityEvents(state),
		}),
		[initialPreset, workItem, state],
	);

	const value = useMemo<AgentSessionsContextValue>(() => ({ state, actions, meta }), [state, actions, meta]);

	return <AgentSessionsContext value={value}>{children}</AgentSessionsContext>;
}

export function useAgentSessions(): AgentSessionsContextValue {
	const context = use(AgentSessionsContext);
	if (context === null) {
		throw new Error("useAgentSessions must be used within an AgentSessionsProvider");
	}
	return context;
}

export function useAgentSessionsState(): AgentSessionsState {
	return useAgentSessions().state;
}

export function useAgentSessionsActions(): AgentSessionsActions {
	return useAgentSessions().actions;
}

export function useAgentSessionsMeta(): AgentSessionsMeta {
	return useAgentSessions().meta;
}

export function useAgentSession(sessionId: string): AgentSession | null {
	const { state } = useAgentSessions();
	return state.sessions.find((session) => session.id === sessionId) ?? null;
}
