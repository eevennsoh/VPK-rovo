/**
 * Production Jira board Display menu sort options. Picking a row moves the
 * menu's selection indicator but does not re-sort the board — this list is the
 * chrome only, matching `BOARD_GROUP_OPTIONS`.
 */
export const BOARD_SORT_OPTIONS = [
	{ id: "rank", label: "Rank" },
	{ id: "last-updated", label: "Last updated" },
	{ id: "created", label: "Created" },
	{ id: "due-date", label: "Due date" },
	{ id: "priority", label: "Priority" },
	{ id: "summary", label: "Summary" },
] as const;

export type BoardSortOptionId = (typeof BOARD_SORT_OPTIONS)[number]["id"];

/** Jira boards land on manual rank order, so the menu opens on it. */
export const BOARD_SORT_DEFAULT_ID: BoardSortOptionId = "rank";

export const BOARD_SORT_ORDER_OPTIONS = [
	{ id: "ascending", label: "Ascending" },
	{ id: "descending", label: "Descending" },
] as const;

export type BoardSortOrderId = (typeof BOARD_SORT_ORDER_OPTIONS)[number]["id"];

export const BOARD_SORT_ORDER_DEFAULT_ID: BoardSortOrderId = "ascending";
