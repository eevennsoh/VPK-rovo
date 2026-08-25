import type { ComponentDetail } from "@/app/data/component-detail-types";

export const AGENT_SESSION_FLYOUT_DETAIL: ComponentDetail = {
	description:
		"The `/jira-golden-journeys-v0` queue session flyout, presented as one compact chat-history list. Every row feeds one shared, anchored flyout viewport, so hovering vertically between sessions moves and resizes the popup while its content crossfades. The property-free flyout uses the Agent States card to show the agent identity, current response, and a composer with working agent at-mentions. By default the block renders the four `/jira-golden-journeys-v0` sessions — awaiting user response, in progress, PR open, and PR merged.",
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
				"Sessions to render, one trigger per item feeding the shared flyout. Each item's agent identity and `status` (\"awaiting-input\" | \"running\" | \"pr-open\" | \"merged\" | \"stopped\") drive the Agent States card.",
		},
		{
			name: "className",
			type: "string",
			description: "Additional classes applied to the compact session-list container.",
		},
	],
};
