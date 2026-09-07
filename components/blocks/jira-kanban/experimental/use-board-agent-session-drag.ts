"use client";

import { useCallback, useMemo, useRef, useState } from "react";

import type { AgentSessionItem } from "@/components/blocks/agent-session";
import { createSessionCohort } from "@/components/blocks/agent-session/session-cohort";
import type {
	JiraIssueAgentSessionDragControl,
	JiraIssueAgentSessionDragState,
} from "@/components/blocks/jira-issue";
import {
	JIRA_ISSUE_AGENT_SESSION_DRAG_IDLE,
	type JiraIssueAgentSessionDragBinding,
	type JiraIssueAgentSessionTransferMember,
} from "@/components/blocks/jira-issue/agent-session-drag";
import type { JiraIssueAgentSessionRef } from "@/components/blocks/jira-issue/agent-session-transfer";

import type { JiraListInsertion } from "@/components/blocks/jira-list/jira-list-types";
import type { JiraKanbanCardData, JiraKanbanColumnData } from "../index";
import {
	createBoardAgentSessionDragTransaction,
	parseListRowDropZone,
	resolveBoardAgentSessionDropAction,
	toListSessionDropIntent,
	updateBoardAgentSessionDragTransaction,
	type BoardAgentSessionDragOrigin,
	type BoardAgentSessionDragTransaction,
	type BoardAgentSessionDropBounds,
	type BoardAgentSessionDropZone,
} from "./lib/board-agent-session-drag";
import type { SessionDropReceipt } from "@/components/blocks/jira-dropzone";

import { toSessionDropReceipt } from "./lib/session-drop-receipt";
import {
	executeSessionTransferPlan,
	planSessionTransfer,
	resolveDragEnablement,
	type SessionTransferLookups,
	type SessionTransferPorts,
} from "./lib/session-transfer-plan";

const SESSION_UNLINK_DROP_HALO_PX = 24;

function clipBoundsToScrollport(
	node: HTMLElement,
	rect: DOMRect,
): BoardAgentSessionDropBounds | null {
	const scrollport = node.closest<HTMLElement>("[data-testid='jira-list-table-scroll']");
	if (!scrollport) {
		return {
			bottom: rect.bottom,
			left: rect.left,
			right: rect.right,
			top: rect.top,
		};
	}

	const clip = scrollport.getBoundingClientRect();
	const header = scrollport.querySelector("thead");
	const headerBottom = header?.getBoundingClientRect().bottom ?? clip.top;
	const top = Math.max(rect.top, headerBottom, clip.top);
	const bottom = Math.min(rect.bottom, clip.bottom);
	const left = Math.max(rect.left, clip.left);
	const right = Math.min(rect.right, clip.right);
	if (bottom <= top || right <= left) {
		return null;
	}

	return { bottom, left, right, top };
}

function collectDropZones(root: HTMLElement | null): BoardAgentSessionDropZone[] {
	if (!root) return [];

	return Array.from(
		root.querySelectorAll<HTMLElement>("[data-board-agent-session-drop-zone]"),
	).flatMap((node): BoardAgentSessionDropZone[] => {
		const kind = node.dataset.boardAgentSessionDropZone;
		const rect = node.getBoundingClientRect();
		if (kind === "create") {
			const columnTitle = node.dataset.boardAgentSessionColumnTitle;
			return columnTitle ? [{
				bounds: {
					bottom: rect.bottom,
					left: rect.left,
					right: rect.right,
					top: rect.top,
				},
				columnTitle,
				kind: "create",
			}] : [];
		}
		if (kind === "untracked") {
			return [{
				bounds: {
					bottom: rect.bottom,
					left: rect.left,
					right: rect.right,
					top: rect.top,
				},
				kind: "untracked",
			}];
		}
		const issueKey = node.closest<HTMLElement>("[data-issue-key]")?.dataset.issueKey;
		if (kind === "list-row") {
			const bounds = clipBoundsToScrollport(node, rect);
			if (!bounds) return [];
			const zone = parseListRowDropZone(issueKey, node.dataset.listRowIndex, bounds);
			return zone ? [zone] : [];
		}
		if (!issueKey || (kind !== "issue" && kind !== "unlink")) return [];
		const halo = kind === "unlink" ? SESSION_UNLINK_DROP_HALO_PX : 0;
		return [{
			bounds: {
				bottom: rect.bottom + halo,
				left: rect.left - halo,
				right: rect.right + halo,
				top: rect.top - halo,
			},
			cardCode: issueKey,
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
	onCreate,
	onCreateWellReceive,
	onListCreate,
	onLink,
	onMove,
	onUnlink,
	untrackedSessions,
}: Readonly<{
	boardColumns: readonly JiraKanbanColumnData[];
	detachedSessionsByCard?: Readonly<Record<string, readonly AgentSessionItem[]>>;
	onCreate?: (session: AgentSessionItem, columnTitle: string) => void;
	onCreateWellReceive?: (receipt: SessionDropReceipt) => void;
	onListCreate?: (
		session: AgentSessionItem,
		insertion: JiraListInsertion,
	) => void;
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
	const transactionRef = useRef<BoardAgentSessionDragTransaction<JiraIssueAgentSessionTransferMember> | null>(null);
	const [transaction, setTransaction] = useState<BoardAgentSessionDragTransaction<JiraIssueAgentSessionTransferMember> | null>(null);
	const [dragState, setDragState] = useState<JiraIssueAgentSessionDragState>(
		JIRA_ISSUE_AGENT_SESSION_DRAG_IDLE,
	);
	const ports: SessionTransferPorts = {
		onCreate,
		onLink,
		onListCreate,
		onMove,
		onUnlink,
	};
	const enablement = resolveDragEnablement(ports);

	const commitDrop = useCallback((
		current: BoardAgentSessionDragTransaction<JiraIssueAgentSessionTransferMember>,
	) => {
		const lookups: SessionTransferLookups = {
			findCard: (cardCode) => findBoardCard(boardColumns, cardCode),
			resolveAttached: (_sourceCardCode, sessionId) => (
				current.cohort.members.find((member) => member.id === sessionId)
			),
			resolveTransferable: (origin, sessionId) => {
				if (origin.kind === "untracked") {
					return untrackedSessions?.find((candidate) => candidate.id === sessionId);
				}
				if (origin.kind === "detached") {
					return detachedSessionsByCard?.[origin.sourceCardCode]?.find(
						(candidate) => candidate.id === sessionId,
					);
				}
				return undefined;
			},
		};
		const plan = planSessionTransfer(
			resolveBoardAgentSessionDropAction(current),
			current.origin,
			lookups,
		);
		executeSessionTransferPlan(plan, ports);
		const receipt = toSessionDropReceipt({
			plan,
			pointer: current.pointer,
		});
		if (receipt) {
			onCreateWellReceive?.(receipt);
		}
	}, [
		boardColumns,
		detachedSessionsByCard,
		onCreate,
		onCreateWellReceive,
		onLink,
		onListCreate,
		onMove,
		onUnlink,
		untrackedSessions,
	]);

	const onDragStateChange = useCallback((
		origin: BoardAgentSessionDragOrigin,
		state: JiraIssueAgentSessionDragState,
	) => {
		if (state.dragging && state.pointer) {
			const cohort = createSessionCohort(state.transfer.members);
			if (cohort === null) {
				return;
			}
			const zones = collectDropZones(boardRootRef.current);
			const current = transactionRef.current;
			const next = current && current.cohort.key === cohort.key
				? updateBoardAgentSessionDragTransaction(current, state.pointer, zones)
				: createBoardAgentSessionDragTransaction(cohort, origin, state.pointer, zones);
			transactionRef.current = next;
			setTransaction(next);
			setDragState(state);
			return;
		}

		const current = transactionRef.current;
		if (current && !state.cancelled) {
			const finalTransaction = state.pointer
				? updateBoardAgentSessionDragTransaction(
					current,
					state.pointer,
					collectDropZones(boardRootRef.current),
				)
				: current;
			commitDrop(finalTransaction);
		}
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
		const target = transaction?.target;
		const dropTarget = target
			&& (target.kind === "attach" || target.kind === "unlink")
			&& target.cardCode === card.code
			? target.kind
			: null;
		const attachedBinding = createBinding(
			{ kind: "attached", sourceCardCode: card.code },
			(session) => {
				if (session) onUnlink?.(session, card, columnTitle);
			},
		);
		const control: JiraIssueAgentSessionDragControl | undefined = enablement.attached
			? {
				binding: attachedBinding,
				dropTarget,
				sourceActive,
				state: sourceActive ? dragState : JIRA_ISSUE_AGENT_SESSION_DRAG_IDLE,
			}
			: undefined;

		return {
			control,
			detachedBinding: enablement.transferable
				? createBinding({ kind: "detached", sourceCardCode: card.code })
				: undefined,
			dropTarget,
		};
	}

	const draggingIds = useMemo(() => {
		if (!dragState.dragging) {
			return new Set<string>();
		}
		return new Set(dragState.transfer.members.map((member) => member.id));
	}, [dragState]);

	return {
		boardRootRef,
		draggingIds,
		dragState,
		enablement,
		getCardDragState,
		listDropIntent: onLink || onListCreate
			? toListSessionDropIntent(transaction?.target ?? null)
			: undefined,
		transaction,
		untrackedBinding: enablement.transferable ? createBinding({ kind: "untracked" }) : undefined,
	};
}

export type BoardAgentSessionDrag = ReturnType<typeof useBoardAgentSessionDrag>;
