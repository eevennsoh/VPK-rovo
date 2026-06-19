const assert = require("node:assert/strict");
const test = require("node:test");

test("component test report separates allowlisted and skipped node:test files", async () => {
	const { buildComponentTestReport } = await import("./run-js-unit-tests.mjs");
	const report = buildComponentTestReport([
		{
			filePath: "components/allowed.test.js",
			source: 'const test = require("node:test");',
		},
		{
			filePath: "components/skipped.test.js",
			source: 'const test = require("node:test");',
		},
		{
			filePath: "components/not-node-test.test.js",
			source: "module.exports = {};",
		},
		{
			filePath: "lib/included-by-prefix.test.js",
			source: 'const test = require("node:test");',
		},
	], {
		includedTestFiles: new Set(["components/allowed.test.js"]),
		includedTestPrefixes: ["lib/"],
		excludedTestFiles: new Set(),
	});

	assert.deepEqual(report, {
		version: 1,
		componentRoot: "components/",
		includedCount: 1,
		excludedCount: 1,
		includedFiles: ["components/allowed.test.js"],
		excludedFiles: [
			{
				filePath: "components/skipped.test.js",
				reason: "not-included",
			},
		],
	});
});

test("runnable test selection preserves the existing prefix and explicit-file gates", async () => {
	const { selectRunnableTestFiles } = await import("./run-js-unit-tests.mjs");
	const runnableFiles = selectRunnableTestFiles([
		{
			filePath: "backend/included-by-prefix.test.js",
			source: 'const test = require("node:test");',
		},
		{
			filePath: "components/allowed.test.js",
			source: 'const test = require("node:test");',
		},
		{
			filePath: "components/skipped.test.js",
			source: 'const test = require("node:test");',
		},
		{
			filePath: "scripts/not-node-test.test.js",
			source: "module.exports = {};",
		},
	], {
		includedTestFiles: new Set(["components/allowed.test.js"]),
		includedTestPrefixes: ["backend/", "scripts/"],
		excludedTestFiles: new Set(),
	});

	assert.deepEqual(runnableFiles, [
		"backend/included-by-prefix.test.js",
		"components/allowed.test.js",
	]);
});
