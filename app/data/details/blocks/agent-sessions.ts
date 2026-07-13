import type { ComponentDetail } from "@/app/data/component-detail-types";

export const AGENT_SESSIONS_DETAIL: ComponentDetail = {
	description: "Jira work-item surface for the Agent sessions block, with a standard current-state variant and an opt-in experimental variant that adds work-item-scoped agent/chat sessions, empty/filled context, and concurrent mock agents.",
	importStatement: `import AgentSessions from "@/components/blocks/agent-sessions";`,
	usage: `import AgentSessions from "@/components/blocks/agent-sessions";

<AgentSessions variant="experimental" initialExperimentalPreset="running" />`,
	examples: [
		{
			title: "Standard",
			description: "Current Jira agent sessions surface with the work item modal trigger and floating Rovo chat.",
			demoSlug: "agent-sessions-demo-standard",
		},
		{
			title: "Experimental",
			description: "Work-item-scoped experimental variant: independent context/session state, deterministic Empty/Filled/Running presets, concurrent mock agents, and one shared floating chat/session experience.",
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
		{
			name: "initialExperimentalPreset",
			type: "\"empty\" | \"filled\" | \"running\"",
			default: "\"filled\"",
			description: "Deterministic starting state for the experimental variant: empty context, filled context, or filled context with concurrent running agents.",
		},
	],
};
