import type { ComponentDetail } from "@/app/data/component-detail-types";

export const JIRA_WORK_ITEM_DETAIL: ComponentDetail = {
	description: "Jira work-item surface with a standard current-state variant and an opt-in experimental variant that adds work-item-scoped agent/chat sessions, empty/filled context, and concurrent mock agents.",
	importStatement: `import JiraWorkItem from "@/components/blocks/jira-work-item";`,
	usage: `import JiraWorkItem from "@/components/blocks/jira-work-item";

<JiraWorkItem variant="experimental" initialExperimentalPreset="running" />`,
	examples: [
		{
			title: "Standard",
			description: "Current Jira agent sessions surface with the work item modal trigger and floating Rovo chat.",
			demoSlug: "jira-work-item-demo-standard",
		},
		{
			title: "Experimental · Filled context",
			description: "Work-item-scoped experimental variant: independent context/session state, deterministic Empty/Filled/Running presets, concurrent mock agents, and one shared floating chat/session experience.",
			demoSlug: "jira-work-item-demo-experimental",
		},
		{
			title: "Experimental · Empty context",
			description: "Experimental empty-context preset with an automatic deterministic AI Planner pass that immediately prefills the normal work-item fields, supports natural-language refinement, and keeps one explicit confirmation action.",
			demoSlug: "jira-work-item-demo-experimental-empty",
		},
		{
			title: "Experimental · Multiple agents running",
			description: "Experimental variant seeded with the running preset: several work-item-scoped agents progressing concurrently on a deterministic metronome, with live status pills and progress.",
			demoSlug: "jira-work-item-demo-experimental-running",
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
			type: "\"blank\" | \"empty\" | \"filled\" | \"running\"",
			default: "\"filled\"",
			description: "Deterministic starting state for the experimental variant: true empty context, AI-planned suggestions, filled context, or filled context with concurrent running agents.",
		},
	],
};
