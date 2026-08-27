import type { ComponentDetail } from "@/app/data/component-detail-types";

export const AGENT_SESSION_FLYOUT_DETAIL: ComponentDetail = {
	description:
		"The `/jira-golden-journeys-v0` queue session flyout, presented as one compact chat-history list. Every row feeds one shared, anchored flyout viewport, so hovering vertically between sessions moves and resizes the popup while its content crossfades. The default flyout is the session-details card (agent, work item, and development properties). Pass `content=\"composer\"` for the Agent States card with a prompt composer and agent at-mentions. By default the block renders the four `/jira-golden-journeys-v0` sessions — awaiting user response, in progress, PR open, and PR merged.",
	demoLayout: { previewHeight: "fit" },
	importStatement: `import { AgentSessionFlyout } from "@/components/blocks/agent-session-flyout";`,
	usage: `import { AgentSessionFlyout } from "@/components/blocks/agent-session-flyout";

<AgentSessionFlyout />`,
	examples: [
		{
			title: "Composer flyout",
			description:
				'The `content="composer"` variant replaces session details with the Agent States card so the viewer can reply without leaving the list.',
			demoSlug: "agent-session-flyout-demo-composer",
		},
	],
	props: [
		{
			name: "sessions",
			type: "readonly JiraSidebarSessionItem[]",
			default: "the four /jira-golden-journeys-v0 queue sessions",
			description:
				"Sessions to render, one trigger per item feeding the shared flyout. Each item's `status` (\"awaiting-input\" | \"running\" | \"pr-open\" | \"merged\" | \"stopped\") drives the details card and, when `content=\"composer\"`, the Agent States card.",
		},
		{
			name: "content",
			type: '"details" | "composer"',
			default: '"details"',
			description:
				"Hover flyout body. `details` is the session property card; `composer` is the Agent States card with a prompt composer.",
		},
		{
			name: "className",
			type: "string",
			description: "Additional classes applied to the compact session-list container.",
		},
	],
};
