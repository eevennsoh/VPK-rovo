import type { ComponentDetail } from "@/app/data/component-detail-types";

export const AGENT_SESSIONS_DETAIL: ComponentDetail = {
	description: "Jira issue-detail modal starting point for the Agent sessions block, with a default current-state variant and an opt-in experimental variant.",
	importStatement: `import AgentSessions from "@/components/blocks/agent-sessions";`,
	usage: `import AgentSessions from "@/components/blocks/agent-sessions";

<AgentSessions variant="default" />`,
	examples: [
		{
			title: "Standard",
			description: "Current Jira agent sessions surface with the work item modal trigger and floating Rovo chat.",
			demoSlug: "agent-sessions-demo-standard",
		},
		{
			title: "Experimental",
			description: "Placeholder experimental entry point. It intentionally matches the standard surface until the redesign lands.",
			demoSlug: "agent-sessions-demo-experimental",
		},
	],
	props: [
		{
			name: "initialIssueOpen",
			type: "boolean",
			default: "false",
			description: "Opens the Jira work item modal on initial render.",
		},
		{
			name: "onIssueClose",
			type: "() => void",
			description: "Called after the Jira work item modal closes.",
		},
		{
			name: "variant",
			type: "\"default\" | \"experimental\"",
			default: "\"default\"",
			description: "Opt-in layout variation. The default variant keeps the current Jira sessions surface.",
		},
	],
};
