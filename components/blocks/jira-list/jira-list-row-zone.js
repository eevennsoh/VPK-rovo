export const JIRA_LIST_ROW_ZONE_BAND = 1 / 3;

/** @typedef {"before" | "drag" | "after"} JiraListRowZone */

/**
 * @param {number} rowOffset
 * @param {number} rowHeight
 * @returns {JiraListRowZone}
 */
export function getRowZone(rowOffset, rowHeight) {
	const rowThird = rowHeight * JIRA_LIST_ROW_ZONE_BAND;

	if (rowOffset < rowThird) {
		return "before";
	}

	if (rowOffset > rowThird * 2) {
		return "after";
	}

	return "drag";
}

/**
 * @param {JiraListRowZone} zone
 * @param {{ issueKey: string, rowIndex: number }} row
 * @returns {{ insertAtIndex: number, position: "before" | "after", relativeToIssueKey: string } | null}
 */
export function getInsertionFromRowZone(zone, row) {
	if (zone === "drag") {
		return null;
	}

	return {
		insertAtIndex: zone === "before" ? row.rowIndex : row.rowIndex + 1,
		position: zone,
		relativeToIssueKey: row.issueKey,
	};
}
