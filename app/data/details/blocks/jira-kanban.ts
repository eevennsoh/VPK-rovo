import type { ComponentDetail } from "@/app/data/component-detail-types";

export const JIRA_KANBAN_DETAIL: ComponentDetail = {
	description:
		"Enterprise RFP Jira kanban board with drag-and-drop work-item cards, agent assignment controls, tags, priority signals, avatar ownership, multi-select drag support, and optional Jira Toolbar actions.",
	demoLayout: { previewHeight: "fit" },
	importStatement: `import { JiraKanban } from "@/components/blocks/jira-kanban";`,
	props: [
		{ name: "selectionToolbar", type: "JiraKanbanSelectionToolbarConfig", description: "Optional Jira Toolbar actions shown while controlled card selection is non-empty." },
	],
};
