const assert = require("node:assert/strict");
const test = require("node:test");
const esbuild = require("esbuild");
const { loadCjsModuleFromText } = require(process.cwd() + "/scripts/lib/esbuild-cjs-loader.js");
const path = require("node:path");

const MODULE_PATH = path.join(__dirname, "filter-changed-files-by-scope.ts");

async function loadModule() {
	const result = await esbuild.build({
		entryPoints: [MODULE_PATH],
		bundle: true,
		format: "cjs",
		platform: "node",
		write: false,
		tsconfig: path.join(process.cwd(), "tsconfig.json"),
	});
	return loadCjsModuleFromText(result.outputFiles[0].text, "filter-changed-files-by-scope.cjs");
}

test("commit scopes only apply when fileIds are present", async () => {
	const {
		canApplyChangesScope,
		filterChangedFilesByScope,
	} = await loadModule();
	const files = [
		{ id: "a", additions: 1, deletions: 0 },
		{ id: "b", additions: 2, deletions: 1 },
	];
	const commits = [
		{ id: "c1", shortSha: "abc", title: "One", additions: 1, deletions: 0 },
		{ id: "c2", shortSha: "def", title: "Two", additions: 2, deletions: 1, fileIds: ["b"] },
	];

	assert.equal(canApplyChangesScope("all-changes", commits), true);
	assert.equal(canApplyChangesScope("uncommitted", commits), false);
	assert.equal(canApplyChangesScope("commit:c1", commits), false);
	assert.equal(canApplyChangesScope("commit:c2", commits), true);
	assert.deepEqual(
		filterChangedFilesByScope(files, commits, "commit:c2").map((file) => file.id),
		["b"],
	);
	assert.deepEqual(
		filterChangedFilesByScope(files, commits, "commit:c1").map((file) => file.id),
		["a", "b"],
	);
});
