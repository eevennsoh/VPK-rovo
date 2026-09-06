const assert = require("node:assert/strict");
const path = require("node:path");
const { test } = require("node:test");
const esbuild = require("esbuild");
const { loadCjsModuleFromText } = require(process.cwd() + "/scripts/lib/esbuild-cjs-loader.js");

let syncModulePromise;

function loadSyncModule() {
	if (!syncModulePromise) {
		syncModulePromise = esbuild
			.build({
				entryPoints: [path.join(__dirname, "agent-session-sync.ts")],
				bundle: true,
				format: "cjs",
				platform: "node",
				tsconfig: path.join(process.cwd(), "tsconfig.json"),
				write: false,
			})
			.then((result) => loadCjsModuleFromText(
				result.outputFiles[0].text,
				"jira-golden-journeys-v4-agent-session-sync-harness.cjs",
			));
	}

	return syncModulePromise;
}

test("the Jira v4 demo syncs one or two new sessions per batch", async () => {
	const sync = await loadSyncModule();

	assert.equal(sync.takeJiraGoldenJourneysV4SyncBatch(0, () => 0).sessions.length, 1);
	assert.equal(sync.takeJiraGoldenJourneysV4SyncBatch(0, () => 0.999).sessions.length, 2);

	const finalBatch = sync.takeJiraGoldenJourneysV4SyncBatch(
		sync.JIRA_GOLDEN_JOURNEYS_V4_SYNC_SESSIONS.length - 1,
		() => 0.999,
	);
	assert.equal(finalBatch.sessions.length, 1);
	assert.equal(finalBatch.nextIndex, sync.JIRA_GOLDEN_JOURNEYS_V4_SYNC_SESSIONS.length);
});

test("the Jira v4 demo chooses a fresh delay inside the four-to-eight-second window", async () => {
	const sync = await loadSyncModule();

	assert.equal(sync.getJiraGoldenJourneysV4SyncDelayMs(() => 0), 4_000);
	assert.equal(sync.getJiraGoldenJourneysV4SyncDelayMs(() => 0.5), 6_000);
	assert.equal(sync.getJiraGoldenJourneysV4SyncDelayMs(() => 0.999_999), 8_000);
});

test("every queued Jira v4 session has a unique stable identity", async () => {
	const sync = await loadSyncModule();
	const sessions = sync.JIRA_GOLDEN_JOURNEYS_V4_SYNC_SESSIONS;

	assert.ok(sessions.length >= 8);
	assert.equal(new Set(sessions.map((session) => session.id)).size, sessions.length);
	assert.ok(sessions.every((session) => session.kind === "agent-session"));
	assert.ok(sessions.every((session) => session.timeLabel === "just now"));
});
