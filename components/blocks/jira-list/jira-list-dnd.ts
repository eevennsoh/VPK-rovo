import { cn } from "@/lib/utils";

import type {
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

export function getRowZone(rowOffset: number, rowHeight: number): JiraListRowZone {
	const rowThird = rowHeight / 3;

	if (rowOffset < rowThird) {
		return "before";
	}

	if (rowOffset > rowThird * 2) {
		return "after";
	}

	return "drag";
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
		return "shadow-[inset_0_2px_0_var(--ds-border-selected)]";
	}

	if (position === "after") {
		return "shadow-[inset_0_-2px_0_var(--ds-border-selected)]";
	}

	return undefined;
}

export function getRowAnchorName(instanceId: string, rowIndex: number): string {
	return `--jira-list-${instanceId}-row-${rowIndex}`;
}

export function getColumnAnchorName(instanceId: string, columnIndex: number): string {
	return `--jira-list-${instanceId}-column-${columnIndex}`;
}
