export type JiraIssueActiveAgentState = "working" | "awaiting-input";

/**
 * `merged` collapses every active agent into one prioritized chin row
 * (`2 Working`). `split` gives each active agent its own row.
 */
export type JiraIssueAgentActivityLayout = "merged" | "split";

interface JiraIssueAgentActivitySummaryInput {
	state: JiraIssueActiveAgentState | "completed";
}

interface JiraIssueAgentActivityRowInput extends JiraIssueAgentActivitySummaryInput {
	id: string;
}

export interface JiraIssueAgentActivityRowGroup<TActivity> {
	activities: readonly TActivity[];
	key: string;
}

export interface JiraIssueAgentActivitySummary {
	activityCount: number;
	featuredActivityIndex: number | null;
	label: string;
	priorityCount: number;
	priorityState: JiraIssueActiveAgentState;
}

export function summarizeJiraIssueAgentActivities(
	activities: readonly JiraIssueAgentActivitySummaryInput[],
): JiraIssueAgentActivitySummary {
	const activeActivities = activities
		.map((activity, index) => ({ activity, index }))
		.filter(({ activity }) => activity.state !== "completed");
	const awaitingInputActivities = activeActivities.filter(({ activity }) => activity.state === "awaiting-input");
	const awaitingInputCount = awaitingInputActivities.length;
	const priorityState = awaitingInputCount > 0 ? "awaiting-input" : "working";
	const priorityCount = awaitingInputCount > 0 ? awaitingInputCount : activeActivities.length;
	const featuredActivityIndex = activeActivities.length === 1
		? activeActivities[0]?.index ?? null
		: awaitingInputActivities.length === 1
			? awaitingInputActivities[0]?.index ?? null
			: null;
	const label = priorityState === "awaiting-input"
		? priorityCount > 1 ? `${priorityCount} Need input` : "Needs input"
		: priorityCount > 1 ? `${priorityCount} Working` : "Working";

	return {
		activityCount: activeActivities.length,
		featuredActivityIndex,
		label,
		priorityCount,
		priorityState,
	};
}

/**
 * Resolves the chin rows to render. Completed activities never take a row, so
 * both layouts operate on the active set only.
 */
export function groupJiraIssueAgentActivityRows<TActivity extends JiraIssueAgentActivityRowInput>(
	activities: readonly TActivity[],
	layout: JiraIssueAgentActivityLayout,
): readonly JiraIssueAgentActivityRowGroup<TActivity>[] {
	const activeActivities = activities.filter((activity) => activity.state !== "completed");

	if (activeActivities.length === 0) {
		return [];
	}

	if (layout === "split") {
		return activeActivities.map((activity) => ({ activities: [activity], key: activity.id }));
	}

	const summary = summarizeJiraIssueAgentActivities(activeActivities);

	return [{ activities: activeActivities, key: `${summary.priorityState}-${summary.activityCount}` }];
}
