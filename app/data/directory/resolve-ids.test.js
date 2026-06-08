const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");

const { loadDirectoryModule } = require(path.join(__dirname, "__tests__", "load-directory-module.js"));

/**
 * Unit tests for the pure ingest utilities in `resolve-ids.ts`. The module
 * imports the real `@/app/data/directory` catalogs (tools/skills/knowledge/
 * agents), so it's loaded through the shared esbuild harness rather than
 * `require()`d directly — same pattern as `catalog.test.js`.
 */

let modulePromise;
function loadResolver() {
	modulePromise ??= loadDirectoryModule(`
		export {
			resolveCatalogIds,
			resolveCatalogNames,
			catalogNameForId,
			extractInstructionTokens,
			repairInstructionTokens,
		} from "@/app/data/directory/resolve-ids";
	`);
	return modulePromise;
}

test("resolveCatalogIds keeps exact catalog ids verbatim", async () => {
	const { resolveCatalogIds } = await loadResolver();

	assert.deepEqual(resolveCatalogIds(["jira"], "tool"), ["jira"]);
	assert.deepEqual(resolveCatalogIds(["confluence", "github"], "tool"), ["confluence", "github"]);
	assert.deepEqual(resolveCatalogIds(["review-pull-request"], "skill"), ["review-pull-request"]);
	assert.deepEqual(resolveCatalogIds(["confluence:all"], "knowledge"), ["confluence:all"]);
	assert.deepEqual(resolveCatalogIds(["rovo-dev"], "subagent"), ["rovo-dev"]);
});

test("resolveCatalogIds fuzzy-repairs near-miss tool ids to the nearest catalog id", async () => {
	const { resolveCatalogIds } = await loadResolver();

	// Token-superset: "jira-cloud" → "jira".
	assert.deepEqual(resolveCatalogIds(["jira-cloud"], "tool"), ["jira"]);
	// Normalized-prefix with camelCase suffix: "servicenowITSM" → "servicenow".
	assert.deepEqual(resolveCatalogIds(["servicenowITSM"], "tool"), ["servicenow"]);
	// Case + separator noise only: "Google_Drive" → "google-drive".
	assert.deepEqual(resolveCatalogIds(["Google_Drive"], "tool"), ["google-drive"]);
});

test("resolveCatalogIds fuzzy-repairs near-miss skill ids", async () => {
	const { resolveCatalogIds } = await loadResolver();

	// camelCase variant of "review-pull-request".
	assert.deepEqual(resolveCatalogIds(["reviewPullRequest"], "skill"), ["review-pull-request"]);
	// Separator + case noise on "sprint-planner".
	assert.deepEqual(resolveCatalogIds(["Sprint Planner"], "skill"), ["sprint-planner"]);
});

test("resolveCatalogIds drops ids with no plausible catalog match", async () => {
	const { resolveCatalogIds } = await loadResolver();

	assert.deepEqual(resolveCatalogIds(["totallymadeupwidget"], "tool"), []);
	assert.deepEqual(resolveCatalogIds(["zzzzzzzz"], "skill"), []);
	// Mixed: real + junk → only the real one survives.
	assert.deepEqual(resolveCatalogIds(["jira", "nonsenseplatform9000"], "tool"), ["jira"]);
});

test("resolveCatalogIds de-dupes and preserves first-seen order of resolved ids", async () => {
	const { resolveCatalogIds } = await loadResolver();

	// Exact + a near-miss that repairs to the same id collapse to one entry.
	assert.deepEqual(resolveCatalogIds(["jira", "jira-cloud", "jira"], "tool"), ["jira"]);
	// Order follows first appearance of the resolved id.
	assert.deepEqual(
		resolveCatalogIds(["github", "jira", "github"], "tool"),
		["github", "jira"],
	);
	// Empty / non-string inputs are ignored.
	assert.deepEqual(resolveCatalogIds(["", "jira"], "tool"), ["jira"]);
});

test("extractInstructionTokens returns all valid tokens in document order", async () => {
	const { extractInstructionTokens } = await loadResolver();

	const md = "Use @[tool:jira] then @[skill:review-pull-request] and @[knowledge:confluence], finally @[subagent:rovo-dev].";
	assert.deepEqual(extractInstructionTokens(md), [
		{ category: "tool", id: "jira" },
		{ category: "skill", id: "review-pull-request" },
		{ category: "knowledge", id: "confluence" },
		{ category: "subagent", id: "rovo-dev" },
	]);
});

test("extractInstructionTokens ignores unknown categories and malformed tokens", async () => {
	const { extractInstructionTokens } = await loadResolver();

	const md = "Real @[tool:jira], bogus @[person:alice], not-a-token @tool:slack and @[skill].";
	assert.deepEqual(extractInstructionTokens(md), [{ category: "tool", id: "jira" }]);
	assert.deepEqual(extractInstructionTokens(""), []);
});

test("repairInstructionTokens rewrites near-miss tokens to resolved ids", async () => {
	const { repairInstructionTokens } = await loadResolver();

	const { markdown, resolved } = repairInstructionTokens(
		"Connect @[tool:jira-cloud] and @[tool:servicenowITSM] for the workflow.",
	);
	assert.equal(markdown, "Connect @[tool:jira] and @[tool:servicenow] for the workflow.");
	assert.deepEqual(resolved.tool, ["jira", "servicenow"]);
	assert.deepEqual(resolved.skill, []);
	assert.deepEqual(resolved.knowledge, []);
	assert.deepEqual(resolved.subagent, []);
});

test("repairInstructionTokens replaces dropped tokens with plain de-kebabed text", async () => {
	const { repairInstructionTokens } = await loadResolver();

	const { markdown, resolved } = repairInstructionTokens(
		"Use @[tool:made-up-thing] alongside @[tool:jira].",
	);
	// Dropped token becomes readable prose; real token stays tokenized.
	assert.equal(markdown, "Use Made Up Thing alongside @[tool:jira].");
	assert.deepEqual(resolved.tool, ["jira"]);
});

test("repairInstructionTokens accumulates resolved ids per category, de-duped in first-seen order", async () => {
	const { repairInstructionTokens } = await loadResolver();

	const { markdown, resolved } = repairInstructionTokens(
		[
			"@[tool:jira] and @[tool:jira-cloud] (same tool).",
			"Skills: @[skill:reviewPullRequest], @[skill:sprint-planner].",
			"Knowledge: @[knowledge:confluence]. Agent: @[subagent:code-reviewer].",
		].join("\n"),
	);

	// jira + jira-cloud both resolve to jira → single tokenized id, de-duped.
	// Bare `confluence` fuzzes to the two-segment knowledge id `confluence:all`.
	assert.equal(
		markdown,
		[
			"@[tool:jira] and @[tool:jira] (same tool).",
			"Skills: @[skill:review-pull-request], @[skill:sprint-planner].",
			"Knowledge: @[knowledge:confluence:all]. Agent: @[subagent:code-reviewer].",
		].join("\n"),
	);
	assert.deepEqual(resolved.tool, ["jira"]);
	assert.deepEqual(resolved.skill, ["review-pull-request", "sprint-planner"]);
	assert.deepEqual(resolved.knowledge, ["confluence:all"]);
	assert.deepEqual(resolved.subagent, ["code-reviewer"]);
});

test("resolveCatalogNames returns display names for config arrays", async () => {
	const { resolveCatalogNames } = await loadResolver();

	assert.deepEqual(resolveCatalogNames(["jira", "jira-cloud"], "tool"), ["Jira"]);
	assert.deepEqual(resolveCatalogNames(["review-pull-request"], "skill"), ["Review pull request"]);
	assert.deepEqual(resolveCatalogNames(["confluence:all"], "knowledge"), ["Confluence - all content"]);
	assert.deepEqual(resolveCatalogNames(["rovo-dev"], "subagent"), ["Rovo Dev"]);
	assert.deepEqual(resolveCatalogNames(["totally-made-up-xyz"], "tool"), []);
});

test("repairInstructionTokens leaves non-token prose untouched", async () => {
	const { repairInstructionTokens } = await loadResolver();

	const { markdown, resolved } = repairInstructionTokens("Plain instructions with no tokens at all.");
	assert.equal(markdown, "Plain instructions with no tokens at all.");
	assert.deepEqual(resolved, { tool: [], skill: [], knowledge: [], subagent: [] });
});

test("token extraction/repair ignores tokens inside code regions", async () => {
	const { extractInstructionTokens, repairInstructionTokens } = await loadResolver();

	const md = [
		"Real @[tool:jira].",
		"```",
		"fenced @[tool:github]",
		"```",
		"inline `@[tool:slack]` example.",
	].join("\n");

	// Only the real reference is extracted; code-region tokens are skipped.
	assert.deepEqual(extractInstructionTokens(md), [{ category: "tool", id: "jira" }]);

	const { markdown, resolved } = repairInstructionTokens(md);
	assert.deepEqual(resolved.tool, ["jira"]);
	// Code regions survive verbatim.
	assert.match(markdown, /fenced @\[tool:github\]/u);
	assert.match(markdown, /`@\[tool:slack\]`/u);
});
