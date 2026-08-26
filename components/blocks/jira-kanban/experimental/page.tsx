"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";

import { useOptionalRovoChat } from "@/app/contexts";
import type {
	JiraKanbanAgentData,
	JiraKanbanCardData,
	JiraKanbanCardSelectModifiers,
	JiraKanbanColumnData,
} from "../index";
import { createJiraKanbanColumns } from "../jira-kanban-data";
import { BoardFilterPopover } from "./components/board-filter-popover";
import { ExperimentalJiraKanban } from "./experimental-jira-kanban";
import { ExperimentalJiraKanbanBoardHeader } from "./experimental-board-header";
import { useBoardFilter, type BoardFilterActions } from "./hooks/use-board-filter";
import {
	BOARD_FILTER_DEMO_NOW_ISO,
	filterPulseTimelineByDays,
} from "./lib/board-filter";
import {
	PULSE_PRESENTATION_MEMBER_ID,
	mergeBoardFilterAssignees,
	promoteAssignee,
	toInsightsAssigneeIds,
	toPulseMemberAssigneeIds,
	toPulseMemberId,
} from "./lib/pulse-roster-filter";
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
	appendPulseAnswer,
	resolvePulseScopeFromSelections,
	toPulseAnswer,
	toPulseScopeKey,
	toPulseSuggestedQuestions,
} from "./pulse/data/pulse-scopes";
import { scopeTimelineToWorkItemKeys } from "./pulse/hooks/use-pulse-timeline";
import type { PulseAnswer, PulseLooseWork, PulseWorkItem } from "./pulse/types";
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
const PULSE_MEMBER_IDS = new Set(PULSE_TIMELINE.members.map((member) => member.id));

/** Stable identity, so an unscoped article does not re-render on every tick. */
const EMPTY_ANSWERS: readonly PulseAnswer[] = [];

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
	insightsDefaultAssigneeIds?: readonly string[];
	isInsightsWorkItemInteractive?: (workItem: PulseWorkItem) => boolean;
	isLooseWorkResumable?: (item: PulseLooseWork) => boolean;
	mode?: ExperimentalJiraKanbanMode;
	onBoardColumnsChange?: (columns: readonly JiraKanbanColumnData[]) => void;
	onCardClick?: (card: JiraKanbanCardData, columnTitle: string) => void;
	onInsightsWorkItemClick?: (workItem: PulseWorkItem) => void;
	onModeChange?: (mode: ExperimentalJiraKanbanMode) => void;
	onResumeLooseWork?: (item: PulseLooseWork) => void;
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
	insightsDefaultAssigneeIds,
	isInsightsWorkItemInteractive,
	isLooseWorkResumable,
	mode: controlledMode,
	onBoardColumnsChange,
	onCardClick,
	onInsightsWorkItemClick,
	onModeChange,
	onResumeLooseWork,
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
	const [localMode, setLocalMode] = useState<ExperimentalJiraKanbanMode>("board");
	const mode = controlledMode ?? localMode;
	const updateMode = useCallback((nextMode: ExperimentalJiraKanbanMode) => {
		if (controlledMode === undefined) {
			setLocalMode(nextMode);
		}
		onModeChange?.(nextMode);
	}, [controlledMode, onModeChange]);
	const rovoChat = useOptionalRovoChat();
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
	// Questions are stored per scope rather than cleared when the scope changes.
	// An answer about Sprint 24 read as a reply to a question asked of PAY-90
	// would be a lie the page told by omission, and keying the record is how
	// that is prevented without an effect that resets state behind the reader.
	const [answersByScope, setAnswersByScope] = useState<Readonly<Record<string, readonly PulseAnswer[]>>>({});
	const [draggedCard, setDraggedCard] = useState<DraggedCardState | null>(null);
	const [selection, setSelection] = useState(createJiraKanbanSelectionState);
	const [assignedAgentIdsByCard, setAssignedAgentIdsByCard] = useState<Record<string, string[]>>({});
	const boardFilter = useBoardFilter();
	const selectedAssigneeIds = boardFilter.selectedAssigneeIds;
	const [timelineLastViewedAt, setTimelineLastViewedAt] = useState<string | null>(
		EXPERIMENTAL_BOARD_LAST_VIEWED_AT,
	);
	const markTimelineAsViewed = useCallback(() => {
		setTimelineLastViewedAt(markTimelineViewed(PULSE_TIMELINE));
	}, []);
	const handleOpenTimeline = useCallback(() => {
		markTimelineAsViewed();
		const nextAssigneeIds = insightsDefaultAssigneeIds === undefined
			? toInsightsAssigneeIds(selectedAssigneeIds, PULSE_MEMBER_IDS)
			: new Set(insightsDefaultAssigneeIds);
		setSelection(createJiraKanbanSelectionState());
		setDraggedCard(null);
		boardFilter.actions.setAssigneeIds(nextAssigneeIds);
		updateMode("pulse");
	}, [boardFilter.actions, insightsDefaultAssigneeIds, markTimelineAsViewed, selectedAssigneeIds, updateMode]);
	// Choosing an epic or a sprint is a request to read the brief, and the brief
	// only exists in Insights. Without this, picking one from the board filter
	// recomputes the scope and leaves the reader on the board looking at
	// columns — the feature silently doing nothing.
	//
	// It hangs off the filter's own actions rather than an effect on `scope`:
	// the mode change is caused by the reader's click, and deriving it from
	// state afterwards would also fire when a scope is restored on mount.
	// Parent and Sprint go through handleOpenTimeline so scoped entry gets the
	// same Venn default as the Insights toggle.
	const filterActions = useMemo((): BoardFilterActions => ({
		...boardFilter.actions,
		toggleValue: (fieldId, valueId) => {
			boardFilter.actions.toggleValue(fieldId, valueId);
			if (fieldId === "parent" || fieldId === "sprint") {
				handleOpenTimeline();
			}
		},
	}), [boardFilter.actions, handleOpenTimeline]);
	// Insights reads Parent and Sprint off the same filter the board reads its
	// own fields off. One control, one selection model — the scope is derived
	// here rather than owned separately, so the popover and the article cannot
	// disagree about what the page is showing.
	const scope = useMemo(
		() => resolvePulseScopeFromSelections(boardFilter.model.selectedValueIdsByField),
		[boardFilter.model.selectedValueIdsByField],
	);
	const scopeKey = toPulseScopeKey(scope);
	const answers = answersByScope[scopeKey] ?? EMPTY_ANSWERS;
	const handleAsk = useCallback((question: string) => {
		setAnswersByScope((current) => {
			const resolved = resolvePulseScopeFromSelections(boardFilter.model.selectedValueIdsByField);
			const key = toPulseScopeKey(resolved);
			return {
				...current,
				[key]: appendPulseAnswer(
					current[key] ?? EMPTY_ANSWERS,
					toPulseAnswer(question, resolved, toPulseSuggestedQuestions(resolved)),
				),
			};
		});
	}, [boardFilter.model.selectedValueIdsByField]);
	const assignees = useMemo(
		() => promoteAssignee(getJiraKanbanAssignees(boardColumns), PULSE_PRESENTATION_MEMBER_ID),
		[boardColumns],
	);
	const filterAssignees = useMemo(
		() => mode === "pulse"
			? mergeBoardFilterAssignees(assignees, PULSE_TIMELINE.members)
			: assignees,
		[assignees, mode],
	);
	// Pulse faces are a shorthand for Filter → assignee. The roster reads the
	// same field the popover writes, so the Filter button is pressed whenever
	// a human or agent face is selected.
	const pulseMemberId = toPulseMemberId(selectedAssigneeIds, PULSE_MEMBER_IDS);
	const filteredBoardColumns = useMemo(
		() => filterJiraKanbanColumnsByAssignee(boardColumns, selectedAssigneeIds),
		[boardColumns, selectedAssigneeIds],
	);
	// Days first, then scope. Both narrow the same timeline and both come from
	// the same control, so they compose rather than competing: a sprint scope
	// inside a "last 3 days" window is a legitimate thing to ask for.
	const pulseTimeline = useMemo(
		() => scopeTimelineToWorkItemKeys(
			filterPulseTimelineByDays(
				PULSE_TIMELINE,
				boardFilter.model.days,
				new Date(BOARD_FILTER_DEMO_NOW_ISO),
			),
			scope === null ? null : new Set(scope.workItemKeys),
		),
		[boardFilter.model.days, scope],
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

	const handlePulseMemberChange = (memberId: string | null) => {
		handleAssigneeFilterChange(toPulseMemberAssigneeIds(memberId));
	};

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
				facepile={isPulse ? (
					<PulseRosterFacepile
						members={PULSE_TIMELINE.members}
						onSelectedMemberIdChange={handlePulseMemberChange}
						selectedMemberId={pulseMemberId}
					/>
				) : undefined}
				filterControl={
					<BoardFilterPopover
						actions={filterActions}
						assignees={filterAssignees}
						compact={compactHeader}
						model={boardFilter.model}
					/>
				}
				modeToggle={
					<PulseModeToggle
						active={isPulse}
						onToggle={() => {
							if (isPulse) {
								rovoChat?.closeChat();
								updateMode("board");
								return;
							}
							handleOpenTimeline();
						}}
						unreadCount={isPulse ? 0 : timelineUnreadCount}
					/>
				}
				viewTabs={viewTabs}
			/>
			{isPulse ? (
				<ExperimentalPulse
					answers={answers}
					capturedLooseWorkIds={capturedLooseWorkIds}
					isLooseWorkResumable={isLooseWorkResumable}
					isWorkItemInteractive={isInsightsWorkItemInteractive}
					onAsk={handleAsk}
					onCaptureLooseWork={handleCaptureLooseWork}
					onRequestAction={handleRequestAction}
					onResumeLooseWork={onResumeLooseWork}
					onSelectedMemberIdChange={handlePulseMemberChange}
					onWorkItemClick={onInsightsWorkItemClick}
					requestedActionIds={requestedActionIds}
					scope={scope}
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
