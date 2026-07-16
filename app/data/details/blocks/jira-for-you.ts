import type { ComponentDetail } from "@/app/data/component-detail-types";

export const JIRA_FOR_YOU_DETAIL: ComponentDetail = {
	description:
		"A personalized \"For you\" work feed that groups Jira work items by status (Needs input, In progress, To do, Done) with issue-type icon tiles, live agent-activity shimmer status, filter tabs, search, and hover row actions.",
	demoLayout: { previewHeight: "fit" },
	importStatement: `import { JiraForYou } from "@/components/blocks/jira-for-you";`,
	usage: `import { JiraForYou } from "@/components/blocks/jira-for-you";

<JiraForYou
  onItemClick={(item) => console.log(item.issueKey)}
/>`,
	props: [
		{
			name: "sections",
			type: "readonly JiraForYouSection[]",
			default: "built-in sample data",
			description:
				"Status-grouped sections, each with a label, optional collapsible flag, and work items.",
		},
		{
			name: "tabs",
			type: "readonly JiraForYouTab[]",
			default: "All / Assigned to me / Worked on / Viewed",
			description: "Filter tabs shown beside the heading; a numeric count renders as a badge.",
		},
		{
			name: "onItemClick",
			type: "(item: JiraForYouItem) => void",
			description: "Called when a work item row or its View action is activated.",
		},
		{
			name: "className",
			type: "string",
			description: "Additional classes applied to the root container.",
		},
	],
};
