const assert = require("node:assert/strict");
const test = require("node:test");

const { moveJiraKanbanAgentSession } = require("../../state.ts");

const {
	cancelBoardAgentSessionDragTransaction,
	createBoardAgentSessionDragTransaction,
	resolveBoardAgentSessionDropAction,
	resolveBoardAgentSessionDropTarget,
	updateBoardAgentSessionDragTransaction,
} = require("./board-agent-session-drag.ts");

const SOURCE_ISSUE = {
	bounds: { bottom: 200, left: 0, right: 200, top: 0 },
	cardCode: "PAY-121",
	kind: "issue",
};
const SOURCE_UNLINK = {
	bounds: { bottom: 200, left: 0, right: 200, top: 150 },
	cardCode: "PAY-121",
	kind: "unlink",
};
const TARGET_ISSUE = {
	bounds: { bottom: 200, left: 220, right: 420, top: 0 },
	cardCode: "PAY-128",
	kind: "issue",
};
const ZONES = [SOURCE_ISSUE, SOURCE_UNLINK, TARGET_ISSUE];

function session(id = "review-agent") {
	return { id, label: "Review Agent", name: "Review Agent", state: "working" };
}

test("moving an attached session atomically preserves the exact activity and derives both card modes", () => {
	const movingActivity = {
		id: "review-agent",
		label: "Review Agent",
		name: "Review Agent",
		message: "Reviewing telemetry gates",
		state: "awaiting-input",
	};
	const columns = [{
		title: "In review",
		count: 2,
		cards: [
			{
				code: "PAY-121",
				agentActivityMode: "awaiting-input",
				agentActivities: [
					{ id: "release-agent", label: "Release Agent", name: "Release Agent", state: "working" },
					movingActivity,
				],
			},
			{
				code: "PAY-128",
				agentActivityMode: "working",
				agentActivities: [
					{ id: "settlement-agent", label: "Settlement Agent", name: "Settlement Agent", state: "working" },
				],
			},
		],
	}];

	const moved = moveJiraKanbanAgentSession(columns, "PAY-121", "PAY-128", "review-agent");
	const source = moved[0].cards[0];
	const target = moved[0].cards[1];

	assert.deepEqual(source.agentActivities.map((activity) => activity.id), ["release-agent"]);
	assert.equal(source.agentActivityMode, "working");
	assert.deepEqual(target.agentActivities.map((activity) => activity.id), ["settlement-agent", "review-agent"]);
	assert.equal(target.agentActivities[1], movingActivity);
	assert.equal(target.agentActivityMode, "awaiting-input");
});

test("moving an attached session refuses same-card, unknown, and duplicate destinations", () => {
	const activity = { id: "review-agent", label: "Review Agent", name: "Review Agent", state: "working" };
	const columns = [{
		title: "In review",
		count: 2,
		cards: [
			{ code: "PAY-121", agentActivityMode: "working", agentActivities: [activity] },
			{
				code: "PAY-128",
				agentActivityMode: "awaiting-input",
				agentActivities: [
					{ id: "review-agent", label: "Duplicate", name: "Duplicate", state: "awaiting-input" },
				],
			},
		],
	}];

	for (const result of [
		moveJiraKanbanAgentSession(columns, "PAY-121", "PAY-121", "review-agent"),
		moveJiraKanbanAgentSession(columns, "UNKNOWN", "PAY-128", "review-agent"),
		moveJiraKanbanAgentSession(columns, "PAY-121", "UNKNOWN", "review-agent"),
		moveJiraKanbanAgentSession(columns, "PAY-121", "PAY-128", "missing-agent"),
		moveJiraKanbanAgentSession(columns, "PAY-121", "PAY-128", "review-agent"),
	]) {
		assert.deepEqual(result, columns);
		assert.equal(result[0].cards[0].agentActivities[0], activity);
	}
});

test("attached drags resolve only the source unlink well or a different issue", () => {
	const origin = { kind: "attached", sourceCardCode: "PAY-121" };

	assert.deepEqual(
		resolveBoardAgentSessionDropTarget(origin, { x: 100, y: 175 }, ZONES),
		{ cardCode: "PAY-121", kind: "unlink" },
	);
	assert.equal(resolveBoardAgentSessionDropTarget(origin, { x: 100, y: 80 }, ZONES), null);
	assert.deepEqual(
		resolveBoardAgentSessionDropTarget(origin, { x: 300, y: 80 }, ZONES),
		{ cardCode: "PAY-128", kind: "attach" },
	);
});

test("detached and untracked drags attach to any issue and never resolve unlink targets", () => {
	for (const origin of [
		{ kind: "detached", sourceCardCode: "PAY-121" },
		{ kind: "untracked" },
	]) {
		assert.deepEqual(
			resolveBoardAgentSessionDropTarget(origin, { x: 100, y: 175 }, ZONES),
			{ cardCode: "PAY-121", kind: "attach" },
		);
		assert.deepEqual(
			resolveBoardAgentSessionDropTarget(origin, { x: 300, y: 80 }, ZONES),
			{ cardCode: "PAY-128", kind: "attach" },
		);
	}
});

test("overlapping eligible issues are ambiguous instead of arming multiple targets", () => {
	const overlappingZones = [
		TARGET_ISSUE,
		{ ...TARGET_ISSUE, cardCode: "PAY-130" },
	];

	assert.equal(
		resolveBoardAgentSessionDropTarget({ kind: "untracked" }, { x: 300, y: 80 }, overlappingZones),
		null,
	);
});

test("transactions record the session, origin, pointer, and one current target", () => {
	const draggedSession = session();
	const transaction = createBoardAgentSessionDragTransaction(
		draggedSession,
		{ kind: "attached", sourceCardCode: "PAY-121" },
		{ x: 100, y: 80 },
		ZONES,
	);
	assert.equal(transaction.session, draggedSession);
	assert.deepEqual(transaction.pointer, { x: 100, y: 80 });
	assert.equal(transaction.target, null);

	const updated = updateBoardAgentSessionDragTransaction(transaction, { x: 300, y: 80 }, ZONES);
	assert.deepEqual(updated.target, { cardCode: "PAY-128", kind: "attach" });
	assert.deepEqual(updated.pointer, { x: 300, y: 80 });
	assert.equal(updated.session, draggedSession);
});

test("drop actions distinguish detach, cross-card move, attach, and invalid cancellation", () => {
	const draggedSession = session();
	const cases = [
		{
			expected: { kind: "detach", sessionId: "review-agent", sourceCardCode: "PAY-121" },
			origin: { kind: "attached", sourceCardCode: "PAY-121" },
			pointer: { x: 100, y: 175 },
		},
		{
			expected: { kind: "move", sessionId: "review-agent", sourceCardCode: "PAY-121", targetCardCode: "PAY-128" },
			origin: { kind: "attached", sourceCardCode: "PAY-121" },
			pointer: { x: 300, y: 80 },
		},
		{
			expected: { kind: "attach", sessionId: "review-agent", targetCardCode: "PAY-128" },
			origin: { kind: "detached", sourceCardCode: "PAY-121" },
			pointer: { x: 300, y: 80 },
		},
		{
			expected: { kind: "attach", sessionId: "review-agent", targetCardCode: "PAY-128" },
			origin: { kind: "untracked" },
			pointer: { x: 300, y: 80 },
		},
		{
			expected: { kind: "none" },
			origin: { kind: "attached", sourceCardCode: "PAY-121" },
			pointer: { x: 800, y: 800 },
		},
	];

	for (const { expected, origin, pointer } of cases) {
		const transaction = createBoardAgentSessionDragTransaction(draggedSession, origin, pointer, ZONES);
		assert.deepEqual(resolveBoardAgentSessionDropAction(transaction), expected);
	}
});

test("cancelling a transaction clears its armed target and resolves to no action", () => {
	const transaction = createBoardAgentSessionDragTransaction(
		session(),
		{ kind: "attached", sourceCardCode: "PAY-121" },
		{ x: 300, y: 80 },
		ZONES,
	);
	const cancelled = cancelBoardAgentSessionDragTransaction(transaction);

	assert.equal(cancelled.target, null);
	assert.deepEqual(resolveBoardAgentSessionDropAction(cancelled), { kind: "none" });
});
