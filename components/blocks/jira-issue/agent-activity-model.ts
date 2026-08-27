export type JiraIssueActiveAgentState = "working" | "awaiting-input";

interface JiraIssueAgentActivitySummaryInput {
	state: JiraIssueActiveAgentState | "completed";
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
