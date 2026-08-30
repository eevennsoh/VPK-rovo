import assert from "node:assert/strict";
import test from "node:test";

// @ts-expect-error Node's strip-types test runner requires the explicit .ts extension here.
import { groupJiraIssueAgentActivityRows, summarizeJiraIssueAgentActivities } from "./agent-activity-model.ts";

test("single working agent uses the direct Working label", () => {
	assert.deepEqual(
		summarizeJiraIssueAgentActivities([{ state: "working" }]),
		{
			activityCount: 1,
			featuredActivityIndex: 0,
			label: "Working",
			priorityCount: 1,
			priorityState: "working",
		},
	);
});

test("multiple working agents show the count in the Working label", () => {
	assert.deepEqual(
		summarizeJiraIssueAgentActivities([
			{ state: "working" },
			{ state: "working" },
		]),
		{
			activityCount: 2,
			featuredActivityIndex: null,
			label: "2 Working",
			priorityCount: 2,
			priorityState: "working",
		},
	);
});

test("one agent needing input takes priority over every working agent", () => {
	assert.deepEqual(
		summarizeJiraIssueAgentActivities([
			{ state: "working" },
			{ state: "working" },
			{ state: "awaiting-input" },
			{ state: "working" },
			{ state: "working" },
		]),
		{
			activityCount: 5,
			featuredActivityIndex: 2,
			label: "Needs input",
			priorityCount: 1,
			priorityState: "awaiting-input",
		},
	);
});

test("multiple agents needing input use the prioritized count", () => {
	assert.deepEqual(
		summarizeJiraIssueAgentActivities([
			{ state: "awaiting-input" },
			{ state: "working" },
			{ state: "awaiting-input" },
		]),
		{
			activityCount: 3,
			featuredActivityIndex: null,
			label: "2 Need input",
			priorityCount: 2,
			priorityState: "awaiting-input",
		},
	);
});

test("merged layout keeps every active agent in one prioritized row", () => {
	assert.deepEqual(
		groupJiraIssueAgentActivityRows(
			[
				{ id: "service-impact-agent", state: "working" },
				{ id: "dependency-mapper", state: "working" },
			],
			"merged",
		),
		[
			{
				activities: [
					{ id: "service-impact-agent", state: "working" },
					{ id: "dependency-mapper", state: "working" },
				],
				key: "working-2",
			},
		],
	);
});

test("split layout gives every active agent its own row keyed by agent id", () => {
	assert.deepEqual(
		groupJiraIssueAgentActivityRows(
			[
				{ id: "service-impact-agent", state: "awaiting-input" },
				{ id: "dependency-mapper", state: "working" },
			],
			"split",
		),
		[
			{ activities: [{ id: "service-impact-agent", state: "awaiting-input" }], key: "service-impact-agent" },
			{ activities: [{ id: "dependency-mapper", state: "working" }], key: "dependency-mapper" },
		],
	);
});

test("completed agents never take a chin row in either layout", () => {
	const activities = [
		{ id: "service-impact-agent", state: "completed" },
		{ id: "dependency-mapper", state: "working" },
	] as const;

	assert.deepEqual(
		groupJiraIssueAgentActivityRows(activities, "split"),
		[{ activities: [{ id: "dependency-mapper", state: "working" }], key: "dependency-mapper" }],
	);
	assert.deepEqual(
		groupJiraIssueAgentActivityRows(activities, "merged"),
		[{ activities: [{ id: "dependency-mapper", state: "working" }], key: "working-1" }],
	);
	assert.deepEqual(groupJiraIssueAgentActivityRows([{ id: "only", state: "completed" }], "split"), []);
});
