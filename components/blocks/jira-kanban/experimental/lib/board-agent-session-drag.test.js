const assert = require("node:assert/strict");
const test = require("node:test");

const { moveJiraKanbanAgentSession } = require("../../state.ts");

const {
	cancelBoardAgentSessionDragTransaction,
	createBoardAgentSessionDragTransaction,
	parseListRowDropZone,
	resolveBoardAgentSessionDropAction,
	resolveBoardAgentSessionDropTarget,
	toListSessionDropIntent,
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
const UNTRACKED = {
	bounds: { bottom: 200, left: 400, right: 760, top: 0 },
	kind: "untracked",
};
const CREATE_WORK_ITEM = {
	bounds: { bottom: 280, left: 220, right: 420, top: 220 },
	columnTitle: "In review",
	kind: "create",
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

test("only untracked sessions resolve a create-work-item column target", () => {
	assert.deepEqual(
		resolveBoardAgentSessionDropTarget(
			{ kind: "untracked" },
			{ x: 300, y: 250 },
			[CREATE_WORK_ITEM],
		),
		{ columnTitle: "In review", kind: "create" },
	);
	assert.deepEqual(
		resolveBoardAgentSessionDropAction(
			createBoardAgentSessionDragTransaction(
				session(),
				{ kind: "untracked" },
				{ x: 300, y: 250 },
				[CREATE_WORK_ITEM],
			),
		),
		{ columnTitle: "In review", kind: "create", sessionId: "review-agent" },
	);
	assert.equal(
		resolveBoardAgentSessionDropTarget(
			{ kind: "attached", sourceCardCode: "PAY-121" },
			{ x: 300, y: 250 },
			[CREATE_WORK_ITEM],
		),
		null,
	);
	assert.equal(
		resolveBoardAgentSessionDropTarget(
			{ kind: "detached", sourceCardCode: "PAY-121" },
			{ x: 300, y: 250 },
			[CREATE_WORK_ITEM],
		),
		null,
	);
});

test("an explicit create target wins over an overlapping issue card", () => {
	const overlappingIssue = {
		bounds: CREATE_WORK_ITEM.bounds,
		cardCode: "PAY-127",
		kind: "issue",
	};
	const transaction = createBoardAgentSessionDragTransaction(
		session(),
		{ kind: "untracked" },
		{ x: 300, y: 250 },
		[overlappingIssue, CREATE_WORK_ITEM],
	);

	assert.deepEqual(transaction.target, { columnTitle: "In review", kind: "create" });
	assert.deepEqual(
		resolveBoardAgentSessionDropAction(transaction),
		{ columnTitle: "In review", kind: "create", sessionId: "review-agent" },
	);
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

test("attached drags prefer Untracked over an issue the rail overlays", () => {
	const origin = { kind: "attached", sourceCardCode: "PAY-121" };
	const overlayingIssue = {
		bounds: UNTRACKED.bounds,
		cardCode: "PAY-128",
		kind: "issue",
	};

	assert.deepEqual(
		resolveBoardAgentSessionDropTarget(origin, { x: 500, y: 80 }, [overlayingIssue, UNTRACKED]),
		{ kind: "untracked" },
	);
	assert.deepEqual(
		resolveBoardAgentSessionDropAction(
			createBoardAgentSessionDragTransaction(
				session(),
				origin,
				{ x: 500, y: 80 },
				[overlayingIssue, UNTRACKED],
			),
		),
		{ kind: "detach", sessionId: "review-agent", sourceCardCode: "PAY-121" },
	);
});

test("untracked origins ignore the Untracked rail and still attach to issues underneath", () => {
	const overlayingIssue = {
		bounds: UNTRACKED.bounds,
		cardCode: "PAY-128",
		kind: "issue",
	};

	assert.deepEqual(
		resolveBoardAgentSessionDropTarget(
			{ kind: "untracked" },
			{ x: 500, y: 80 },
			[overlayingIssue, UNTRACKED],
		),
		{ cardCode: "PAY-128", kind: "attach" },
	);
});

const LIST_ROW = {
	bounds: { bottom: 90, left: 0, right: 400, top: 0 },
	issueKey: "PAY-118",
	kind: "list-row",
	rowIndex: 0,
};
const NEXT_LIST_ROW = {
	bounds: { bottom: 180, left: 0, right: 400, top: 90 },
	issueKey: "PAY-107",
	kind: "list-row",
	rowIndex: 1,
};
const LIST_ZONES = [LIST_ROW, NEXT_LIST_ROW];

test("untracked list-row middle thirds attach and boundary thirds create at insertAtIndex", () => {
	const origin = { kind: "untracked" };

	assert.deepEqual(
		resolveBoardAgentSessionDropTarget(origin, { x: 40, y: 45 }, LIST_ZONES),
		{ cardCode: "PAY-118", kind: "attach" },
	);
	assert.deepEqual(
		resolveBoardAgentSessionDropTarget(origin, { x: 40, y: 10 }, LIST_ZONES),
		{
			insertion: { insertAtIndex: 0, position: "before", relativeToIssueKey: "PAY-118" },
			kind: "create-list",
		},
	);
	const afterFirst = resolveBoardAgentSessionDropTarget(origin, { x: 40, y: 80 }, LIST_ZONES);
	const beforeSecond = resolveBoardAgentSessionDropTarget(origin, { x: 40, y: 100 }, LIST_ZONES);
	const sharedEdge = resolveBoardAgentSessionDropTarget(origin, { x: 40, y: 90 }, LIST_ZONES);
	assert.deepEqual(afterFirst, {
		insertion: { insertAtIndex: 1, position: "after", relativeToIssueKey: "PAY-118" },
		kind: "create-list",
	});
	assert.deepEqual(beforeSecond, {
		insertion: { insertAtIndex: 1, position: "before", relativeToIssueKey: "PAY-107" },
		kind: "create-list",
	});
	assert.equal(afterFirst.insertion.insertAtIndex, beforeSecond.insertion.insertAtIndex);
	assert.equal(sharedEdge?.kind, "create-list");
	assert.equal(sharedEdge?.insertion.insertAtIndex, 1);
});

test("list-row create is untracked-only and attached origins ignore create strips", () => {
	assert.equal(
		resolveBoardAgentSessionDropTarget(
			{ kind: "attached", sourceCardCode: "PAY-121" },
			{ x: 40, y: 10 },
			LIST_ZONES,
		),
		null,
	);
	assert.equal(
		resolveBoardAgentSessionDropTarget(
			{ kind: "detached", sourceCardCode: "PAY-121" },
			{ x: 40, y: 10 },
			LIST_ZONES,
		),
		null,
	);
	assert.deepEqual(
		resolveBoardAgentSessionDropTarget(
			{ kind: "detached", sourceCardCode: "PAY-121" },
			{ x: 40, y: 45 },
			LIST_ZONES,
		),
		{ cardCode: "PAY-118", kind: "attach" },
	);
});

test("overlapping list-row attach cards stay ambiguous", () => {
	const overlappingRows = [
		LIST_ROW,
		{ ...LIST_ROW, issueKey: "PAY-130", rowIndex: 2 },
	];

	assert.equal(
		resolveBoardAgentSessionDropTarget({ kind: "untracked" }, { x: 40, y: 45 }, overlappingRows),
		null,
	);
});

test("list-row create actions carry insertion and cancel to none", () => {
	const draggedSession = session();
	const createTransaction = createBoardAgentSessionDragTransaction(
		draggedSession,
		{ kind: "untracked" },
		{ x: 40, y: 10 },
		LIST_ZONES,
	);
	assert.deepEqual(
		resolveBoardAgentSessionDropAction(createTransaction),
		{
			insertion: { insertAtIndex: 0, position: "before", relativeToIssueKey: "PAY-118" },
			kind: "create-list",
			sessionId: "review-agent",
		},
	);
	assert.deepEqual(
		toListSessionDropIntent(createTransaction.target),
		{
			insertion: { insertAtIndex: 0, position: "before", relativeToIssueKey: "PAY-118" },
			kind: "create",
		},
	);
	assert.deepEqual(
		toListSessionDropIntent({ cardCode: "PAY-118", kind: "attach" }),
		{ issueKey: "PAY-118", kind: "attach" },
	);
	assert.deepEqual(toListSessionDropIntent({ kind: "untracked" }), { kind: "none" });
	assert.deepEqual(toListSessionDropIntent(null), { kind: "none" });

	const cancelled = cancelBoardAgentSessionDragTransaction(createTransaction);
	assert.equal(cancelled.target, null);
	assert.deepEqual(resolveBoardAgentSessionDropAction(cancelled), { kind: "none" });
});

test("malformed list-row attributes yield no zone", () => {
	const bounds = { bottom: 90, left: 0, right: 400, top: 0 };
	assert.equal(parseListRowDropZone(undefined, "0", bounds), null);
	assert.equal(parseListRowDropZone("PAY-118", undefined, bounds), null);
	assert.equal(parseListRowDropZone("PAY-118", "", bounds), null);
	assert.equal(parseListRowDropZone("PAY-118", "1.5", bounds), null);
	assert.equal(parseListRowDropZone("PAY-118", "row", bounds), null);
	assert.deepEqual(
		parseListRowDropZone("PAY-118", "0", bounds),
		{ bounds, issueKey: "PAY-118", kind: "list-row", rowIndex: 0 },
	);
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
