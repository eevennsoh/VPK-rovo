import type { JiraKanbanCardSelectModifiers, JiraKanbanColumnData } from "@/components/blocks/jira-kanban";
import {
	moveJiraKanbanCardsToColumn,
	selectJiraKanbanCard,
} from "@/components/blocks/jira-kanban/state";
import {
	ASX_KANBAN_DEFAULT_AGENT_ID,
	ASX_KANBAN_DRAFTING_COLUMN,
	ASX_KANBAN_INTAKE_COLUMN,
	ASX_KANBAN_REVIEW_COLUMN,
	type AsxKanbanAgentSelection,
	createAsxKanbanActivity,
	createAsxKanbanCompletedRun,
	createAsxKanbanColumns,
} from "../data/kanban-data";

export type AsxKanbanLifecyclePhase = "default" | "thinking" | "generating" | "needs-input" | "completed";

export interface AsxKanbanLifecycle {
	agentIds: string[];
	agentSelectionsById: Record<string, AsxKanbanAgentSelection>;
	generatedOutput?: string;
	phase: AsxKanbanLifecyclePhase;
}

export interface AsxKanbanDragState {
	cardCodes: string[];
	sourceColumnTitle: string;
}

export interface AsxKanbanState {
	columns: JiraKanbanColumnData[];
	dragged: AsxKanbanDragState | null;
	lastSelectedByColumn: Record<string, number>;
	lifecycleByCode: Record<string, AsxKanbanLifecycle>;
	selectedCardCodes: Set<string>;
}

export type AsxKanbanAction =
	| { type: "assign-agent"; cardCodes: readonly string[]; agent: AsxKanbanAgentSelection }
	| { type: "advance-generating"; cardCode: string }
	| { type: "request-input"; cardCode: string }
	| { type: "answer-question"; cardCode: string }
	| { type: "complete"; cardCode: string; generatedOutput?: string }
	| { type: "select"; cardCode: string; columnTitle: string; indexInColumn: number; modifiers: JiraKanbanCardSelectModifiers }
	| { type: "drag-start"; cardCode: string; sourceColumnTitle: string }
	| { type: "drag-end" }
	| { type: "drop"; targetColumnTitle: string; agent?: AsxKanbanAgentSelection };

function assignAgents(
	lifecycleByCode: Readonly<Record<string, AsxKanbanLifecycle>>,
	cardCodes: readonly string[],
	agent: AsxKanbanAgentSelection,
): Record<string, AsxKanbanLifecycle> {
	const next = { ...lifecycleByCode };
	for (const cardCode of cardCodes) {
		const current = next[cardCode] ?? {
			agentIds: [],
			agentSelectionsById: {},
			phase: "default" as const,
		};
		next[cardCode] = {
			...current,
			agentIds: current.agentIds.includes(agent.id) ? current.agentIds : [...current.agentIds, agent.id],
			agentSelectionsById: {
				...current.agentSelectionsById,
				[agent.id]: agent,
			},
			phase: "thinking",
		};
	}
	return next;
}

function updateLifecycle(
	state: AsxKanbanState,
	cardCode: string,
	update: (current: AsxKanbanLifecycle) => AsxKanbanLifecycle,
): AsxKanbanState {
	const current = state.lifecycleByCode[cardCode];
	if (!current) return state;
	return {
		...state,
		lifecycleByCode: { ...state.lifecycleByCode, [cardCode]: update(current) },
	};
}

export function createInitialAsxKanbanState(): AsxKanbanState {
	return {
		columns: createAsxKanbanColumns(),
		dragged: null,
		lastSelectedByColumn: {},
		lifecycleByCode: {},
		selectedCardCodes: new Set(),
	};
}

/** Resolves lifecycle state into the shared JiraIssue presentation contract. */
export function resolveAsxKanbanColumns(state: AsxKanbanState): JiraKanbanColumnData[] {
	return state.columns.map((column) => ({
		...column,
		count: column.cards.length,
		cards: column.cards.map((card) => {
			const lifecycle = state.lifecycleByCode[card.code];
			if (!lifecycle) return card;

			if (lifecycle.phase === "completed") {
				return {
					...card,
					agentActivities: undefined,
					agentActivityMode: "completed" as const,
					agentDoneRuns: lifecycle.agentIds.map((agentId, index) => createAsxKanbanCompletedRun(
						agentId,
						{ issueKey: card.code, issueSummary: card.title },
						lifecycle.agentSelectionsById[agentId],
						index === 0 ? lifecycle.generatedOutput : undefined,
					)),
				};
			}

			const awaitingInput = lifecycle.phase === "needs-input";
			const activities = lifecycle.agentIds.map((agentId, index) => (
				createAsxKanbanActivity(
					agentId,
					awaitingInput && index === 0,
					lifecycle.agentSelectionsById[agentId],
				)
			));

			return {
				...card,
				agentActivities: activities,
				agentActivityMode: awaitingInput ? "awaiting-input" as const : "working" as const,
				agentDoneRuns: undefined,
			};
		}),
	}));
}

export function asxKanbanReducer(state: AsxKanbanState, action: AsxKanbanAction): AsxKanbanState {
	switch (action.type) {
		case "assign-agent":
			return {
				...state,
				columns: moveJiraKanbanCardsToColumn(state.columns, action.cardCodes, ASX_KANBAN_DRAFTING_COLUMN),
				lifecycleByCode: assignAgents(state.lifecycleByCode, action.cardCodes, action.agent),
			};
		case "advance-generating":
			return updateLifecycle(state, action.cardCode, (current) => ({ ...current, phase: "generating" }));
		case "request-input":
			return updateLifecycle(state, action.cardCode, (current) => ({ ...current, phase: "needs-input" }));
		case "answer-question":
			return updateLifecycle(state, action.cardCode, (current) => ({ ...current, phase: "generating" }));
		case "complete": {
			const next = updateLifecycle(state, action.cardCode, (current) => ({
				...current,
				generatedOutput: action.generatedOutput,
				phase: "completed",
			}));
			return {
				...next,
				columns: moveJiraKanbanCardsToColumn(next.columns, [action.cardCode], ASX_KANBAN_REVIEW_COLUMN),
				selectedCardCodes: new Set([...next.selectedCardCodes].filter((code) => code !== action.cardCode)),
			};
		}
		case "select": {
			return {
				...state,
				...selectJiraKanbanCard(state, state.columns, action),
			};
		}
		case "drag-start": {
			const cardCodes = state.selectedCardCodes.has(action.cardCode) && state.selectedCardCodes.size > 1
				? [...state.selectedCardCodes]
				: [action.cardCode];
			return { ...state, dragged: { cardCodes, sourceColumnTitle: action.sourceColumnTitle } };
		}
		case "drag-end":
			return { ...state, dragged: null };
		case "drop": {
			if (!state.dragged
				|| state.dragged.sourceColumnTitle !== ASX_KANBAN_INTAKE_COLUMN
				|| action.targetColumnTitle !== ASX_KANBAN_DRAFTING_COLUMN) {
				return { ...state, dragged: null };
			}
			return {
				...state,
				columns: moveJiraKanbanCardsToColumn(state.columns, state.dragged.cardCodes, ASX_KANBAN_DRAFTING_COLUMN),
				dragged: null,
				lifecycleByCode: assignAgents(
					state.lifecycleByCode,
					state.dragged.cardCodes,
					action.agent ?? { id: ASX_KANBAN_DEFAULT_AGENT_ID },
				),
				selectedCardCodes: new Set(),
			};
		}
	}
}
