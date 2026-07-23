import type { ComponentDetail } from "@/app/data/component-detail-types";

export const JIRA_FOR_YOU_DETAIL: ComponentDetail = {
	description:
		"A personalized Jira work feed with a reusable list primitive and a full-height workspace demo that opens agent-specific conversation and details from the existing View action.",
	demoLayout: { previewContentWidth: "full", previewHeight: "fixed" },
	importStatement: `import { JiraForYouWorkspace, JiraForYou } from "@/components/blocks/jira-for-you";`,
	usage: `import { JiraForYouWorkspace, JiraForYou } from "@/components/blocks/jira-for-you";

<JiraForYouWorkspace />

<JiraForYou
  onItemClick={(item) => console.log(item.issueKey)}
  onView={(item) => console.log("open workspace", item.issueKey)}
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
			description: "Called when a row body is activated. Standalone list consumers keep the existing behavior unless they supply onView separately.",
		},
		{
			name: "onView",
			type: "(item: JiraForYouItem) => void",
			description: "Called when the row’s View action is activated. When omitted, View falls back to onItemClick for existing list consumers.",
		},
		{
			name: "className",
			type: "string",
			description: "Additional classes applied to the root list or workspace container.",
		},
	],
};
