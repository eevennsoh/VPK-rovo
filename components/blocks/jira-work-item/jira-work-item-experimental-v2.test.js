const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

// Contract tests for the `experimental-v2` fork of the Jira Work Item surface.
//
// v2 was created as a full copy of `experimental/` so it can diverge on any
// pixel without risk to v1. These tests protect the two properties that make
// that fork safe rather than merely duplicated:
//
//   1. Isolation — neither tree imports the other, so an edit in one can never
//      change the other's rendered surface.
//   2. A shared model — the session/planner reducer under `data/` stays single-
//      sourced, so behavioral fixes reach both variants.
//
// As v2 diverges, the "starts as a duplicate" assertion below is expected to be
// relaxed; isolation and the shared model are the durable contracts.

const BLOCK_DIR = __dirname;
const V1_DIR = path.join(BLOCK_DIR, "experimental");
const V2_DIR = path.join(BLOCK_DIR, "experimental-v2");

function readBlockFile(relativePath) {
	return fs.readFileSync(path.join(BLOCK_DIR, relativePath), "utf8");
}

/** Repo-relative paths of every `.ts`/`.tsx`/`.js` file under `dir`, recursively. */
function listSourceFiles(dir) {
	return fs
		.readdirSync(dir, { recursive: true, withFileTypes: true })
		.filter((entry) => entry.isFile() && /\.(?:tsx?|js)$/u.test(entry.name))
		.map((entry) => path.join(entry.parentPath ?? entry.path, entry.name));
}

test("experimental v2 exists with a distinctly named composition root", () => {
	assert.ok(fs.existsSync(V2_DIR));

	const compositionSource = readBlockFile("experimental-v2/experimental-v2-jira-work-item.tsx");
	assert.match(compositionSource, /export function ExperimentalV2JiraWorkItem\(/u);
	assert.match(compositionSource, /export default ExperimentalV2JiraWorkItem;/u);
	assert.match(compositionSource, /export type ExperimentalV2JiraWorkItemProps/u);
	// The v1 root filename must not linger in v2 — both roots are imported side
	// by side by the block index, so their names have to stay distinct.
	assert.equal(fs.existsSync(path.join(V2_DIR, "experimental-jira-work-item.tsx")), false);
});

test("experimental v2 and v1 are mutually isolated", () => {
	for (const filePath of listSourceFiles(V2_DIR)) {
		assert.doesNotMatch(
			fs.readFileSync(filePath, "utf8"),
			/jira-work-item\/experimental\//u,
			`${path.relative(BLOCK_DIR, filePath)} still imports from the v1 experimental tree`,
		);
	}

	for (const filePath of listSourceFiles(V1_DIR)) {
		assert.doesNotMatch(
			fs.readFileSync(filePath, "utf8"),
			/experimental-v2/u,
			`${path.relative(BLOCK_DIR, filePath)} leaks a v2 reference into the v1 tree`,
		);
	}
});

test("experimental v2 starts as a structural duplicate of v1", () => {
	const v1Files = listSourceFiles(V1_DIR)
		.map((filePath) => path.relative(V1_DIR, filePath))
		.filter((relativePath) => relativePath !== "experimental-jira-work-item.tsx")
		.sort();
	const v2Files = listSourceFiles(V2_DIR)
		.map((filePath) => path.relative(V2_DIR, filePath))
		.filter((relativePath) => relativePath !== "experimental-v2-jira-work-item.tsx")
		.sort();

	assert.deepEqual(v2Files, v1Files);

	// Every shared file differs from its v1 twin only in the rewritten import path.
	for (const relativePath of v2Files) {
		const v1Source = fs.readFileSync(path.join(V1_DIR, relativePath), "utf8");
		const v2Source = fs.readFileSync(path.join(V2_DIR, relativePath), "utf8");
		const normalizedV2 = v2Source
			.replaceAll("jira-work-item/experimental-v2/", "jira-work-item/experimental/")
			.replaceAll("jira-activity-adapter-v2-harness.cjs", "jira-activity-adapter-harness.cjs");
		assert.equal(normalizedV2, v1Source, `${relativePath} has diverged from its v1 twin`);
	}
});

test("experimental v2 shares the session/planner data layer with v1", () => {
	assert.match(
		readBlockFile("experimental-v2/experimental-v2-jira-work-item.tsx"),
		/@\/components\/blocks\/jira-work-item\/data\/session-state/u,
	);
	assert.match(
		readBlockFile("experimental-v2/use-jira-work-item-controller.ts"),
		/@\/components\/blocks\/jira-work-item\/data\/session-state/u,
	);
	// No forked copy of the model lives under v2.
	assert.equal(fs.existsSync(path.join(V2_DIR, "data")), false);
});

test("the block index resolves both experimental surfaces from one map", () => {
	const indexSource = readBlockFile("index.tsx");

	assert.match(indexSource, /export type JiraWorkItemVariant = "default" \| "experimental" \| "experimental-v2";/u);
	assert.match(
		indexSource,
		/const EXPERIMENTAL_SURFACES = \{\s*experimental: ExperimentalJiraWorkItem,\s*"experimental-v2": ExperimentalV2JiraWorkItem,\s*\} as const;/u,
	);
	assert.match(indexSource, /type ExperimentalVariant = keyof typeof EXPERIMENTAL_SURFACES;/u);
	assert.match(indexSource, /const ExperimentalSurface = EXPERIMENTAL_SURFACES\[surface\];/u);
	// One shared view owns the open/close plumbing for every experimental variant.
	assert.equal((indexSource.match(/function JiraWorkItemExperimentalView/gu) ?? []).length, 1);
});
