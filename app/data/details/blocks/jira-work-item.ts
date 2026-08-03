import type { ComponentDetail } from "@/app/data/component-detail-types";

export const JIRA_WORK_ITEM_DETAIL: ComponentDetail = {
	description: "Jira work-item surface with a standard current-state variant, an opt-in experimental variant that adds work-item-scoped agent/chat sessions, empty/filled context, and concurrent mock agents, plus an experimental v2 fork of that surface for independent iteration.",
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
		{
			title: "Experimental v2 · Filled context",
			description: "Experimental v2 session: a standalone fork of the experimental surface that starts identical to v1 and diverges independently. Shares the session/planner model, owns its own component tree.",
			demoSlug: "jira-work-item-demo-experimental-v2",
		},
		{
			title: "Experimental v2 · Empty context",
			description: "Experimental v2 empty-context preset with the same automatic deterministic AI Planner pass, natural-language refinement, and single explicit confirmation action as v1.",
			demoSlug: "jira-work-item-demo-experimental-v2-empty",
		},
		{
			title: "Experimental v2 · Multiple agents running",
			description: "Experimental v2 seeded with the running preset: several work-item-scoped agents progressing concurrently on a deterministic metronome, with live status pills and progress.",
			demoSlug: "jira-work-item-demo-experimental-v2-running",
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
			type: "\"default\" | \"experimental\" | \"experimental-v2\"",
			default: "\"default\"",
			description: "Opt-in layout variation. The default variant keeps the current Jira sessions surface; experimental-v2 is an independent fork of the experimental surface.",
		},
		{
			name: "initialExperimentalPreset",
			type: "\"blank\" | \"empty\" | \"filled\" | \"running\"",
			default: "\"filled\"",
			description: "Deterministic starting state for the experimental variants: true empty context, AI-planned suggestions, filled context, or filled context with concurrent running agents.",
		},
	],
};
