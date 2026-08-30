import type { ComponentDetail } from "@/app/data/component-detail-types";

export const AGENT_SESSION_FLYOUT_DETAIL: ComponentDetail = {
	description:
		"The `/jira-golden-journeys-v0` queue session flyout, presented as one compact chat-history list. Every row feeds one shared, anchored flyout viewport, so hovering vertically between sessions moves and resizes the popup while its content crossfades. The default flyout is the session-details card (agent, work item, and development properties). Pass `content=\"composer\"` for the Agent States card or `content=\"untracked-work\"` for a suggested Jira relationship with confidence and rationale. By default the block renders the four `/jira-golden-journeys-v0` sessions — awaiting user response, in progress, PR open, and PR merged.",
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
		{
			title: "Untracked work",
			description:
				'The `content="untracked-work"` variant keeps the session and SmartLink metadata together, then suggests linking the session to the Jira work item with confidence and rationale.',
			demoSlug: "agent-session-flyout-demo-untracked-work",
		},
	],
	props: [
		{
			name: "sessions",
			type: "readonly JiraSidebarSessionItem[]",
			default: "the four /jira-golden-journeys-v0 queue sessions",
			description:
				"Sessions to render, one trigger per item feeding the shared flyout. Each item's `status` (\"awaiting-input\" | \"running\" | \"pr-open\" | \"merged\" | \"stopped\") drives the work-item status and Agent States lifecycle.",
		},
		{
			name: "content",
			type: '"details" | "composer" | "untracked-work"',
			default: '"details"',
			description:
				"Hover flyout body. `details` is the session property card; `composer` is the Agent States card; `untracked-work` suggests a Jira relationship with confidence and rationale.",
		},
		{
			name: "className",
			type: "string",
			description: "Additional classes applied to the compact session-list container.",
		},
	],
};
