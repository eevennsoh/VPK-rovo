const assert = require("node:assert/strict");
const { test } = require("node:test");

const {
	applyAssignedAgentIdsToColumns,
	applyListOrder,
	createListRows,
	getNextPayIssueKey,
	insertListOrderKey,
	insertWorkItemCard,
	moveListOrder,
	toKanbanCardFromDraft,
} = require("./list-rows.ts");

const PAY_BOARD_CATALOG = [
	{
		id: "claude-code",
		name: "Claude Code",
		byline: "Coding agent by Anthropic",
		brandName: "claude",
	},
	{
		id: "review-agent",
		name: "Review Agent",
		byline: "Reviews every pull request",
		avatarSrc: "/avatar-agent/teamwork-agents/decision-director.svg",
	},
	{
		id: "test-agent",
		name: "Test Author Agent",
		byline: "Writes and repairs tests",
		avatarSrc: "/avatar-agent/service-agents/rca-agent.svg",
	},
	{
		id: "release-agent",
		name: "Release Captain Agent",
		byline: "Owns the flag and rollout",
		avatarSrc: "/avatar-agent/strategy-agents/strategic-insight.svg",
	},
];

const COLUMNS = [
	{
		title: "To do",
		count: 2,
		cards: [
			{
				code: "PAY-118",
				title: "First",
				priority: "medium",
				tags: [],
				assignee: { id: "diego", name: "Diego Santos", avatarSrc: "/diego.png" },
			},
			{
				code: "PAY-107",
				title: "Second",
				priority: "major",
				tags: [{ text: "wallet", color: "purple" }],
			},
		],
	},
	{
		title: "In progress",
		count: 1,
		cards: [
			{
				code: "PAY-101",
				title: "Third",
				priority: "minor",
				tags: [],
				agentActivities: [{ id: "claude", name: "Claude Code", state: "working" }],
				agentDoneRuns: [{ agentName: "Review Agent", state: "done" }],
			},
		],
	},
];

test("createListRows flattens board columns and maps agent sessions", () => {
	const rows = createListRows(COLUMNS, PAY_BOARD_CATALOG);

	assert.deepEqual(rows.map((row) => row.issueKey), ["PAY-118", "PAY-107", "PAY-101"]);
	assert.equal(rows[0]?.status, "To do");
	assert.equal(rows[0]?.statusVariant, "neutral");
	assert.equal(rows[2]?.status, "In progress");
	assert.equal(rows[2]?.statusVariant, "information");
	assert.deepEqual(rows[2]?.agentSessions, [
		{
			id: "claude-code",
			name: "Claude Code",
			byline: "Coding agent by Anthropic",
			brandName: "claude",
			statusKind: "working",
			statusLabel: "Working",
		},
		{
			id: "review-agent",
			name: "Review Agent",
			byline: "Reviews every pull request",
			avatarSrc: "/avatar-agent/teamwork-agents/decision-director.svg",
			statusKind: "finished",
			statusLabel: "Finished",
		},
	]);
	assert.equal(rows[0]?.assignee?.name, "Diego Santos");
	assert.equal(rows[1]?.assignee, undefined);
	assert.deepEqual(rows[0]?.agentSessions, []);
});

test("applyListOrder keeps a custom rank and appends new keys", () => {
	const rows = createListRows(COLUMNS, PAY_BOARD_CATALOG);

	assert.deepEqual(
		applyListOrder(rows, ["PAY-101", "PAY-118"]).map((row) => row.issueKey),
		["PAY-101", "PAY-118", "PAY-107"],
	);
	assert.deepEqual(
		applyListOrder(rows, []).map((row) => row.issueKey),
		["PAY-118", "PAY-107", "PAY-101"],
	);
});

test("moveListOrder rearranges among visible keys and leaves hidden keys in place", () => {
	assert.deepEqual(
		moveListOrder(["PAY-118", "PAY-107", "PAY-101"], ["PAY-118", "PAY-107", "PAY-101"], "PAY-101", 0),
		["PAY-101", "PAY-118", "PAY-107"],
	);
	assert.deepEqual(
		moveListOrder(["PAY-118", "HIDDEN", "PAY-107", "PAY-101"], ["PAY-118", "PAY-107", "PAY-101"], "PAY-107", 0),
		["PAY-107", "HIDDEN", "PAY-118", "PAY-101"],
	);
	assert.deepEqual(
		moveListOrder([], ["PAY-118", "PAY-107", "PAY-101"], "PAY-118", 2),
		["PAY-107", "PAY-101", "PAY-118"],
	);
});

test("insertListOrderKey places a created key at the list insertion index", () => {
	assert.deepEqual(
		insertListOrderKey(["PAY-118", "PAY-107"], ["PAY-118", "PAY-107"], "PAY-200", 1),
		["PAY-118", "PAY-200", "PAY-107"],
	);
	assert.deepEqual(
		insertListOrderKey(["PAY-118", "PAY-107"], ["PAY-118", "PAY-107"], "PAY-200", null),
		["PAY-118", "PAY-107", "PAY-200"],
	);
});

test("getNextPayIssueKey increments the highest PAY issue number", () => {
	assert.equal(getNextPayIssueKey(COLUMNS), "PAY-119");
});

test("toKanbanCardFromDraft keeps the create editor issue type and due date", () => {
	const card = toKanbanCardFromDraft({
		issueKey: "PAY-200",
		summary: "New work",
		issueType: "bug",
		dueDate: "2026-09-04",
	});
	const rows = createListRows(
		[{ title: "To do", count: 1, cards: [card] }],
		PAY_BOARD_CATALOG,
	);

	assert.equal(card.issueType, "bug");
	assert.equal(card.dueDate, "2026-09-04");
	assert.equal(rows[0]?.issueType, "bug");
	assert.equal(rows[0]?.dueDate, "2026-09-04");
});

test("insertWorkItemCard appends to the named status column", () => {
	const card = toKanbanCardFromDraft({
		issueKey: "PAY-200",
		summary: "New work",
		assignee: { id: "maya", name: "Maya Ferreira", avatarSrc: "/maya.png" },
	});
	const next = insertWorkItemCard(COLUMNS, card, "In progress");
	const inProgress = next.find((column) => column.title === "In progress");

	assert.equal(inProgress?.cards.at(-1)?.code, "PAY-200");
	assert.equal(inProgress?.count, 2);
	assert.equal(next.find((column) => column.title === "To do")?.count, 2);
});

test("applyAssignedAgentIdsToColumns archives and assigns against board columns", () => {
	const archived = applyAssignedAgentIdsToColumns(COLUMNS, "PAY-101", ["review-agent"], PAY_BOARD_CATALOG);
	const archivedCard = archived
		.find((column) => column.title === "In progress")
		?.cards.find((card) => card.code === "PAY-101");

	assert.equal(archivedCard?.agentActivities, undefined);
	assert.deepEqual(archivedCard?.agentDoneRuns?.map((run) => run.agentName), ["Review Agent"]);

	const assigned = applyAssignedAgentIdsToColumns(COLUMNS, "PAY-118", ["test-agent"], PAY_BOARD_CATALOG);
	const assignedCard = assigned
		.find((column) => column.title === "To do")
		?.cards.find((card) => card.code === "PAY-118");

	assert.equal(assignedCard?.agentActivities?.[0]?.id, "PAY-118:test-agent");
	assert.equal(assignedCard?.agentActivities?.[0]?.name, "Test Author Agent");
	assert.equal(assignedCard?.agentActivities?.[0]?.state, "working");

	const unchanged = applyAssignedAgentIdsToColumns(
		COLUMNS,
		"PAY-101",
		["claude-code", "review-agent"],
		PAY_BOARD_CATALOG,
	);
	const unchangedCard = unchanged
		.find((column) => column.title === "In progress")
		?.cards.find((card) => card.code === "PAY-101");
	assert.equal(unchangedCard?.agentActivities?.[0]?.name, "Claude Code");
	assert.equal(unchangedCard?.agentDoneRuns?.[0]?.agentName, "Review Agent");
});
