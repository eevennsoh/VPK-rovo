"use client";

import {
	Fragment,
	useId,
	useMemo,
	useState,
	type KeyboardEvent as ReactKeyboardEvent,
	type PointerEvent as ReactPointerEvent,
} from "react";
import {
	DndContext,
	KeyboardSensor,
	PointerSensor,
	closestCenter,
	useSensor,
	useSensors,
	type DragEndEvent,
	type DragOverEvent,
	type DragStartEvent,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
	SortableContext,
	sortableKeyboardCoordinates,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import AddIcon from "@atlaskit/icon/core/add";
import AppSwitcherIcon from "@atlaskit/icon/core/app-switcher";
import CalendarIcon from "@atlaskit/icon/core/calendar";
import CheckMarkIcon from "@atlaskit/icon/core/check-mark";
import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";
import ChevronRightIcon from "@atlaskit/icon/core/chevron-right";
import LinkIcon from "@atlaskit/icon/core/link";
import PanelRightIcon from "@atlaskit/icon/core/panel-right";
import RefreshIcon from "@atlaskit/icon/core/refresh";

import { EditorPaletteAssigneePicker } from "@/components/blocks/editor-palette/page";
import {
	JiraListColumnActions,
	JiraListColumnBoundary,
} from "@/components/blocks/jira-list/jira-list-column-controls";
import { AvatarUnassigned } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/ui/icon";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
} from "@/components/ui/input-group";
import { Lozenge, LozengeDropdownTrigger } from "@/components/ui/lozenge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import type {
	JiraListIssueType,
	JiraListProps,
	JiraListRowData,
} from "@/components/blocks/jira-list/jira-list-types";

export type {
	JiraListBaseColumnId,
	JiraListColumnAnchorId,
	JiraListDraftWorkItem,
	JiraListExtraColumn,
	JiraListGoal,
	JiraListInsertion,
	JiraListInsertionPosition,
	JiraListIssueType,
	JiraListPerson,
	JiraListPriority,
	JiraListProps,
	JiraListRowData,
	JiraListStatusOption,
	JiraListTag,
} from "@/components/blocks/jira-list/jira-list-types";

import {
	getBodyCellClassName,
	getColumnAnchorName,
	getColumnBoundaryIndex,
	getDragInsertionPosition,
	getInsertionLineClassName,
	getRowAnchorName,
	getRowZone,
	type JiraListColumnBoundaryIndex,
	type JiraListInsertionTarget,
	type JiraListRowTarget,
} from "@/components/blocks/jira-list/jira-list-dnd";
import {
	HierarchyConnector,
	IssueTypeGlyph,
	JiraListAgentSessionsCell,
	JiraListAvatar,
	JiraListLabelsCell,
	PriorityGlyph,
} from "@/components/blocks/jira-list/jira-list-cells";
import {
	getOrderedColumns,
	type JiraListColumnDefinition,
} from "@/components/blocks/jira-list/jira-list-column-model";
import { PRIORITY_LABELS } from "@/components/blocks/jira-list/jira-list-cell-data";
import {
	JiraListSortableRow,
	RowBoundaryCreateControls,
} from "@/components/blocks/jira-list/jira-list-rows";

const ISSUE_TYPE_OPTIONS: readonly {
	label: string;
	value: JiraListIssueType;
}[] = [
	{ label: "Task", value: "task" },
	{ label: "Epic", value: "epic" },
	{ label: "Story", value: "story" },
	{ label: "Bug", value: "bug" },
	{ label: "Subtask", value: "subtask" },
];

const HEADER_CELL_CLASS =
	"h-10 border-b border-r border-border bg-surface-sunken px-3 py-0 text-left align-middle text-xs font-semibold text-text-subtle whitespace-nowrap last:border-r-0";

export function JiraList({
	rows,
	activeIssueKey,
	ariaLabel = "Jira list view",
	className,
	createLabel = "Create",
	totalCountLabel = `${rows.length}`,
	visibleCount = rows.length,
	selectedIssueKeys = new Set<string>(),
	copiedIssueKey = null,
	draftWorkItem = null,
	extraColumns = [],
	statusOptions = [],
	onCreate,
	onCopyLink,
	onDraftWorkItemCancel,
	onDraftWorkItemAssigneeChange,
	onDraftWorkItemDueDateChange,
	onDraftWorkItemIssueTypeChange,
	onDraftWorkItemSubmit,
	onDraftWorkItemSummaryChange,
	onIssueClick,
	onIssueKeyClick,
	onMoveRow,
	onRefresh,
	onSelectAllRows,
	onSelectRow,
	onStatusChange,
	onToggleExpand,
}: Readonly<JiraListProps>) {
	const insertionAnchorId = useId().replaceAll(":", "");
	const rowIds = useMemo(() => rows.map((row) => row.issueKey), [rows]);
	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
		useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
	);
	const [isDueDateOpen, setIsDueDateOpen] = useState(false);
	const [isAssigneeOpen, setIsAssigneeOpen] = useState(false);
	const [hoveredRowTarget, setHoveredRowTarget] = useState<JiraListRowTarget | null>(null);
	const [hoveredColumnBoundaryIndex, setHoveredColumnBoundaryIndex] =
		useState<JiraListColumnBoundaryIndex | null>(null);
	const [hoveredCreateTarget, setHoveredCreateTarget] = useState<JiraListInsertionTarget | null>(null);
	const [focusedCreateTarget, setFocusedCreateTarget] = useState<JiraListInsertionTarget | null>(null);
	const [rowOverlayElement, setRowOverlayElement] = useState<HTMLDivElement | null>(null);
	const [draggingIssueKey, setDraggingIssueKey] = useState<string | null>(null);
	const [dragOverIssueKey, setDragOverIssueKey] = useState<string | null>(null);
	const [openCopyTooltipIssueKey, setOpenCopyTooltipIssueKey] = useState<string | null>(null);
	const activeInsertionTarget = focusedCreateTarget ?? hoveredCreateTarget;
	const draggingIndex = draggingIssueKey
		? rows.findIndex((row) => row.issueKey === draggingIssueKey)
		: -1;
	const dragOverIndex = dragOverIssueKey
		? rows.findIndex((row) => row.issueKey === dragOverIssueKey)
		: -1;
	const selectableRowCount = rows.length;
	const selectedRowCount = rows.filter((row) => selectedIssueKeys.has(row.issueKey)).length;
	const allRowsSelected = selectableRowCount > 0 && selectedRowCount === selectableRowCount;
	const someRowsSelected = selectedRowCount > 0 && !allRowsSelected;
	const hasHoverRowActions = Boolean(onIssueClick);
	const isFooterDraft = Boolean(
		draftWorkItem && draftWorkItem.insertAtIndex === null,
	);
	const handleRowPointerMove = (
		event: ReactPointerEvent<HTMLTableRowElement>,
		row: JiraListRowData,
	) => {
		const rowBounds = event.currentTarget.getBoundingClientRect();
		const rowOffset = event.clientY - rowBounds.top;
		// Equal thirds keep boundary creation predictable while preserving a full
		// row-height center target for reordering.
		const zone = getRowZone(rowOffset, rowBounds.height);
		setHoveredRowTarget((currentTarget) => (
			currentTarget?.issueKey === row.issueKey && currentTarget.zone === zone
				? currentTarget
				: { issueKey: row.issueKey, zone }
		));
	};
	const handleColumnPointerMove = (
		event: ReactPointerEvent<HTMLTableCellElement>,
		columnIndex: number,
	) => {
		const columnBounds = event.currentTarget.getBoundingClientRect();
		const columnOffset = event.clientX - columnBounds.left;
		const boundaryIndex = getColumnBoundaryIndex(
			columnOffset,
			columnBounds.width,
			columnIndex,
		);
		setHoveredColumnBoundaryIndex((currentBoundaryIndex) => (
			currentBoundaryIndex === boundaryIndex ? currentBoundaryIndex : boundaryIndex
		));
	};
	const clearDragState = () => {
		setDraggingIssueKey(null);
		setDragOverIssueKey(null);
	};
	const handleDragStart = (event: DragStartEvent) => {
		setHoveredRowTarget(null);
		setDraggingIssueKey(String(event.active.id));
	};
	const handleDragOver = (event: DragOverEvent) => {
		setDragOverIssueKey(event.over ? String(event.over.id) : null);
	};
	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;
		clearDragState();
		if (!over || active.id === over.id) {
			return;
		}

		const targetIndex = rows.findIndex((row) => row.issueKey === String(over.id));
		if (targetIndex >= 0) {
			onMoveRow?.(String(active.id), targetIndex);
		}
	};
	const baseColumns: readonly JiraListColumnDefinition[] = [
		{
			id: "work",
			label: "Work",
			widthClassName: "w-[438px]",
			renderCell: (row) => {
				const indentLevel = row.indentLevel ?? 0;
				const isCopiedRow = copiedIssueKey === row.issueKey;

				return (
					<div className="flex min-w-0 items-center gap-2">
						<div className="flex min-w-0 flex-1 items-center gap-1.5">
							<HierarchyConnector indentLevel={indentLevel} />
							{row.hasChildren ? (
								<Button
									aria-label={`${row.isExpanded ? "Collapse" : "Expand"} ${row.issueKey}`}
									className="size-5 shrink-0 rounded-sm px-0 hover:bg-transparent focus-visible:bg-bg-neutral-subtle-hovered"
									onClick={() => onToggleExpand?.(row.issueKey)}
									size="icon-compact"
									variant="ghost"
								>
									<Icon
										className="text-icon-subtle"
										render={
											row.isExpanded ? (
												<ChevronDownIcon label="" size="small" />
											) : (
												<ChevronRightIcon label="" size="small" />
											)
										}
									/>
								</Button>
							) : indentLevel > 0 ? (
								<span aria-hidden="true" className="block size-5 shrink-0" />
							) : null}
							<IssueTypeGlyph issueType={row.issueType} />
							<div className="group/issue-key flex shrink-0 items-center">
								<Button
									className="h-auto shrink-0 px-0 text-link hover:underline focus-visible:underline"
									onClick={() => onIssueKeyClick?.(row)}
									size="compact"
									variant="link"
								>
									{row.issueKey}
								</Button>
								{onCopyLink ? (
									<span
										className={cn(
													"pointer-events-none max-w-0 overflow-hidden opacity-0 transition-[max-width,opacity] duration-normal ease-out-practical motion-reduce:transition-none group-hover/issue-key:pointer-events-auto group-hover/issue-key:max-w-7 group-hover/issue-key:opacity-100 group-has-[:focus-visible]/issue-key:pointer-events-auto group-has-[:focus-visible]/issue-key:max-w-7 group-has-[:focus-visible]/issue-key:opacity-100",
											isCopiedRow && "pointer-events-auto max-w-7 opacity-100",
										)}
										data-testid={`copy-link-reveal-${row.issueKey}`}
									>
										<Tooltip
											onOpenChange={(open) => setOpenCopyTooltipIssueKey(open ? row.issueKey : null)}
											open={isCopiedRow || openCopyTooltipIssueKey === row.issueKey}
										>
											<TooltipTrigger
												render={
													<Button
														aria-label={`${isCopiedRow ? "Copied link" : "Copy link"} for ${row.issueKey}`}
														className={cn(
															"ms-0.5 size-6 shrink-0 translate-x-1 scale-95 transition-[translate,scale] duration-normal ease-out-practical motion-reduce:transition-none group-hover/issue-key:translate-x-0 group-hover/issue-key:scale-100 group-has-[:focus-visible]/issue-key:translate-x-0 group-has-[:focus-visible]/issue-key:scale-100",
															isCopiedRow && "translate-x-0 scale-100",
														)}
														onClick={() => onCopyLink(row)}
														size="icon-compact"
														variant="ghost"
													/>
												}
											>
												<Icon
													className={isCopiedRow ? "text-icon-success" : "text-icon-subtle"}
													render={
														isCopiedRow ? (
															<CheckMarkIcon label="" size="small" />
														) : (
															<LinkIcon label="" size="small" />
														)
													}
												/>
											</TooltipTrigger>
											<TooltipContent>{isCopiedRow ? "Copied" : "Copy link"}</TooltipContent>
										</Tooltip>
									</span>
								) : null}
							</div>
							<button
								className="min-w-0 flex-1 truncate rounded-sm text-left text-[13px] font-medium text-text hover:text-link focus-visible:text-link focus-visible:outline-none"
								onClick={() => onIssueClick?.(row)}
								type="button"
							>
								{row.summary}
							</button>
						</div>
						{hasHoverRowActions ? (
							<div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover/row:opacity-100 group-focus-within/row:opacity-100">
								{onIssueClick ? (
									<Tooltip>
										<TooltipTrigger
											render={
												<Button
													aria-label="Open work item"
													className="text-text-subtle hover:text-text"
													onClick={() => onIssueClick(row)}
													size="icon-compact"
													variant="ghost"
												/>
											}
										>
											<Icon render={<PanelRightIcon label="" size="small" />} />
										</TooltipTrigger>
										<TooltipContent>Open work item</TooltipContent>
									</Tooltip>
								) : null}
							</div>
						) : null}
					</div>
				);
			},
		},
		{
			id: "status",
			label: "Status",
			widthClassName: "w-[126px]",
			renderCell: (row) => onStatusChange && statusOptions.length > 0 ? (
				<DropdownMenu>
					<DropdownMenuTrigger
						render={
							<LozengeDropdownTrigger
								aria-label={`Change status for ${row.issueKey}. Current status: ${row.status}`}
								variant={row.statusVariant ?? "neutral"}
							/>
						}
					>
						{row.status}
					</DropdownMenuTrigger>
					<DropdownMenuContent align="start" className="w-40" sideOffset={6}>
						{statusOptions.map((option) => (
							<DropdownMenuItem
								key={option.status}
								onSelect={() => onStatusChange(row.issueKey, option)}
								selected={option.status === row.status}
							>
								<Lozenge variant={option.statusVariant ?? "neutral"}>
									{option.status}
								</Lozenge>
							</DropdownMenuItem>
						))}
					</DropdownMenuContent>
				</DropdownMenu>
			) : (
				<Lozenge variant={row.statusVariant ?? "neutral"}>{row.status}</Lozenge>
			),
		},
		{
			id: "assignee",
			label: "Assignee",
			widthClassName: "w-[214px]",
			renderCell: (row) => row.assignee ? (
				<div className="flex min-w-0 items-center gap-2">
					<JiraListAvatar person={row.assignee} />
					<span className="truncate text-sm text-text">{row.assignee.name}</span>
				</div>
			) : (
				<span className="text-text-subtle text-sm">Unassigned</span>
			),
		},
		{
			id: "agentSessions",
			label: "Agent sessions",
			widthClassName: "w-[247px]",
			renderCell: (row) => <JiraListAgentSessionsCell agentSessions={row.agentSessions} />,
		},
		{
			id: "priority",
			label: "Priority",
			widthClassName: "w-[112px]",
			renderCell: (row) => (
				<div className="flex items-center gap-2">
					<span aria-hidden="true">
						<PriorityGlyph priority={row.priority} />
					</span>
					<span className="text-sm text-text">{PRIORITY_LABELS[row.priority]}</span>
				</div>
			),
		},
		{
			id: "labels",
			label: "Labels",
			widthClassName: "w-[180px]",
			renderCell: (row) => <JiraListLabelsCell labels={row.labels} />,
		},
		{
			id: "dueDate",
			label: "Due date",
			widthClassName: "w-[114px]",
			renderCell: (row) => (
				<span className="text-sm text-text">{row.dueDate ?? "No due date"}</span>
			),
		},
	];
	const orderedColumns = getOrderedColumns(baseColumns, extraColumns);
	const columnBoundaries = orderedColumns.flatMap((column, columnIndex) => {
		const endBoundary = {
			anchorLabel: column.label,
			anchorSide: "right" as const,
			boundaryIndex: columnIndex + 1,
			positionAnchor: getColumnAnchorName(insertionAnchorId, columnIndex),
			positionLabel: columnIndex === orderedColumns.length - 1
				? `after ${column.label}`
				: `between ${column.label} and ${orderedColumns[columnIndex + 1]?.label ?? ""}`,
		};

		if (columnIndex !== 0) {
			return [endBoundary];
		}

		return [
			{
				anchorLabel: column.label,
				anchorSide: "left" as const,
				boundaryIndex: columnIndex,
				positionAnchor: getColumnAnchorName(insertionAnchorId, columnIndex),
				positionLabel: `before ${column.label}`,
			},
			endBoundary,
		];
	});

	const handleDraftWorkItemKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
		if (event.key === "Enter") {
			event.preventDefault();
			onDraftWorkItemSubmit?.();
			return;
		}

		if (event.key === "Escape") {
			event.preventDefault();
			onDraftWorkItemCancel?.();
		}
	};

	const selectedIssueType = draftWorkItem?.issueType ?? "task";
	const selectedDueDate = draftWorkItem?.dueDate
		? new Date(`${draftWorkItem.dueDate}T00:00:00`)
		: undefined;

	const renderIssueTypeControl = () => (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<Button
						aria-label={`Issue type: ${selectedIssueType}`}
						className="shrink-0 gap-1 px-2"
						size="compact"
						variant="ghost"
					/>
				}
			>
				<IssueTypeGlyph issueType={selectedIssueType} />
				<Icon className="text-icon-subtle" render={<ChevronDownIcon label="" size="small" />} />
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start" className="min-w-48" side="top">
				{ISSUE_TYPE_OPTIONS.map((option) => (
					<DropdownMenuItem
						elemBefore={<IssueTypeGlyph issueType={option.value} />}
						key={option.value}
						onSelect={() => onDraftWorkItemIssueTypeChange?.(option.value)}
						selected={option.value === selectedIssueType}
					>
						{option.label}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);

	const renderFooterMetadataControls = () => (
		<>
			<Popover open={isDueDateOpen} onOpenChange={setIsDueDateOpen}>
				<PopoverTrigger
					render={
						<InputGroupButton
							aria-label={draftWorkItem?.dueDate ? `Due date: ${draftWorkItem.dueDate}` : "Set due date"}
							className="shrink-0"
							size={selectedDueDate ? "xs" : "icon-xs"}
						/>
					}
				>
					<Icon
						className={isDueDateOpen ? "text-icon-selected" : "text-icon-subtle"}
						render={<CalendarIcon label="" size="small" />}
					/>
					{selectedDueDate ? (
						<span className="hidden text-text-subtle xl:inline">
							{new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(selectedDueDate)}
						</span>
					) : null}
				</PopoverTrigger>
				<PopoverContent align="end" className="w-auto p-2" side="top">
					<Calendar
						mode="single"
						onSelect={(date) => {
							onDraftWorkItemDueDateChange?.(
								date
									? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
									: undefined,
							);
							setIsDueDateOpen(false);
						}}
						selected={selectedDueDate}
					/>
				</PopoverContent>
			</Popover>
			<Popover open={isAssigneeOpen} onOpenChange={setIsAssigneeOpen}>
				<PopoverTrigger
					render={
						<InputGroupButton
							aria-label={draftWorkItem?.assignee ? `Assignee: ${draftWorkItem.assignee.name}` : "Set assignee"}
							className="shrink-0"
							size={draftWorkItem?.assignee ? "xs" : "icon-xs"}
						/>
					}
				>
					{draftWorkItem?.assignee ? (
						<JiraListAvatar person={draftWorkItem.assignee} />
					) : (
						<AvatarUnassigned aria-hidden="true" size="xs" />
					)}
					{draftWorkItem?.assignee ? (
						<span className="hidden max-w-28 truncate text-text-subtle xl:inline">
							{draftWorkItem.assignee.name}
						</span>
					) : null}
				</PopoverTrigger>
				<PopoverContent align="end" className="w-auto p-0" side="top">
					<EditorPaletteAssigneePicker
						onSelect={(item) => {
							onDraftWorkItemAssigneeChange?.({
								id: item.id,
								name: item.label,
								avatarShape: item.visual?.kind === "avatar" ? item.visual.shape : undefined,
								avatarSrc:
									item.visual?.kind === "avatar" || item.visual?.kind === "image"
										? item.visual.src
										: undefined,
								avatarUnassignedKind: item.category === "subagent" ? "agent" : undefined,
							});
							setIsAssigneeOpen(false);
						}}
					/>
				</PopoverContent>
			</Popover>
		</>
	);

	const renderDraftWorkItemEditor = (className?: string, showFooterControls = false) => (
		<div className={cn("flex min-w-0 items-center gap-2", className)}>
			{showFooterControls ? renderIssueTypeControl() : <IssueTypeGlyph issueType={selectedIssueType} />}
			<span
				className={cn(
					"shrink-0 text-[13px] font-semibold text-text-subtle",
					showFooterControls && "hidden sm:inline",
				)}
			>
				{draftWorkItem?.issueKeyLabel ?? "NEW"}
			</span>
			<label className="sr-only" htmlFor="jira-list-draft-summary">
				New work item summary
			</label>
			<InputGroup className="h-8 min-w-0 flex-1">
				<InputGroupInput
					autoFocus
					id="jira-list-draft-summary"
					onChange={(event) => onDraftWorkItemSummaryChange?.(event.target.value)}
					onKeyDown={handleDraftWorkItemKeyDown}
					placeholder="What needs to be done?"
					type="text"
					value={draftWorkItem?.summary ?? ""}
				/>
				{showFooterControls ? (
					<InputGroupAddon align="inline-end" className="gap-0.5">
						{renderFooterMetadataControls()}
					</InputGroupAddon>
				) : null}
			</InputGroup>
			<div className="ml-auto flex shrink-0 items-center gap-1">
				<Button
					className="px-2"
					disabled={!draftWorkItem?.summary.trim()}
					onClick={onDraftWorkItemSubmit}
					size="compact"
				>
					Create
				</Button>
				<Button
					className="px-2"
					onClick={onDraftWorkItemCancel}
					size="compact"
					variant="ghost"
				>
					Cancel
				</Button>
			</div>
		</div>
	);

	const renderDraftWorkItemRow = (insertAtIndex: number) => {
		if (draftWorkItem?.insertAtIndex !== insertAtIndex) {
			return null;
		}

		return (
			<TableRow
				className="group/row border-0 hover:bg-transparent focus-within:bg-transparent"
				data-state="draft"
				key={`jira-list-draft-${insertAtIndex}`}
			>
				<TableCell
					className={cn(
						getBodyCellClassName({ isSelected: false, align: "center" }),
						"sticky left-0 z-10 px-0",
					)}
				>
					<div className="flex items-center justify-center">
						<Icon
							className="text-icon-subtle"
							render={<AppSwitcherIcon label="" size="small" />}
						/>
					</div>
				</TableCell>
				<TableCell
					className={cn(
						getBodyCellClassName({ isSelected: false, isLastColumn: true }),
						"px-2",
					)}
					colSpan={orderedColumns.length}
				>
					{renderDraftWorkItemEditor()}
				</TableCell>
			</TableRow>
		);
	};

	return (
		<section
			aria-label={ariaLabel}
			className={cn(
				"relative flex max-h-[640px] flex-col overflow-visible rounded-xl border border-border bg-surface",
				className,
			)}
			data-testid="jira-list"
		>
			<div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[inherit]">
				<div
					className="min-h-0 flex-1 overflow-auto"
					data-testid="jira-list-table-scroll"
				>
					<DndContext
						collisionDetection={closestCenter}
						modifiers={[restrictToVerticalAxis]}
						onDragCancel={clearDragState}
						onDragEnd={handleDragEnd}
						onDragOver={handleDragOver}
						onDragStart={handleDragStart}
						sensors={sensors}
					>
					<Table
					className="min-w-[1570px] table-fixed border-separate border-spacing-0"
					containerClassName="overflow-visible"
					>
					<colgroup>
						<col className="w-10" />
						{orderedColumns.map((column) => (
							<col className={column.widthClassName} key={column.id} />
						))}
					</colgroup>
					<TableHeader className="sticky top-0 z-20 bg-surface-sunken shadow-[inset_0_-1px_0_var(--ds-border)]">
						<TableRow className="border-0 hover:bg-transparent">
							<TableHead className={cn(HEADER_CELL_CLASS, "sticky left-0 z-30 px-0")}>
								<div className="flex items-center justify-center">
									<Checkbox
										aria-label="Select all work items"
										checked={allRowsSelected}
										disabled={selectableRowCount === 0}
										isIndeterminate={someRowsSelected}
										onCheckedChange={(checked) => onSelectAllRows?.(Boolean(checked))}
									/>
								</div>
							</TableHead>
							{orderedColumns.map((column, columnIndex) => {
								const isLastColumn = columnIndex === orderedColumns.length - 1;

								return (
									<TableHead
										className={cn(
											HEADER_CELL_CLASS,
											column.align === "center" && "text-center",
											isLastColumn && "border-r-0",
											"relative overflow-visible",
										)}
										key={column.id}
										onPointerLeave={() => setHoveredColumnBoundaryIndex(null)}
										onPointerMove={(event) => handleColumnPointerMove(event, columnIndex)}
										style={{
											anchorName: getColumnAnchorName(insertionAnchorId, columnIndex),
										}}
									>
										<div className="group/column-header flex min-w-0 items-center gap-2">
											<div
												className={cn(
													"inline-flex min-w-0 items-center gap-1 truncate",
													column.align === "center" && "justify-center",
												)}
											>
												{column.headerContent ?? column.label}
											</div>
											<JiraListColumnActions label={column.label} />
										</div>
									</TableHead>
								);
							})}
						</TableRow>
					</TableHeader>
					<TableBody>
						<SortableContext items={rowIds} strategy={verticalListSortingStrategy}>
							{rows.map((row, rowIndex) => {
								const isSelected = selectedIssueKeys.has(row.issueKey);
								const isActive = activeIssueKey === row.issueKey;
								const isHighlighted = isSelected || isActive;
								const isDropTarget = (
									dragOverIssueKey === row.issueKey
									&& draggingIssueKey !== row.issueKey
								);
								const dragInsertionPosition = getDragInsertionPosition(
									isDropTarget,
									draggingIndex,
									dragOverIndex,
								);
								const insertionLinePosition = activeInsertionTarget?.issueKey === row.issueKey
									? activeInsertionTarget.position
									: dragInsertionPosition;
								const insertionLineClassName = getInsertionLineClassName(insertionLinePosition);

								return (
									<Fragment key={row.issueKey}>
										{renderDraftWorkItemRow(rowIndex)}
										<JiraListSortableRow
											aria-selected={isHighlighted || undefined}
											className="group/row border-0 hover:bg-transparent focus-within:bg-transparent data-[state=selected]:bg-transparent"
											data-active={isActive || undefined}
											data-state={isSelected ? "selected" : undefined}
											handleOverlayElement={rowOverlayElement}
											instanceId={insertionAnchorId}
											isDropTarget={isDropTarget}
											isHandleVisible={(
												hoveredRowTarget?.issueKey === row.issueKey
												&& hoveredRowTarget.zone === "drag"
											)}
											onMoveRow={onMoveRow}
											onPointerLeave={() => setHoveredRowTarget(null)}
											onPointerMove={(event) => handleRowPointerMove(event, row)}
											row={row}
											rowCount={rows.length}
											rowIndex={rowIndex}
										>
											<TableCell
												className={cn(
													getBodyCellClassName({ isSelected: isHighlighted, align: "center" }),
													"sticky left-0 isolate overflow-visible bg-surface! px-0 before:pointer-events-none before:absolute before:inset-0 before:z-0 before:transition-colors",
													isHighlighted
														? "before:bg-bg-selected"
														: "before:bg-transparent group-hover/row:before:bg-bg-neutral-subtle-hovered group-focus-within/row:before:bg-bg-neutral-subtle-hovered",
													insertionLinePosition ? "z-30" : "z-10",
													insertionLineClassName,
												)}
												data-insertion-line={insertionLinePosition}
												style={{ anchorName: getRowAnchorName(insertionAnchorId, rowIndex) }}
											>
												<div className="relative z-10 flex items-center justify-center">
													<Checkbox
														aria-label={`Select ${row.issueKey}`}
														checked={isSelected}
														onCheckedChange={(checked) => onSelectRow?.(row.issueKey, Boolean(checked))}
													/>
												</div>
											</TableCell>
											{orderedColumns.map((column, columnIndex) => (
												<TableCell
													className={cn(
														getBodyCellClassName({
															isSelected: isHighlighted,
															align: column.align,
															isLastColumn: columnIndex === orderedColumns.length - 1,
														}),
														insertionLineClassName,
													)}
													data-insertion-line={insertionLinePosition}
													key={column.id}
												>
													{column.renderCell(row)}
												</TableCell>
											))}
										</JiraListSortableRow>
									</Fragment>
								);
							})}
						</SortableContext>
						{renderDraftWorkItemRow(rows.length)}
					</TableBody>
					</Table>
					</DndContext>
				</div>
				<div
					className="sticky bottom-0 z-20 flex h-10 min-h-10 items-center gap-3 bg-surface px-1 py-1 text-[13px] shrink-0"
					data-footer-state={isFooterDraft ? "editing" : "default"}
					data-testid="jira-list-sticky-footer"
				>
					{isFooterDraft ? (
						<div className="min-w-0 flex-1" data-testid="jira-list-footer-draft">
							{renderDraftWorkItemEditor(undefined, true)}
						</div>
					) : (
						<>
							<div data-testid="jira-list-footer-controls">
								<Button
									className="-ml-2 text-text-subtle hover:text-text"
									onClick={() => onCreate?.()}
									size="default"
									variant="ghost"
								>
									<Icon className="text-icon-subtle" render={<AddIcon label="" size="small" />} />
									{createLabel}
								</Button>
							</div>
							<div
								className="absolute left-1/2 inline-flex -translate-x-1/2 items-center gap-1"
								data-testid="jira-list-footer-count"
							>
								<p className="text-sm font-medium text-text-subtle tabular-nums">
									{visibleCount} of {totalCountLabel}
								</p>
								<Button
									aria-label="Refresh work items"
									onClick={onRefresh}
									size="icon"
									title="Refresh work items"
									variant="ghost"
								>
									<Icon render={<RefreshIcon label="" size="small" />} />
								</Button>
							</div>
						</>
					)}
				</div>
			</div>
			<div
				className="pointer-events-none contents"
				data-testid="jira-list-column-boundary-overlay"
			>
				{columnBoundaries.map((boundary) => (
					<JiraListColumnBoundary
						anchorLabel={boundary.anchorLabel}
						anchorSide={boundary.anchorSide}
						boundaryIndex={boundary.boundaryIndex}
						isTargeted={hoveredColumnBoundaryIndex === boundary.boundaryIndex}
						key={boundary.boundaryIndex}
						positionAnchor={boundary.positionAnchor}
						positionLabel={boundary.positionLabel}
					/>
				))}
			</div>
			{onCreate || onMoveRow ? (
				<RowBoundaryCreateControls
					activeTarget={activeInsertionTarget}
					hoveredTarget={hoveredRowTarget}
					instanceId={insertionAnchorId}
					onCreate={onCreate}
					onFocusedTargetChange={setFocusedCreateTarget}
					onHoveredTargetChange={setHoveredCreateTarget}
					overlayRef={setRowOverlayElement}
					rows={rows}
				/>
			) : null}
		</section>
	);
}
