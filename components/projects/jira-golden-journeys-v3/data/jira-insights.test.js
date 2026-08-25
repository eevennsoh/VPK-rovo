const assert = require("node:assert/strict");
const test = require("node:test");

const {
	createJiraGoldenJourneysV3InsightsSnapshot,
} = require("./jira-insights.ts");

function checkpointIds(snapshot) {
	return snapshot.checkpoints.map((checkpoint) => checkpoint.id);
}

test("Build starts with the two delivery decisions advertised on the Insights tab", () => {
	const snapshot = createJiraGoldenJourneysV3InsightsSnapshot(
		"build",
		{},
		"launch-1",
	);

	assert.deepEqual(checkpointIds(snapshot), [
		"implementation-safeguards",
		"delivery-path",
	]);
	assert.deepEqual(snapshot.unreadCheckpointIds, checkpointIds(snapshot));
	assert.equal(snapshot.revision, "launch-1");
});

test("the story accumulates decisions only after their underlying event occurs", () => {
	const failedReview = createJiraGoldenJourneysV3InsightsSnapshot(
		"review",
		{ reviewStep: "failed" },
		"launch-1",
	);
	const repairing = createJiraGoldenJourneysV3InsightsSnapshot(
		"fix",
		{ fixStep: "repairing" },
		"launch-1",
	);
	const fixed = createJiraGoldenJourneysV3InsightsSnapshot(
		"fix",
		{ fixStep: "complete" },
		"launch-1",
	);

	assert.deepEqual(checkpointIds(failedReview), [
		"implementation-safeguards",
		"delivery-path",
		"ci-blocker",
	]);
	assert.deepEqual(checkpointIds(repairing), [
		...checkpointIds(failedReview),
		"delivery-address-repair",
	]);
	assert.deepEqual(checkpointIds(fixed), [
		...checkpointIds(repairing),
		"ci-rerun-green",
	]);
});

test("approval and release checkpoints reflect satisfied gates and merge", () => {
	const approved = createJiraGoldenJourneysV3InsightsSnapshot(
		"approve",
		{ approvalStep: 2, ciStatus: "passed" },
		"launch-2",
	);
	const released = createJiraGoldenJourneysV3InsightsSnapshot(
		"release",
		{ approvalStep: 2, ciStatus: "passed", pullRequestMerged: true },
		"launch-2",
	);

	assert.equal(checkpointIds(approved).at(-1), "approval-gate-satisfied");
	assert.equal(checkpointIds(released).at(-1), "merge-complete");
	assert.match(released.summary, /merged automatically/u);
});

test("checkpoint sources use typed existing destinations", () => {
	const snapshot = createJiraGoldenJourneysV3InsightsSnapshot(
		"release",
		{ approvalStep: 2, ciStatus: "passed", pullRequestMerged: true },
		"launch-1",
	);
	const sourceKinds = new Set(
		snapshot.checkpoints.flatMap((checkpoint) => (
			checkpoint.sources.map((source) => source.kind)
		)),
	);

	assert.deepEqual([...sourceKinds].sort(), [
		"activity-entry",
		"agent-session",
		"external-link",
		"pull-request",
		"work-item-section",
	]);
});
