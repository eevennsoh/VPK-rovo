const test = require("node:test")
const assert = require("node:assert/strict")

const {
	buildAgentActivitySteps,
	buildConfigEntries,
	executionSummaryToEntry,
	toolCallSummaryToEntry,
	mapExecutionState,
	mapToolState,
} = require("./agent-activity-timeline.ts")

function makeEntry(overrides = {}) {
	return {
		profile: { id: "agent-1", name: "Untitled agent", byline: "Custom agent by You", starters: [] },
		resultKey: "rk",
		sourceResult: {},
		draftResult: {},
		publishedResult: null,
		lastTouchedAt: Date.UTC(2026, 5, 2, 9, 4),
		publishStatus: "testing",
		publishReadyResult: {},
		...overrides,
	}
}

test("buildAgentActivitySteps returns [] when there is no runtime activity and no entry", () => {
	assert.deepEqual(buildAgentActivitySteps({ runtimeEntries: [], entry: null }), [])
})

test("mapExecutionState maps runtime statuses to tracker states", () => {
	assert.equal(mapExecutionState("completed"), "done")
	assert.equal(mapExecutionState("failed"), "warning")
	assert.equal(mapExecutionState("working"), "current")
})

test("mapToolState maps tool states to tracker states", () => {
	assert.equal(mapToolState("completed"), "done")
	assert.equal(mapToolState("error"), "warning")
	assert.equal(mapToolState("running"), "current")
	assert.equal(mapToolState("approval-requested"), "current")
})

test("executionSummaryToEntry derives id/label/state and omits byline while in-flight", () => {
	const done = executionSummaryToEntry(
		{ agentId: "a", agentName: "A", taskId: "t1", taskLabel: "Drafted response", status: "completed", content: "" },
		0,
		"2026-06-02T09:04:00.000Z",
	)
	assert.equal(done.id, "exec-0-t1")
	assert.equal(done.label, "Drafted response")
	assert.equal(done.state, "done")
	assert.ok(typeof done.byline === "string" && done.byline.length > 0)

	const working = executionSummaryToEntry(
		{ agentId: "a", agentName: "A", taskId: "t2", taskLabel: "Working", status: "working", content: "" },
		1,
		"2026-06-02T09:04:00.000Z",
	)
	assert.equal(working.state, "current")
	assert.equal(working.byline, undefined)
})

test("toolCallSummaryToEntry prefers label and the tool-call timestamp", () => {
	const entry = toolCallSummaryToEntry(
		{ id: "tc1", toolName: "jira_search", label: "Search Jira", state: "completed", timestamp: "2026-06-02T09:01:00.000Z" },
		0,
		undefined,
	)
	assert.equal(entry.id, "tool-0-tc1")
	assert.equal(entry.label, "Search Jira")
	assert.equal(entry.state, "done")
	assert.ok(typeof entry.byline === "string" && entry.byline.length > 0)
})

test("buildConfigEntries emits done milestones for triggers/tools and a current testing status", () => {
	const entries = buildConfigEntries(
		makeEntry({
			publishStatus: "testing",
			publishReadyResult: {
				automationRules: [{ id: "automation-1", triggers: [{}] }, { id: "automation-2", triggers: [{}] }],
				tools: ["Jira", "Confluence"],
			},
		}),
	)
	assert.deepEqual(
		entries.map((e) => [e.id, e.state]),
		[
			["config-triggers", "done"],
			["config-tools", "done"],
			["config-status", "current"],
		],
	)
	assert.equal(entries[0].label, "2 automations configured")
	assert.deepEqual(entries[1].toolTags, ["Jira", "Confluence"])
	assert.equal(entries[2].label, "In testing")
	assert.ok(typeof entries[2].byline === "string" && entries[2].byline.length > 0)
})

test("buildConfigEntries marks published agents done and singularizes labels", () => {
	const entries = buildConfigEntries(
		makeEntry({
			publishStatus: "published",
			publishReadyResult: { automationRules: [{ id: "automation-1", triggers: [{}] }], tools: ["Jira"] },
		}),
	)
	assert.equal(entries[0].label, "Automation configured")
	assert.equal(entries[1].label, "Tool connected")
	assert.equal(entries[2].label, "Published")
	assert.equal(entries[2].state, "done")
})

test("buildConfigEntries omits trigger/tool rows when none are configured", () => {
	const entries = buildConfigEntries(makeEntry({ publishReadyResult: {} }))
	assert.deepEqual(entries.map((e) => e.id), ["config-status"])
})

test("buildAgentActivitySteps puts runtime newest-first above config milestones", () => {
	const runtimeEntries = [
		{ id: "r-old", label: "Old", state: "done" },
		{ id: "r-new", label: "New", state: "done" },
	]
	const steps = buildAgentActivitySteps({
		runtimeEntries,
		entry: makeEntry({ publishReadyResult: { tools: ["Jira"] } }),
	})
	assert.deepEqual(steps.map((s) => s.id), ["r-new", "r-old", "config-tools", "config-status"])
})

test("buildAgentActivitySteps clamps to 12 rows while preserving all config milestones", () => {
	const runtimeEntries = Array.from({ length: 15 }, (_, index) => ({
		id: `r-${index}`,
		label: `Run ${index}`,
		state: "done",
	}))
	const steps = buildAgentActivitySteps({
		runtimeEntries,
		entry: makeEntry({ publishReadyResult: { automationRules: [{ id: "automation-1", triggers: [{}] }], tools: ["Jira"] } }),
	})
	assert.equal(steps.length, 12)
	// 3 config milestones kept at the tail, 9 runtime rows (newest-first) on top.
	assert.deepEqual(
		steps.slice(-3).map((s) => s.id),
		["config-triggers", "config-tools", "config-status"],
	)
	assert.equal(steps[0].id, "r-14")
})
