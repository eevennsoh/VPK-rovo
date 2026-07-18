import type { ComponentDetail } from "@/app/data/component-detail-types";

export const AGENT_SESSION_FLYOUT_DETAIL: ComponentDetail = {
	description:
		"The `/asx` queue session flyout, shown across each agent session lifecycle state. Each state has its own section whose row opens the real anchored HoverCard popover: a title with a relative timestamp, an awaiting-response banner, Session/Agent/Work item rows (the agent as a Tag pill, the work item as a SmartLink with its status lozenge), and a separated \u201cDevelopment\u201d block for SCM fields (Pull request with an Open/Merged lozenge, Commit, and a GitHub repository) rendered in mono font. By default the block renders the four `/asx` sessions — awaiting user response, in progress, PR open, and PR merged.",
	demoLayout: { previewHeight: "fit" },
	importStatement: `import { AgentSessionFlyout } from "@/components/blocks/agent-session-flyout";`,
	usage: `import { AgentSessionFlyout } from "@/components/blocks/agent-session-flyout";

<AgentSessionFlyout />`,
	props: [
		{
			name: "sessions",
			type: "readonly JiraSidebarSessionItem[]",
			default: "the four /asx queue sessions",
			description:
				"Sessions to render, one flyout per item. Each item's `status` (\"awaiting-input\" | \"running\" | \"pr-open\" | \"merged\" | \"stopped\") and populated fields drive which detail rows appear.",
		},
		{
			name: "className",
			type: "string",
			description: "Additional classes applied to the flyout grid container.",
		},
	],
};
