import { cn } from "../../../lib/utils.ts";

import type {
	JiraListAgentSessionDropIntent,
	JiraListInsertion,
	JiraListInsertionPosition,
} from "@/components/blocks/jira-list/jira-list-types";

export interface JiraListInsertionTarget {
	issueKey: string;
	position: JiraListInsertionPosition;
}

export type JiraListRowZone = "before" | "drag" | "after";
export type JiraListColumnBoundaryIndex = number;

export interface JiraListRowTarget {
	issueKey: string;
	zone: JiraListRowZone;
}

export function getColumnBoundaryIndex(
	columnOffset: number,
	columnWidth: number,
	columnIndex: number,
): JiraListColumnBoundaryIndex {
	if (columnOffset < columnWidth / 2) {
		return columnIndex;
	}

	return columnIndex + 1;
}

export const JIRA_LIST_ROW_ZONE_BAND = 1 / 3;

export function getRowZone(rowOffset: number, rowHeight: number): JiraListRowZone {
	const rowThird = rowHeight * JIRA_LIST_ROW_ZONE_BAND;

	if (rowOffset < rowThird) {
		return "before";
	}

	if (rowOffset > rowThird * 2) {
		return "after";
	}

	return "drag";
}

export function getInsertionFromRowZone(
	zone: JiraListRowZone,
	row: Readonly<{ issueKey: string; rowIndex: number }>,
): JiraListInsertion | null {
	if (zone === "drag") {
		return null;
	}

	return {
		insertAtIndex: zone === "before" ? row.rowIndex : row.rowIndex + 1,
		position: zone,
		relativeToIssueKey: row.issueKey,
	};
}

export function getAgentSessionInsertionTarget(
	intent: JiraListAgentSessionDropIntent | undefined,
): JiraListInsertionTarget | null {
	return intent?.kind === "create"
		? {
			issueKey: intent.insertion.relativeToIssueKey,
			position: intent.insertion.position,
		}
		: null;
}

export function isAgentSessionAttachTarget(
	intent: JiraListAgentSessionDropIntent | undefined,
	issueKey: string,
): boolean {
	return intent?.kind === "attach" && intent.issueKey === issueKey;
}

export function getAgentSessionAttachCellClassName(isTarget: boolean): string | undefined {
	return isTarget ? "bg-bg-selected ring-1 ring-inset ring-border-selected" : undefined;
}

export function getDragInsertionPosition(
	isDropTarget: boolean,
	draggingIndex: number,
	dragOverIndex: number,
): JiraListInsertionPosition | undefined {
	if (!isDropTarget) {
		return undefined;
	}

	return draggingIndex < dragOverIndex ? "after" : "before";
}

export function getBodyCellClassName({
	isSelected,
	isLastColumn = false,
	isLastRow = false,
	align = "left",
}: Readonly<{
	isSelected: boolean;
	isLastColumn?: boolean;
	isLastRow?: boolean;
	align?: "left" | "center";
}>) {
	return cn(
		"relative h-10 border-b border-r border-border px-3 py-0 align-middle whitespace-nowrap transition-colors",
		align === "center" && "text-center",
		isLastColumn && "border-r-0",
		isLastRow && "border-b-0",
		isSelected
			? "bg-bg-selected"
			: "bg-surface group-hover/row:bg-bg-neutral-subtle-hovered group-focus-within/row:bg-bg-neutral-subtle-hovered",
	);
}

export function isInsertionTarget(
	target: JiraListInsertionTarget | null,
	issueKey: string,
	position: JiraListInsertionPosition,
): boolean {
	return target?.issueKey === issueKey && target.position === position;
}

export function getInsertionLineClassName(
	position: JiraListInsertionPosition | undefined,
): string | undefined {
	if (position === "before") {
		return "after:pointer-events-none after:absolute after:-top-px after:-inset-x-px after:z-30 after:h-0.5 after:bg-border-selected";
	}

	if (position === "after") {
		return "after:pointer-events-none after:absolute after:-bottom-px after:-inset-x-px after:z-30 after:h-0.5 after:bg-border-selected";
	}

	return undefined;
}

export function getRowAnchorName(instanceId: string, rowIndex: number): string {
	return `--jira-list-${instanceId}-row-${rowIndex}`;
}

export function getColumnAnchorName(instanceId: string, columnIndex: number): string {
	return `--jira-list-${instanceId}-column-${columnIndex}`;
}
