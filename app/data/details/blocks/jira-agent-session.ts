import type { ComponentDetail } from "@/app/data/component-detail-types";

export const JIRA_AGENT_SESSION_DETAIL: ComponentDetail = {
	description:
		'A grouped list of single-row agent sessions styled like the Jira "For you" feed. Each row shows the working agent\'s avatar and a title line whose treatment reflects the state: a running session shimmers the work-item title (the shimmer alone signals progress), an awaiting session replaces the title with "Awaiting user response" plus animated dots, and a complete session shows a solid title. A metadata line lists the agent name, branch, and pull-request status (PR created / PR merged; omitted until a PR exists). Every row offers a View action that opens the Rovo floating chat, plus a Stop action while running.',
	demoLayout: { previewHeight: "fit" },
	importStatement: `import { JiraAgentSession } from "@/components/blocks/jira-agent-session";`,
	usage: `import { JiraAgentSession } from "@/components/blocks/jira-agent-session";

<JiraAgentSession
  onView={(item) => console.log("view", item.id)}
  onStop={(item) => console.log("stop", item.id)}
/>`,
	examples: [
		{
			title: "Activity card",
			description:
				"Expanded Jira Activity treatment with a rich agent response, supporting details, and an in-card reply composer.",
			demoSlug: "jira-agent-session-demo-activity-card",
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
			name: "onView",
			type: "(item: JiraAgentSessionItem) => void",
			description:
				"Called when a card body or its View action is activated. In the demo this opens the Rovo floating chat.",
		},
		{
			name: "onStop",
			type: "(item: JiraAgentSessionItem) => void",
			description: "Called when the Stop action on a running card is activated.",
		},
		{
			name: "className",
			type: "string",
			description: "Additional classes applied to the root container.",
		},
	],
	subComponents: [
		{
			name: "JiraAgentSessionActivityCard",
			description:
				"Expanded activity-feed variant used by Jira Activity for agent responses, optional supporting details, replies, and a reply composer.",
			props: [
				{
					name: "item",
					type: "JiraAgentSessionItem",
					description:
						"Optional session summary that replaces the compact activity header with the agent avatar, work title, branch, pull-request status, and lifecycle indicator.",
				},
				{
					name: "agentName",
					type: "string",
					description: "Fallback agent name shown when `item` is omitted.",
				},
				{
					name: "timestamp",
					type: "string",
					description: "Fallback relative timestamp shown when `item` is omitted.",
				},
				{
					name: "onView",
					type: "(item: JiraAgentSessionItem) => void",
					description: "Called when the rich activity header's View button is activated.",
				},
				{
					name: "details",
					type: "{ label: string; children: ReactNode }",
					description: "Optional expandable supporting detail.",
				},
				{
					name: "replies",
					type: "ReactNode",
					description: "Rendered replies shown in the card footer.",
				},
				{
					name: "replyComposer",
					type: "ReactNode",
					description: "Optional reply composer shown below replies.",
				},
			],
		},
	],
};
