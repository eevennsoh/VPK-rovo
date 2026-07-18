"use client";

// oxlint-disable react-doctor/no-noninteractive-tabindex -- These surfaces intentionally receive keyboard focus for application-style keyboard handling or card-level shortcuts.
// oxlint-disable react-doctor/prefer-module-scope-pure-function -- These helpers are intentionally local to the component/demo because they depend on the surrounding interaction contract.

import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import AiAgentIcon from "@atlaskit/icon/core/ai-agent";
import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";
import AddIcon from "@atlaskit/icon/core/add";

import {
	JiraIssue,
	type JiraIssueAgentActivity,
	type JiraIssueAgentActivityMode,
	type JiraIssueCompletedAgentRun,
	type JiraIssueGenerativeActionRequest,
	type JiraIssuePriority,
	type JiraIssueTag,
} from "@/components/blocks/jira-issue";
import { AgentSelector } from "@/components/blocks/agent-selector";
import { JiraToolbar } from "@/components/blocks/jira-toolbar";
import type { QuestionCardAnswers } from "@/components/blocks/question-card/types";
import { LogoThirdParty } from "@/components/ui/logo-third-party";
import type { ThirdPartyLogoName } from "@/components/ui/data/logo-third-party-data";
import {
	Avatar,
	AvatarFallback,
	AvatarGroup,
	AvatarImage,
	type AvatarProps,
	type AvatarUnassignedKind,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/ui/icon";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { token } from "@/lib/tokens";
import { cn } from "@/lib/utils";

export type JiraKanbanPriority = JiraIssuePriority;

export type JiraKanbanCardTag = JiraIssueTag;

export interface JiraKanbanCardData {
	title: string;
	code: string;
	tags: JiraKanbanCardTag[];
	priority: JiraKanbanPriority;
	avatarSrc?: string;
	avatarShape?: NonNullable<AvatarProps["shape"]>;
	avatarUnassignedKind?: AvatarUnassignedKind;
	avatarPulse?: boolean;
	agentActivities?: readonly JiraIssueAgentActivity[];
	agentActivityMode?: JiraIssueAgentActivityMode;
	agentDoneRuns?: readonly JiraIssueCompletedAgentRun[];
}

export interface JiraKanbanColumnData {
	title: string;
	count: number;
	cards: JiraKanbanCardData[];
}

export interface JiraKanbanAgentData {
	id: string;
	name: string;
	byline: string;
	avatarSrc?: string;
	/** When set, renders the upstream `@atlassian/logo-third-party` mark (3P brands). */
	brandName?: ThirdPartyLogoName;
}

export interface JiraKanbanCardSelectModifiers {
	shiftKey: boolean;
	metaOrCtrlKey: boolean;
}

export interface JiraKanbanSelectionToolbarConfig {
	agents?: readonly JiraKanbanAgentData[];
	className?: string;
	onAgentAssignmentChange: (agentId: string, assigned: boolean) => void;
	onBrowseAgents?: () => void;
	onClearSelection: () => void;
	onCreateAgent?: () => void;
	onDelete?: () => void;
	onEditFields?: () => void;
	onMerge?: () => void;
	onSelectAll?: () => void;
	onStatusChange: (status: string) => void;
	onWatchOptions?: () => void;
	selectedAgentIds?: readonly string[];
}

export interface JiraKanbanProps {
	boardColumns: readonly JiraKanbanColumnData[];
	agents?: readonly JiraKanbanAgentData[];
	assignedAgentIdsByColumn?: Readonly<Record<string, readonly string[]>>;
	ariaLabel?: string;
	columnHeaderPaddingBlock?: CSSProperties["paddingBlock"];
	draggedCardCode?: string | null;
	selectedCardCodes?: ReadonlySet<string>;
	onCardClick?: (title: string, code: string, card: JiraKanbanCardData, columnTitle: string) => void;
	onCardSelect?: (
		code: string,
		columnTitle: string,
		indexInColumn: number,
		modifiers: JiraKanbanCardSelectModifiers,
	) => void;
	onCardDragStart?: (card: JiraKanbanCardData, sourceColumnTitle: string) => void;
	onCardDrop?: (targetColumnTitle: string) => void;
	onCardDragEnd?: () => void;
	onCardGenerativeActionSubmit?: (
		request: JiraIssueGenerativeActionRequest,
		card: JiraKanbanCardData,
		columnTitle: string,
	) => void | Promise<void>;
	onCardAgentActivityOpenChange?: (
		open: boolean,
		card: JiraKanbanCardData,
		columnTitle: string,
	) => void;
	onCardAgentActivityViewChat?: (
		activity: JiraIssueAgentActivity,
		card: JiraKanbanCardData,
		columnTitle: string,
	) => void;
	onCardAgentActivityQuestionSubmit?: (
		activity: JiraIssueAgentActivity,
		answers: QuestionCardAnswers,
		card: JiraKanbanCardData,
		columnTitle: string,
	) => void;
	onCreateAgent?: (columnTitle: string) => void;
	onToggleColumnAgent?: (columnTitle: string, agentId: string) => void;
	paddingBottom?: CSSProperties["paddingBottom"];
	paddingTop?: CSSProperties["paddingTop"];
	selectionToolbar?: JiraKanbanSelectionToolbarConfig;
}

export function createJiraKanbanColumns(
	columns: readonly JiraKanbanColumnData[],
): JiraKanbanColumnData[] {
	return columns.map((column) => ({
		...column,
		cards: column.cards.map((card) => ({
			...card,
			tags: card.tags.map((tag) => ({ ...tag })),
			agentActivities: card.agentActivities?.map((activity) => ({
				...activity,
				question: activity.question
					? {
						...activity.question,
						options: activity.question.options.map((option) => ({ ...option })),
					}
					: undefined,
			})),
			agentDoneRuns: card.agentDoneRuns?.map((run) => ({ ...run })),
		})),
	}));
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
		// Brand-identity agent → self-framing package tile (no hexagon).
		return <LogoThirdParty className={className} label={agent.name} name={agent.brandName} size="small" />;
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
											hasAssignedAgents ? "h-8 min-w-0 gap-1 px-1.5" : "size-8",
											(hasAssignedAgents || open) && "opacity-100",
										)}
										data-assigned={hasAssignedAgents || undefined}
										data-open={open || undefined}
										size={hasAssignedAgents ? "default" : "icon"}
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
										label="Agent"
										render={<AiAgentIcon label="" />}
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
					<AgentSelector
						agents={agents}
						selectedAgentIds={assignedAgentIds}
						onBrowseAgents={handleBrowseAgents}
						onCreateAgent={handleCreateAgent}
						onQueryChange={setQuery}
						onAgentToggle={onToggleAgent}
						query={query}
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
	headerPaddingBlock,
	onCreateAgent,
	onToggleAgent,
	title,
}: Readonly<{
	agents?: readonly JiraKanbanAgentData[];
	assignedAgentIds: readonly string[];
	children: ReactNode;
	count: number;
	headerPaddingBlock: CSSProperties["paddingBlock"];
	onCreateAgent?: (columnTitle: string) => void;
	onToggleAgent?: (agentId: string) => void;
	title: string;
}>) {
	const showAgentAssignment = Boolean(agents?.length && onCreateAgent && onToggleAgent);

	return (
		<div
			className="group/board-column"
			style={{
				display: "flex",
				flexDirection: "column",
				width: "100%",
				height: "100%",
				backgroundColor: token("elevation.surface.sunken"),
				borderRadius: token("radius.xlarge"),
			}}
		>
			<div style={{ paddingTop: token("space.150"), paddingBottom: headerPaddingBlock, paddingInline: token("space.150") }}>
				<div className={cn("flex min-w-0 items-center gap-2", showAgentAssignment && "justify-between")}>
					<div className="flex min-w-0 items-center gap-2">
						<span
							className="truncate"
							style={{
								font: token("font.body.small"),
								fontWeight: token("font.weight.medium"),
								color: token("color.text.subtle"),
							}}
						>
							{title.toUpperCase()}
						</span>
						<Badge>{count}</Badge>
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
			</div>

			<div
				style={{
					flexGrow: 1,
					overflowY: "auto",
					paddingTop: token("space.050"),
					paddingBottom: token("space.100"),
					paddingInline: token("space.050"),
					display: "flex",
					flexDirection: "column",
					gap: token("space.050"),
				}}
			>
				{children}
			</div>

			<div style={{ padding: token("space.050") }}>
				<Button className="w-full justify-start gap-2 rounded-lg" size="default" variant="ghost">
					<Icon render={<AddIcon label="" size="small" />} />
					Create
				</Button>
			</div>
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

export function JiraKanban({
	agents,
	ariaLabel = "Jira kanban columns. Scroll horizontally to review all statuses.",
	assignedAgentIdsByColumn = {},
	boardColumns,
	columnHeaderPaddingBlock = token("space.100"),
	draggedCardCode = null,
	selectedCardCodes,
	onCardClick,
	onCardSelect,
	onCardDragEnd,
	onCardDragStart,
	onCardDrop,
	onCardGenerativeActionSubmit,
	onCardAgentActivityOpenChange,
	onCardAgentActivityQuestionSubmit,
	onCardAgentActivityViewChat,
	onCreateAgent,
	onToggleColumnAgent,
	paddingBottom = token("space.150"),
	paddingTop = token("space.150"),
	selectionToolbar,
}: Readonly<JiraKanbanProps>) {
	const scrollRef = useRef<HTMLDivElement>(null);
	const [canScrollRight, setCanScrollRight] = useState(false);
	const dragImageRef = useRef<HTMLDivElement | null>(null);
	const selectedCount = selectedCardCodes?.size ?? 0;
	const selectedStatus = selectedCardCodes
		? getCommonSelectedCardStatus(boardColumns, selectedCardCodes)
		: null;

	// oxlint-disable react-doctor/no-adjust-state-on-prop-change -- scroll affordance depends on measured DOM dimensions.
	useEffect(() => {
		const scrollContainer = scrollRef.current;

		if (!scrollContainer) {
			return;
		}

		const updateScrollAffordance = () => {
			const maxScrollLeft = scrollContainer.scrollWidth - scrollContainer.clientWidth;
			setCanScrollRight(maxScrollLeft > 1 && scrollContainer.scrollLeft < maxScrollLeft - 1);
		};

		updateScrollAffordance();

		const resizeObserver =
			typeof ResizeObserver === "undefined"
				? null
				: new ResizeObserver(() => {
					updateScrollAffordance();
				});

		resizeObserver?.observe(scrollContainer);
		// Use `scrollend` (Baseline 2025-09-15) so React state only updates once
		// the user finishes scrolling, rather than re-rendering the affordance
		// chip on every animation frame during a horizontal scroll.
		scrollContainer.addEventListener("scrollend", updateScrollAffordance, { passive: true });
		window.addEventListener("resize", updateScrollAffordance);

		return () => {
			resizeObserver?.disconnect();
			scrollContainer.removeEventListener("scrollend", updateScrollAffordance);
			window.removeEventListener("resize", updateScrollAffordance);
		};
	}, [boardColumns]);

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
		<div className="relative flex-1 min-h-0">
			{canScrollRight ? (
				<div
					aria-hidden="true"
					className="pointer-events-none absolute top-2 right-4 z-10 rounded-full border border-border bg-surface-raised px-2.5 py-1 text-[11px] font-medium text-text-subtle shadow-sm"
				>
					Scroll for more
				</div>
			) : null}

				<section
					ref={scrollRef}
					tabIndex={0}
				aria-label={ariaLabel}
				className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
				style={{
					flex: 1,
					paddingTop,
					paddingBottom,
					paddingInline: token("space.200"),
					overflowX: "auto",
					overflowY: "hidden",
					minHeight: 0,
				}}
				>
				<div className="flex items-stretch gap-2" style={{ minWidth: "100%" }}>
					{boardColumns.map((column) => (
						<div
							key={column.title}
							className="border-2 border-transparent transition-colors"
							onDragOver={handleColumnDragOver}
							onDragLeave={handleColumnDragLeave}
							onDrop={(event) => handleColumnDrop(event, column.title)}
							style={{ flex: "1 1 0", minWidth: "168px", borderRadius: token("radius.xlarge") }}
						>
							<BoardColumn
								agents={agents}
								assignedAgentIds={assignedAgentIdsByColumn[column.title] ?? []}
								count={column.cards.length}
								headerPaddingBlock={columnHeaderPaddingBlock}
								onCreateAgent={onCreateAgent}
								onToggleAgent={
									onToggleColumnAgent
										? (agentId) => onToggleColumnAgent(column.title, agentId)
										: undefined
								}
								title={column.title}
							>
								{column.cards.map((card, cardIndex) => {
									const isSelected = selectedCardCodes?.has(card.code) ?? false;
									const isCardBeingDragged = draggedCardCode === card.code;
									const isMultiSelection = (selectedCardCodes?.size ?? 0) > 1;
									const isSelectedCardBeingDragged = Boolean(draggedCardCode && isMultiSelection && isSelected);
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
										<JiraIssue
											key={card.code}
											summary={card.title}
											issueKey={card.code}
											tags={card.tags}
											priority={card.priority}
											assigneeAvatarSrc={card.avatarSrc}
											assigneeAvatarShape={card.avatarShape}
											assigneeUnassignedKind={card.avatarUnassignedKind}
											assigneePulse={card.avatarPulse}
											agentActivities={card.agentActivities}
											agentActivityMode={card.agentActivityMode}
											agentDoneRuns={card.agentDoneRuns}
											generativeAction={
												onCardGenerativeActionSubmit
													? {
														onSubmit: (request) =>
															onCardGenerativeActionSubmit(request, card, column.title),
													}
													: undefined
											}
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
											onAgentActivityQuestionSubmit={
												onCardAgentActivityQuestionSubmit
													? (activity, answers) =>
														onCardAgentActivityQuestionSubmit(activity, answers, card, column.title)
													: undefined
											}
											dragging={isCardBeingDragged || isSelectedCardBeingDragged}
											selected={isSelected}
											onClick={handleClick}
											onDragStart={(event) => handleCardDragStartInternal(card, column.title, event)}
											onDragEnd={handleCardDragEndInternal}
										/>
									);
								})}
							</BoardColumn>
						</div>
					))}
				</div>
				</section>
				{selectionToolbar ? (
					<JiraToolbar
						agents={selectionToolbar.agents ?? agents ?? []}
						className={selectionToolbar.className}
						onAgentAssignmentChange={selectionToolbar.onAgentAssignmentChange}
						onBrowseAgents={selectionToolbar.onBrowseAgents}
						onClearSelection={selectionToolbar.onClearSelection}
						onCreateAgent={selectionToolbar.onCreateAgent}
						onDelete={selectionToolbar.onDelete}
						onEditFields={selectionToolbar.onEditFields}
						onMerge={selectionToolbar.onMerge}
						onSelectAll={selectionToolbar.onSelectAll}
						onStatusChange={selectionToolbar.onStatusChange}
						onWatchOptions={selectionToolbar.onWatchOptions}
						selectedAgentIds={selectionToolbar.selectedAgentIds}
						selectedCount={selectedCount}
						selectedStatus={selectedStatus}
						statusOptions={boardColumns.map((column) => column.title)}
					/>
				) : null}
			</div>
	);
}
