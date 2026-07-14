import type { ComponentDetail } from "@/app/data/component-detail-types";

export const JIRA_EPIC_DETAIL: ComponentDetail = {
	description:
		"Jira parent epic selector with a tag-style trigger, selectable epic rows, and parent actions for add, view, and remove workflows.",
	demoLayout: { previewHeight: "fit" },
	importStatement: `import { JiraEpic } from "@/components/blocks/jira-epic";`,
	usage: `import { JiraEpic } from "@/components/blocks/jira-epic";

<JiraEpic
  epics={[
    { id: "agentic-jira", issueKey: "JDSN-174", name: "Agentic Jira", color: "purple" },
    { id: "work-pals", issueKey: "JDSN-210", name: "Work Pals", color: "magenta" },
  ]}
  selectedEpicId="agentic-jira"
  onEpicSelect={(epicId) => console.log(epicId)}
  onAddParent={() => console.log("add parent")}
  onViewParent={() => console.log("view parent")}
  onRemoveParent={() => console.log("remove parent")}
/>`,
	props: [
		{ name: "epics", type: "readonly JiraEpicOption[]", required: true, description: "Epic options shown in the dropdown." },
		{ name: "selectedEpicId", type: "string | null", description: "Controlled selected epic id. Pass null to show the Add parent placeholder." },
		{ name: "defaultSelectedEpicId", type: "string | null", description: "Initial selected epic for uncontrolled usage." },
		{ name: "showLabel", type: "boolean", default: "true", description: "Shows the Parent label above the trigger." },
		{ name: "onEpicSelect", type: "(epicId: string, epic: JiraEpicOption) => void", description: "Called when a parent epic row is selected." },
		{ name: "onAddParent", type: "() => void", description: "Called from the Add parent action." },
		{ name: "onViewParent", type: "() => void", description: "Called from the View parent action." },
		{ name: "onRemoveParent", type: "() => void", description: "Called from the Remove parent action after uncontrolled selection is cleared." },
		{ name: "open", type: "boolean", description: "Controlled dropdown open state." },
		{ name: "onOpenChange", type: "(open: boolean) => void", description: "Called when the dropdown opens or closes." },
	],
};
