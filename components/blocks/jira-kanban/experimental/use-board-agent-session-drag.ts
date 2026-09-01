"use client";

import { useCallback, useRef, useState } from "react";

import type { AgentSessionItem } from "@/components/blocks/agent-session";
import type {
	JiraIssueAgentSessionDragControl,
	JiraIssueAgentSessionDragState,
} from "@/components/blocks/jira-issue";
import {
	JIRA_ISSUE_AGENT_SESSION_DRAG_IDLE,
	type JiraIssueAgentSessionDragBinding,
} from "@/components/blocks/jira-issue/agent-session-drag";
import type { JiraIssueAgentSessionRef } from "@/components/blocks/jira-issue/agent-session-transfer";

import type { JiraKanbanCardData, JiraKanbanColumnData } from "../index";
import {
	createBoardAgentSessionDragTransaction,
	resolveBoardAgentSessionDropAction,
	updateBoardAgentSessionDragTransaction,
	type BoardAgentSessionDragOrigin,
	type BoardAgentSessionDragTransaction,
	type BoardAgentSessionDropZone,
} from "./lib/board-agent-session-drag";

const SESSION_UNLINK_DROP_HALO_PX = 24;

function collectDropZones(root: HTMLElement | null): BoardAgentSessionDropZone[] {
	if (!root) return [];

	return Array.from(
		root.querySelectorAll<HTMLElement>("[data-board-agent-session-drop-zone]"),
	).flatMap((node) => {
		const cardCode = node.closest<HTMLElement>("[data-issue-key]")?.dataset.issueKey;
		const kind = node.dataset.boardAgentSessionDropZone;
		if (!cardCode || (kind !== "issue" && kind !== "unlink")) return [];
		const rect = node.getBoundingClientRect();
		const halo = kind === "unlink" ? SESSION_UNLINK_DROP_HALO_PX : 0;
		return [{
			bounds: {
				bottom: rect.bottom + halo,
				left: rect.left - halo,
				right: rect.right + halo,
				top: rect.top - halo,
			},
			cardCode,
			kind,
		}];
	});
}

function findBoardCard(
	columns: readonly JiraKanbanColumnData[],
	cardCode: string,
): { card: JiraKanbanCardData; columnTitle: string } | undefined {
	for (const column of columns) {
		const card = column.cards.find((candidate) => candidate.code === cardCode);
		if (card) return { card, columnTitle: column.title };
	}
	return undefined;
}

export function useBoardAgentSessionDrag({
	boardColumns,
	detachedSessionsByCard,
	enabled,
	onLink,
	onMove,
	onUnlink,
	untrackedSessions,
}: Readonly<{
	boardColumns: readonly JiraKanbanColumnData[];
	detachedSessionsByCard?: Readonly<Record<string, readonly AgentSessionItem[]>>;
	enabled: boolean;
	onLink?: (session: AgentSessionItem, card: JiraKanbanCardData, columnTitle: string) => void;
	onMove?: (
		session: JiraIssueAgentSessionRef,
		sourceCard: JiraKanbanCardData,
		targetCard: JiraKanbanCardData,
		sourceColumnTitle: string,
		targetColumnTitle: string,
	) => void;
	onUnlink?: (session: JiraIssueAgentSessionRef, card: JiraKanbanCardData, columnTitle: string) => void;
	untrackedSessions?: readonly AgentSessionItem[];
}>) {
	const boardRootRef = useRef<HTMLDivElement | null>(null);
	const transactionRef = useRef<BoardAgentSessionDragTransaction<JiraIssueAgentSessionRef> | null>(null);
	const [transaction, setTransaction] = useState<BoardAgentSessionDragTransaction<JiraIssueAgentSessionRef> | null>(null);
	const [dragState, setDragState] = useState<JiraIssueAgentSessionDragState>(
		JIRA_ISSUE_AGENT_SESSION_DRAG_IDLE,
	);

	const commitDrop = useCallback((
		current: BoardAgentSessionDragTransaction<JiraIssueAgentSessionRef>,
	) => {
		const action = resolveBoardAgentSessionDropAction(current);
		if (action.kind === "none") return;

		if (action.kind === "detach") {
			const source = findBoardCard(boardColumns, action.sourceCardCode);
			if (source) onUnlink?.(current.session, source.card, source.columnTitle);
			return;
		}

		if (action.kind === "move") {
			const source = findBoardCard(boardColumns, action.sourceCardCode);
			const target = findBoardCard(boardColumns, action.targetCardCode);
			if (source && target) {
				onMove?.(
					current.session,
					source.card,
					target.card,
					source.columnTitle,
					target.columnTitle,
				);
			}
			return;
		}

		const target = findBoardCard(boardColumns, action.targetCardCode);
		const item = current.origin.kind === "untracked"
			? untrackedSessions?.find((candidate) => candidate.id === action.sessionId)
			: detachedSessionsByCard?.[current.origin.sourceCardCode]?.find(
				(candidate) => candidate.id === action.sessionId,
			);
		if (target && item) onLink?.(item, target.card, target.columnTitle);
	}, [boardColumns, detachedSessionsByCard, onLink, onMove, onUnlink, untrackedSessions]);

	const onDragStateChange = useCallback((
		origin: BoardAgentSessionDragOrigin,
		state: JiraIssueAgentSessionDragState,
	) => {
		const session = state.activities[0];
		if (state.dragging && state.pointer && session) {
			const zones = collectDropZones(boardRootRef.current);
			const current = transactionRef.current;
			const next = current && current.session.id === session.id
				? updateBoardAgentSessionDragTransaction(current, state.pointer, zones)
				: createBoardAgentSessionDragTransaction(session, origin, state.pointer, zones);
			transactionRef.current = next;
			setTransaction(next);
			setDragState(state);
			return;
		}

		const current = transactionRef.current;
		if (current && !state.cancelled) commitDrop(current);
		transactionRef.current = null;
		setTransaction(null);
		setDragState(
			state.cancelled
				? { ...JIRA_ISSUE_AGENT_SESSION_DRAG_IDLE, cancelled: true }
				: JIRA_ISSUE_AGENT_SESSION_DRAG_IDLE,
		);
	}, [commitDrop]);

	function createBinding(
		origin: BoardAgentSessionDragOrigin,
		bindingOnUnlink?: JiraIssueAgentSessionDragBinding["onUnlink"],
	): JiraIssueAgentSessionDragBinding {
		return {
			onDragStateChange: (state) => onDragStateChange(origin, state),
			onFocusedActivitiesChange: () => {},
			onUnlink: bindingOnUnlink,
		};
	}

	function getCardDragState(card: JiraKanbanCardData, columnTitle: string) {
		const origin = transaction?.origin;
		const sourceActive = Boolean(
			origin
			&& origin.kind !== "untracked"
			&& origin.sourceCardCode === card.code,
		);
		const dropTarget = transaction?.target?.cardCode === card.code
			? transaction.target.kind
			: null;
		const attachedBinding = createBinding(
			{ kind: "attached", sourceCardCode: card.code },
			(session) => {
				if (session) onUnlink?.(session, card, columnTitle);
			},
		);
		const control: JiraIssueAgentSessionDragControl | undefined = enabled
			? {
				binding: attachedBinding,
				dropTarget,
				sourceActive,
				state: sourceActive ? dragState : JIRA_ISSUE_AGENT_SESSION_DRAG_IDLE,
			}
			: undefined;

		return {
			control,
			detachedBinding: enabled
				? createBinding({ kind: "detached", sourceCardCode: card.code })
				: undefined,
			dropTarget,
		};
	}

	return {
		boardRootRef,
		dragState,
		getCardDragState,
		transaction,
		untrackedBinding: enabled ? createBinding({ kind: "untracked" }) : undefined,
	};
}
