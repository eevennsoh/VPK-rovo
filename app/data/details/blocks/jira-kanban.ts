import type { ComponentDetail } from "@/app/data/component-detail-types";

export const JIRA_KANBAN_DETAIL: ComponentDetail = {
	description:
		"Enterprise RFP Jira kanban board with drag-and-drop work-item cards, agent assignment controls, tags, priority signals, avatar ownership, multi-select drag support, and optional Jira Toolbar actions. Ships a standard variant plus an experimental variant that starts identical and diverges independently.",
	demoLayout: { previewHeight: "fit", examplesContentWidth: "bleed" },
	importStatement: `import { JiraKanban } from "@/components/blocks/jira-kanban";`,
	usage: `import JiraKanbanPage from "@/components/blocks/jira-kanban/page";
import ExperimentalJiraKanbanPage from "@/components/blocks/jira-kanban/experimental/page";`,
	examples: [
		{
			title: "Standard",
			description: "Current Jira kanban board: drag-and-drop columns, per-column agent assignment, assignee filtering, and the multi-select Jira Toolbar.",
			demoSlug: "jira-kanban-demo-standard",
		},
		{
			title: "Experimental",
			description: "Standalone fork of the standard board that starts identical to it. Owns its own board, header, and page tree so experimental changes never touch the default variant; shares the board state helpers and data contracts.",
			demoSlug: "jira-kanban-demo-experimental",
		},
	],
	props: [
		{ name: "selectionToolbar", type: "JiraKanbanSelectionToolbarConfig", description: "Optional Jira Toolbar actions shown while controlled card selection is non-empty." },
	],
};
