"use client";

import { useMemo, useState } from "react";

import { JiraList } from "./index";
import { JIRA_LIST_SAMPLE_ROWS, type JiraListSampleRow } from "./data";

function getVisibleRows(
	rows: readonly JiraListSampleRow[],
	expandedIssueKeys: ReadonlySet<string>,
): JiraListSampleRow[] {
	const visibleRows: JiraListSampleRow[] = [];

	for (const row of rows) {
		if (!row.parentIssueKey) {
			visibleRows.push({
				...row,
				isExpanded: row.hasChildren ? expandedIssueKeys.has(row.issueKey) : row.isExpanded,
			});
			continue;
		}

		if (expandedIssueKeys.has(row.parentIssueKey)) {
			visibleRows.push(row);
		}
	}

	return visibleRows;
}

export default function JiraListPage() {
	const [expandedIssueKeys, setExpandedIssueKeys] = useState<Set<string>>(
		() => new Set(["PD-001"]),
	);
	const [selectedIssueKeys, setSelectedIssueKeys] = useState<Set<string>>(
		() => new Set(["PD-001"]),
	);

	const visibleRows = useMemo(
		() => getVisibleRows(JIRA_LIST_SAMPLE_ROWS, expandedIssueKeys),
		[expandedIssueKeys],
	);

	const handleSelectAllRows = (checked: boolean) => {
		setSelectedIssueKeys(
			checked ? new Set(visibleRows.map((row) => row.issueKey)) : new Set<string>(),
		);
	};

	const handleSelectRow = (issueKey: string, checked: boolean) => {
		setSelectedIssueKeys((currentSelected) => {
			const nextSelected = new Set(currentSelected);
			if (checked) {
				nextSelected.add(issueKey);
			} else {
				nextSelected.delete(issueKey);
			}
			return nextSelected;
		});
	};

	const handleToggleExpand = (issueKey: string) => {
		setExpandedIssueKeys((currentExpanded) => {
			const nextExpanded = new Set(currentExpanded);
			if (nextExpanded.has(issueKey)) {
				nextExpanded.delete(issueKey);
			} else {
				nextExpanded.add(issueKey);
			}
			return nextExpanded;
		});
	};

	return (
		<div className="flex h-full min-h-[640px] flex-col bg-surface p-4 md:p-5">
			<div className="min-w-0 overflow-x-auto">
				<JiraList
					onCreate={() => undefined}
					onIssueClick={() => undefined}
					onIssueKeyClick={() => undefined}
					onSelectAllRows={handleSelectAllRows}
					onSelectRow={handleSelectRow}
					onToggleExpand={handleToggleExpand}
					rows={visibleRows}
					selectedIssueKeys={selectedIssueKeys}
					totalCountLabel="1000+"
					visibleCount={50}
				/>
			</div>
		</div>
	);
}
