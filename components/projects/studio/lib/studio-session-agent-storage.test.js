const assert = require("node:assert/strict");
const test = require("node:test");
const { beforeEach } = test;

const {
	STUDIO_SESSION_AGENTS_STORAGE_KEY,
	readSessionAgentRecords,
	writeSessionAgentRecords,
	dedupeSessionAgentRecordsByProfileId,
} = require("./studio-session-agent-storage.ts");

const LEGACY_KEY = "vpk:studio:published-agents:v1";

function makeAgentResult(overrides = {}) {
	return {
		agentId: "agent-1",
		name: "Test Agent",
		summary: "An agent for tests",
		action: "create",
		...overrides,
	};
}

function makeRecord(overrides = {}) {
	const result = makeAgentResult();
	return {
		profileId: "profile-1",
		resultKey: "result-key-1",
		sourceResult: result,
		draftResult: result,
		publishReadyResult: result,
		publishedResult: null,
		publishStatus: "testing",
		lastTouchedAt: 1_700_000_000_000,
		...overrides,
	};
}

function installStorageShim(mutator = {}) {
	const store = new Map();
	const shim = {
		getItem(key) {
			return store.has(key) ? store.get(key) : null;
		},
		setItem(key, value) {
			if (mutator.setItem) {
				mutator.setItem(key, value);
			}
			store.set(key, value);
		},
		removeItem(key) {
			store.delete(key);
		},
		clear() {
			store.clear();
		},
		key(index) {
			return Array.from(store.keys())[index] ?? null;
		},
		get length() {
			return store.size;
		},
	};

	const win = { localStorage: shim };
	globalThis.window = win;
	globalThis.localStorage = shim;

	return store;
}

beforeEach(() => {
	installStorageShim();
});

test("round-trips draft and published records through localStorage", () => {
	const publishedResult = makeAgentResult({ agentId: "agent-pub", name: "Pub" });
	const draft = makeRecord({
		profileId: "profile-draft",
		resultKey: "draft-key",
		sourceResult: makeAgentResult({ agentId: "agent-draft" }),
		draftResult: makeAgentResult({ agentId: "agent-draft", description: "edited" }),
		publishReadyResult: makeAgentResult({ agentId: "agent-draft" }),
		publishedResult: null,
		publishStatus: "testing",
		lastTouchedAt: 1_700_000_000_001,
	});
	const published = makeRecord({
		profileId: "profile-pub",
		resultKey: "pub-key",
		sourceResult: publishedResult,
		draftResult: publishedResult,
		publishReadyResult: publishedResult,
		publishedResult,
		publishStatus: "published",
		lastTouchedAt: 1_700_000_000_002,
	});

	writeSessionAgentRecords([draft, published]);
	const read = readSessionAgentRecords();

	assert.deepEqual(read, [draft, published]);
});

test("migrates legacy published-agents key into the new key and removes the legacy key", () => {
	const store = installStorageShim();
	const legacyResult = makeAgentResult({ agentId: "legacy-agent", name: "Legacy" });
	const legacyRecord = {
		profileId: "profile-legacy",
		profileName: "Legacy Profile",
		resultKey: "legacy-result-key",
		result: legacyResult,
		lastTouchedAt: 1_699_999_999_999,
	};
	store.set(LEGACY_KEY, JSON.stringify([legacyRecord]));

	const records = readSessionAgentRecords();

	assert.equal(records.length, 1);
	const migrated = records[0];
	assert.equal(migrated.profileId, "profile-legacy");
	assert.equal(migrated.publishStatus, "published");
	assert.equal(migrated.resultKey, "legacy-result-key");
	assert.deepEqual(migrated.sourceResult, legacyResult);
	assert.deepEqual(migrated.draftResult, legacyResult);
	assert.deepEqual(migrated.publishReadyResult, legacyResult);
	assert.deepEqual(migrated.publishedResult, legacyResult);
	assert.equal(migrated.lastTouchedAt, 1_699_999_999_999);

	const newKeyRaw = store.get(STUDIO_SESSION_AGENTS_STORAGE_KEY);
	assert.ok(newKeyRaw, "new key should hold the migrated payload");
	assert.deepEqual(JSON.parse(newKeyRaw), [migrated]);

	assert.equal(store.has(LEGACY_KEY), false);
});

test("migrates legacy records that lack profileName", () => {
	const store = installStorageShim();
	const legacyResult = makeAgentResult({ agentId: "legacy-noname" });
	const legacyRecord = {
		profileId: "profile-noname",
		resultKey: "legacy-result-key",
		result: legacyResult,
	};
	store.set(LEGACY_KEY, JSON.stringify([legacyRecord]));

	const records = readSessionAgentRecords();

	assert.equal(records.length, 1);
	assert.equal(records[0].profileId, "profile-noname");
});

test("preserves legacy key when migration write-back throws", () => {
	const store = installStorageShim({
		setItem(key) {
			if (key === STUDIO_SESSION_AGENTS_STORAGE_KEY) {
				throw new Error("write blocked");
			}
		},
	});
	const legacyResult = makeAgentResult({ agentId: "legacy-agent" });
	const legacyRecord = {
		profileId: "profile-legacy",
		profileName: "Legacy Profile",
		resultKey: "legacy-result-key",
		result: legacyResult,
		lastTouchedAt: 1_699_999_999_998,
	};
	store.set(LEGACY_KEY, JSON.stringify([legacyRecord]));

	const records = readSessionAgentRecords();

	assert.equal(records.length, 1);
	assert.equal(records[0].publishStatus, "published");

	assert.ok(store.has(LEGACY_KEY), "legacy key must be preserved on failed write-back");

	assert.equal(store.has(STUDIO_SESSION_AGENTS_STORAGE_KEY), false);
});

test("accepts agent-result records with any action string", () => {
	const store = installStorageShim();
	const archiveResult = makeAgentResult({ action: "archive" });
	const record = makeRecord({
		profileId: "profile-archive",
		sourceResult: archiveResult,
		draftResult: archiveResult,
		publishReadyResult: archiveResult,
	});
	store.set(STUDIO_SESSION_AGENTS_STORAGE_KEY, JSON.stringify([record]));

	const records = readSessionAgentRecords();
	assert.equal(records.length, 1);
	assert.equal(records[0].sourceResult.action, "archive");
});

test("returns [] when the new key contains a corrupt payload", () => {
	const store = installStorageShim();
	store.set(STUDIO_SESSION_AGENTS_STORAGE_KEY, "not json");

	let records = [makeRecord()];
	assert.doesNotThrow(() => {
		records = readSessionAgentRecords();
	});
	assert.deepEqual(records, []);
});

test("writeSessionAgentRecords swallows quota errors", () => {
	installStorageShim({
		setItem() {
			const err = new Error("QuotaExceededError");
			err.name = "QuotaExceededError";
			throw err;
		},
	});

	assert.doesNotThrow(() => {
		writeSessionAgentRecords([makeRecord()]);
	});
});

// Regression: a stored payload with two records sharing a profileId used to
// hydrate into two session-agent entries with the same React key. React's keyed
// reconciler then left a stale row in the sidebar / "My agents" table when one
// was deleted (the agent appeared to linger on screen). readSessionAgentRecords
// now collapses same-profileId records, keeping the freshest, so the bug can't
// reach the UI.
test("readSessionAgentRecords collapses records sharing a profileId, keeping the freshest", () => {
	const store = installStorageShim();
	const stale = makeRecord({
		profileId: "decision-director",
		resultKey: "key-1",
		draftResult: makeAgentResult({ name: "Decision Director", description: "old" }),
		lastTouchedAt: 1_700_000_000_000,
	});
	const fresh = makeRecord({
		profileId: "decision-director",
		resultKey: "key-2",
		draftResult: makeAgentResult({ name: "Decision Director", description: "new" }),
		lastTouchedAt: 1_700_000_005_000,
	});
	const other = makeRecord({ profileId: "untitled-agent", resultKey: "key-3" });
	store.set(STUDIO_SESSION_AGENTS_STORAGE_KEY, JSON.stringify([stale, fresh, other]));

	const records = readSessionAgentRecords();

	assert.equal(records.length, 2);
	const directorRecords = records.filter((record) => record.profileId === "decision-director");
	assert.equal(directorRecords.length, 1);
	assert.equal(directorRecords[0].resultKey, "key-2");
	assert.equal(directorRecords[0].draftResult.description, "new");
});

test("dedupeSessionAgentRecordsByProfileId keeps one record per profileId and preserves uniques", () => {
	const a1 = makeRecord({ profileId: "a", resultKey: "a-1", lastTouchedAt: 1 });
	const a2 = makeRecord({ profileId: "a", resultKey: "a-2", lastTouchedAt: 2 });
	const b = makeRecord({ profileId: "b", resultKey: "b-1", lastTouchedAt: 5 });

	const deduped = dedupeSessionAgentRecordsByProfileId([a1, a2, b]);

	assert.equal(deduped.length, 2);
	const ids = deduped.map((record) => record.profileId).sort();
	assert.deepEqual(ids, ["a", "b"]);
	const aRecord = deduped.find((record) => record.profileId === "a");
	assert.equal(aRecord.resultKey, "a-2");
});
