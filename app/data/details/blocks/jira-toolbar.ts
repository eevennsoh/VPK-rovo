import type { ComponentDetail } from "@/app/data/component-detail-types";

export const JIRA_TOOLBAR_DETAIL: ComponentDetail = {
	description:
		"Floating Jira bulk-action toolbar for selected work items, with direct agent assignment, status changes, multi-selection actions, and reduced-motion-aware presence transitions.",
	demoLayout: { previewHeight: "fit" },
	importStatement: `import { JiraToolbar } from "@/components/blocks/jira-toolbar";`,
	props: [
		{ name: "selectedCount", type: "number", required: true, description: "Number of selected Jira work items; zero hides the toolbar." },
		{ name: "agents", type: "readonly JiraToolbarAgent[]", required: true, description: "Agents displayed in the shared Agent Selector." },
		{ name: "selectedAgentIds", type: "readonly string[]", default: "[]", description: "Agents assigned to every selected work item." },
		{ name: "statusOptions", type: "readonly string[]", required: true, description: "Available Jira statuses in menu order." },
		{ name: "selectedStatus", type: "string | null", description: "Common status for all selected work items, or null for mixed statuses." },
		{ name: "onAgentAssignmentChange", type: "(agentId: string, assigned: boolean) => void", required: true, description: "Adds or removes an agent across the selected work items." },
		{ name: "onStatusChange", type: "(status: string) => void", required: true, description: "Changes the selected work items to a Jira status." },
		{ name: "onClearSelection", type: "() => void", required: true, description: "Clears selection and dismisses the toolbar." },
	],
};
