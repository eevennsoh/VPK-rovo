"use client";

import { JiraInsightsContent } from "@/components/blocks/jira-insights/components/jira-insights-content";
import { JiraInsightsScrubber } from "@/components/blocks/jira-insights/components/jira-insights-scrubber";
import { JiraInsightsProvider } from "@/components/blocks/jira-insights/context-jira-insights";
import type { JiraInsightSource, JiraInsightsSnapshot } from "@/components/blocks/jira-insights/jira-insights-types";
import { cn } from "@/lib/utils";

export interface JiraInsightsProps {
	className?: string;
	onSourceSelect?: (source: JiraInsightSource) => void;
	snapshot: JiraInsightsSnapshot;
}

export function JiraInsights({ className, onSourceSelect, snapshot }: Readonly<JiraInsightsProps>) {
	return (
		<JiraInsightsProvider onSourceSelect={onSourceSelect} snapshot={snapshot}>
			<div className={cn("flex min-w-0 flex-col", className)} data-jira-insights>
				<JiraInsightsContent />
				<JiraInsightsScrubber className="mt-6" />
			</div>
		</JiraInsightsProvider>
	);
}

export { JiraInsightsContent } from "@/components/blocks/jira-insights/components/jira-insights-content";
export { JiraInsightsEditorialPane } from "@/components/blocks/jira-insights/components/jira-insights-editorial-pane";
export { JiraInsightsScrubber } from "@/components/blocks/jira-insights/components/jira-insights-scrubber";
export {
	JiraInsightsTimelineRail,
	type JiraInsightsTimelineRailProps,
} from "@/components/blocks/jira-insights/components/jira-insights-timeline-rail";
export {
	JiraInsightsProvider,
	useJiraInsights,
} from "@/components/blocks/jira-insights/context-jira-insights";
export type {
	JiraInsightCheckpoint,
	JiraInsightSource,
	JiraInsightsSelectionState,
	JiraInsightsSnapshot,
} from "@/components/blocks/jira-insights/jira-insights-types";
