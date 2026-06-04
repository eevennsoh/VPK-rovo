"use strict";

const assert = require("node:assert/strict");
const { test } = require("node:test");

const {
	createWikiMemoryCollectionSync,
	isMissingNativeBindingError,
} = require("./wiki-memory-collection-sync");

function createTestLogger() {
	const warnings = [];
	return {
		warn(...args) {
			warnings.push(args.join(" "));
		},
		warnings,
	};
}

test("isMissingNativeBindingError detects better-sqlite3 binding failures", () => {
	const bindingError = new Error(
		"Could not locate the bindings file. Tried:\n → .../build/better_sqlite3.node",
	);
	assert.equal(isMissingNativeBindingError(bindingError), true);

	const moduleError = new Error("Cannot find module 'better-sqlite3'");
	moduleError.code = "MODULE_NOT_FOUND";
	assert.equal(isMissingNativeBindingError(moduleError), true);

	assert.equal(isMissingNativeBindingError(new Error("some unrelated failure")), false);
	assert.equal(isMissingNativeBindingError(null), false);
});

test("syncWikiMemoryCollection skips when no collection name is provided", async () => {
	let called = false;
	const sync = createWikiMemoryCollectionSync({
		logger: createTestLogger(),
		syncWikiQmdIndex: async () => {
			called = true;
		},
	});

	await sync({});
	assert.equal(called, false, "index sync should not run without a collection name");
});

test("syncWikiMemoryCollection refreshes the index for a named collection", async () => {
	const calls = [];
	const sync = createWikiMemoryCollectionSync({
		logger: createTestLogger(),
		syncWikiQmdIndex: async (input) => {
			calls.push(input);
		},
	});

	await sync({ collectionName: "work", wikiDir: "/tmp/wiki" });
	assert.equal(calls.length, 1);
	assert.deepEqual(calls[0].collectionNames, ["work"]);
	assert.equal(calls[0].wikiDir, "/tmp/wiki");
});

test("syncWikiMemoryCollection swallows a missing better-sqlite3 binding error", async () => {
	const logger = createTestLogger();
	const sync = createWikiMemoryCollectionSync({
		logger,
		syncWikiQmdIndex: async () => {
			throw new Error(
				"Could not locate the bindings file. Tried:\n → .../build/better_sqlite3.node",
			);
		},
	});

	// This must NOT throw — a memory reset/delete has already mutated the
	// markdown corpus; the index refresh failing is non-fatal.
	await sync({ collectionName: "work" });

	assert.equal(logger.warnings.length, 1);
	assert.match(logger.warnings[0], /Skipped QMD index refresh/);
	assert.match(logger.warnings[0], /qmd:sync-wiki/);
});

test("syncWikiMemoryCollection swallows unexpected index errors as a warning", async () => {
	const logger = createTestLogger();
	const sync = createWikiMemoryCollectionSync({
		logger,
		syncWikiQmdIndex: async () => {
			throw new Error("disk is on fire");
		},
	});

	await sync({ collectionName: "profile" });

	assert.equal(logger.warnings.length, 1);
	assert.match(logger.warnings[0], /QMD index refresh failed/);
	assert.match(logger.warnings[0], /disk is on fire/);
});

test("createWikiMemoryCollectionSync requires a syncWikiQmdIndex function", () => {
	assert.throws(() => createWikiMemoryCollectionSync({}), /requires a syncWikiQmdIndex function/);
});
