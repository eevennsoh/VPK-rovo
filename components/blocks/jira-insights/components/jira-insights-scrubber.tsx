"use client";

import { JiraInsightsTimelineRail } from "@/components/blocks/jira-insights/components/jira-insights-timeline-rail";
import { useJiraInsights } from "@/components/blocks/jira-insights/context-jira-insights";
import { cn } from "@/lib/utils";

export function JiraInsightsScrubber({
	activityTimestamps,
	className,
}: Readonly<{
	activityTimestamps?: readonly number[];
	className?: string;
}>) {
	const { activeCheckpointId, checkpoints, selectCheckpoint } = useJiraInsights();

	return (
		<div className={cn("min-w-0", className)} data-jira-insights-scrubber>
			<JiraInsightsTimelineRail
				activeCheckpointId={activeCheckpointId}
				activityTimestamps={activityTimestamps}
				checkpoints={checkpoints}
				onCheckpointSelect={selectCheckpoint}
			/>
		</div>
	);
}
