"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";

import type { JiraIssueGenerativeActionRequest } from "@/components/blocks/jira-issue";
import type { JiraKanbanCardData, JiraKanbanCardSelectModifiers } from "@/components/blocks/jira-kanban";
import {
	ASX_KANBAN_DEFAULT_AGENT_ID,
	ASX_KANBAN_DRAFTING_COLUMN,
	getAsxGenerativeActivityId,
} from "../data/kanban-data";
import {
	asxKanbanReducer,
	createInitialAsxKanbanState,
	resolveAsxKanbanColumns,
} from "../lib/kanban-lifecycle";

const GENERATING_DELAY_MS = 1_200;
const COMPLETION_DELAY_MS = 5_500;
const INPUT_RESUME_COMPLETION_DELAY_MS = 2_500;
const NEEDS_INPUT_CARD_CODE = "RFP-101";

type TimerHandle = number;

interface UseAsxKanbanLifecycleOptions {
	onNonAgentAction?: (request: JiraIssueGenerativeActionRequest, card: JiraKanbanCardData) => void;
}

export function useAsxKanbanLifecycle({
	onNonAgentAction,
}: UseAsxKanbanLifecycleOptions = {}) {
	const [state, dispatch] = useReducer(asxKanbanReducer, undefined, createInitialAsxKanbanState);
	const stateRef = useRef(state);
	const timersRef = useRef(new Map<string, Set<TimerHandle>>());

	useEffect(() => {
		stateRef.current = state;
	}, [state]);

	const clearCardTimers = useCallback((cardCode: string) => {
		const timers = timersRef.current.get(cardCode);
		if (!timers) return;
		for (const timer of timers) window.clearTimeout(timer);
		timersRef.current.delete(cardCode);
	}, []);

	const schedule = useCallback((cardCode: string, delayMs: number, callback: () => void) => {
		const timer = window.setTimeout(() => {
			timersRef.current.get(cardCode)?.delete(timer);
			callback();
		}, delayMs);
		const cardTimers = timersRef.current.get(cardCode) ?? new Set<TimerHandle>();
		cardTimers.add(timer);
		timersRef.current.set(cardCode, cardTimers);
	}, []);

	useEffect(() => () => {
		for (const timers of timersRef.current.values()) {
			for (const timer of timers) window.clearTimeout(timer);
		}
		timersRef.current.clear();
	}, []);

	const startCards = useCallback((cardCodes: readonly string[], agentId: string) => {
		for (const cardCode of cardCodes) {
			clearCardTimers(cardCode);
			dispatch({ type: "assign-agent", cardCodes: [cardCode], agentId });
			schedule(cardCode, GENERATING_DELAY_MS, () => {
				dispatch({ type: "advance-generating", cardCode });
			});
			schedule(cardCode, COMPLETION_DELAY_MS, () => {
				dispatch({ type: cardCode === NEEDS_INPUT_CARD_CODE ? "request-input" : "complete", cardCode });
			});
		}
	}, [clearCardTimers, schedule]);

	const handleGenerativeActionSubmit = useCallback((
		request: JiraIssueGenerativeActionRequest,
		card: JiraKanbanCardData,
	) => {
		if (request.kind === "ask-rovo") {
			onNonAgentAction?.(request, card);
			return;
		}
		startCards([card.code], getAsxGenerativeActivityId(request));
	}, [onNonAgentAction, startCards]);

	const handleCardSelect = useCallback((
		cardCode: string,
		columnTitle: string,
		indexInColumn: number,
		modifiers: JiraKanbanCardSelectModifiers,
	) => {
		dispatch({ type: "select", cardCode, columnTitle, indexInColumn, modifiers });
	}, []);

	const handleCardDragStart = useCallback((card: JiraKanbanCardData, sourceColumnTitle: string) => {
		dispatch({ type: "drag-start", cardCode: card.code, sourceColumnTitle });
	}, []);

	const handleCardDrop = useCallback((targetColumnTitle: string) => {
		const dragged = stateRef.current.dragged;
		if (dragged && targetColumnTitle === ASX_KANBAN_DRAFTING_COLUMN) {
			const codes = [...dragged.cardCodes];
			dispatch({ type: "drop", targetColumnTitle, agentId: ASX_KANBAN_DEFAULT_AGENT_ID });
			for (const cardCode of codes) {
				clearCardTimers(cardCode);
				schedule(cardCode, GENERATING_DELAY_MS, () => dispatch({ type: "advance-generating", cardCode }));
				schedule(cardCode, COMPLETION_DELAY_MS, () => {
					dispatch({ type: cardCode === NEEDS_INPUT_CARD_CODE ? "request-input" : "complete", cardCode });
				});
			}
			return;
		}
		dispatch({ type: "drop", targetColumnTitle });
	}, [clearCardTimers, schedule]);

	const handleQuestionSubmit = useCallback((_activity: unknown, _answers: unknown, card: JiraKanbanCardData) => {
		clearCardTimers(card.code);
		dispatch({ type: "answer-question", cardCode: card.code });
		schedule(card.code, INPUT_RESUME_COMPLETION_DELAY_MS, () => {
			dispatch({ type: "complete", cardCode: card.code });
		});
	}, [clearCardTimers, schedule]);

	return {
		boardColumns: useMemo(() => resolveAsxKanbanColumns(state), [state]),
		draggedCardCode: state.dragged?.cardCodes[0] ?? null,
		handleCardDragEnd: useCallback(() => dispatch({ type: "drag-end" }), []),
		handleCardDragStart,
		handleCardDrop,
		handleCardSelect,
		handleGenerativeActionSubmit,
		handleQuestionSubmit,
		selectedCardCodes: state.selectedCardCodes,
	};
}
