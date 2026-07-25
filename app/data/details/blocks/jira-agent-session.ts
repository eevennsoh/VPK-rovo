import type { ComponentDetail } from "@/app/data/component-detail-types";

export const JIRA_AGENT_SESSION_DETAIL: ComponentDetail = {
	description:
		'A grouped list of single-row agent sessions styled like the Jira "For you" feed. Each row shows the working agent\'s avatar and a title line whose treatment reflects the state: a running session shimmers the work-item title (the shimmer alone signals progress), an awaiting session replaces the title with "Awaiting user response" plus animated dots, and a complete session shows a solid title. A metadata line lists the agent name, branch, and pull-request status (PR created / PR merged; omitted until a PR exists). Every row offers a View action that opens the Rovo floating chat.',
	demoLayout: { previewHeight: "fit" },
	importStatement: `import { JiraAgentSession } from "@/components/blocks/jira-agent-session";`,
	usage: `import { JiraAgentSession } from "@/components/blocks/jira-agent-session";

<JiraAgentSession
  onView={(item) => console.log("view", item.id)}
/>`,
	examples: [
		{
			title: "Compact",
			description:
				"The same session states and actions in a denser row with a 24px agent avatar and 12px title.",
			demoSlug: "jira-agent-session-demo-compact",
		},
	],
	props: [
		{
			name: "items",
			type: "readonly JiraAgentSessionItem[]",
			default: "built-in sample data",
			description:
				"Session cards to render. Each item's `state` (\"running\" | \"complete\" | \"needs-input\") drives the status treatment and row actions.",
		},
		{
			name: "variant",
			type: '"default" | "compact"',
			default: '"default"',
			description:
				"Controls row density. Compact rows use a 24px agent avatar and 12px title while preserving all states and actions.",
		},
		{
			name: "onView",
			type: "(item: JiraAgentSessionItem) => void",
			description:
				"Called when a card body or its View action is activated. In the demo this opens the Rovo floating chat.",
		},
		{
			name: "className",
			type: "string",
			description: "Additional classes applied to the root container.",
		},
	],
};
