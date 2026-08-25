"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";
import type {
	JiraKanbanAgentData,
	JiraKanbanCardData,
	JiraKanbanCardSelectModifiers,
	JiraKanbanColumnData,
} from "../index";
import { createJiraKanbanColumns } from "../jira-kanban-data";
import { BoardFilterPopover } from "./components/board-filter-popover";
import { TimelineActivityBadge } from "./components/timeline-activity-badge";
import { ExperimentalJiraKanban } from "./experimental-jira-kanban";
import { ExperimentalJiraKanbanBoardHeader } from "./experimental-board-header";
import { useBoardFilter } from "./hooks/use-board-filter";
import {
	BOARD_FILTER_DEMO_NOW_ISO,
	filterPulseTimelineByDays,
} from "./lib/board-filter";
import {
	countUnviewedTimelineSnapshots,
	EXPERIMENTAL_BOARD_LAST_VIEWED_AT,
	markTimelineViewed,
} from "./lib/timeline-activity";
import { ExperimentalPulse } from "./pulse/experimental-pulse";
import {
	PulseModeToggle,
	PulseRosterFacepile,
	type ExperimentalJiraKanbanMode,
} from "./pulse/components/pulse-mode-controls";
import { PULSE_TIMELINE } from "./pulse/data/pulse-timeline";
import {
	createJiraKanbanSelectionState,
	filterJiraKanbanColumnsByAssignee,
	getCommonJiraKanbanAgentIds,
	getJiraKanbanAssignees,
	moveJiraKanbanCardsToColumn,
	selectJiraKanbanCard,
	updateJiraKanbanCardAgentAssignment,
} from "../state";
import { BOARD_AGENTS } from "@/components/projects/jira/data/board-agents";
import { BOARD_COLUMNS } from "@/components/projects/jira/data/board-data";

const DEFAULT_CREATED_COLUMN_AGENT_ID = "readiness-checker";

/**
 * Experimental Jira Kanban page.
 *
 * Standalone fork of `components/blocks/jira-kanban/page.tsx`. It owns its own
 * board and header components so the experimental variant can diverge without
 * touching the default variant, while reusing the shared board state helpers.
 */
export interface ExperimentalJiraKanbanPageProps {
	activeCardCode?: string;
	agents?: readonly JiraKanbanAgentData[];
	ariaLabel?: string;
	boardColumns?: readonly JiraKanbanColumnData[];
	compactHeader?: boolean;
	onBoardColumnsChange?: (columns: readonly JiraKanbanColumnData[]) => void;
	onCardClick?: (card: JiraKanbanCardData, columnTitle: string) => void;
	viewTabs?: ReactNode;
}

interface DraggedCardState {
	card: JiraKanbanCardData;
	sourceColumnTitle: string;
}

export default function ExperimentalJiraKanbanPage({
	activeCardCode,
	agents = BOARD_AGENTS,
	ariaLabel = "Experimental RFP board columns. Scroll horizontally to review all statuses.",
	boardColumns: controlledBoardColumns,
	compactHeader = false,
	onBoardColumnsChange,
	onCardClick,
	viewTabs,
}: Readonly<ExperimentalJiraKanbanPageProps>) {
	const [localBoardColumns, setLocalBoardColumns] = useState<JiraKanbanColumnData[]>(
		() => createJiraKanbanColumns(BOARD_COLUMNS),
	);
	const boardColumns = controlledBoardColumns ?? localBoardColumns;
	const updateBoardColumns = useCallback((
		updater: (columns: readonly JiraKanbanColumnData[]) => readonly JiraKanbanColumnData[],
	) => {
		const nextColumns = updater(boardColumns);
		if (controlledBoardColumns !== undefined) {
			onBoardColumnsChange?.(nextColumns);
			return;
		}

		setLocalBoardColumns([...nextColumns]);
	}, [boardColumns, controlledBoardColumns, onBoardColumnsChange]);
	const [columnAgentAssignments, setColumnAgentAssignments] = useState<Record<string, string[]>>({});
	const [mode, setMode] = useState<ExperimentalJiraKanbanMode>("board");
	// Owned here, not inside Pulse: the board header's facepile is the primary
	// way in and out of the filter, and it lives above the mode switch.
	const [pulseMemberId, setPulseMemberId] = useState<string | null>(null);
	// Commitments live above the mode switch: Pulse unmounts when it is toggled
	// off, and a requested action or a captured note is something the reader
	// decided, not view state that may quietly reset with the subtree.
	const [requestedActionIds, setRequestedActionIds] = useState<ReadonlySet<string>>(() => new Set<string>());
	const [capturedLooseWorkIds, setCapturedLooseWorkIds] = useState<ReadonlySet<string>>(() => new Set<string>());
	const handleRequestAction = useCallback((action: { id: string }) => {
		setRequestedActionIds((current) => new Set(current).add(action.id));
	}, []);
	const handleCaptureLooseWork = useCallback((item: { id: string }) => {
		setCapturedLooseWorkIds((current) => new Set(current).add(item.id));
	}, []);
	const [draggedCard, setDraggedCard] = useState<DraggedCardState | null>(null);
	const [selection, setSelection] = useState(createJiraKanbanSelectionState);
	const [assignedAgentIdsByCard, setAssignedAgentIdsByCard] = useState<Record<string, string[]>>({});
	const boardFilter = useBoardFilter();
	const selectedAssigneeIds = boardFilter.selectedAssigneeIds;
	const [timelineLastViewedAt, setTimelineLastViewedAt] = useState<string | null>(
		EXPERIMENTAL_BOARD_LAST_VIEWED_AT,
	);
	const assignees = useMemo(() => getJiraKanbanAssignees(boardColumns), [boardColumns]);
	const filteredBoardColumns = useMemo(
		() => filterJiraKanbanColumnsByAssignee(boardColumns, selectedAssigneeIds),
		[boardColumns, selectedAssigneeIds],
	);
	const pulseTimeline = useMemo(
		() => filterPulseTimelineByDays(
			PULSE_TIMELINE,
			boardFilter.model.days,
			new Date(BOARD_FILTER_DEMO_NOW_ISO),
		),
		[boardFilter.model.days],
	);
	const timelineUnreadCount = countUnviewedTimelineSnapshots(
		PULSE_TIMELINE.snapshots,
		timelineLastViewedAt,
	);
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
		setSelection((current) => selectJiraKanbanCard(current, filteredBoardColumns, {
			cardCode,
			columnTitle,
			indexInColumn,
			modifiers,
		}));
	};

	// An owning workspace uses a plain click for activation, so clear any bulk
	// selection before opening it. Shift/⌘ clicks bypass this handler in
	// `JiraKanban` and continue through `onCardSelect` for range/toggle selection.
	// The standalone block keeps its original plain-click selection behavior.
	const handleCardClick = (
		_title: string,
		cardCode: string,
		card: JiraKanbanCardData,
		columnTitle: string,
	) => {
		if (onCardClick) {
			setSelection(createJiraKanbanSelectionState());
			onCardClick(card, columnTitle);
			return;
		}

		const indexInColumn = filteredBoardColumns
			.find((column) => column.title === columnTitle)
			?.cards.findIndex((card) => card.code === cardCode) ?? 0;
		handleCardSelect(cardCode, columnTitle, indexInColumn, {
			metaOrCtrlKey: false,
			shiftKey: false,
		});
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

		updateBoardColumns((prevColumns) => {
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

	const handleAssigneeFilterChange = (assigneeIds: Set<string>) => {
		setSelection(createJiraKanbanSelectionState());
		setDraggedCard(null);
		boardFilter.actions.setAssigneeIds(assigneeIds);
	};

	const markTimelineAsViewed = useCallback(() => {
		setTimelineLastViewedAt(markTimelineViewed(PULSE_TIMELINE));
	}, []);

	const handleOpenTimeline = useCallback(() => {
		markTimelineAsViewed();
		setMode("pulse");
	}, [markTimelineAsViewed]);

	const handleSelectedCardsStatusChange = (targetColumnTitle: string) => {
		updateBoardColumns((currentColumns) => moveJiraKanbanCardsToColumn(
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

	const isPulse = mode === "pulse";

	return (
		<div className="flex h-full min-h-[640px] flex-col rounded-lg bg-surface">
			<ExperimentalJiraKanbanBoardHeader
				assignees={assignees}
				compact={compactHeader}
				onSelectedAssigneeIdsChange={handleAssigneeFilterChange}
				selectedAssigneeIds={selectedAssigneeIds}
				endSlot={
					<TimelineActivityBadge
						compact={compactHeader}
						onSelect={handleOpenTimeline}
						unreadCount={isPulse ? 0 : timelineUnreadCount}
					/>
				}
				facepile={isPulse ? (
					<PulseRosterFacepile
						members={PULSE_TIMELINE.members}
						onSelectedMemberIdChange={setPulseMemberId}
						selectedMemberId={pulseMemberId}
					/>
				) : undefined}
				filterControl={
					<BoardFilterPopover
						actions={boardFilter.actions}
						assignees={assignees}
						compact={compactHeader}
						model={boardFilter.model}
					/>
				}
				modeToggle={
					<PulseModeToggle
						active={isPulse}
						onToggle={() => {
							if (isPulse) {
								setMode("board");
								return;
							}
							handleOpenTimeline();
						}}
					/>
				}
				viewTabs={viewTabs}
			/>
			{isPulse ? (
				<ExperimentalPulse
					capturedLooseWorkIds={capturedLooseWorkIds}
					onCaptureLooseWork={handleCaptureLooseWork}
					onRequestAction={handleRequestAction}
					onSelectedMemberIdChange={setPulseMemberId}
					requestedActionIds={requestedActionIds}
					selectedMemberId={pulseMemberId}
					timeline={pulseTimeline}
				/>
			) : (
				<div className="flex min-h-0 min-w-0 flex-1">
					<ExperimentalJiraKanban
						activeCardCode={activeCardCode}
						agents={agents}
						ariaLabel={ariaLabel}
						assignedAgentIdsByColumn={columnAgentAssignments}
						boardColumns={filteredBoardColumns}
						draggedCardCode={draggedCard?.card.code ?? null}
						selectedCardCodes={selection.selectedCardCodes}
						onCardClick={handleCardClick}
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
			)}
		</div>
	);
}
