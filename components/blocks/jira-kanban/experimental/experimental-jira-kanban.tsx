"use client";

// oxlint-disable react-doctor/no-noninteractive-tabindex -- These surfaces intentionally receive keyboard focus for application-style keyboard handling or card-level shortcuts.
// oxlint-disable react-doctor/prefer-module-scope-pure-function -- These helpers are intentionally local to the component/demo because they depend on the surrounding interaction contract.

import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { LayoutGroup, motion, useReducedMotion, type Transition } from "motion/react";
import AiAgentAddIcon from "@atlaskit/icon-lab/core/ai-agent-add";
import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";
import { type AgentSessionColumnProps } from "@/components/blocks/agent-session-column";
import type { AgentSessionItem } from "@/components/blocks/agent-session";
import {
	type JiraIssueAgentActivityLayout,
	type JiraIssueAgentActivityIndicatorRenderer,
	type JiraIssueGenerativeActionPresentation,
} from "@/components/blocks/jira-issue";
import type { JiraIssueAgentSessionRef } from "@/components/blocks/jira-issue/agent-session-transfer";
import { JiraSessionFlyoutSuspensionProvider } from "@/components/blocks/product-sidebar/variants/jira-session-flyout";
import {
	mapAgentToMentionItem,
	mapSkillToMentionItem,
} from "@/components/blocks/editor-palette/data/mention-sources";
import { WorkItemAgentSelector } from "@/components/blocks/jira-work-item/experimental-v3/components/work-item-agent-selector";
import { DEFAULT_PINNED_SPACE_AGENT_IDS } from "@/components/blocks/jira-work-item/experimental-v3/lib/work-item-picker-options";
import { JiraToolbar } from "@/components/blocks/jira-toolbar";
import { LogoThirdParty } from "@/components/ui/logo-third-party";
import {
	Avatar,
	AvatarFallback,
	AvatarGroup,
	AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/ui/icon";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getMentionChildItems } from "@/components/ui-custom/rich-text-editor";
import { useHasVerticalOverflow } from "@/components/hooks/use-has-vertical-overflow";
import { buildScrollMaskStyle } from "@/components/visual/scroll-mask/lib";
import { token } from "@/lib/tokens";
import { cn } from "@/lib/utils";

import {
	BoardColumnResizeButton,
	CollapsedBoardColumn,
} from "./components/collapsed-board-column";
import { BoardColumnCreateAction } from "./components/create-work-item-drop-zone";
import { ExclusiveCreateWellProximityProvider } from "./components/create-work-item-exclusive-proximity-context";
import { InFlowAgentSessionColumn } from "./components/in-flow-agent-session-column";
import { BOARD_COLUMN_ACTION_REVEAL } from "./lib/board-column-action-reveal";
import {
	EMPTY_COLLAPSED_BOARD_COLUMNS,
	getBoardColumnOuterWidthPx,
	isBoardColumnCollapsed,
	toggleCollapsedBoardColumn,
	BOARD_COLUMN_WIDTH_PX,
	type CollapsedBoardColumns,
} from "./lib/board-column-collapse";
import { ExperimentalJiraKanbanCard } from "./experimental-jira-kanban-card";
import {
	bindBoardProximitySessionActions,
	resolveBoardUntrackedIssueKey,
	resolveVisibleFocusedIssueKey,
	scrollBoardIssueIntoView,
} from "./lib/board-untracked-sessions";
import {
	useBoardAgentSessionDrag,
	type BoardAgentSessionDrag,
} from "./use-board-agent-session-drag";

import type {
	JiraKanbanAgentData,
	JiraKanbanCardData,
	JiraKanbanCardMoveAnimation,
	JiraKanbanCardSelectModifiers,
	JiraKanbanColumnData,
	JiraKanbanProps,
} from "../index";
import {
	DEFAULT_KANBAN_COLUMN_CHROME,
	resolveKanbanColumnChrome,
	type KanbanColumnChrome,
	type KanbanColumnChromeStyles,
} from "../column-chrome";

/**
 * Experimental Jira Kanban board.
 *
 * A standalone fork of `components/blocks/jira-kanban/index.tsx` that starts
 * identical to the default variant and is free to diverge from it. The data
 * contracts (`JiraKanban*` types, `state.ts`, `jira-kanban-data.ts`) stay
 * shared so both variants remain interchangeable inside an owning surface.
 */
export interface ExperimentalJiraKanbanProps extends JiraKanbanProps {
	agentActivityLayout?: JiraIssueAgentActivityLayout;
	/**
	 * Replaces each status column's resting create button with a visible drop
	 * target while an agent session is being dragged. The owning route supplies
	 * the copy so this shared board stays variation-agnostic.
	 */
	createWorkItemDropZoneLabel?: string;
	/**
	 * Trailing scroll inset in px, added to the scrollable content rather than to
	 * the scrollport.
	 *
	 * A floating side panel is `absolute`, so board content is *meant* to pass
	 * underneath it. But at maximum scroll the trailing column's edge lands flush
	 * with the scrollport's edge — permanently under the panel, with no scroll
	 * left to pull it clear. Padding the content extends the scroll extent by the
	 * panel's width, so the column still slides under the panel while scrolling
	 * and can still be scrolled fully into view. Padding the *scrollport* would
	 * reserve dead space instead and defeat the overlay.
	 */
	scrollEndInset?: number;
	/** Detached sessions keyed by the Jira card they should remain beneath. */
	detachedAgentSessionsByCard?: Readonly<Record<string, readonly AgentSessionItem[]>>;
	onCardAgentSessionUnlink?: (
		session: JiraIssueAgentSessionRef,
		card: JiraKanbanCardData,
		columnTitle: string,
	) => void;
	/**
	 * Dashed "Drag here to unlink" well under a card. Defaults on. A host can
	 * keep chin drag and click-unlink without mounting that well.
	 */
	showAgentSessionUnlinkWell?: boolean;
	onCardAgentSessionLink?: (
		session: AgentSessionItem,
		card: JiraKanbanCardData,
		columnTitle: string,
	) => void;
	onCardAgentSessionMove?: (session: JiraIssueAgentSessionRef, sourceCard: JiraKanbanCardData, targetCard: JiraKanbanCardData, sourceColumnTitle: string, targetColumnTitle: string) => void;
	/** Chooses where card agent and skill actions are presented. */
	cardGenerativeActionPresentation?: JiraIssueGenerativeActionPresentation;
	renderAgentActivityIndicator?: JiraIssueAgentActivityIndicatorRenderer;
	/**
	 * Sessions that never became work items, pinned as a column to the
	 * left of the board. Omit to render only Jira status columns.
	 */
	agentSessionColumn?: AgentSessionColumnProps;
	/**
	 * Untracked sessions when the in-flow column is omitted (panel mode).
	 * Keeps the board drag hook able to resolve a drop onto an issue.
	 */
	untrackedSessions?: readonly AgentSessionItem[];
	/**
	 * Hovered Untracked session id from a host-owned column. Lights the board
	 * twin when the in-flow column lives outside this tree so it can survive
	 * a Board/List switch.
	 */
	proximityHighlightedSessionId?: string | null;
	/**
	 * Injected board-session drag API. The page supplies this when the
	 * floating panel also needs `untrackedBinding`; omit to let the board
	 * own the hook (standalone demos).
	 */
	boardAgentSessionDrag?: BoardAgentSessionDrag;
	/**
	 * Capture actions for board-adjacent Untracked sessions. Independent of
	 * {@link agentSessionColumn} so proximity rows still work when the column
	 * is omitted. Gate Link / Create / Subtask with `actionableSessionIds`.
	 */
	proximityAgentSession?: {
		actionableSessionIds?: ReadonlySet<string>;
		capturedItemIds?: ReadonlySet<string>;
		onCreateWorkItem?: AgentSessionColumnProps["onCreateWorkItem"];
		onLinkWorkItem?: AgentSessionColumnProps["onLinkWorkItem"];
		onSubtasks?: AgentSessionColumnProps["onSubtasks"];
	};
	/**
	 * Which columns are collapsed, when the host wants to own that.
	 *
	 * Collapse is a viewer's deliberate choice, so it has to outlive anything
	 * that unmounts this board — switching to the list or Pulse view and back is
	 * a temporary view switch, not a reason to re-expand every column. A host
	 * that renders the board in such a branch should lift this state above the
	 * branch. Omit both props to let the board keep it locally.
	 */
	collapsedColumns?: CollapsedBoardColumns;
	/** Called with the next collapsed set when a column is collapsed or expanded. */
	onCollapsedColumnsChange?: (collapsedColumns: CollapsedBoardColumns) => void;
}

const JIRA_KANBAN_CARD_MOVE: Transition = { duration: 0.6, ease: [0.4, 0, 0, 1] }; // duration-slowest + ease-in-out
const JIRA_KANBAN_CARD_DEPART: Transition = { duration: 0.4, ease: [0.6, 0, 0.8, 0.6] }; // duration-slower + ease-in

/**
 * Collapsing a column repositions everything to its right, so the width change
 * uses the bold in-place transition profile (`duration-medium` + `ease-in-out`).
 * The drag-target border keeps its own interaction profile.
 */
const BOARD_COLUMN_SHELL_TRANSITION = [
	"min-width var(--duration-medium) var(--ease-in-out)",
	"max-width var(--duration-medium) var(--ease-in-out)",
	"border-color var(--duration-normal) var(--ease-out-practical)",
].join(", ");
function getJiraKanbanCardScale(
	phase: JiraKanbanCardMoveAnimation["phase"] | undefined,
): number {
	if (phase === "arriving") return 0.9;
	if (phase === "departing") return 0.96;
	return 1;
}

function orderPickerItems<T extends Readonly<{ id: string }>>(
	items: readonly T[],
	pinnedIds: readonly string[] | undefined,
): readonly T[] {
	if (!pinnedIds?.length) return items;
	const pinnedIdSet = new Set(pinnedIds);
	return [
		...items.filter((item) => pinnedIdSet.has(item.id)),
		...items.filter((item) => !pinnedIdSet.has(item.id)),
	];
}
function getAgentInitials(name: string): string {
	return name
		.split(/\s+/u)
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0]?.toUpperCase() ?? "")
		.join("");
}
function AgentAvatar({ agent, className }: Readonly<{ agent: JiraKanbanAgentData; className?: string }>) {
	if (agent.brandName) {
		return (
			<Avatar className={className} label={agent.name} shape="hexagon" size="sm">
				<LogoThirdParty borderless label="" name={agent.brandName} size="xxsmall" />
			</Avatar>
		);
	}
	return (
		<Avatar className={className} label={agent.name} shape="hexagon" size="sm">
			<AvatarImage alt="" src={agent.avatarSrc} />
			<AvatarFallback>{getAgentInitials(agent.name)}</AvatarFallback>
		</Avatar>
	);
}

function AgentStack({ agents }: Readonly<{ agents: readonly JiraKanbanAgentData[] }>) {
	const visibleAgents = agents.slice(0, 2);
	const overflowCount = Math.max(0, agents.length - visibleAgents.length);
	const label = agents.map((agent) => agent.name).join(", ");

	if (agents.length === 0) {
		return null;
	}

	return (
		<AvatarGroup className="-space-x-1.5 *:data-[slot=avatar]:ring-0!" label={`Assigned agents: ${label}`}>
			{visibleAgents.map((agent) => (
				<AgentAvatar agent={agent} key={agent.id} />
			))}
			{overflowCount > 0 ? (
				<Avatar aria-label={`${overflowCount} more assigned agents`} shape="hexagon" size="sm">
					<AvatarFallback className="bg-bg-neutral-bold text-[10px] font-semibold text-text-inverse">
						+{overflowCount}
					</AvatarFallback>
				</Avatar>
			) : null}
		</AvatarGroup>
	);
}

function ColumnAgentAssignment({
	agents,
	assignedAgentIds,
	columnTitle,
	onCreateAgent,
	onToggleAgent,
}: Readonly<{
	agents: readonly JiraKanbanAgentData[];
	assignedAgentIds: readonly string[];
	columnTitle: string;
	onCreateAgent: (columnTitle: string) => void;
	onToggleAgent: (agentId: string) => void;
}>) {
	const [open, setOpen] = useState(false);
	const [pinnedAgentIds, setPinnedAgentIds] = useState<readonly string[]>(DEFAULT_PINNED_SPACE_AGENT_IDS);
	const [query, setQuery] = useState("");
	const assignedAgents = useMemo(
		() => assignedAgentIds.map((id) => agents.find((agent) => agent.id === id)).filter((agent): agent is JiraKanbanAgentData => Boolean(agent)),
		[agents, assignedAgentIds],
	);
	const hasAssignedAgents = assignedAgents.length > 0;
	const triggerLabel = hasAssignedAgents
		? `Manage agents for ${columnTitle}`
		: `Add agent to ${columnTitle}`;

	const handleCreateAgent = () => {
		setOpen(false);
		setQuery("");
		onCreateAgent(columnTitle);
	};

	const handleBrowseAgents = () => {
		setOpen(false);
		setQuery("");
	};

	const handleOpenChange = (nextOpen: boolean) => {
		setOpen(nextOpen);
		if (!nextOpen) {
			setQuery("");
		}
	};

	return (
		<div className="flex min-w-0 shrink-0 items-center">
			<DropdownMenu open={open} onOpenChange={handleOpenChange}>
				<TooltipProvider>
					<Tooltip>
						<TooltipTrigger render={<span className="inline-flex" />}>
							<DropdownMenuTrigger
								render={
									<Button
										aria-label={triggerLabel}
										className={cn(
											"opacity-0 transition-opacity group-hover/board-column:opacity-100 group-focus-within/board-column:opacity-100",
											hasAssignedAgents && "h-8 min-w-0 gap-1 px-1.5",
											(hasAssignedAgents || open) && "opacity-100",
										)}
										data-assigned={hasAssignedAgents || undefined}
										data-open={open || undefined}
										size={hasAssignedAgents ? "default" : "icon-compact"}
										variant="ghost"
									/>
								}
							>
								{hasAssignedAgents ? (
									<>
										<AgentStack agents={assignedAgents} />
										<Icon className="ml-0.5 text-icon-subtle group-aria-expanded/button:text-icon-selected" render={<ChevronDownIcon label="" size="small" />} />
									</>
								) : (
									<Icon
										className="text-icon-subtle group-aria-expanded/button:text-icon-selected"
										label="Add agent"
										render={<AiAgentAddIcon label="" />}
									/>
								)}
							</DropdownMenuTrigger>
						</TooltipTrigger>
						<TooltipContent>{hasAssignedAgents ? "Manage agents" : "Add agent"}</TooltipContent>
					</Tooltip>
				</TooltipProvider>
				<DropdownMenuContent
					align="end"
					className="max-h-none w-[360px] overflow-hidden p-0"
					positionerClassName="z-[502]"
					sideOffset={8}
				>
					<WorkItemAgentSelector
						agents={agents}
						onAgentToggle={onToggleAgent}
						onBrowseAgents={handleBrowseAgents}
						onCreateAgent={handleCreateAgent}
						onPinnedAgentIdsChange={setPinnedAgentIds}
						onQueryChange={setQuery}
						pinnedAgentIds={pinnedAgentIds}
						query={query}
						selectedAgentIds={assignedAgentIds}
					/>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}

function BoardColumn({
	agents,
	assignedAgentIds,
	children,
	chrome,
	columnChrome,
	count,
	createWorkItemDropZoneLabel,
	onCollapse,
	onCreateAgent,
	onToggleAgent,
	sessionDragTransaction,
	title,
}: Readonly<{
	agents?: readonly JiraKanbanAgentData[];
	assignedAgentIds: readonly string[];
	children: ReactNode;
	chrome: KanbanColumnChromeStyles;
	columnChrome: KanbanColumnChrome;
	count: number;
	createWorkItemDropZoneLabel?: string;
	onCollapse: () => void;
	onCreateAgent?: (columnTitle: string) => void;
	onToggleAgent?: (agentId: string) => void;
	sessionDragTransaction: BoardAgentSessionDrag["transaction"];
	title: string;
}>) {
	const showAgentAssignment = Boolean(agents?.length && onCreateAgent && onToggleAgent);
	const { ref: cardListRef, showBottomScrollMask, showTopScrollMask } = useHasVerticalOverflow<HTMLDivElement>();
	const cardListScrollMaskStyle = useMemo(
		() => buildScrollMaskStyle({
			fadeBottom: showBottomScrollMask,
			fadeSize: "3rem",
			fadeTop: showTopScrollMask,
			scrollbarWidth: 0,
		}),
		[showBottomScrollMask, showTopScrollMask],
	);

	return (
		<div
			className={cn("group/board-column min-w-0 overflow-visible", chrome.columnClassName)}
			data-kanban-column-chrome={columnChrome}
			style={{
				display: "flex",
				flexDirection: "column",
				width: "100%",
				// Pin the layout width so the column never reflows while the shell
				// animates back open from the collapsed pill.
				minWidth: `${BOARD_COLUMN_WIDTH_PX}px`,
				height: "100%",
				borderRadius: token("radius.xlarge"),
			}}
		>
			<div
				className="flex min-w-0 items-center justify-between gap-2"
				style={{ paddingBottom: token("space.100"), ...chrome.header }}
			>
				<div className="flex min-w-0 items-center gap-1.5">
					<span className="truncate text-xs font-medium leading-4 text-text-subtle">
						{title}
					</span>
					<span className="shrink-0 text-xs font-normal text-text-subtlest">
						{count}
					</span>
				</div>
				<div className="flex shrink-0 items-center gap-0.5">
					{showAgentAssignment && agents && onCreateAgent && onToggleAgent ? (
						<ColumnAgentAssignment
							agents={agents}
							assignedAgentIds={assignedAgentIds}
							columnTitle={title}
							onCreateAgent={onCreateAgent}
							onToggleAgent={onToggleAgent}
						/>
					) : null}
					<BoardColumnResizeButton
						className={cn(
							BOARD_COLUMN_ACTION_REVEAL,
							chrome.resizeButtonClassName,
							"group-hover/board-column:pointer-events-auto group-hover/board-column:opacity-100",
							"group-has-[:focus-visible]/board-column:pointer-events-auto group-has-[:focus-visible]/board-column:opacity-100",
						)}
						collapsed={false}
						onToggle={onCollapse}
						title={title}
					/>
				</div>
			</div>

			<div
				ref={cardListRef}
				data-jira-kanban-card-list=""
				className="min-w-0 overflow-y-auto has-[[data-session-dragging]]:overflow-visible"
				style={{
					flexGrow: 1,
					display: "flex",
					flexDirection: "column",
					gap: token("space.100"),
					...cardListScrollMaskStyle,
					...chrome.cardList,
				}}
			>
				{children}
			</div>

			<div style={chrome.footer}>
				<BoardColumnCreateAction
					dropZoneLabel={createWorkItemDropZoneLabel}
					sessionDragTransaction={sessionDragTransaction}
					title={title}
				/>
			</div>
		</div>
	);
}

function BoardColumnShell({
	children,
	chrome,
	collapsed,
	columnChrome,
	count,
	onDragLeave,
	onDragOver,
	onDrop,
	onToggleCollapsed,
	title,
}: Readonly<{
	/** Receives the collapse handler so the column header can render the control. */
	children: (onCollapse: () => void) => ReactNode;
	chrome: KanbanColumnChromeStyles;
	collapsed: boolean;
	columnChrome: KanbanColumnChrome;
	count: number;
	onDragLeave: (event: React.DragEvent<HTMLDivElement>) => void;
	onDragOver: (event: React.DragEvent<HTMLDivElement>) => void;
	onDrop: (event: React.DragEvent<HTMLDivElement>) => void;
	onToggleCollapsed: () => void;
	title: string;
}>) {
	const shouldReduceMotion = useReducedMotion();
	// The column keeps its full layout width while the shell animates, so the
	// overflow has to be clipped for the duration of the width transition. Doing
	// it any longer would clip the 4px focus rings on the cards inside.
	const [isResizing, setIsResizing] = useState(false);
	const outerWidth = `${getBoardColumnOuterWidthPx(collapsed)}px`;

	const handleToggleCollapsed = () => {
		if (!shouldReduceMotion) {
			setIsResizing(true);
		}
		onToggleCollapsed();
	};

	const handleTransitionEnd = (event: React.TransitionEvent<HTMLDivElement>) => {
		if (event.target === event.currentTarget && event.propertyName === "max-width") {
			setIsResizing(false);
		}
	};

	return (
		<div
			data-jira-kanban-column={title}
			data-kanban-column-chrome={columnChrome}
			data-collapsed={collapsed || undefined}
			className={cn(
				"min-w-0 border-2 border-transparent",
				collapsed || isResizing ? "overflow-hidden" : "overflow-visible",
			)}
			onDragOver={onDragOver}
			onDragLeave={onDragLeave}
			onDrop={onDrop}
			onTransitionEnd={handleTransitionEnd}
			style={{
				flex: "1 1 0",
				minWidth: outerWidth,
				maxWidth: outerWidth,
				borderRadius: token("radius.xlarge"),
				transition: shouldReduceMotion ? "none" : BOARD_COLUMN_SHELL_TRANSITION,
			}}
		>
			{collapsed ? (
				<CollapsedBoardColumn
					chrome={chrome.collapsed}
					count={count}
					headerFrame={chrome.headerFrame}
					onExpand={handleToggleCollapsed}
					title={title}
				/>
			) : (
				children(handleToggleCollapsed)
			)}
		</div>
	);
}

function getCommonSelectedCardStatus(
	columns: readonly JiraKanbanColumnData[],
	selectedCardCodes: ReadonlySet<string>,
): string | null {
	let commonStatus: string | null = null;
	let foundSelectedCard = false;

	for (const column of columns) {
		for (const card of column.cards) {
			if (!selectedCardCodes.has(card.code)) {
				continue;
			}
			if (!foundSelectedCard) {
				commonStatus = column.title;
				foundSelectedCard = true;
				continue;
			}
			if (commonStatus !== column.title) {
				return null;
			}
		}
	}

	return foundSelectedCard ? commonStatus : null;
}

function ExperimentalJiraKanbanView({
	activeCardCode,
	agentActivityLayout = "merged",
	agentSessionColumn,
	agents,
	animateCardMoves = false,
	ariaLabel = "Experimental Jira kanban columns. Scroll horizontally to review all statuses.",
	assignedAgentIdsByColumn = {},
	scrollEndInset = 0,
	boardColumns,
	cardGenerativeActionPresentation = "sparkle",
	cardMoveAnimation,
	collapsedColumns: controlledCollapsedColumns,
	columnChrome = DEFAULT_KANBAN_COLUMN_CHROME,
	createWorkItemDropZoneLabel,
	detachedAgentSessionsByCard,
	draggedCardCode = null,
	selectedCardCodes,
	onCardClick,
	onCardSelect,
	onCardDragEnd,
	onCardDragStart,
	onCardDrop,
	onCardGenerativeActionSubmit,
	onCardAgentActivityOpenChange,
	onCardAgentActivityViewChat,
	onCardAgentSessionLink,
	onCardAgentSessionMove,
	onCardAgentSessionUnlink,
	showAgentSessionUnlinkWell = true,
	onCardAgentDoneRunReview,
	onCardAgentDoneRunView,
	onCreateAgent,
	onCollapsedColumnsChange,
	onToggleColumnAgent,
	boardSessionDrag,
	proximityAgentSession,
	proximityHighlightedSessionId = null,
	renderAgentActivityIndicator,
	paddingBottom = token("space.150"),
	paddingTop = token("space.150"),
	selectionToolbar,
	captureBoardSessionDragRoot = true,
}: Readonly<ExperimentalJiraKanbanProps> & {
	boardSessionDrag: BoardAgentSessionDrag;
	captureBoardSessionDragRoot?: boolean;
}) {
	const chrome = resolveKanbanColumnChrome(columnChrome);
	const cardLayoutGroupId = useId();
	const shouldReduceMotion = useReducedMotion();
	const shouldAnimateCardMoves = animateCardMoves && !shouldReduceMotion;
	const boardScrollportRef = useRef<HTMLElement | null>(null);
	const dragImageRef = useRef<HTMLDivElement | null>(null);
	const [uncontrolledCollapsedColumns, setUncontrolledCollapsedColumns] = useState(
		EMPTY_COLLAPSED_BOARD_COLUMNS,
	);
	const [focusedIssueKey, setFocusedIssueKey] = useState<string | null>(null);
	const [hoveredSessionId, setHoveredSessionId] = useState<string | null>(null);
	const highlightedSessionId = hoveredSessionId ?? proximityHighlightedSessionId;
	const spotlightIssueKey = resolveVisibleFocusedIssueKey(focusedIssueKey, boardColumns);
	const collapsedColumns = controlledCollapsedColumns ?? uncontrolledCollapsedColumns;
	const selectedCount = selectedCardCodes?.size ?? 0;
	const selectedStatus = selectedCardCodes
		? getCommonSelectedCardStatus(boardColumns, selectedCardCodes)
		: null;
	const generativeActionAgents = useMemo(
		() => selectionToolbar?.agents
			? getMentionChildItems(
					{
						subagent: orderPickerItems(
							selectionToolbar.agents,
							selectionToolbar.defaultPinnedAgentIds,
						).map(mapAgentToMentionItem),
					},
					"subagent",
				)
			: undefined,
		[selectionToolbar?.agents, selectionToolbar?.defaultPinnedAgentIds],
	);
	const generativeActionSkills = useMemo(
		() => selectionToolbar?.skills
			? getMentionChildItems(
					{
						skill: orderPickerItems(
							selectionToolbar.skills,
							selectionToolbar.defaultPinnedSkillIds,
						).map(mapSkillToMentionItem),
					},
					"skill",
				)
			: undefined,
		[selectionToolbar?.defaultPinnedSkillIds, selectionToolbar?.skills],
	);

	// oxlint-disable react-doctor/no-adjust-state-on-prop-change -- the drag preview node is measured/allocated against the live DOM.
	const handleColumnDragOver = (event: React.DragEvent<HTMLDivElement>) => {
		event.preventDefault();
		event.dataTransfer.dropEffect = "move";
		event.currentTarget.classList.add("border-ring");
		event.currentTarget.classList.remove("border-transparent");
	};

	const handleColumnDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
		event.currentTarget.classList.add("border-transparent");
		event.currentTarget.classList.remove("border-ring");
	};

	const handleColumnDrop = (event: React.DragEvent<HTMLDivElement>, targetColumnTitle: string) => {
		event.preventDefault();
		event.currentTarget.classList.add("border-transparent");
		event.currentTarget.classList.remove("border-ring");
		onCardDrop?.(targetColumnTitle);
	};

	// Cache the multi-drag preview DOM node once on mount. Previously this node
	// was allocated synchronously inside `dragstart`, adding DOM work to the long
	// task that starts a drag, and could leak if the user pressed Escape to
	// cancel (the cached ref was only cleared by `dragend`).
	useEffect(() => {
		if (typeof document === "undefined") {
			return;
		}
		const node = document.createElement("div");
		node.setAttribute("aria-hidden", "true");
		node.style.position = "fixed";
		node.style.top = "-1000px";
		node.style.left = "-1000px";
		node.style.width = "104px";
		node.style.height = "56px";
		node.style.pointerEvents = "none";

		const label = document.createElement("span");
		label.style.position = "absolute";
		label.style.top = "18px";
		label.style.left = "6px";
		label.style.padding = "6px 12px";
		label.style.borderRadius = "6px";
		label.style.background = "var(--ds-background-neutral-bold)";
		label.style.color = "var(--ds-text-inverse)";
		label.style.font = "var(--ds-font-body-small)";
		label.style.boxShadow = "var(--ds-shadow-overlay)";
		node.appendChild(label);

		document.body.appendChild(node);
		dragImageRef.current = node;

		return () => {
			node.remove();
			dragImageRef.current = null;
		};
	}, []);
	// oxlint-enable react-doctor/no-adjust-state-on-prop-change

	const handleCardDragStartInternal = (
		card: JiraKanbanCardData,
		columnTitle: string,
		event: React.DragEvent<HTMLButtonElement>,
	) => {
		const isMultiDrag = Boolean(selectedCardCodes?.has(card.code) && selectedCardCodes.size > 1);
		event.dataTransfer.effectAllowed = "move";
		event.dataTransfer.dropEffect = "move";
		event.dataTransfer.setData("text/plain", card.code);
		if (isMultiDrag && selectedCardCodes && dragImageRef.current) {
			const labelNode = dragImageRef.current.firstChild;
			if (labelNode) {
				labelNode.textContent = `${selectedCardCodes.size} items`;
			}
			event.dataTransfer.setDragImage(dragImageRef.current, 0, 0);
		}
		onCardDragStart?.(card, columnTitle);
	};

	const handleCardDragEndInternal = () => {
		onCardDragEnd?.();
	};

	const handleSessionView = (item: AgentSessionItem) => {
		const nextKey = resolveVisibleFocusedIssueKey(
			resolveBoardUntrackedIssueKey(item),
			boardColumns,
		);
		setFocusedIssueKey(nextKey);
		if (nextKey) {
			scrollBoardIssueIntoView(boardScrollportRef.current, nextKey);
		}
		agentSessionColumn?.onView?.(item);
	};

	// Hovering an Untracked card lights its twin beside the work item it already
	// names. Both surfaces render the same session ids — the column holds every
	// untracked session, the board holds the subset naming an issue on it — so an
	// id match is the whole relationship test, and a session with no board
	// relationship simply has no row to light. Preview only: the click spotlight
	// above still owns focus, scroll, and dimming.
	const handleSessionHover = (item: AgentSessionItem | null) => {
		setHoveredSessionId(item?.id ?? null);
		agentSessionColumn?.onItemHover?.(item);
	};

	const handleSessionSelectionChange = (itemId: string | null) => {
		// Card deselect is not a view. Clear the session-driven spotlight so
		// status columns drop `opacity-40` instead of staying veiled.
		if (itemId === null) {
			setFocusedIssueKey(null);
		}
		agentSessionColumn?.onSelectedItemIdChange?.(itemId);
	};

	const handleToggleColumnCollapsed = (columnTitle: string) => {
		const nextCollapsedColumns = toggleCollapsedBoardColumn(collapsedColumns, columnTitle);
		// Only own the state when the host has not claimed it, so a controlled
		// host stays the single source of truth.
		if (controlledCollapsedColumns === undefined) {
			setUncontrolledCollapsedColumns(nextCollapsedColumns);
		}
		onCollapsedColumnsChange?.(nextCollapsedColumns);
	};
	const sessionFlyoutsSuspended = boardSessionDrag.transaction !== null || draggedCardCode !== null;
	const untrackedDropArmed = boardSessionDrag.transaction?.target?.kind === "untracked";

	return (
		<div
			ref={captureBoardSessionDragRoot ? boardSessionDrag.boardRootRef : undefined}
			className="relative flex min-h-0 min-w-0 flex-1 flex-col"
			data-board-agent-session-dragging={boardSessionDrag.transaction !== null || undefined}
			data-board-agent-session-origin={boardSessionDrag.transaction?.origin.kind}
		>
			<div className="flex min-h-0 min-w-0 flex-1 items-stretch">
				{agentSessionColumn ? (
					<InFlowAgentSessionColumn
						agentSessionColumn={{
							...agentSessionColumn,
							highlightedItemId: highlightedSessionId,
							onItemHover: handleSessionHover,
							onSelectedItemIdChange: handleSessionSelectionChange,
							onView: handleSessionView,
							sessionDrag: boardSessionDrag.enablement.transferable
								? boardSessionDrag.untrackedBinding
								: agentSessionColumn.sessionDrag,
						}}
						columnFrame={chrome.headerFrame}
						paddingBottom={paddingBottom}
						paddingTop={paddingTop}
						sessionFlyoutsSuspended={sessionFlyoutsSuspended}
						untrackedDropArmed={untrackedDropArmed}
					/>
				) : null}
				<JiraSessionFlyoutSuspensionProvider suspended>
				<section
					ref={boardScrollportRef}
					data-jira-kanban-scrollport=""
					tabIndex={0}
					aria-label={ariaLabel}
					className="flex min-h-0 min-w-0 flex-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
					style={{
						flex: 1,
						paddingTop,
						paddingBottom,
						overflowX: "auto",
						overflowY: "hidden",
						minHeight: 0,
					}}
				>
				<LayoutGroup id={cardLayoutGroupId}>
						<div
							className="flex min-h-full w-max min-w-full items-stretch ps-6"
						>
						<ExclusiveCreateWellProximityProvider>
						<div className="flex min-h-full flex-1 items-stretch gap-2">
						{boardColumns.map((column) => (
						<BoardColumnShell
							chrome={chrome}
							collapsed={isBoardColumnCollapsed(collapsedColumns, column.title)}
							columnChrome={columnChrome}
							count={column.cards.length}
							key={column.title}
							onDragOver={handleColumnDragOver}
							onDragLeave={handleColumnDragLeave}
							onDrop={(event) => handleColumnDrop(event, column.title)}
							onToggleCollapsed={() => handleToggleColumnCollapsed(column.title)}
							title={column.title}
						>
							{(handleCollapseColumn) => (
							<BoardColumn
								agents={agents}
								assignedAgentIds={assignedAgentIdsByColumn[column.title] ?? []}
								chrome={chrome}
								columnChrome={columnChrome}
								count={column.cards.length}
								createWorkItemDropZoneLabel={createWorkItemDropZoneLabel}
								onCollapse={handleCollapseColumn}
								onCreateAgent={onCreateAgent}
								onToggleAgent={
									onToggleColumnAgent
										? (agentId) => onToggleColumnAgent(column.title, agentId)
										: undefined
								}
								sessionDragTransaction={boardSessionDrag.transaction}
								title={column.title}
							>
								{column.cards.map((card, cardIndex) => {
									const isActive = activeCardCode === card.code;
									const isSelected = selectedCardCodes?.has(card.code) ?? false;
									const isCardBeingDragged = draggedCardCode === card.code;
									const isMultiSelection = (selectedCardCodes?.size ?? 0) > 1;
									const isSelectedCardBeingDragged = Boolean(draggedCardCode && isMultiSelection && isSelected);
									const cardMovePhase = cardMoveAnimation?.cardCode === card.code
										? cardMoveAnimation.phase
										: undefined;
									const shouldAnimateCardPosition = shouldAnimateCardMoves && cardMovePhase === undefined;
									const detachedAgentSessions = detachedAgentSessionsByCard?.[card.code] ?? [];
										const proximityActions = bindBoardProximitySessionActions({
										actionableSessionIds: proximityAgentSession?.actionableSessionIds,
										capturedItemIds: proximityAgentSession?.capturedItemIds,
										onCreateWorkItem: proximityAgentSession?.onCreateWorkItem,
										onLinkWorkItem: proximityAgentSession?.onLinkWorkItem,
										onSubtasks: proximityAgentSession?.onSubtasks,
											sessions: detachedAgentSessions,
										});
										const {
											control: agentSessionDragControl,
											detachedBinding: detachedSessionDragBinding,
											dropTarget: cardDropTarget,
										} = boardSessionDrag.getCardDragState(card, column.title);
										const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
										const modifiers: JiraKanbanCardSelectModifiers = {
											shiftKey: event.shiftKey,
											metaOrCtrlKey: event.metaKey || event.ctrlKey,
										};
										if (modifiers.shiftKey || modifiers.metaOrCtrlKey) {
											event.preventDefault();
											onCardSelect?.(card.code, column.title, cardIndex, modifiers);
											return;
										}
										onCardClick?.(card.title, card.code, card, column.title);
									};
									return (
										<motion.div
											key={card.code}
											className="w-full min-w-0 max-w-[280px]"
											layout={shouldAnimateCardPosition ? "position" : false}
											layoutId={shouldAnimateCardPosition ? `jira-kanban-card-${card.code}` : undefined}
											style={shouldAnimateCardPosition ? { willChange: "transform" } : undefined}
											transition={JIRA_KANBAN_CARD_MOVE}
										>
											<motion.div
												animate={
													shouldAnimateCardMoves
														? { scale: getJiraKanbanCardScale(cardMovePhase) }
														: undefined
												}
												className={cn(
													"flex w-full min-w-0 max-w-[280px] flex-col gap-2 rounded-lg",
													"transition-[background-color,opacity] duration-normal ease-out-practical",
													"motion-reduce:transition-none",
													spotlightIssueKey === card.code && "bg-bg-accent-blue-subtlest",
													spotlightIssueKey !== null && spotlightIssueKey !== card.code && "opacity-40",
												)}
												data-board-agent-session-drop-zone="issue"
												data-board-agent-session-target={cardDropTarget ?? undefined}
												data-issue-key={card.code}
												initial={false}
												style={cardMovePhase ? { willChange: "transform" } : undefined}
												transition={cardMovePhase === "departing" ? JIRA_KANBAN_CARD_DEPART : JIRA_KANBAN_CARD_MOVE}
											>
												<ExperimentalJiraKanbanCard
												active={isActive}
													agentActivityLayout={agentActivityLayout}
													agentSessionDragControl={agentSessionDragControl}
												capturedItemIds={proximityActions.capturedItemIds}
												card={card}
												chrome={chrome.cardChrome}
												columnTitle={column.title}
													detachedAgentSessions={detachedAgentSessions}
													detachedSessionDrag={detachedSessionDragBinding}
												dragging={isCardBeingDragged || isSelectedCardBeingDragged}
												generativeActionAgents={generativeActionAgents}
												generativeActionPresentation={cardGenerativeActionPresentation}
												generativeActionSkills={generativeActionSkills}
												highlightedSessionId={highlightedSessionId}
												onAgentActivityOpenChange={onCardAgentActivityOpenChange}
												onAgentActivityViewChat={onCardAgentActivityViewChat}
												onAgentDoneRunReview={onCardAgentDoneRunReview}
												onAgentDoneRunView={onCardAgentDoneRunView}
												onClick={handleClick}
												onCreateWorkItem={proximityActions.onCreateWorkItem}
												onDragEnd={handleCardDragEndInternal}
												onDragStart={(event) => handleCardDragStartInternal(card, column.title, event)}
												onGenerativeActionSubmit={onCardGenerativeActionSubmit}
											onLinkWorkItem={proximityActions.onLinkWorkItem}
											onItemHover={handleSessionHover}
											renderAgentActivityIndicator={renderAgentActivityIndicator}
											onSessionLink={onCardAgentSessionLink}
												onSessionUnlink={onCardAgentSessionUnlink}
												onSubtasks={proximityActions.onSubtasks}
												showUnlinkWell={showAgentSessionUnlinkWell}
												selected={isSelected}
											/>
											</motion.div>
										</motion.div>
									);
								})}
							</BoardColumn>
							)}
						</BoardColumnShell>
						))}
						</div>
						</ExclusiveCreateWellProximityProvider>
						{/* Trailing gutter. It also absorbs `scrollEndInset`: the outer
						    `w-max min-w-full` box is clamped to the scrollport by its
						    min-width, so padding it moves nothing — the scroll extent
						    comes from this row's own children. Widening the spacer is
						    what lets the last column scroll clear of a floating panel. */}
						<div
							aria-hidden
							className="shrink-0"
							style={{ width: `calc(var(--spacing) * 6 + ${scrollEndInset}px)` }}
						/>
					</div>
				</LayoutGroup>
				</section>
				</JiraSessionFlyoutSuspensionProvider>
			</div>
				{selectionToolbar ? (
					<JiraToolbar
						agents={selectionToolbar.agents ?? agents ?? []}
						className={selectionToolbar.className}
						defaultPinnedAgentIds={selectionToolbar.defaultPinnedAgentIds}
						defaultPinnedSkillIds={selectionToolbar.defaultPinnedSkillIds}
						onAgentAssignmentChange={selectionToolbar.onAgentAssignmentChange}
						onBrowseAgents={selectionToolbar.onBrowseAgents}
						onClearSelection={selectionToolbar.onClearSelection}
						onCreateAgent={selectionToolbar.onCreateAgent}
						onDelete={selectionToolbar.onDelete}
						onEditFields={selectionToolbar.onEditFields}
						onMerge={selectionToolbar.onMerge}
						onStatusChange={selectionToolbar.onStatusChange}
						onWatchOptions={selectionToolbar.onWatchOptions}
						pinnedItemsLabel={selectionToolbar.pinnedItemsLabel}
						selectedAgentIds={selectionToolbar.selectedAgentIds}
						selectedCount={selectedCount}
						selectedStatus={selectedStatus}
						skills={selectionToolbar.skills}
						statusOptions={boardColumns.map((column) => column.title)}
					/>
				) : null}
		</div>
	);
}

function ExperimentalJiraKanbanOwned(props: Readonly<ExperimentalJiraKanbanProps>) {
	const boardSessionDrag = useBoardAgentSessionDrag({
		boardColumns: props.boardColumns,
		detachedSessionsByCard: props.detachedAgentSessionsByCard,
		onCreate: props.proximityAgentSession?.onCreateWorkItem,
		onLink: props.onCardAgentSessionLink,
		onMove: props.onCardAgentSessionMove,
		onUnlink: props.onCardAgentSessionUnlink,
		untrackedSessions: props.agentSessionColumn?.items ?? props.untrackedSessions,
	});
	return <ExperimentalJiraKanbanView {...props} boardSessionDrag={boardSessionDrag} />;
}

export function ExperimentalJiraKanban(props: Readonly<ExperimentalJiraKanbanProps>) {
	if (props.boardAgentSessionDrag) {
		return (
			<ExperimentalJiraKanbanView
				{...props}
				boardSessionDrag={props.boardAgentSessionDrag}
				captureBoardSessionDragRoot={false}
			/>
		);
	}
	return <ExperimentalJiraKanbanOwned {...props} />;
}
