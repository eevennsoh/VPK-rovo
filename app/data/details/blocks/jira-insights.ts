import type { ComponentDetail } from "@/app/data/component-detail-types";

export const JIRA_INSIGHTS_DETAIL: ComponentDetail = {
	description:
		"A decision-focused Jira work-item briefing with a current summary, sourced checkpoints on the shared Jira Activity spine, unread selection state, and a dockable timeline scrubber.",
	demoLayout: { previewHeight: "fit" },
	importStatement: `import { JiraInsights } from "@/components/blocks/jira-insights";`,
	usage: `import { JiraInsights } from "@/components/blocks/jira-insights";
import { JIRA_INSIGHTS_DEMO_SNAPSHOT } from "@/components/blocks/jira-insights/data";

<JiraInsights snapshot={JIRA_INSIGHTS_DEMO_SNAPSHOT} />`,
	props: [
		{
			name: "snapshot",
			type: "JiraInsightsSnapshot",
			required: true,
			description: "Summary, ordered decision checkpoints, unread checkpoint ids, and the reset revision.",
		},
		{
			name: "onSourceSelect",
			type: "(source: JiraInsightSource) => void",
			description: "Handles in-product work-item, activity, agent-session, and pull-request sources. External links navigate directly.",
		},
		{
			name: "className",
			type: "string",
			description: "Additional classes applied to the standalone block container.",
		},
	],
	subComponents: [
		{
			name: "JiraInsightsProvider",
			description: "Shares selection, unread state, source handling, and checkpoint element registration across split layout slots.",
			props: [],
		},
		{
			name: "JiraInsightsContent",
			description: "Renders the summary and newest-first decision timeline.",
			props: [],
		},
		{
			name: "JiraInsightsScrubber",
			description: "Renders the discrete oldest-to-newest checkpoint scrubber for a dock or standalone layout.",
			props: [],
		},
	],
};
