const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");
const esbuild = require("esbuild");
const { loadCjsModuleFromText } = require(process.cwd() + "/scripts/lib/esbuild-cjs-loader.js");

const BLOCK_DIR = __dirname;
const TEST_WORK_ITEM = {
	code: "JRA-4821",
	title: "Board filters reset after live reconnect",
	status: "In progress",
	priority: "Highest",
	assignee: { name: "Jordan Lee" },
	reporter: { name: "Maya Chen" },
};

function loadBlockModule(relativePath, harnessName) {
	return esbuild
		.build({
			entryPoints: [path.join(BLOCK_DIR, relativePath)],
			bundle: true,
			format: "cjs",
			loader: { ".css": "empty" },
			platform: "node",
			tsconfig: path.join(process.cwd(), "tsconfig.json"),
			write: false,
		})
		.then((result) => loadCjsModuleFromText(result.outputFiles[0].text, harnessName));
}

const modelPromise = loadBlockModule("data/session-state.ts", "jira-work-item-shared-channel-state.cjs");
const routingPromise = loadBlockModule(
	"experimental-v2/lib/activity-composer-session-routing.ts",
	"jira-work-item-shared-channel-routing.cjs",
);

test("multiple mentions target each distinct working agent once", async () => {
	const [model, routing] = await Promise.all([modelPromise, routingPromise]);
	let state = model.hydratePreset("empty", TEST_WORK_ITEM);
	state = model.jiraWorkItemReducer(state, { type: "launch-session", agentId: "a1", agentName: "Agent One" });
	state = model.jiraWorkItemReducer(state, { type: "launch-session", agentId: "a2", agentName: "Agent Two" });
	state = model.jiraWorkItemReducer(state, { type: "launch-session", agentId: "a1", agentName: "Agent One" });

	assert.deepEqual(
		routing.findSteeredWorkingSessions(state.sessions, "@Agent One and @Agent Two").map((session) => session.id),
		[state.sessions[2].id, state.sessions[1].id],
	);
});

test("multiple mentions launch every distinct available agent once", async () => {
	const routing = await routingPromise;
	const agents = [
		{ id: "impact", name: "Service Impact agent", byline: "Lead" },
		{ id: "claude", name: "Claude Code", byline: "Implement" },
		{ id: "tests", name: "Unit Test Creator", byline: "Verify" },
		{ id: "claude", name: "Claude Code", byline: "Duplicate" },
	];
	assert.deepEqual(
		routing.findMentionedAvailableAgents(
			agents,
			"@Service Impact agent lead, @Claude Code patch, and @Unit Test Creator verify.",
		).map((agent) => agent.id),
		["impact", "claude", "tests"],
	);
	assert.deepEqual(
		routing.findMentionedAvailableAgents(
			agents,
			"@Service Impact agent and @Claude Code",
			new Set(["impact"]),
			new Set(["Claude Code"]),
		),
		[],
	);
});

test("broadcasts reach active sessions once without resuming waits", async () => {
	const model = await modelPromise;
	let state = model.hydratePreset("empty", TEST_WORK_ITEM);
	for (const [agentId, agentName] of [["a1", "Agent One"], ["a2", "Agent Two"], ["a3", "Agent Three"]]) {
		state = model.jiraWorkItemReducer(state, { type: "launch-session", agentId, agentName });
	}
	state = {
		...state,
		sessions: state.sessions.map((session, index) => index === 1
			? { ...session, status: "waiting", waitingOn: { kind: "agent", agentId: "a1", agentName: "Agent One" } }
			: index === 2 ? { ...session, status: "completed" } : session),
	};
	const messageCounts = state.sessions.map((session) => session.messages.length);
	state = model.jiraWorkItemReducer(state, { type: "broadcast-comment", text: "Include reconnect telemetry." });

	assert.deepEqual(state.sessions.map((session, index) => session.messages.length - messageCounts[index]), [1, 1, 0]);
	assert.equal(state.sessions[1].status, "waiting");
	assert.equal(state.comments.length, 1);
	assert.deepEqual(state.comments[0].reactions[0].actorIds, [
		model.getAgentActivityActorId("a1"),
		model.getAgentActivityActorId("a2"),
	]);
});

test("a direct reply resumes one waiting session and clears its dependency", async () => {
	const model = await modelPromise;
	let state = model.hydratePreset("running", TEST_WORK_ITEM);
	const waiting = state.sessions.find((session) => session.status === "waiting");
	state = {
		...state,
		sessions: state.sessions.map((session) => session.id === waiting.id
			? { ...session, waitingOn: { kind: "agent", agentId: "a1", agentName: "Agent One" } }
			: session),
	};
	state = model.jiraWorkItemReducer(state, { type: "reply-session", sessionId: waiting.id, text: "Resume now." });
	const resumed = state.sessions.find((session) => session.id === waiting.id);

	assert.equal(resumed.status, "running");
	assert.equal(resumed.waitingOn, undefined);
	assert.equal(state.sessions.filter((session) => session.id !== waiting.id && session.status === "waiting").length, 0);
});
