"use client";

import { useMemo } from "react";

import { resolveAgentSessionWorkItemKey } from "@/components/blocks/agent-session";
import type { AgentSessionItem, UntrackedWorkTriage } from "@/components/blocks/agent-session";
import type { JiraKanbanCardData, JiraKanbanColumnData } from "@/components/blocks/jira-kanban";

export interface BoardUntrackedAttachTarget {
	readonly card: JiraKanbanCardData;
	readonly columnTitle: string;
}

export function locateBoardUntrackedTarget(
	columns: readonly JiraKanbanColumnData[],
	workItemKey: string | undefined,
): BoardUntrackedAttachTarget | undefined {
	if (workItemKey === undefined) {
		return undefined;
	}

	for (const column of columns) {
		const card = column.cards.find((candidate: JiraKanbanCardData) => (
			candidate.code === workItemKey
		));
		if (card !== undefined) {
			return { card, columnTitle: column.title };
		}
	}

	return undefined;
}

export function createBoardUntrackedTriage(
	input: Readonly<{
		boardColumns: readonly JiraKanbanColumnData[];
		onArchive: (item: { id: string }) => void;
		onCreateWorkItem: (item: { id: string }) => void;
		onLink: ((
			session: AgentSessionItem,
			card: JiraKanbanCardData,
			columnTitle: string,
		) => void) | undefined;
	}>,
): UntrackedWorkTriage<BoardUntrackedAttachTarget> {
	return {
		archive: (session: AgentSessionItem) => {
			input.onArchive(session);
		},
		attach: (session: AgentSessionItem, target: BoardUntrackedAttachTarget) => {
			input.onLink?.(session, target.card, target.columnTitle);
		},
		createFrom: (session: AgentSessionItem) => {
			input.onCreateWorkItem(session);
		},
		locateTarget: (session: AgentSessionItem) => {
			if (input.onLink === undefined) {
				return undefined;
			}

			return locateBoardUntrackedTarget(
				input.boardColumns,
				resolveAgentSessionWorkItemKey(session),
			);
		},
	};
}

export function useBoardUntrackedTriage(
	input: Readonly<{
		boardColumns: readonly JiraKanbanColumnData[];
		onArchive: (item: { id: string }) => void;
		onCreateWorkItem: (item: { id: string }) => void;
		onLink: ((
			session: AgentSessionItem,
			card: JiraKanbanCardData,
			columnTitle: string,
		) => void) | undefined;
	}>,
): UntrackedWorkTriage<BoardUntrackedAttachTarget> {
	const { boardColumns, onArchive, onCreateWorkItem, onLink } = input;
	return useMemo(
		() =>
			createBoardUntrackedTriage({
				boardColumns,
				onArchive,
				onCreateWorkItem,
				onLink,
			}),
		[boardColumns, onArchive, onCreateWorkItem, onLink],
	);
}
