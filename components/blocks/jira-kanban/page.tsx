"use client";

import { useMemo, useState } from "react";
import {
	JiraKanban,
	createJiraKanbanColumns,
	type JiraKanbanCardData,
	type JiraKanbanCardSelectModifiers,
	type JiraKanbanColumnData,
} from "./index";
import {
	createJiraKanbanSelectionState,
	getCommonJiraKanbanAgentIds,
	moveJiraKanbanCardsToColumn,
	selectJiraKanbanCard,
	updateJiraKanbanCardAgentAssignment,
} from "./state";
import { BOARD_AGENTS } from "@/components/projects/jira/data/board-agents";
import { BOARD_COLUMNS } from "@/components/projects/jira/data/board-data";

const DEFAULT_CREATED_COLUMN_AGENT_ID = "readiness-checker";

interface DraggedCardState {
	card: JiraKanbanCardData;
	sourceColumnTitle: string;
}

export default function JiraKanbanPage() {
	const [boardColumns, setBoardColumns] = useState<JiraKanbanColumnData[]>(() => createJiraKanbanColumns(BOARD_COLUMNS));
	const [columnAgentAssignments, setColumnAgentAssignments] = useState<Record<string, string[]>>({});
	const [draggedCard, setDraggedCard] = useState<DraggedCardState | null>(null);
	const [selection, setSelection] = useState(createJiraKanbanSelectionState);
	const [assignedAgentIdsByCard, setAssignedAgentIdsByCard] = useState<Record<string, string[]>>({});
	const selectedAgentIds = useMemo(
		() => getCommonJiraKanbanAgentIds(assignedAgentIdsByCard, selection.selectedCardCodes),
		[assignedAgentIdsByCard, selection.selectedCardCodes],
	);

	const handleCardSelect = (
		cardCode: string,
		columnTitle: string,
		indexInColumn: number,
		modifiers: JiraKanbanCardSelectModifiers,
	) => {
		setSelection((current) => selectJiraKanbanCard(current, boardColumns, {
			cardCode,
			columnTitle,
			indexInColumn,
			modifiers,
		}));
	};

	const handleCardDragStart = (card: JiraKanbanCardData, sourceColumnTitle: string) => {
		if (!selection.selectedCardCodes.has(card.code)) {
			setSelection(createJiraKanbanSelectionState());
		}
		setDraggedCard({ card, sourceColumnTitle });
	};

	const handleCardDrop = (targetColumnTitle: string) => {
		if (!draggedCard || draggedCard.sourceColumnTitle === targetColumnTitle) {
			setDraggedCard(null);
			return;
		}

		const isMultiDrag = selection.selectedCardCodes.has(draggedCard.card.code)
			&& selection.selectedCardCodes.size > 1;
		const draggedCardCodes = isMultiDrag
			? [...selection.selectedCardCodes]
			: [draggedCard.card.code];

		setBoardColumns((prevColumns) => {
			const movableCardCodes = draggedCardCodes.filter((cardCode) => prevColumns.some((column) => (
				column.title !== targetColumnTitle && column.cards.some((card) => card.code === cardCode)
			)));
			return moveJiraKanbanCardsToColumn(prevColumns, movableCardCodes, targetColumnTitle);
		});

		if (isMultiDrag) {
			setSelection(createJiraKanbanSelectionState());
		}
		setDraggedCard(null);
	};

	const handleCardDragEnd = () => {
		setDraggedCard(null);
	};

	const handleSelectedCardsStatusChange = (targetColumnTitle: string) => {
		setBoardColumns((currentColumns) => moveJiraKanbanCardsToColumn(
			currentColumns,
			[...selection.selectedCardCodes],
			targetColumnTitle,
		));
	};

	const handleSelectedCardsAgentAssignmentChange = (agentId: string, assigned: boolean) => {
		setAssignedAgentIdsByCard((currentAssignments) => updateJiraKanbanCardAgentAssignment(
			currentAssignments,
			selection.selectedCardCodes,
			agentId,
			assigned,
		));
	};

	const handleToggleColumnAgent = (columnTitle: string, agentId: string) => {
		setColumnAgentAssignments((prevAssignments) => {
			const assignedAgentIds = prevAssignments[columnTitle] ?? [];
			const hasAgent = assignedAgentIds.includes(agentId);
			const nextAgentIds = hasAgent
				? assignedAgentIds.filter((assignedAgentId) => assignedAgentId !== agentId)
				: [...assignedAgentIds, agentId];

			return {
				...prevAssignments,
				[columnTitle]: nextAgentIds,
			};
		});
	};

	const handleCreateColumnAgent = (columnTitle: string) => {
		setColumnAgentAssignments((prevAssignments) => {
			const assignedAgentIds = prevAssignments[columnTitle] ?? [];

			if (assignedAgentIds.includes(DEFAULT_CREATED_COLUMN_AGENT_ID)) {
				return prevAssignments;
			}

			return {
				...prevAssignments,
				[columnTitle]: [...assignedAgentIds, DEFAULT_CREATED_COLUMN_AGENT_ID],
			};
		});
	};

	return (
		<div className="flex h-full min-h-[640px] flex-col rounded-lg bg-surface p-4 md:p-5">
			<div className="min-w-0">
				<JiraKanban
					agents={BOARD_AGENTS}
					ariaLabel="RFP board columns. Scroll horizontally to review all statuses."
					assignedAgentIdsByColumn={columnAgentAssignments}
					boardColumns={boardColumns}
					draggedCardCode={draggedCard?.card.code ?? null}
					selectedCardCodes={selection.selectedCardCodes}
					onCardSelect={handleCardSelect}
					onCardDragStart={handleCardDragStart}
					onCardDrop={handleCardDrop}
					onCardDragEnd={handleCardDragEnd}
					onCreateAgent={handleCreateColumnAgent}
					onToggleColumnAgent={handleToggleColumnAgent}
					paddingTop={0}
					selectionToolbar={{
						onAgentAssignmentChange: handleSelectedCardsAgentAssignmentChange,
						onClearSelection: () => setSelection(createJiraKanbanSelectionState()),
						onStatusChange: handleSelectedCardsStatusChange,
						selectedAgentIds,
					}}
				/>
			</div>
		</div>
	);
}
