/**
 * Production Jira board Group picker labels. Selecting a row does not regroup
 * the board — this list is the chrome only.
 */
export const BOARD_GROUP_OPTIONS = [
	{ id: "agent", label: "Agent" },
	{ id: "assignee", label: "Assignee" },
	{ id: "atlassian-project", label: "Atlassian Project" },
	{ id: "epic", label: "Epic" },
	{ id: "labels", label: "Labels" },
	{ id: "priority", label: "Priority" },
	{ id: "subtask", label: "Subtask" },
] as const;

export type BoardGroupOptionId = (typeof BOARD_GROUP_OPTIONS)[number]["id"];

/**
 * Empty on purpose: the View menu opens with no grouping selected. The radio
 * group still accepts a later pick; nothing matches this value, so no row
 * starts checked.
 */
export const BOARD_GROUP_DEFAULT_ID = "" as const;
