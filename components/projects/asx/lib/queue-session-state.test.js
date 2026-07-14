const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");
const esbuild = require("esbuild");
const { loadCjsModuleFromText } = require(path.join(process.cwd(), "scripts/lib/esbuild-cjs-loader.js"));

async function loadQueueStateHarness() {
	const result = await esbuild.build({
		stdin: {
			contents: `
				export {
					appendQueueSessionUserMessage,
					createInitialQueueSessions,
					getUnfinishedQueueSessions,
					groupQueueSessionsBySpace,
				} from "./components/projects/asx/lib/queue-session-state";
			`,
			loader: "ts",
			resolveDir: process.cwd(),
			sourcefile: "queue-session-state-harness.ts",
		},
		bundle: true,
		format: "cjs",
		platform: "node",
		tsconfig: path.join(process.cwd(), "tsconfig.json"),
		write: false,
	});

	return loadCjsModuleFromText(result.outputFiles[0].text);
}

function session(id, spaceId, status = "running") {
	return {
		agentId: "agent-1",
		id,
		messages: [{ id: `${id}-message`, role: "assistant", parts: [{ type: "text", text: id }] }],
		spaceId,
		status,
		title: id,
	};
}

test("queue sessions clone seeded message collections", async () => {
	const harness = await loadQueueStateHarness();
	const seeds = [session("one", "space-a")];
	const initial = harness.createInitialQueueSessions(seeds);

	assert.notEqual(initial, seeds);
	assert.notEqual(initial[0], seeds[0]);
	assert.notEqual(initial[0].messages, seeds[0].messages);
	assert.deepEqual(initial, seeds);
});

test("queue sessions group unfinished work by Jira space", async () => {
	const harness = await loadQueueStateHarness();
	const sessions = [
		session("queued", "space-a", "queued"),
		session("running", "space-a", "running"),
		session("input", "space-b", "needs-input"),
		session("done", "space-b", "completed"),
	];

	assert.deepEqual(
		harness.getUnfinishedQueueSessions(sessions).map((item) => item.id),
		["queued", "running", "input"],
	);
	assert.deepEqual(
		Object.fromEntries(
			Object.entries(harness.groupQueueSessionsBySpace(sessions)).map(([spaceId, items]) => [
				spaceId,
				items.map((item) => item.id),
			]),
		),
		{
			"space-a": ["queued", "running"],
			"space-b": ["input"],
		},
	);
});

test("local replies append only to the selected session and move unfinished states to running", async () => {
	const harness = await loadQueueStateHarness();
	const sessions = [
		session("queued", "space-a", "queued"),
		session("input", "space-a", "needs-input"),
		session("running", "space-b", "running"),
	];
	const reply = { id: "reply", role: "user", parts: [{ type: "text", text: "Here is the answer." }] };

	const queuedReply = harness.appendQueueSessionUserMessage(sessions, "queued", reply);
	assert.equal(queuedReply[0].status, "running");
	assert.equal(queuedReply[0].messages.at(-1), reply);
	assert.equal(queuedReply[1], sessions[1]);

	const inputReply = harness.appendQueueSessionUserMessage(sessions, "input", reply);
	assert.equal(inputReply[1].status, "running");

	const runningReply = harness.appendQueueSessionUserMessage(sessions, "running", reply);
	assert.equal(runningReply[2].status, "running");
});
