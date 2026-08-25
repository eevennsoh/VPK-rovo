import type { ComponentDetail } from "@/app/data/component-detail-types";

export const AGENT_SESSION_FLYOUT_DETAIL: ComponentDetail = {
	description:
		"The `/jira-golden-journeys-v0` queue session flyout, presented as one compact chat-history list. Every row feeds one shared, anchored flyout viewport, so hovering vertically between sessions moves and resizes the popup while its content crossfades. The flyout includes a title with a relative timestamp, an awaiting-response banner, Session/Agent/Work item rows (the agent as an at-mention Tag pill, the work item as a SmartLink with its status lozenge), and a separated \u201cDevelopment\u201d block for SCM fields. By default the block renders the four `/jira-golden-journeys-v0` sessions — awaiting user response, in progress, PR open, and PR merged.",
	demoLayout: { previewHeight: "fit" },
	importStatement: `import { AgentSessionFlyout } from "@/components/blocks/agent-session-flyout";`,
	usage: `import { AgentSessionFlyout } from "@/components/blocks/agent-session-flyout";

<AgentSessionFlyout />`,
	props: [
		{
			name: "sessions",
			type: "readonly JiraSidebarSessionItem[]",
			default: "the four /jira-golden-journeys-v0 queue sessions",
			description:
				"Sessions to render, one trigger per item feeding the shared flyout. Each item's `status` (\"awaiting-input\" | \"running\" | \"pr-open\" | \"merged\" | \"stopped\") and populated fields drive which detail rows appear.",
		},
		{
			name: "className",
			type: "string",
			description: "Additional classes applied to the compact session-list container.",
		},
	],
};
