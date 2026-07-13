import type { ComponentDetail } from "@/app/data/component-detail-types";

export const JIRA_KANBAN_DETAIL: ComponentDetail = {
	description:
		"Enterprise RFP Jira kanban board with drag-and-drop work-item cards, agent assignment controls, tags, priority signals, avatar ownership, and multi-select drag support.",
	demoLayout: { previewHeight: "fit" },
	importStatement: `import { JiraKanban } from "@/components/blocks/jira-kanban";`,
};
