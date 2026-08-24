import type { JiraInsightCheckpoint, JiraInsightSource } from "@/components/blocks/jira-insights/jira-insights-types";

const SOURCE_CATEGORY_LABELS: Record<JiraInsightSource["kind"], string> = {
	"activity-entry": "Activity",
	"agent-session": "Agent session",
	"external-link": "External reference",
	"pull-request": "Pull request",
	"work-item-section": "Work item",
};

export interface JiraInsightsEditorialSelection {
	category: string;
	checkpoint: JiraInsightCheckpoint;
	nextCheckpointId: string | null;
	position: number;
	previousCheckpointId: string | null;
	sourceCount: number;
	total: number;
}

function getCheckpointCategory(sources: readonly JiraInsightSource[]): string {
	const categories = new Set(sources.map((source) => SOURCE_CATEGORY_LABELS[source.kind]));
	if (categories.size === 0) return "No sources";
	if (categories.size > 1) return "Mixed evidence";
	return categories.values().next().value ?? "No sources";
}

export function getJiraInsightsEditorialSelection(
	checkpoints: readonly JiraInsightCheckpoint[],
	activeCheckpointId: string | null,
): JiraInsightsEditorialSelection | null {
	if (checkpoints.length === 0) return null;

	const activeIndex = checkpoints.findIndex((checkpoint) => checkpoint.id === activeCheckpointId);
	const resolvedIndex = activeIndex >= 0 ? activeIndex : checkpoints.length - 1;
	const checkpoint = checkpoints[resolvedIndex];
	if (!checkpoint) return null;

	return {
		category: getCheckpointCategory(checkpoint.sources),
		checkpoint,
		nextCheckpointId: checkpoints[resolvedIndex + 1]?.id ?? null,
		position: resolvedIndex + 1,
		previousCheckpointId: checkpoints[resolvedIndex - 1]?.id ?? null,
		sourceCount: checkpoint.sources.length,
		total: checkpoints.length,
	};
}
