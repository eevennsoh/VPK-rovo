import type { ComponentProps } from "react";

import type { JiraIssuePriority, JiraIssueTag } from "@/components/blocks/jira-issue";
import type { AvatarProps, AvatarUnassignedKind } from "@/components/ui/avatar";
import type { Lozenge } from "@/components/ui/lozenge";

export type JiraListPriority = JiraIssuePriority;
export type JiraListTag = JiraIssueTag;
export type JiraListIssueType = "epic" | "task" | "story" | "subtask" | "bug";
export type JiraListBaseColumnId =
	| "work"
	| "status"
	| "assignee"
	| "agentSessions"
	| "goals"
	| "priority"
	| "labels"
	| "dueDate"
	| "contributors";
export type JiraListColumnAnchorId = JiraListBaseColumnId | string;
export type JiraListInsertionPosition = "before" | "after";

export interface JiraListInsertion {
	insertAtIndex: number;
	position: JiraListInsertionPosition;
	relativeToIssueKey: string;
}

export interface JiraListPerson {
	id: string;
	name: string;
	avatarSrc?: string;
	avatarShape?: NonNullable<AvatarProps["shape"]>;
	avatarUnassignedKind?: AvatarUnassignedKind;
}

export interface JiraListGoal {
	text: string;
	emphasis?: "default" | "warning";
}

export interface JiraListRowData {
	issueKey: string;
	summary: string;
	issueType: JiraListIssueType;
	priority: JiraListPriority;
	status: string;
	statusVariant?: ComponentProps<typeof Lozenge>["variant"];
	indentLevel?: number;
	hasChildren?: boolean;
	isExpanded?: boolean;
	assignee?: JiraListPerson;
	// Display labels only; labels are not stable IDs and may repeat.
	agentSessions?: readonly string[];
	goals?: readonly JiraListGoal[];
	labels?: readonly JiraListTag[];
	dueDate?: string;
	contributors?: readonly JiraListPerson[];
}

export interface JiraListStatusOption {
	status: string;
	statusVariant?: ComponentProps<typeof Lozenge>["variant"];
}

export interface JiraListExtraColumn {
	id: string;
	label: string;
	afterColumnId: JiraListColumnAnchorId;
	valuesByIssueKey?: Readonly<Record<string, string>>;
	widthClassName?: string;
}

export interface JiraListDraftWorkItem {
	assignee?: JiraListPerson;
	dueDate?: string;
	insertAtIndex: number | null;
	issueKeyLabel?: string;
	issueType?: JiraListIssueType;
	summary: string;
}

export interface JiraListProps {
	rows: readonly JiraListRowData[];
	activeIssueKey?: string;
	ariaLabel?: string;
	className?: string;
	createLabel?: string;
	totalCountLabel?: string;
	visibleCount?: number;
	selectedIssueKeys?: ReadonlySet<string>;
	copiedIssueKey?: string | null;
	draftWorkItem?: JiraListDraftWorkItem | null;
	extraColumns?: readonly JiraListExtraColumn[];
	statusOptions?: readonly JiraListStatusOption[];
	onCreate?: (insertion?: JiraListInsertion) => void;
	onAddColumn?: (afterColumnId: JiraListColumnAnchorId) => void;
	onCopyLink?: (row: JiraListRowData) => void;
	onDraftWorkItemCancel?: () => void;
	onDraftWorkItemAssigneeChange?: (assignee: JiraListPerson | undefined) => void;
	onDraftWorkItemDueDateChange?: (dueDate: string | undefined) => void;
	onDraftWorkItemIssueTypeChange?: (issueType: JiraListIssueType) => void;
	onDraftWorkItemSubmit?: () => void;
	onDraftWorkItemSummaryChange?: (summary: string) => void;
	onIssueClick?: (row: JiraListRowData) => void;
	onIssueKeyClick?: (row: JiraListRowData) => void;
	onMoveRow?: (issueKey: string, targetIndex: number) => void;
	onRefresh?: () => void;
	onSelectAllRows?: (checked: boolean) => void;
	onSelectRow?: (issueKey: string, checked: boolean) => void;
	onStatusChange?: (issueKey: string, status: JiraListStatusOption) => void;
	onToggleExpand?: (issueKey: string) => void;
}
