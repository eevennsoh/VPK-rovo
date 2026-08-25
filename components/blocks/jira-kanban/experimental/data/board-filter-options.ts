import { PULSE_EPICS, PULSE_SPRINTS } from "../pulse/data/pulse-scopes";
import type { BoardFilterDaysPreset, BoardFilterFieldId } from "../lib/board-filter";

export interface BoardFilterOption {
	description?: string;
	id: string;
	label: string;
	lozenge?: "danger" | "neutral" | "success";
}

export const BOARD_FILTER_FIELD_LABELS: Readonly<Record<BoardFilterFieldId, string>> = {
	assignee: "Assignee",
	days: "Filter by days",
	labels: "Labels",
	parent: "Parent",
	project: "Atlassian Project",
	sprint: "Sprint",
	status: "Status",
	"work-type": "Work type",
};

export const BOARD_FILTER_DAYS_OPTIONS: readonly Readonly<{
	id: BoardFilterDaysPreset;
	label: string;
}>[] = [
	{ id: "today", label: "Today" },
	{ id: "yesterday", label: "Yesterday" },
	{ id: "last-3-days", label: "Last 3 days" },
	{ id: "last-7-days", label: "Last 7 days" },
	{ id: "last-30-days", label: "Last 30 days" },
	{ id: "custom", label: "Custom date range" },
];

export const BOARD_FILTER_OPTIONS: Readonly<
	Record<Exclude<BoardFilterFieldId, "assignee" | "days">, readonly BoardFilterOption[]>
> = {
	labels: [
		{ id: "no-label", label: "No label" },
		{ id: "qualification", label: "qualification" },
		{ id: "enterprise", label: "enterprise" },
		{ id: "payments-sdk", label: "payments-sdk" },
		{ id: "guest-checkout", label: "guest-checkout" },
		{ id: "ai-native-design-org", label: "ai-native-design-org" },
	],
	// Parent and Sprint are the two fields Insights actually reads. They are
	// derived from the Pulse scope fixture rather than hand-listed, so a picker
	// can never offer a scope the article cannot open — the failure a static
	// option list makes invisible until someone clicks the row.
	parent: PULSE_EPICS.map((epic) => ({
		description: epic.key,
		id: epic.id,
		label: epic.name,
	})),
	sprint: PULSE_SPRINTS.map((sprint) => ({
		description: sprint.key,
		id: sprint.id,
		label: sprint.name,
	})),
	project: [
		{ id: "no-project", label: "No project" },
		{ description: "Jira Design", id: "jira-design", label: "Jira Design" },
		{ description: "PAY", id: "pay", label: "Payments SDK v2 migration" },
		{ description: "SHOP", id: "shop", label: "Shop storefront" },
	],
	status: [
		{ id: "rfp-intake", label: "RFP Intake", lozenge: "neutral" },
		{ id: "in-progress", label: "In progress", lozenge: "neutral" },
		{ id: "in-review", label: "In review", lozenge: "neutral" },
		{ id: "blocked", label: "Blocked", lozenge: "danger" },
		{ id: "done", label: "Done", lozenge: "success" },
		{ id: "backlog", label: "Backlog", lozenge: "neutral" },
	],
	"work-type": [
		{ id: "epic", label: "Epic" },
		{ id: "task", label: "Task" },
		{ id: "sub-task", label: "Sub-task" },
	],
};
