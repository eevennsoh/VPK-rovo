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
			description: "Standalone summary and Jira Activity-backed decision timeline composition.",
			props: [],
		},
		{
			name: "JiraInsightsScrubber",
			description: "Connects provider selection to the horizontal Activity/decision timeline rail.",
			props: [],
		},
		{
			name: "JiraInsightsTimelineRail",
			description: "Scrollable horizontal chronology with Activity ticks, decision landmarks, hover tooltips, drag, wheel, and keyboard navigation.",
			props: [],
		},
		{
			name: "JiraInsightsEditorialPane",
			description: "Selected-decision editorial summary with adjacent navigation, sources, and metadata.",
			props: [],
		},
	],
};
