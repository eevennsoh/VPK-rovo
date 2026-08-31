const assert = require("node:assert/strict");
const test = require("node:test");

const { ALL_BOARD_AGENT_SESSION_STATE_IDS } = require("../data/board-view-options.ts");
const {
	applyCardAgentSessionVisibility,
	filterJiraKanbanColumnsByAgentSessionState,
} = require("./board-agent-session-visibility.ts");

function activity(id, state) {
	return { id, label: id, name: id, state };
}

function card(overrides = {}) {
	return {
		code: "PAY-1",
		priority: "major",
		tags: [],
		title: "Port the v2 client",
		...overrides,
	};
}

test("all shown session states leave cards and columns untouched", () => {
	const working = card({
		agentActivities: [activity("working-agent", "working")],
	});
	const columns = [{ title: "In progress", count: 1, cards: [working] }];

	assert.equal(
		applyCardAgentSessionVisibility(working, ALL_BOARD_AGENT_SESSION_STATE_IDS),
		working,
	);
	const filtered = filterJiraKanbanColumnsByAgentSessionState(
		columns,
		ALL_BOARD_AGENT_SESSION_STATE_IDS,
	);
	assert.equal(filtered[0], columns[0]);
	assert.equal(filtered[0].cards[0], working);
});

test("hiding Working strips working rows and leaves Needs input", () => {
	const mixed = card({
		agentActivities: [
			activity("working-agent", "working"),
			activity("blocked-agent", "awaiting-input"),
		],
		agentActivityMode: "awaiting-input",
	});

	const next = applyCardAgentSessionVisibility(mixed, new Set(["needs-input", "finished"]));
	assert.deepEqual(next.agentActivities.map((item) => item.id), ["blocked-agent"]);
	assert.equal(next.agentActivityMode, "awaiting-input");
});

test("hiding Needs input strips awaiting-input rows", () => {
	const blocked = card({
		agentActivities: [activity("blocked-agent", "awaiting-input")],
		agentActivityMode: "awaiting-input",
	});

	const next = applyCardAgentSessionVisibility(blocked, new Set(["working", "finished"]));
	assert.equal(next.agentActivities, undefined);
	assert.equal(next.agentActivityMode, undefined);
});

test("hiding Finished strips completed-run notifications", () => {
	const finished = card({
		agentActivityMode: "completed",
		agentDoneRuns: [{ id: "done-run", summary: "Captured inventory" }],
	});

	const next = applyCardAgentSessionVisibility(finished, new Set(["working", "needs-input"]));
	assert.equal(next.agentDoneRuns, undefined);
	assert.equal(next.agentActivityMode, undefined);
});

test("hiding Finished also drops completed activities on the card", () => {
	const finished = card({
		agentActivities: [activity("done-agent", "completed")],
		agentActivityMode: "completed",
	});

	const next = applyCardAgentSessionVisibility(finished, new Set(["working", "needs-input"]));
	assert.equal(next.agentActivities, undefined);
	assert.equal(next.agentActivityMode, undefined);
});

test("hiding linked states clears a leftover mode-only agent shell", () => {
	const unlinked = card({
		agentActivities: [],
		agentActivityMode: "none",
	});

	const next = applyCardAgentSessionVisibility(unlinked, new Set());
	assert.notEqual(next, unlinked);
	assert.equal(next.agentActivityMode, undefined);
	assert.equal(next.agentActivities, undefined);
});

test("hiding every linked state leaves the issue on the board without agent chrome", () => {
	const working = card({
		agentActivities: [activity("working-agent", "working")],
		code: "PAY-105",
	});
	const columns = [{ title: "In progress", count: 1, cards: [working] }];

	const filtered = filterJiraKanbanColumnsByAgentSessionState(columns, new Set());
	assert.equal(filtered[0].cards[0].code, "PAY-105");
	assert.equal(filtered[0].cards[0].agentActivities, undefined);
	assert.equal(filtered[0].cards[0].agentActivityMode, undefined);
	assert.equal(filtered[0].count, 1);
});
