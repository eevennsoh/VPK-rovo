/**
 * Production Jira board "View settings" options, mirrored into the board's View
 * menu. Picking a row moves the menu's own indicator but does not change the
 * board — these lists are the chrome only, matching `BOARD_GROUP_OPTIONS` and
 * `BOARD_SORT_OPTIONS`.
 */
export const BOARD_HIDE_DONE_OPTIONS = [
	{ id: "never", label: "Never" },
	{ id: "1-day", label: "1 day" },
	{ id: "7-days", label: "7 days" },
	{ id: "14-days", label: "14 days" },
	{ id: "30-days", label: "30 days" },
	{ id: "60-days", label: "60 days" },
] as const;

export type BoardHideDoneOptionId = (typeof BOARD_HIDE_DONE_OPTIONS)[number]["id"];

export const BOARD_HIDE_DONE_DEFAULT_ID: BoardHideDoneOptionId = "14-days";

export const BOARD_COLUMN_SIZE_OPTIONS = [
	{ id: "fixed", label: "Fixed width" },
	{ id: "flexible", label: "Flexible width" },
] as const;

export type BoardColumnSizeId = (typeof BOARD_COLUMN_SIZE_OPTIONS)[number]["id"];

export const BOARD_COLUMN_SIZE_DEFAULT_ID: BoardColumnSizeId = "fixed";

/**
 * A checkbox row in the View menu: something on the board that can be shown or
 * hidden. Shared by the column, PR-state, agent-state, and card-field lists so
 * they stay one shape rather than four copies.
 */
interface BoardVisibilityOption {
	id: string;
	label: string;
	/** Whether the item starts visible on the board. */
	shown: boolean;
}

/**
 * Board column visibility. Distinct from `BOARD_COLUMN_SIZE_OPTIONS`, which
 * sizes the columns rather than choosing which ones render. The labels mirror
 * the board's own status phases; they are duplicated here rather than imported
 * from the consuming project so the block stays the owner of its chrome.
 */
export const BOARD_COLUMN_OPTIONS: readonly BoardVisibilityOption[] = [
	{ id: "to-do", label: "To do", shown: true },
	{ id: "in-progress", label: "In progress", shown: true },
	{ id: "in-review", label: "In review", shown: true },
	{ id: "done", label: "Done", shown: true },
];

/**
 * Which pull-request states surface on a card's development row. Ordered by
 * where a PR sits in its lifecycle rather than alphabetically, so the list
 * reads as a progression.
 *
 * `as const satisfies` rather than a plain annotation: the shape is still
 * checked, but the literal ids survive so `BoardPrStateId` can key the menu's
 * icon map and make a missing glyph a type error rather than a blank row.
 */
export const BOARD_PR_STATE_OPTIONS = [
	{ id: "open", label: "Open", shown: true },
	{ id: "draft", label: "Draft", shown: true },
	{ id: "queued", label: "Queued", shown: true },
	{ id: "merged", label: "Merged", shown: true },
	{ id: "closed", label: "Closed", shown: true },
] as const satisfies readonly BoardVisibilityOption[];

export type BoardPrStateId = (typeof BOARD_PR_STATE_OPTIONS)[number]["id"];

/**
 * Which agent-session states surface on a card's activity row. Ordered by the
 * shape of a session rather than alphabetically: the state an agent holds on
 * its own, then the one that wants a human, then the terminal one.
 *
 * Label-only in the menu — unlike PR state these rows carry no leading glyph,
 * so the list needs no literal-id union to key an icon map.
 */
export const BOARD_AGENT_STATE_OPTIONS: readonly BoardVisibilityOption[] = [
	{ id: "working", label: "Working", shown: true },
	{ id: "needs-input", label: "Needs input", shown: true },
	{ id: "finished", label: "Finished", shown: true },
];

interface BoardFieldOption extends BoardVisibilityOption {
	/** Summary always renders, so Jira locks its toggle on. */
	locked?: boolean;
}

export const BOARD_FIELD_OPTIONS: readonly BoardFieldOption[] = [
	{ id: "agent-sessions", label: "Agent sessions", shown: true },
	{ id: "assignee", label: "Assignee", shown: true },
	{ id: "card-cover", label: "Card cover", shown: false },
	{ id: "confluence-items", label: "Confluence items", shown: false },
	{ id: "created", label: "Created", shown: false },
	{ id: "days-in-column", label: "Days in column", shown: false },
	{ id: "development", label: "Development", shown: true },
	{ id: "due-date", label: "Due date", shown: true },
	{ id: "flagged", label: "Flagged", shown: true },
	{ id: "labels", label: "Labels", shown: true },
	{ id: "linked-work-items", label: "Linked work items", shown: false },
	{ id: "parent", label: "Parent", shown: true },
	{ id: "reporter", label: "Reporter", shown: false },
	{ id: "resolved", label: "Resolved", shown: false },
	{ id: "start-date", label: "Start date", shown: false },
	{ id: "status", label: "Status", shown: false },
	{ id: "subtask-summary", label: "Subtask summary", shown: true },
	{ id: "summary", label: "Summary", shown: true, locked: true },
	{ id: "team", label: "Team", shown: false },
	{ id: "updated", label: "Updated", shown: false },
	{ id: "work-item-key", label: "Work item key", shown: true },
	{ id: "work-type", label: "Work type", shown: true },
];
