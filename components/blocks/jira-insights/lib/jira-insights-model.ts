import type {
	JiraInsightCheckpoint,
	JiraInsightsSelectionState,
	JiraInsightsSnapshot,
} from "@/components/blocks/jira-insights/jira-insights-types";

export function sortJiraInsightCheckpoints<T extends Pick<JiraInsightCheckpoint, "capturedAtMs">>(
	checkpoints: readonly T[],
): T[] {
	return [...checkpoints].sort((a, b) => a.capturedAtMs - b.capturedAtMs);
}

function newestCheckpointId(snapshot: JiraInsightsSnapshot): string | null {
	return sortJiraInsightCheckpoints(snapshot.checkpoints).at(-1)?.id ?? null;
}

export function createJiraInsightsSelectionState(
	snapshot: JiraInsightsSnapshot,
): JiraInsightsSelectionState {
	return {
		activeCheckpointId: newestCheckpointId(snapshot),
		readCheckpointIds: [],
		revision: snapshot.revision,
	};
}

export function getUnreadCheckpointIds(
	snapshot: JiraInsightsSnapshot,
	state: JiraInsightsSelectionState,
): string[] {
	const unreadIds = new Set(snapshot.unreadCheckpointIds);
	const readIds = new Set(state.readCheckpointIds);
	return sortJiraInsightCheckpoints(snapshot.checkpoints)
		.filter((checkpoint) => unreadIds.has(checkpoint.id) && !readIds.has(checkpoint.id))
		.map((checkpoint) => checkpoint.id);
}

export function reconcileJiraInsightsSelectionState(
	snapshot: JiraInsightsSnapshot,
	state: JiraInsightsSelectionState,
): JiraInsightsSelectionState {
	if (!Object.is(snapshot.revision, state.revision)) {
		return createJiraInsightsSelectionState(snapshot);
	}

	const checkpointIds = new Set(snapshot.checkpoints.map((checkpoint) => checkpoint.id));
	return {
		activeCheckpointId: state.activeCheckpointId && checkpointIds.has(state.activeCheckpointId)
			? state.activeCheckpointId
			: newestCheckpointId(snapshot),
		readCheckpointIds: state.readCheckpointIds.filter((id) => checkpointIds.has(id)),
		revision: state.revision,
	};
}

export function selectLatestUnreadCheckpoint(
	snapshot: JiraInsightsSnapshot,
	state: JiraInsightsSelectionState,
): JiraInsightsSelectionState {
	const unreadCheckpointIds = getUnreadCheckpointIds(snapshot, state);
	const readIds = new Set(state.readCheckpointIds);
	for (const id of unreadCheckpointIds) readIds.add(id);

	return {
		activeCheckpointId: unreadCheckpointIds.at(-1) ?? state.activeCheckpointId,
		readCheckpointIds: [...readIds],
		revision: state.revision,
	};
}
