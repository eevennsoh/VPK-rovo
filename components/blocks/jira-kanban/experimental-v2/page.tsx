"use client";

import {
	useCallback,
	useImperativeHandle,
	useMemo,
	useState,
	type ReactNode,
	type Ref,
} from "react";

import { useOptionalRovoChat } from "@/app/contexts";
import type {
	JiraKanbanAgentData,
	JiraKanbanAssigneeData,
	JiraKanbanCardData,
	JiraKanbanCardSelectModifiers,
	JiraKanbanColumnData,
	JiraKanbanProps,
} from "../index";
import { createJiraKanbanColumns } from "../jira-kanban-data";
import { BoardFilterPopover } from "../experimental/components/board-filter-popover";
import { ExperimentalV2JiraKanban } from "./experimental-v2-jira-kanban";
import { ExperimentalV2JiraKanbanBoardHeader } from "./experimental-v2-board-header";
import { useBoardFilter, type BoardFilterActions } from "../experimental/hooks/use-board-filter";
import {
	BOARD_FILTER_DEMO_NOW_ISO,
	filterPulseTimelineByDays,
} from "../experimental/lib/board-filter";
import {
	fillBoardFacepileAssignees,
	mergeBoardFilterAssignees,
	toInsightsAssigneeIds,
	toPulseMemberAssigneeIds,
	toPulseMemberId,
} from "../experimental/lib/pulse-roster-filter";
import {
	countUnviewedTimelineSnapshots,
	EXPERIMENTAL_BOARD_LAST_VIEWED_AT,
	markTimelineViewed,
} from "../experimental/lib/timeline-activity";
import { ExperimentalPulse } from "../experimental/pulse/experimental-pulse";
import {
	PulseModeToggle,
	PulseRosterFacepile,
	type ExperimentalJiraKanbanMode as ExperimentalV2JiraKanbanMode,
} from "../experimental/pulse/components/pulse-mode-controls";
import { PULSE_TIMELINE } from "../experimental/pulse/data/pulse-timeline";
import {
	appendPulseAnswer,
	resolvePulseScopeFromSelections,
	toPulseAnswer,
	toPulseScopeKey,
	toPulseSuggestedQuestions,
} from "../experimental/pulse/data/pulse-scopes";
import { scopeTimelineToWorkItemKeys } from "../experimental/pulse/hooks/use-pulse-timeline";
import {
	filterPulseLooseWorkByMember,
	toPulseSessionHandlers,
	toPulseSessionItems,
} from "../experimental/pulse/lib/pulse-sessions";
import type { PulseAnswer, PulseLooseWork, PulseWorkItem } from "../experimental/pulse/types";
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
 * Experimental v2 Jira Kanban page.
 *
 * Standalone fork of `components/blocks/jira-kanban/experimental/page.tsx`. It
 * owns its own board and header components so v2 can diverge without touching
 * the current experimental variant, while reusing its support contracts.
 */
/**
 * Imperative entry into Insights, for an owner that renders its own affordance.
 *
 * The board's daily-insights nudge lives on the floating Rovo button, which is
 * portalled to `document.body` and therefore mounted by the route rather than
 * by this page. It still has to open Insights *the board's way*: opening also
 * advances the unread watermark and applies the roster default, and a caller
 * that merely set `mode="pulse"` would leave a stale badge over an article the
 * reader is looking at. Handing out `handleOpenTimeline` itself keeps that rule
 * in one place instead of copying its steps into every owner.
 */
export interface ExperimentalV2JiraKanbanPageHandle {
	/**
	 * Open Insights, mark the timeline viewed, and land on `snapshotId`.
	 * Omit the id to open at the top of the article, as the toggle does.
	 */
	openTimeline: (snapshotId?: string | null) => void;
}

export interface ExperimentalV2JiraKanbanPageProps {
	activeCardCode?: string;
	agents?: readonly JiraKanbanAgentData[];
	ariaLabel?: string;
	boardColumns?: readonly JiraKanbanColumnData[];
	compactHeader?: boolean;
	headerAssignees?: readonly JiraKanbanAssigneeData[];
	insightsDefaultAssigneeIds?: readonly string[];
	isInsightsWorkItemInteractive?: (workItem: PulseWorkItem) => boolean;
	isLooseWorkResumable?: (item: PulseLooseWork) => boolean;
	mode?: ExperimentalV2JiraKanbanMode;
	onBoardColumnsChange?: (columns: readonly JiraKanbanColumnData[]) => void;
	onCardClick?: (card: JiraKanbanCardData, columnTitle: string) => void;
	onCardAgentActivityViewChat?: JiraKanbanProps["onCardAgentActivityViewChat"];
	onInsightsWorkItemClick?: (workItem: PulseWorkItem) => void;
	onModeChange?: (mode: ExperimentalV2JiraKanbanMode) => void;
	onResumeLooseWork?: (item: PulseLooseWork) => void;
	/**
	 * Controlled unread watermark, so an owner rendering its own insights
	 * affordance counts the same unread snapshots the toggle's badge does.
	 * Omit to let this page own it; `null` is a real value meaning "nothing
	 * viewed yet", so it cannot be spelled the same way as "uncontrolled".
	 */
	onTimelineLastViewedAtChange?: (lastViewedAt: string) => void;
	ref?: Ref<ExperimentalV2JiraKanbanPageHandle>;
	timelineLastViewedAt?: string | null;
	viewTabs?: ReactNode;
}

interface DraggedCardState {
	card: JiraKanbanCardData;
	sourceColumnTitle: string;
}

export default function ExperimentalV2JiraKanbanPage({
	activeCardCode,
	agents = BOARD_AGENTS,
	ariaLabel = "Experimental v2 RFP board columns. Scroll horizontally to review all statuses.",
	boardColumns: controlledBoardColumns,
	compactHeader = false,
	headerAssignees,
	insightsDefaultAssigneeIds,
	isInsightsWorkItemInteractive,
	isLooseWorkResumable,
	mode: controlledMode,
	onBoardColumnsChange,
	onCardClick,
	onCardAgentActivityViewChat,
	onInsightsWorkItemClick,
	onModeChange,
	onResumeLooseWork,
	onTimelineLastViewedAtChange,
	ref,
	timelineLastViewedAt: controlledTimelineLastViewedAt,
	viewTabs,
}: Readonly<ExperimentalV2JiraKanbanPageProps>) {
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
	const [localMode, setLocalMode] = useState<ExperimentalV2JiraKanbanMode>("board");
	const mode = controlledMode ?? localMode;
	const updateMode = useCallback((nextMode: ExperimentalV2JiraKanbanMode) => {
		if (controlledMode === undefined) {
			setLocalMode(nextMode);
		}
		onModeChange?.(nextMode);
	}, [controlledMode, onModeChange]);
	// Which insight the article should open on. Written only by
	// `handleOpenTimeline`, so the toggle's plain open clears it back to the top
	// and a deep link cannot survive into the next visit.
	const [pulseFocusSnapshotId, setPulseFocusSnapshotId] = useState<string | null>(null);
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
	const [localTimelineLastViewedAt, setLocalTimelineLastViewedAt] = useState<string | null>(() => (
		controlledMode === "pulse"
			? markTimelineViewed(PULSE_TIMELINE)
			: EXPERIMENTAL_BOARD_LAST_VIEWED_AT
	));
	// `??` would swallow a controlled `null`, which means "nothing viewed yet"
	// and makes every snapshot unread — a real value here, unlike `boardColumns`,
	// where only `undefined` is ever passed.
	const timelineLastViewedAt = controlledTimelineLastViewedAt !== undefined
		? controlledTimelineLastViewedAt
		: localTimelineLastViewedAt;
	const markTimelineAsViewed = useCallback(() => {
		const nextViewedAt = markTimelineViewed(PULSE_TIMELINE);
		if (controlledTimelineLastViewedAt !== undefined) {
			onTimelineLastViewedAtChange?.(nextViewedAt);
			return;
		}

		setLocalTimelineLastViewedAt(nextViewedAt);
	}, [controlledTimelineLastViewedAt, onTimelineLastViewedAtChange]);
	// The one way into Insights. Every step belongs together: opening the
	// article is what "reading" means here, so the badge must clear in the same
	// gesture, and every caller — the toggle, the board filter's scope pick, and
	// the route's floating nudge through the ref handle below — goes through
	// here.
	const handleOpenTimeline = useCallback((snapshotId: string | null = null) => {
		setPulseFocusSnapshotId(snapshotId);
		markTimelineAsViewed();
		const nextAssigneeIds = insightsDefaultAssigneeIds === undefined
			? toInsightsAssigneeIds(selectedAssigneeIds, PULSE_MEMBER_IDS)
			: new Set(insightsDefaultAssigneeIds);
		setSelection(createJiraKanbanSelectionState());
		setDraggedCard(null);
		boardFilter.actions.setAssigneeIds(nextAssigneeIds);
		updateMode("pulse");
	}, [boardFilter.actions, insightsDefaultAssigneeIds, markTimelineAsViewed, selectedAssigneeIds, updateMode]);
	useImperativeHandle(ref, () => ({
		openTimeline: (snapshotId: string | null = null) => handleOpenTimeline(snapshotId),
	}), [handleOpenTimeline]);
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
		() => fillBoardFacepileAssignees(
			getJiraKanbanAssignees(boardColumns),
			headerAssignees ?? [],
		),
		[boardColumns, headerAssignees],
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
	// The board's untracked-work column and the Insights rail show the same
	// sessions from the same fixtures and commit through the same captured set,
	// so capturing on the board is the same event as capturing in Insights.
	// The column also honours the header's assignee filter: it narrows the
	// status columns, and a filter that skipped this one would stop describing
	// the whole board.
	const agentSessionItems = useMemo(
		() => toPulseSessionItems(
			filterPulseLooseWorkByMember(pulseTimeline.looseWork, pulseMemberId),
			PULSE_TIMELINE.members,
		),
		[pulseMemberId, pulseTimeline.looseWork],
	);
	const agentSessionHandlers = useMemo(
		() => toPulseSessionHandlers({
			isLooseWorkResumable,
			looseWork: pulseTimeline.looseWork,
			onCapture: handleCaptureLooseWork,
			onResume: onResumeLooseWork,
		}),
		[
			handleCaptureLooseWork,
			isLooseWorkResumable,
			onResumeLooseWork,
			pulseTimeline.looseWork,
		],
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
			<ExperimentalV2JiraKanbanBoardHeader
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
					initialSnapshotId={pulseFocusSnapshotId}
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
					<ExperimentalV2JiraKanban
						activeCardCode={activeCardCode}
						agentSessionColumn={{
							capturedItemIds: capturedLooseWorkIds,
							items: agentSessionItems,
							...agentSessionHandlers,
						}}
						agents={agents}
						ariaLabel={ariaLabel}
						assignedAgentIdsByColumn={columnAgentAssignments}
						boardColumns={filteredBoardColumns}
						draggedCardCode={draggedCard?.card.code ?? null}
						selectedCardCodes={selection.selectedCardCodes}
						onCardClick={handleCardClick}
						onCardAgentActivityViewChat={onCardAgentActivityViewChat}
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
