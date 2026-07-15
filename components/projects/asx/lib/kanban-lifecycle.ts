import type { JiraKanbanCardData, JiraKanbanCardSelectModifiers, JiraKanbanColumnData } from "@/components/blocks/jira-kanban";
import {
	ASX_RFP_QUESTION,
	ASX_KANBAN_DEFAULT_AGENT_ID,
	ASX_KANBAN_DRAFTING_COLUMN,
	ASX_KANBAN_INTAKE_COLUMN,
	ASX_KANBAN_REVIEW_COLUMN,
	createAsxKanbanActivity,
	createAsxKanbanColumns,
} from "../data/kanban-data";

export type AsxKanbanLifecyclePhase = "default" | "thinking" | "generating" | "needs-input" | "completed";

export interface AsxKanbanLifecycle {
	agentIds: string[];
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
	| { type: "assign-agent"; cardCodes: readonly string[]; agentId: string }
	| { type: "advance-generating"; cardCode: string }
	| { type: "request-input"; cardCode: string }
	| { type: "answer-question"; cardCode: string }
	| { type: "complete"; cardCode: string; generatedOutput?: string }
	| { type: "select"; cardCode: string; columnTitle: string; indexInColumn: number; modifiers: JiraKanbanCardSelectModifiers }
	| { type: "drag-start"; cardCode: string; sourceColumnTitle: string }
	| { type: "drag-end" }
	| { type: "drop"; targetColumnTitle: string; agentId?: string };

function withDerivedCounts(columns: readonly JiraKanbanColumnData[]): JiraKanbanColumnData[] {
	return columns.map((column) => ({ ...column, count: column.cards.length }));
}

function moveCardsToTop(
	columns: readonly JiraKanbanColumnData[],
	cardCodes: readonly string[],
	targetColumnTitle: string,
): JiraKanbanColumnData[] {
	const codeSet = new Set(cardCodes);
	const movingCards: JiraKanbanCardData[] = [];

	for (const column of columns) {
		for (const card of column.cards) {
			if (codeSet.has(card.code)) movingCards.push(card);
		}
	}

	if (movingCards.length === 0) return [...columns];

	return withDerivedCounts(columns.map((column) => ({
		...column,
		cards: column.title === targetColumnTitle
			? [...movingCards, ...column.cards.filter((card) => !codeSet.has(card.code))]
			: column.cards.filter((card) => !codeSet.has(card.code)),
	})));
}

function assignAgents(
	lifecycleByCode: Readonly<Record<string, AsxKanbanLifecycle>>,
	cardCodes: readonly string[],
	agentId: string,
): Record<string, AsxKanbanLifecycle> {
	const next = { ...lifecycleByCode };
	for (const cardCode of cardCodes) {
		const current = next[cardCode] ?? { agentIds: [], phase: "default" as const };
		next[cardCode] = {
			...current,
			agentIds: current.agentIds.includes(agentId) ? current.agentIds : [...current.agentIds, agentId],
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
					agentDoneCount: lifecycle.agentIds.length,
				};
			}

			const awaitingInput = lifecycle.phase === "needs-input";
			const activities = lifecycle.agentIds.map((agentId, index) => ({
				...createAsxKanbanActivity(agentId, awaitingInput && index === 0),
				question: awaitingInput && index === 0 ? ASX_RFP_QUESTION[0] : undefined,
			}));

			return {
				...card,
				agentActivities: activities,
				agentActivityMode: awaitingInput ? "awaiting-input" as const : "working" as const,
				agentDoneCount: 0,
			};
		}),
	}));
}

export function asxKanbanReducer(state: AsxKanbanState, action: AsxKanbanAction): AsxKanbanState {
	switch (action.type) {
		case "assign-agent":
			return {
				...state,
				columns: moveCardsToTop(state.columns, action.cardCodes, ASX_KANBAN_DRAFTING_COLUMN),
				lifecycleByCode: assignAgents(state.lifecycleByCode, action.cardCodes, action.agentId),
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
				columns: moveCardsToTop(next.columns, [action.cardCode], ASX_KANBAN_REVIEW_COLUMN),
				selectedCardCodes: new Set([...next.selectedCardCodes].filter((code) => code !== action.cardCode)),
			};
		}
		case "select": {
			const nextSelection = new Set(state.selectedCardCodes);
			const column = state.columns.find((candidate) => candidate.title === action.columnTitle);
			const previousIndex = state.lastSelectedByColumn[action.columnTitle];

			if (action.modifiers.shiftKey && column && previousIndex !== undefined) {
				const start = Math.min(previousIndex, action.indexInColumn);
				const end = Math.max(previousIndex, action.indexInColumn);
				for (const card of column.cards.slice(start, end + 1)) nextSelection.add(card.code);
			} else if (action.modifiers.metaOrCtrlKey) {
				if (nextSelection.has(action.cardCode)) nextSelection.delete(action.cardCode);
				else nextSelection.add(action.cardCode);
			} else {
				nextSelection.clear();
				nextSelection.add(action.cardCode);
			}

			return {
				...state,
				lastSelectedByColumn: { ...state.lastSelectedByColumn, [action.columnTitle]: action.indexInColumn },
				selectedCardCodes: nextSelection,
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
				columns: moveCardsToTop(state.columns, state.dragged.cardCodes, ASX_KANBAN_DRAFTING_COLUMN),
				dragged: null,
				lifecycleByCode: assignAgents(
					state.lifecycleByCode,
					state.dragged.cardCodes,
					action.agentId ?? ASX_KANBAN_DEFAULT_AGENT_ID,
				),
				selectedCardCodes: new Set(),
			};
		}
	}
}
