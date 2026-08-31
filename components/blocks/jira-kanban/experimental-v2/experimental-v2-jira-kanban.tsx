"use client";

// oxlint-disable react-doctor/no-noninteractive-tabindex -- These surfaces intentionally receive keyboard focus for application-style keyboard handling or card-level shortcuts.
// oxlint-disable react-doctor/prefer-module-scope-pure-function -- These helpers are intentionally local to the component/demo because they depend on the surrounding interaction contract.

import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { LayoutGroup, motion, useReducedMotion, type Transition } from "motion/react";
import AiAgentAddIcon from "@atlaskit/icon-lab/core/ai-agent-add";
import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";
import AddIcon from "@atlaskit/icon/core/add";

import { AgentSessionColumn, type AgentSessionColumnProps } from "@/components/blocks/agent-session-column";
import { JiraIssue } from "@/components/blocks/jira-issue";
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

import type {
	JiraKanbanAgentData,
	JiraKanbanCardData,
	JiraKanbanCardMoveAnimation,
	JiraKanbanCardSelectModifiers,
	JiraKanbanColumnData,
	JiraKanbanProps,
} from "../index";

/**
 * Experimental v2 Jira Kanban board.
 *
 * A standalone fork of `components/blocks/jira-kanban/index.tsx` that starts
 * identical to the default variant and is free to diverge from it. The data
 * contracts (`JiraKanban*` types, `state.ts`, `jira-kanban-data.ts`) stay
 * shared so both variants remain interchangeable inside an owning surface.
 */
export type ExperimentalV2JiraKanbanProps = JiraKanbanProps & {
	/**
	 * Sessions that never became work items, pinned as a sunken column to the
	 * left of the board.
	 *
	 * It sits outside the horizontal scrollport rather than inside
	 * `boardColumns`, because untracked work is not a status: it has no place in
	 * the left-to-right progression the board's columns describe, and it must
	 * stay reachable while the reader scrolls to Submitted. Omit to render the
	 * board without it.
	 */
	agentSessionColumn?: AgentSessionColumnProps;
};

const JIRA_KANBAN_CARD_MOVE: Transition = { duration: 0.6, ease: [0.4, 0, 0, 1] }; // duration-slowest + ease-in-out
const JIRA_KANBAN_CARD_DEPART: Transition = { duration: 0.4, ease: [0.6, 0, 0.8, 0.6] }; // duration-slower + ease-in

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

function getCardAssigneeAvatarShape(card: JiraKanbanCardData) {
	if (card.avatarShape) {
		return card.avatarShape;
	}
	return card.avatarSrc?.startsWith("/avatar-agent/") ? "hexagon" as const : undefined;
}

function AgentAvatar({ agent, className }: Readonly<{ agent: JiraKanbanAgentData; className?: string }>) {
	return (
		<Avatar className={className} label={agent.name} shape="hexagon" size="sm">
			{agent.brandName ? (
				<LogoThirdParty borderless label="" name={agent.brandName} size="xxsmall" />
			) : (
				<>
					<AvatarImage alt="" src={agent.avatarSrc} />
					<AvatarFallback>{getAgentInitials(agent.name)}</AvatarFallback>
				</>
			)}
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
	count,
	onCreateAgent,
	onToggleAgent,
	title,
}: Readonly<{
	agents?: readonly JiraKanbanAgentData[];
	assignedAgentIds: readonly string[];
	children: ReactNode;
	count: number;
	onCreateAgent?: (columnTitle: string) => void;
	onToggleAgent?: (agentId: string) => void;
	title: string;
}>) {
	const showAgentAssignment = Boolean(agents?.length && onCreateAgent && onToggleAgent);
	const { ref: cardListRef, showBottomScrollMask, showTopScrollMask } = useHasVerticalOverflow<HTMLDivElement>();
	const cardListScrollMaskStyle = useMemo(
		() => buildScrollMaskStyle({
			fadeBottom: showBottomScrollMask,
			fadeSize: "3rem",
			fadeTop: showTopScrollMask,
		}),
		[showBottomScrollMask, showTopScrollMask],
	);

	return (
		<div
			className="group/board-column min-w-0 overflow-visible"
			style={{
				display: "flex",
				flexDirection: "column",
				width: "100%",
				height: "100%",
				borderRadius: token("radius.xlarge"),
			}}
		>
			<div
				className={cn("flex min-w-0 items-center gap-2", showAgentAssignment && "justify-between")}
				style={{ paddingBottom: token("space.100") }}
			>
				<div className="flex min-w-0 items-center gap-1.5">
					<span className="truncate text-xs font-medium leading-4 text-text-subtle">
						{title}
					</span>
					<span className="shrink-0 text-xs font-normal text-text-subtlest">
						{count}
					</span>
				</div>
				{showAgentAssignment && agents && onCreateAgent && onToggleAgent ? (
					<ColumnAgentAssignment
						agents={agents}
						assignedAgentIds={assignedAgentIds}
						columnTitle={title}
						onCreateAgent={onCreateAgent}
						onToggleAgent={onToggleAgent}
					/>
				) : null}
			</div>

			<div
				ref={cardListRef}
				className="min-w-0"
				style={{
					flexGrow: 1,
					overflowY: "auto",
					display: "flex",
					flexDirection: "column",
					gap: token("space.100"),
					...cardListScrollMaskStyle,
				}}
			>
				{children}
			</div>

			<div className="w-full" style={{ paddingBlock: token("space.050") }}>
				<Button
					className={cn(
						"w-full justify-start gap-2 rounded-lg",
						"pointer-events-none opacity-0 transition-opacity duration-normal ease-out-practical",
						"group-hover/board-column:pointer-events-auto group-hover/board-column:opacity-100",
						"group-has-[:focus-visible]/board-column:pointer-events-auto group-has-[:focus-visible]/board-column:opacity-100",
						"motion-reduce:transition-none",
					)}
					size="default"
					variant="ghost"
				>
					<Icon render={<AddIcon label="" size="small" />} />
					Create
				</Button>
			</div>
		</div>
	);
}

function BoardAddColumnButton() {
	return (
		<div className="flex shrink-0 flex-col self-start overflow-visible border-2 border-transparent">
			<div
				aria-hidden
				className="flex items-center"
				style={{ paddingBottom: token("space.100") }}
			>
				<span className="size-6" />
			</div>
			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger
						render={
							<Button
								aria-label="Create column"
								className="shrink-0"
								data-jira-kanban-add-column=""
								size="icon"
								type="button"
								variant="outline"
							/>
						}
					>
						<Icon render={<AddIcon label="" />} />
					</TooltipTrigger>
					<TooltipContent>Create column</TooltipContent>
				</Tooltip>
			</TooltipProvider>
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

export function ExperimentalV2JiraKanban({
	activeCardCode,
	agentSessionColumn,
	agents,
	animateCardMoves = false,
	ariaLabel = "Experimental v2 Jira kanban columns. Scroll horizontally to review all statuses.",
	assignedAgentIdsByColumn = {},
	boardColumns,
	cardMoveAnimation,
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
	onCardAgentDoneRunReview,
	onCardAgentDoneRunView,
	onCreateAgent,
	onToggleColumnAgent,
	paddingBottom = token("space.150"),
	paddingTop = token("space.150"),
	selectionToolbar,
}: Readonly<ExperimentalV2JiraKanbanProps>) {
	const cardLayoutGroupId = useId();
	const shouldReduceMotion = useReducedMotion();
	const shouldAnimateCardMoves = animateCardMoves && !shouldReduceMotion;
	const dragImageRef = useRef<HTMLDivElement | null>(null);
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

	return (
		<div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
			<div className="flex min-h-0 min-w-0 flex-1 items-stretch">
				{agentSessionColumn ? (
					// Same vertical padding as the scrollport beside it, and the same
					// 2px transparent border every status column carries for its
					// drop-target ring — matching the box model, not just the padding,
					// is what actually puts the five column headers on one baseline
					// and keeps one 12px gap between every pair of column contents.
					<div
						className="flex min-h-0 shrink-0 border-2 border-transparent ps-6"
						style={{ paddingTop, paddingBottom }}
					>
						<AgentSessionColumn {...agentSessionColumn} />
					</div>
				) : null}
				<section
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
						className={cn(
							"flex min-h-full w-max min-w-full items-stretch",
							// The pinned column already supplies the board's left inset, so
							// drop to the inter-column gap and keep one rhythm across all
							// columns instead of a 24px seam after the sunken one.
							agentSessionColumn ? "ps-2" : "ps-6",
						)}
					>
						<div className="flex min-h-full flex-1 items-stretch gap-2">
						{boardColumns.map((column) => (
						<div
							data-jira-kanban-column={column.title}
							key={column.title}
							className="min-w-0 overflow-visible border-2 border-transparent transition-colors"
							onDragOver={handleColumnDragOver}
							onDragLeave={handleColumnDragLeave}
							onDrop={(event) => handleColumnDrop(event, column.title)}
							style={{ flex: "1 1 0", minWidth: "280px", maxWidth: "280px", borderRadius: token("radius.xlarge") }}
						>
							<BoardColumn
								agents={agents}
								assignedAgentIds={assignedAgentIdsByColumn[column.title] ?? []}
								count={column.cards.length}
								onCreateAgent={onCreateAgent}
								onToggleAgent={
									onToggleColumnAgent
										? (agentId) => onToggleColumnAgent(column.title, agentId)
										: undefined
								}
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
												className="w-full min-w-0 max-w-[280px]"
												initial={false}
												style={cardMovePhase ? { willChange: "transform" } : undefined}
												transition={cardMovePhase === "departing" ? JIRA_KANBAN_CARD_DEPART : JIRA_KANBAN_CARD_MOVE}
											>
											<JiraIssue
												active={isActive}
												chrome="stroke"
												summary={card.title}
												issueKey={card.code}
												tags={card.tags}
												priority={card.priority}
												pullRequestNumber={card.pullRequestNumber}
												pullRequestPreview={card.pullRequestPreview}
												pullRequestStatus={card.pullRequestStatus}
												assigneeAvatarLabel={card.assignee?.name}
												assigneeAvatarSrc={card.avatarSrc}
												assigneeAvatarShape={getCardAssigneeAvatarShape(card)}
												assigneeUnassignedKind={card.avatarUnassignedKind}
												assigneePulse={card.avatarPulse}
												agentActivities={card.agentActivities}
												agentActivityMode={card.agentActivityMode}
												agentDoneRuns={card.agentDoneRuns}
												generativeAction={{
													agents: generativeActionAgents,
													onSubmit: (request) => {
														void onCardGenerativeActionSubmit?.(request, card, column.title);
													},
													skills: generativeActionSkills,
												}}
												onAgentActivityOpenChange={
													onCardAgentActivityOpenChange
														? (open) => onCardAgentActivityOpenChange(open, card, column.title)
														: undefined
												}
												onAgentActivityViewChat={
													onCardAgentActivityViewChat
														? (activity) => onCardAgentActivityViewChat(activity, card, column.title)
														: undefined
												}
												onAgentDoneRunReview={
													onCardAgentDoneRunReview
														? (run) => onCardAgentDoneRunReview(run, card, column.title)
														: undefined
												}
												onAgentDoneRunView={
													onCardAgentDoneRunView
														? (run) => onCardAgentDoneRunView(run, card, column.title)
														: undefined
												}
												dragging={isCardBeingDragged || isSelectedCardBeingDragged}
												selected={isSelected}
												onClick={handleClick}
												onDragStart={(event) => handleCardDragStartInternal(card, column.title, event)}
												onDragEnd={handleCardDragEndInternal}
											/>
											</motion.div>
										</motion.div>
									);
								})}
							</BoardColumn>
						</div>
						))}
						<BoardAddColumnButton />
						</div>
						<div aria-hidden className="w-6 shrink-0" />
					</div>
				</LayoutGroup>
				</section>
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
