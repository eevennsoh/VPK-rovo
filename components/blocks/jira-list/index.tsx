"use client";

import {
	Fragment,
	useId,
	useMemo,
	useState,
	type ComponentProps,
	type KeyboardEvent as ReactKeyboardEvent,
	type PointerEvent as ReactPointerEvent,
	type ReactNode,
} from "react";
import { createPortal } from "react-dom";
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
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import AddIcon from "@atlaskit/icon/core/add";
import ArrowUpIcon from "@atlaskit/icon/core/arrow-up";
import AppSwitcherIcon from "@atlaskit/icon/core/app-switcher";
import BugIcon from "@atlaskit/icon/core/bug";
import CalendarIcon from "@atlaskit/icon/core/calendar";
import CheckMarkIcon from "@atlaskit/icon/core/check-mark";
import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";
import ChevronRightIcon from "@atlaskit/icon/core/chevron-right";
import CopyIcon from "@atlaskit/icon/core/copy";
import EpicIcon from "@atlaskit/icon/core/epic";
import PanelRightIcon from "@atlaskit/icon/core/panel-right";
import PriorityMajorIcon from "@atlaskit/icon/core/priority-major";
import PriorityMediumIcon from "@atlaskit/icon/core/priority-medium";
import PriorityMinorIcon from "@atlaskit/icon/core/priority-minor";
import RefreshIcon from "@atlaskit/icon/core/refresh";
import StoryIcon from "@atlaskit/icon/core/story";
import SubtasksIcon from "@atlaskit/icon/core/subtasks";
import TaskIcon from "@atlaskit/icon/core/task";
import PersonAssigneeIcon from "@atlaskit/icon-lab/core/person-assignee";

import { EditorPaletteAssigneePicker } from "@/components/blocks/editor-palette/page";
import {
	JiraListColumnActions,
	JiraListColumnBoundary,
} from "@/components/blocks/jira-list/jira-list-column-controls";
import {
	Avatar,
	AvatarFallback,
	AvatarGroup,
	AvatarImage,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
import { Lozenge } from "@/components/ui/lozenge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tag, TagGroup } from "@/components/ui/tag";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import type {
	JiraListColumnAnchorId,
	JiraListExtraColumn,
	JiraListGoal,
	JiraListInsertion,
	JiraListInsertionPosition,
	JiraListIssueType,
	JiraListPerson,
	JiraListPriority,
	JiraListProps,
	JiraListRowData,
	JiraListTag,
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
	JiraListTag,
} from "@/components/blocks/jira-list/jira-list-types";

const PRIORITY_ICONS = {
	major: PriorityMajorIcon,
	medium: PriorityMediumIcon,
	minor: PriorityMinorIcon,
} as const;

const ISSUE_TYPE_ICONS = {
	epic: EpicIcon,
	task: TaskIcon,
	story: StoryIcon,
	subtask: SubtasksIcon,
	bug: BugIcon,
} as const;

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
const DEFAULT_EXTRA_COLUMN_WIDTH_CLASS = "w-[156px]";

interface JiraListInsertionTarget {
	issueKey: string;
	position: JiraListInsertionPosition;
}

type JiraListRowZone = "before" | "drag" | "after";
type JiraListColumnBoundaryIndex = number;

interface JiraListRowTarget {
	issueKey: string;
	zone: JiraListRowZone;
}

function getColumnBoundaryIndex(
	columnOffset: number,
	columnWidth: number,
	columnIndex: number,
): JiraListColumnBoundaryIndex {
	if (columnOffset < columnWidth / 2) {
		return columnIndex;
	}

	return columnIndex + 1;
}

function getRowZone(rowOffset: number, rowHeight: number): JiraListRowZone {
	const rowThird = rowHeight / 3;

	if (rowOffset < rowThird) {
		return "before";
	}

	if (rowOffset > rowThird * 2) {
		return "after";
	}

	return "drag";
}

function getDragInsertionPosition(
	isDropTarget: boolean,
	draggingIndex: number,
	dragOverIndex: number,
): JiraListInsertionPosition | undefined {
	if (!isDropTarget) {
		return undefined;
	}

	return draggingIndex < dragOverIndex ? "after" : "before";
}

function getBodyCellClassName({
	isSelected,
	isLastColumn = false,
	align = "left",
}: Readonly<{
	isSelected: boolean;
	isLastColumn?: boolean;
	align?: "left" | "center";
}>) {
	return cn(
		"h-10 border-b border-r border-border px-3 py-0 align-middle whitespace-nowrap transition-colors",
		align === "center" && "text-center",
		isLastColumn && "border-r-0",
		isSelected
			? "bg-bg-selected"
			: "bg-surface group-hover/row:bg-bg-neutral-subtle-hovered group-focus-within/row:bg-bg-neutral-subtle-hovered",
	);
}

function isInsertionTarget(
	target: JiraListInsertionTarget | null,
	issueKey: string,
	position: JiraListInsertionPosition,
): boolean {
	return target?.issueKey === issueKey && target.position === position;
}

function getInsertionLineClassName(
	position: JiraListInsertionPosition | undefined,
): string | undefined {
	if (position === "before") {
		return "shadow-[inset_0_2px_0_var(--ds-border-selected)]";
	}

	if (position === "after") {
		return "shadow-[inset_0_-2px_0_var(--ds-border-selected)]";
	}

	return undefined;
}

function getRowAnchorName(instanceId: string, rowIndex: number): string {
	return `--jira-list-${instanceId}-row-${rowIndex}`;
}

function getColumnAnchorName(instanceId: string, columnIndex: number): string {
	return `--jira-list-${instanceId}-column-${columnIndex}`;
}

function RowBoundaryCreateControls({
	activeTarget,
	hoveredTarget,
	instanceId,
	onCreate,
	onFocusedTargetChange,
	onHoveredTargetChange,
	overlayRef,
	rows,
}: Readonly<{
	activeTarget: JiraListInsertionTarget | null;
	hoveredTarget: JiraListRowTarget | null;
	instanceId: string;
	onCreate?: (insertion: JiraListInsertion) => void;
	onFocusedTargetChange: (target: JiraListInsertionTarget | null) => void;
	onHoveredTargetChange: (target: JiraListInsertionTarget | null) => void;
	overlayRef: (element: HTMLDivElement | null) => void;
	rows: readonly JiraListRowData[];
}>) {
	const renderControl = (
		row: JiraListRowData,
		rowIndex: number,
		position: JiraListInsertionPosition,
	) => {
		const isActive = isInsertionTarget(activeTarget, row.issueKey, position);
		const isVisible = (
			hoveredTarget?.issueKey === row.issueKey && hoveredTarget.zone === position
		) || isActive;
		const insertAtIndex = position === "before" ? rowIndex : rowIndex + 1;
		const target = { issueKey: row.issueKey, position };

		return (
			<Tooltip key={`${row.issueKey}-${position}`}>
				<TooltipTrigger
					render={
						<Button
							aria-label={`Create work item ${position} ${row.issueKey}`}
							className={cn(
								"absolute z-30 isolate size-8 -translate-x-1/2 -translate-y-1/2 border-border bg-surface! shadow-md opacity-0 transition-opacity duration-fast before:pointer-events-none before:absolute before:-inset-0.5 before:-z-10 before:rounded-lg before:bg-surface before:content-[''] hover:bg-surface! active:bg-surface! focus-visible:pointer-events-auto focus-visible:bg-surface! focus-visible:opacity-100",
								isVisible && "pointer-events-auto opacity-100",
							)}
							data-insertion-position={position}
							onBlur={() => onFocusedTargetChange(null)}
							onClick={() => onCreate?.({
								insertAtIndex,
								position,
								relativeToIssueKey: row.issueKey,
							})}
							onFocus={() => onFocusedTargetChange(target)}
							onPointerEnter={() => onHoveredTargetChange(target)}
							onPointerLeave={() => onHoveredTargetChange(null)}
							onPointerMove={(event) => event.stopPropagation()}
							size="icon"
							style={{
								left: "anchor(left)",
								positionAnchor: getRowAnchorName(instanceId, rowIndex),
								top: position === "before" ? "anchor(top)" : "anchor(bottom)",
							}}
							variant="outline"
						/>
					}
				>
					<Icon render={<AddIcon label="" size="small" />} />
				</TooltipTrigger>
				<TooltipContent side="right">Create</TooltipContent>
			</Tooltip>
		);
	};

	return (
		<div
			className="pointer-events-none contents"
			data-testid="jira-list-row-boundary-overlay"
			ref={overlayRef}
		>
			{onCreate
				? rows.flatMap((row, rowIndex) => [
						renderControl(row, rowIndex, "before"),
						renderControl(row, rowIndex, "after"),
					])
				: null}
		</div>
	);
}

function JiraListSortableRow({
	children,
	handleOverlayElement,
	instanceId,
	isDropTarget,
	isHandleVisible,
	onMoveRow,
	row,
	rowIndex,
	rowCount,
	...rowProps
}: Readonly<{
	children: ReactNode;
	handleOverlayElement: HTMLDivElement | null;
	instanceId: string;
	isDropTarget: boolean;
	isHandleVisible: boolean;
	onMoveRow?: (issueKey: string, targetIndex: number) => void;
	row: JiraListRowData;
	rowIndex: number;
	rowCount: number;
}> & Omit<ComponentProps<typeof TableRow>, "children">) {
	const [isHandleFocused, setIsHandleFocused] = useState(false);
	const [isHandleHovered, setIsHandleHovered] = useState(false);
	const {
		attributes,
		isDragging,
		listeners,
		setActivatorNodeRef,
		setNodeRef,
		transform,
		transition,
	} = useSortable({ disabled: !onMoveRow, id: row.issueKey });
	const showHandle = isHandleVisible || isHandleFocused || isHandleHovered || isDragging;

	const handleKeyboardMove = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
		if (event.key !== "ArrowUp" && event.key !== "ArrowDown") {
			return;
		}

		event.preventDefault();
		event.stopPropagation();
		const direction = event.key === "ArrowUp" ? -1 : 1;
		const targetIndex = Math.min(Math.max(rowIndex + direction, 0), rowCount - 1);
		if (targetIndex !== rowIndex) {
			onMoveRow?.(row.issueKey, targetIndex);
		}
	};

	const dragHandle = (
		<Tooltip>
			<TooltipTrigger
				render={
					<Button
						{...attributes}
						{...listeners}
						aria-label="Drag to reorder"
						className={cn(
							"absolute z-30 isolate size-8 -translate-x-1/2 -translate-y-1/2 cursor-grab touch-none border-border bg-surface! shadow-md opacity-0 transition-opacity duration-fast before:pointer-events-none before:absolute before:-inset-0.5 before:-z-10 before:rounded-lg before:bg-surface before:content-[''] hover:bg-surface! active:cursor-grabbing active:bg-surface! focus-visible:bg-surface! focus-visible:opacity-100",
							showHandle && "pointer-events-auto opacity-100",
						)}
						data-testid={`jira-list-drag-handle-${row.issueKey}`}
						onBlur={() => setIsHandleFocused(false)}
						onFocus={() => setIsHandleFocused(true)}
						onKeyDownCapture={handleKeyboardMove}
						onPointerEnter={() => setIsHandleHovered(true)}
						onPointerLeave={() => setIsHandleHovered(false)}
						ref={setActivatorNodeRef}
						size="icon"
						style={{
							left: "anchor(left)",
							positionAnchor: getRowAnchorName(instanceId, rowIndex),
							top: "anchor(center)",
						}}
						variant="outline"
					/>
				}
			>
				<Icon render={<AppSwitcherIcon label="" size="small" />} />
			</TooltipTrigger>
			<TooltipContent side="right">Drag to reorder</TooltipContent>
		</Tooltip>
	);

	return (
		<>
			<TableRow
				{...rowProps}
				className={cn(
					rowProps.className,
					isDragging && "z-30 opacity-80 shadow-lg [&>td]:bg-bg-selected",
				)}
				data-dragging={isDragging || undefined}
				data-drop-target={isDropTarget || undefined}
				ref={setNodeRef}
				style={{
					transform: CSS.Transform.toString(transform),
					transition,
				}}
			>
				{children}
			</TableRow>
			{handleOverlayElement && onMoveRow ? createPortal(dragHandle, handleOverlayElement) : null}
		</>
	);
}

function HierarchyConnector({
	indentLevel,
}: Readonly<{
	indentLevel: number;
}>) {
	if (indentLevel <= 0) {
		return null;
	}

	return (
		<div
			aria-hidden="true"
			className="relative shrink-0"
			style={{ width: `${indentLevel * 18}px` }}
		>
			<span className="absolute inset-y-0 left-2 w-px bg-border" />
			<span className="absolute top-1/2 left-2 h-px w-3 -translate-y-1/2 bg-border" />
		</div>
	);
}

function getPersonInitials(name: string): string {
	return name
		.split(/\s+/u)
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0]?.toUpperCase() ?? "")
		.join("");
}

function JiraListAvatar({ person }: Readonly<{ person: JiraListPerson }>) {
	if (person.avatarUnassignedKind) {
		return (
			<Avatar label={person.name} shape={person.avatarShape ?? "circle"} size="sm">
				<AvatarFallback>{person.avatarUnassignedKind === "agent" ? "AI" : "?"}</AvatarFallback>
			</Avatar>
		);
	}

	return (
		<Avatar label={person.name} shape={person.avatarShape ?? "circle"} size="sm">
			{person.avatarSrc ? <AvatarImage alt="" src={person.avatarSrc} /> : null}
			<AvatarFallback>{getPersonInitials(person.name)}</AvatarFallback>
		</Avatar>
	);
}

function IssueTypeGlyph({ issueType }: Readonly<{ issueType: JiraListIssueType }>) {
	const IssueTypeIcon = ISSUE_TYPE_ICONS[issueType];
	return (
		<Icon
			className="text-icon-brand"
			label={issueType}
			render={<IssueTypeIcon label="" size="small" />}
		/>
	);
}

function PriorityGlyph({ priority }: Readonly<{ priority: JiraListPriority }>) {
	const PriorityIcon = PRIORITY_ICONS[priority];
	return (
		<Icon
			className={cn(
				priority === "major" && "text-icon-danger",
				priority === "medium" && "text-icon-information",
				priority === "minor" && "text-icon-success",
			)}
			label={`${priority} priority`}
			render={<PriorityIcon label="" size="small" />}
		/>
	);
}

function OverflowBadge({
	count,
	label,
}: Readonly<{
	count: number;
	label: string;
}>) {
	return count > 0 ? <Badge aria-label={label}>+{count}</Badge> : null;
}

interface JiraListColumnDefinition {
	id: JiraListColumnAnchorId;
	label: string;
	widthClassName: string;
	align?: "left" | "center";
	headerContent?: ReactNode;
	renderCell: (row: JiraListRowData) => ReactNode;
}

function getOrderedColumns(
	baseColumns: readonly JiraListColumnDefinition[],
	extraColumns: readonly JiraListExtraColumn[],
): JiraListColumnDefinition[] {
	const orderedColumns = [...baseColumns];

	for (const extraColumn of extraColumns) {
		const anchorIndex = orderedColumns.findIndex((column) => column.id === extraColumn.afterColumnId);
		orderedColumns.splice(anchorIndex === -1 ? orderedColumns.length : anchorIndex + 1, 0, {
			id: extraColumn.id,
			label: extraColumn.label,
			widthClassName: extraColumn.widthClassName ?? DEFAULT_EXTRA_COLUMN_WIDTH_CLASS,
			renderCell: (row) => (
				<span className="text-sm text-text-subtle">
					{extraColumn.valuesByIssueKey?.[row.issueKey] ?? "None"}
				</span>
			),
		});
	}

	return orderedColumns;
}

function renderAgentSessions(agentSessions: readonly string[] | undefined): ReactNode {
	if (!agentSessions || agentSessions.length === 0) {
		return <span className="text-text-subtle text-sm">None</span>;
	}

	const visibleSessions = agentSessions.slice(0, 2);
	return (
		<div className="flex min-w-0 items-center gap-1 overflow-hidden">
			<TagGroup className="min-w-0 gap-1">
				{visibleSessions.map((session) => (
					<Tag className="max-w-[7rem]" color="teal" key={session}>
						{session}
					</Tag>
				))}
			</TagGroup>
			<OverflowBadge
				count={Math.max(0, agentSessions.length - visibleSessions.length)}
				label={`${agentSessions.length - visibleSessions.length} more agent sessions`}
			/>
		</div>
	);
}

function renderGoals(goals: readonly JiraListGoal[] | undefined): ReactNode {
	if (!goals || goals.length === 0) {
		return <span className="text-text-subtle text-sm">None</span>;
	}

	const [primaryGoal, ...secondaryGoals] = goals;
	return (
		<div className="flex min-w-0 items-center gap-1 overflow-hidden">
			<span
				className={cn(
					"truncate text-sm",
					primaryGoal.emphasis === "warning" ? "text-text-warning" : "text-link",
				)}
			>
				{primaryGoal.text}
			</span>
			<OverflowBadge
				count={secondaryGoals.length}
				label={`${secondaryGoals.length} more goals`}
			/>
		</div>
	);
}

function renderLabels(labels: readonly JiraListTag[] | undefined): ReactNode {
	if (!labels || labels.length === 0) {
		return <span className="text-text-subtle text-sm">None</span>;
	}

	const visibleLabels = labels.slice(0, 2);
	return (
		<div className="flex min-w-0 items-center gap-1 overflow-hidden">
			<TagGroup className="min-w-0 gap-1">
				{visibleLabels.map((label) => (
					<Tag className="max-w-[5.75rem]" color={label.color} key={`${label.text}-${label.color}`}>
						{label.text}
					</Tag>
				))}
			</TagGroup>
			<OverflowBadge
				count={Math.max(0, labels.length - visibleLabels.length)}
				label={`${labels.length - visibleLabels.length} more labels`}
			/>
		</div>
	);
}

function renderContributors(contributors: readonly JiraListPerson[] | undefined): ReactNode {
	if (!contributors || contributors.length === 0) {
		return <span className="text-text-subtle text-sm">None</span>;
	}

	const visibleContributors = contributors.slice(0, 3);
	const overflowCount = Math.max(0, contributors.length - visibleContributors.length);
	return (
		<AvatarGroup
			className="-space-x-1.5 *:data-[slot=avatar]:ring-0!"
			label={`Contributors: ${contributors.map((contributor) => contributor.name).join(", ")}`}
		>
			{visibleContributors.map((contributor) => (
				<JiraListAvatar key={contributor.id} person={contributor} />
			))}
			{overflowCount > 0 ? (
				<Avatar aria-label={`${overflowCount} more contributors`} size="sm">
					<AvatarFallback className="bg-bg-neutral-bold text-[10px] font-semibold text-text-inverse">
						+{overflowCount}
					</AvatarFallback>
				</Avatar>
			) : null}
		</AvatarGroup>
	);
}

export function JiraList({
	rows,
	ariaLabel = "Jira list view",
	className,
	createLabel = "Create",
	totalCountLabel = `${rows.length}`,
	visibleCount = rows.length,
	selectedIssueKeys = new Set<string>(),
	copiedIssueKey = null,
	draftWorkItem = null,
	extraColumns = [],
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
							) : (
								<span aria-hidden="true" className="block size-5 shrink-0" />
							)}
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
											"pointer-events-none max-w-0 overflow-hidden opacity-0 transition-[max-width,opacity] duration-normal ease-out-practical motion-reduce:transition-none group-hover/issue-key:pointer-events-auto group-hover/issue-key:max-w-7 group-hover/issue-key:opacity-100 group-focus-within/issue-key:pointer-events-auto group-focus-within/issue-key:max-w-7 group-focus-within/issue-key:opacity-100",
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
															"ms-0.5 size-6 shrink-0 translate-x-1 scale-95 transition-[translate,scale] duration-normal ease-out-practical motion-reduce:transition-none group-hover/issue-key:translate-x-0 group-hover/issue-key:scale-100 group-focus-within/issue-key:translate-x-0 group-focus-within/issue-key:scale-100",
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
															<CopyIcon label="" size="small" />
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
			renderCell: (row) => <Lozenge variant={row.statusVariant ?? "neutral"}>{row.status}</Lozenge>,
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
			renderCell: (row) => renderAgentSessions(row.agentSessions),
		},
		{
			id: "goals",
			label: "Goals",
			widthClassName: "w-[132px]",
			renderCell: (row) => renderGoals(row.goals),
		},
		{
			id: "priority",
			label: "Priority",
			widthClassName: "w-[61px]",
			align: "center",
			renderCell: (row) => (
				<div className="flex items-center justify-center">
					<PriorityGlyph priority={row.priority} />
				</div>
			),
		},
		{
			id: "labels",
			label: "Labels",
			widthClassName: "w-[112px]",
			renderCell: (row) => renderLabels(row.labels),
		},
		{
			id: "dueDate",
			label: "Due date",
			widthClassName: "w-[114px]",
			renderCell: (row) => (
				<span className="text-sm text-text-subtle">{row.dueDate ?? "No due date"}</span>
			),
		},
		{
			id: "contributors",
			label: "Contributors",
			widthClassName: "w-[173px]",
			headerContent: (
				<span className="inline-flex items-center gap-1">
					Contributors
					<Icon className="text-icon-subtle" render={<ArrowUpIcon label="" size="small" />} />
				</span>
			),
			renderCell: (row) => renderContributors(row.contributors),
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
						className="h-8 shrink-0 gap-1 px-2"
						size="compact"
						variant="outline"
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
						<Button
							aria-label={draftWorkItem?.dueDate ? `Due date: ${draftWorkItem.dueDate}` : "Set due date"}
							className="h-8 shrink-0 gap-1.5 px-2"
							size="compact"
							variant={draftWorkItem?.dueDate ? "outline" : "ghost"}
						/>
					}
				>
					<Icon className="text-icon-subtle" render={<CalendarIcon label="" size="small" />} />
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
						<Button
							aria-label={draftWorkItem?.assignee ? `Assignee: ${draftWorkItem.assignee.name}` : "Set assignee"}
							className="h-8 shrink-0 gap-1.5 px-2"
							size="compact"
							variant={draftWorkItem?.assignee ? "outline" : "ghost"}
						/>
					}
				>
					{draftWorkItem?.assignee ? (
						<JiraListAvatar person={draftWorkItem.assignee} />
					) : (
						<Icon className="text-icon-subtle" render={<PersonAssigneeIcon label="" size="small" />} />
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
			<input
				autoFocus
				className="h-8 min-w-0 flex-1 rounded-md border border-border bg-surface px-2 text-sm text-text outline-none transition-colors focus:border-border-selected focus-visible:ring-3 focus-visible:ring-ring/20"
				id="jira-list-draft-summary"
				onChange={(event) => onDraftWorkItemSummaryChange?.(event.target.value)}
				onKeyDown={handleDraftWorkItemKeyDown}
				placeholder="What needs to be done?"
				type="text"
				value={draftWorkItem?.summary ?? ""}
			/>
			{showFooterControls ? renderFooterMetadataControls() : null}
			<div className="ml-auto flex shrink-0 items-center gap-1">
				<Button
					className="h-7 px-2"
					disabled={!draftWorkItem?.summary.trim()}
					onClick={onDraftWorkItemSubmit}
					size="compact"
				>
					Create
				</Button>
				<Button
					className="h-7 px-2"
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
										<div className="flex min-w-0 items-center gap-2">
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
											aria-selected={isSelected || undefined}
											className="group/row border-0 hover:bg-transparent focus-within:bg-transparent data-[state=selected]:bg-transparent"
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
													getBodyCellClassName({ isSelected, align: "center" }),
													"sticky left-0 overflow-visible px-0",
													insertionLinePosition ? "z-30" : "z-10",
													insertionLineClassName,
												)}
												data-insertion-line={insertionLinePosition}
												style={{ anchorName: getRowAnchorName(insertionAnchorId, rowIndex) }}
											>
												<div className="flex items-center justify-center">
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
															isSelected,
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
					className="sticky bottom-0 z-20 flex h-10 min-h-10 items-center gap-3 bg-surface px-3 py-1 text-[13px] shrink-0"
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
