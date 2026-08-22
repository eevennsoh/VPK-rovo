const assert = require("node:assert/strict");
const test = require("node:test");

const {
	createJiraInsightsSelectionState,
	getUnreadCheckpointIds,
	reconcileJiraInsightsSelectionState,
	selectLatestUnreadCheckpoint,
	sortJiraInsightCheckpoints,
} = require("./jira-insights-model.ts");

const CHECKPOINTS = [
	{ id: "middle", capturedAtMs: 200 },
	{ id: "latest", capturedAtMs: 300 },
	{ id: "earliest", capturedAtMs: 100 },
];

function snapshot(overrides = {}) {
	return {
		summary: "Current state",
		checkpoints: CHECKPOINTS,
		unreadCheckpointIds: ["middle", "latest"],
		revision: "launch-1",
		...overrides,
	};
}

test("sortJiraInsightCheckpoints returns a stable oldest-first copy", () => {
	const sorted = sortJiraInsightCheckpoints(CHECKPOINTS);

	assert.deepEqual(sorted.map((checkpoint) => checkpoint.id), [
		"earliest",
		"middle",
		"latest",
	]);
	assert.deepEqual(CHECKPOINTS.map((checkpoint) => checkpoint.id), [
		"middle",
		"latest",
		"earliest",
	]);
});

test("selection starts on the newest checkpoint and exposes unread ids in checkpoint order", () => {
	const state = createJiraInsightsSelectionState(snapshot());

	assert.equal(state.activeCheckpointId, "latest");
	assert.deepEqual(getUnreadCheckpointIds(snapshot(), state), ["middle", "latest"]);
});

test("selecting the latest unread checkpoint marks the current unread set read", () => {
	const current = createJiraInsightsSelectionState(snapshot());
	const next = selectLatestUnreadCheckpoint(snapshot(), current);

	assert.equal(next.activeCheckpointId, "latest");
	assert.deepEqual(next.readCheckpointIds, ["middle", "latest"]);
	assert.deepEqual(getUnreadCheckpointIds(snapshot(), next), []);
});

test("reconciliation preserves valid selection and surfaces later unread checkpoints", () => {
	const current = selectLatestUnreadCheckpoint(
		snapshot(),
		createJiraInsightsSelectionState(snapshot()),
	);
	const expanded = snapshot({
		checkpoints: [...CHECKPOINTS, { id: "newest", capturedAtMs: 400 }],
		unreadCheckpointIds: ["middle", "latest", "newest"],
	});
	const next = reconcileJiraInsightsSelectionState(expanded, current);

	assert.equal(next.activeCheckpointId, "latest");
	assert.deepEqual(getUnreadCheckpointIds(expanded, next), ["newest"]);
});

test("a new revision resets read state and falls back to the newest available checkpoint", () => {
	const current = {
		activeCheckpointId: "removed",
		readCheckpointIds: ["middle", "latest"],
		revision: "launch-1",
	};
	const reset = snapshot({
		checkpoints: CHECKPOINTS.slice(0, 2),
		revision: "launch-2",
	});
	const next = reconcileJiraInsightsSelectionState(reset, current);

	assert.equal(next.activeCheckpointId, "latest");
	assert.deepEqual(next.readCheckpointIds, []);
	assert.equal(next.revision, "launch-2");
});

test("empty snapshots expose no selection or unread ids", () => {
	const empty = snapshot({ checkpoints: [], unreadCheckpointIds: [] });
	const state = createJiraInsightsSelectionState(empty);

	assert.equal(state.activeCheckpointId, null);
	assert.deepEqual(getUnreadCheckpointIds(empty, state), []);
});
