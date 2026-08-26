const assert = require("node:assert/strict");
const path = require("node:path");
const { test } = require("node:test");
const esbuild = require("esbuild");
const { loadCjsModuleFromText } = require(process.cwd() + "/scripts/lib/esbuild-cjs-loader.js");

let presentationModulePromise;

function loadPresentationModule() {
	if (!presentationModulePromise) {
		presentationModulePromise = esbuild
			.build({
				entryPoints: [path.join(__dirname, "presentation-story.ts")],
				bundle: true,
				format: "cjs",
				loader: { ".css": "empty" },
				platform: "node",
				tsconfig: path.join(process.cwd(), "tsconfig.json"),
				write: false,
			})
			.then((result) => loadCjsModuleFromText(
				result.outputFiles[0].text,
				"jira-golden-journeys-v3-presentation-story-harness.cjs",
			));
	}

	return presentationModulePromise;
}

test("the presentation chapters follow the manager journey from Track to Terminal", async () => {
	const story = await loadPresentationModule();

	assert.deepEqual(
		story.JIRA_GOLDEN_JOURNEYS_V3_PRESENTATION_CHAPTERS,
		[
			{ label: "Track", value: "track" },
			{ label: "Learn", value: "learn" },
			{ label: "Build", value: "build" },
			{ label: "Terminal", value: "terminal" },
		],
	);
});

test("the PAY board fills every existing status with coding work and the full state matrix", async () => {
	const story = await loadPresentationModule();
	const columns = story.createJiraGoldenJourneysV3PayBoardColumns();
	const cards = columns.flatMap((column) => column.cards);

	assert.deepEqual(columns.map((column) => column.title), [
		"Review",
		"In progress",
		"In review",
		"To do",
		"Done",
	]);
	assert.ok(columns.every((column) => column.cards.length >= 3));
	assert.ok(columns.every((column) => column.count === column.cards.length));
	assert.ok(cards.every((card) => card.code.startsWith("PAY-")));

	const agentStates = new Set(
		cards.flatMap((card) => card.agentActivities?.map((activity) => activity.state) ?? []),
	);
	assert.ok(cards.some((card) => !card.agentActivities?.length && !card.agentDoneRuns?.length));
	assert.ok(agentStates.has("working"));
	assert.ok(agentStates.has("awaiting-input"));
	assert.ok(cards.some((card) => card.agentActivityMode === "completed" && card.agentDoneRuns?.length));

	assert.deepEqual(
		new Set(cards.map((card) => card.pullRequestStatus).filter(Boolean)),
		new Set(["open", "failed", "merged"]),
	);

	const pay101 = cards.find((card) => card.code === "PAY-101");
	assert.equal(pay101.pullRequestNumber, 1839);
	assert.equal(pay101.pullRequestStatus, "merged");
});

test("the board factory returns isolated cards and nested agent state", async () => {
	const story = await loadPresentationModule();
	const first = story.createJiraGoldenJourneysV3PayBoardColumns();
	const second = story.createJiraGoldenJourneysV3PayBoardColumns();

	assert.notEqual(first, second);
	assert.notEqual(first[0].cards, second[0].cards);
	assert.notEqual(first[0].cards[0], second[0].cards[0]);
	assert.notEqual(first[0].cards[0].agentActivities, second[0].cards[0].agentActivities);
});

test("PAY-101 Build captures the inventory agent run and the first Insight's merged evidence", async () => {
	const story = await loadPresentationModule();
	const state = story.createJiraGoldenJourneysV3Pay101BuildState();

	assert.equal(story.JIRA_GOLDEN_JOURNEYS_V3_PAY_101_WORK_ITEM.code, "PAY-101");
	assert.match(story.JIRA_GOLDEN_JOURNEYS_V3_PAY_101_WORK_ITEM.title, /Inventory every v1 call site/u);
	assert.equal(state.activeSessionId, null, "Build should keep the initial Activity viewport at the top");
	assert.equal(state.sessions.length, 1);
	assert.equal(state.sessions[0].id, story.JIRA_GOLDEN_JOURNEYS_V3_PAY_101_SESSION_ID);
	assert.equal(story.JIRA_GOLDEN_JOURNEYS_V3_PAY_101_UNCAPTURED_SESSION_ID, "lw-scope-thread");
	assert.notEqual(
		state.sessions[0].id,
		story.JIRA_GOLDEN_JOURNEYS_V3_PAY_101_UNCAPTURED_SESSION_ID,
		"the captured inventory run must stay distinct from the uncaptured rationale session",
	);
	assert.equal(state.sessions[0].status, "completed");
	assert.equal(state.sessions[0].activityVisibility, "public");
	assert.match(state.sessions[0].previewText, /61 call sites across four services/u);
	assert.ok(state.comments.some((comment) => /rationale remains uncaptured.*local Claude session/u.test(comment.content)));
	assert.doesNotMatch(
		state.sessions[0].messages.map((message) => message.content).join(" "),
		/captured the keep-or-delete reasoning|made (?:the|it) durable/u,
	);

	const allOutputs = [
		...state.sessions.flatMap((session) => session.outputs ?? []),
		...state.comments.flatMap((comment) => comment.outputs ?? []),
		...state.staticEvents.flatMap((event) => event.kind === "changed-files" ? event.outputs ?? [] : []),
	];
	const inventoryPr = allOutputs.find((output) => output.id === "pay-101-inventory-pr-1839");
	const inventoryCommit = allOutputs.find((output) => output.id === "pay-101-inventory-commit-8c2f4e1");

	assert.deepEqual(inventoryPr.pullRequest, {
		additions: 312,
		deletions: 8,
		number: 1839,
		status: "Merged",
	});
	assert.match(inventoryCommit.title, /8c2f4e1/u);

	const mergedPrEvent = state.staticEvents.find((event) => event.pullRequest?.number === 1839);
	assert.equal(mergedPrEvent.pullRequest.status, "Merged");
	assert.equal(mergedPrEvent.pullRequest.mergeState, "merged");
});

test("the PAY-specific agent exports cover the board and Build composer without SHOP aliases", async () => {
	const story = await loadPresentationModule();

	assert.ok(story.JIRA_GOLDEN_JOURNEYS_V3_PAY_BOARD_AGENTS.length >= 4);
	assert.ok(story.JIRA_GOLDEN_JOURNEYS_V3_PAY_COMPOSER_AGENTS.length >= 4);
	assert.ok(story.JIRA_GOLDEN_JOURNEYS_V3_PAY_BOARD_AGENTS.some((agent) => agent.id === "claude-code"));
	assert.ok(story.JIRA_GOLDEN_JOURNEYS_V3_PAY_COMPOSER_AGENTS.some((agent) => agent.id === "claude-code"));
});
