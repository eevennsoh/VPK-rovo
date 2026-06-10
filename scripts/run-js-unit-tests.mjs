import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

const EXCLUDED_TEST_FILES = new Set([
	// Stale source-extraction coverage for functions no longer in backend/server.js.
	"backend/lib/deferred-clarification-replay.test.js",
]);
const INCLUDED_TEST_PREFIXES = [
	"app/",
	"backend/",
	"lib/",
	"rovo/",
	"scripts/",
];
// Specific component-tree tests gated by CI even though `components/` as a whole
// is not (its 200+ source-assertion tests have drifted and aren't CI-maintained).
// This covers the agent-generation creation-context seam. NOTE: the broader
// `rovo-app-agent-creation-flow.test.js` is deliberately NOT gated — it bundles
// pre-existing source-grep tests (greeting, landing layout) that drift whenever
// main refactors those components; the focused tests here plus the e2e pipeline
// test in `app/data/directory/agent-generation-e2e.test.js` cover this feature.
const INCLUDED_TEST_FILES = new Set([
	"components/projects/studio/lib/studio-agent-creation-context.test.js",
	"components/projects/sidebar-chat/lib/agent-activity-timeline.test.js",
	// Canonical logo usage metadata (1P/2P/3P border treatment) — guards the
	// on-disk 16-borderless.svg <-> logo-usage.json sync. Lives under components/
	// (which is not CI-gated wholesale) so it is included explicitly.
	"components/ui/data/logo-usage.test.js",
	// Scheduled-trigger inference (daily-at-7am + NL → structured definitions).
	// Lives under components/ so it must be included explicitly to run in CI.
	"components/blocks/triggers/data/trigger-inference.test.js",
]);

const gitResult = spawnSync("git", [
	"ls-files",
	"--cached",
	"--others",
	"--exclude-standard",
	"*.test.js",
], {
	encoding: "utf8",
	stdio: ["ignore", "pipe", "inherit"],
});

if (gitResult.status !== 0) {
	process.exit(gitResult.status ?? 1);
}

const testFiles = gitResult.stdout
	.split("\n")
	.map((filePath) => filePath.trim())
	.filter((filePath) => {
		if (!filePath || EXCLUDED_TEST_FILES.has(filePath)) {
			return false;
		}
		const isIncluded =
			INCLUDED_TEST_FILES.has(filePath) ||
			INCLUDED_TEST_PREFIXES.some((prefix) => filePath.startsWith(prefix));
		if (!isIncluded) {
			return false;
		}

		const source = readFileSync(filePath, "utf8");
		return source.includes("node:test");
	});

if (testFiles.length === 0) {
	process.exit(0);
}

for (const testFile of testFiles) {
	const source = readFileSync(testFile, "utf8");
	const nodeArgs = source.includes("vm.SyntheticModule") || source.includes("vm.SourceTextModule")
		? ["--experimental-vm-modules"]
		: [];
	const result = spawnSync(process.execPath, [...nodeArgs, "--test", testFile], {
		stdio: "inherit",
	});

	if (result.status !== 0) {
		process.exit(result.status ?? 1);
	}

	if (result.signal) {
		process.kill(process.pid, result.signal);
	}
}
