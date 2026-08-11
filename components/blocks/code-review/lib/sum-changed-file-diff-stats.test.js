const assert = require("node:assert/strict");
const { join } = require("node:path");
const test = require("node:test");
const esbuild = require("esbuild");
const { loadCjsModuleFromText } = require(process.cwd() + "/scripts/lib/esbuild-cjs-loader.js");

const MODULE_PATH = join(__dirname, "sum-changed-file-diff-stats.ts");

let statsPromise;
function loadStatsModule() {
	if (!statsPromise) {
		statsPromise = esbuild
			.build({
				entryPoints: [MODULE_PATH],
				bundle: true,
				format: "cjs",
				platform: "node",
				tsconfig: join(process.cwd(), "tsconfig.json"),
				write: false,
			})
			.then((result) => loadCjsModuleFromText(
				result.outputFiles[0].text,
				"sum-changed-file-diff-stats-harness.cjs",
			));
	}
	return statsPromise;
}

test("sumChangedFileDiffStats totals additions and deletions across files", async () => {
	const { sumChangedFileDiffStats } = await loadStatsModule();

	assert.deepEqual(
		sumChangedFileDiffStats([
			{ additions: 24, deletions: 2 },
			{ additions: 7, deletions: 2 },
			{ additions: 0, deletions: 1 },
		]),
		{ additions: 31, deletions: 5 },
	);
});

test("sumChangedFileDiffStats returns zeros for an empty file list", async () => {
	const { sumChangedFileDiffStats } = await loadStatsModule();

	assert.deepEqual(sumChangedFileDiffStats([]), { additions: 0, deletions: 0 });
});
