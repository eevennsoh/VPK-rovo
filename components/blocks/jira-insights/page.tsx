"use client";

import { JIRA_INSIGHTS_DEMO_SNAPSHOT } from "@/components/blocks/jira-insights/data";
import { JiraInsights } from "@/components/blocks/jira-insights";

export default function JiraInsightsPage() {
	return (
		<div className="flex min-h-screen w-full justify-center bg-surface-overlay p-6">
			<JiraInsights className="w-full max-w-3xl" snapshot={JIRA_INSIGHTS_DEMO_SNAPSHOT} />
		</div>
	);
}
