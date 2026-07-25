import type { ReactNode } from "react";

import type {
	JiraListColumnAnchorId,
	JiraListExtraColumn,
	JiraListRowData,
} from "@/components/blocks/jira-list/jira-list-types";

const DEFAULT_EXTRA_COLUMN_WIDTH_CLASS = "w-[156px]";

export interface JiraListColumnDefinition {
	id: JiraListColumnAnchorId;
	label: string;
	widthClassName: string;
	align?: "left" | "center";
	headerContent?: ReactNode;
	renderCell: (row: JiraListRowData) => ReactNode;
}

export function getOrderedColumns(
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
