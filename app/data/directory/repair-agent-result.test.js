const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");

const { loadDirectoryModule } = require(path.join(__dirname, "__tests__", "load-directory-module.js"));

/**
 * Unit tests for `repairGeneratedAgentCatalog` — the pure ingest step that
 * repairs a generated agent's catalog references. Config arrays store display
 * NAMES (the form the directory dialogs write and the chip resolver looks up);
 * instruction-body `@[category:id]` tokens stay id-based; the union maps body
 * ids → names. Loaded through the shared esbuild harness (imports real catalogs).
 */
let modulePromise;
function loadRepair() {
	modulePromise ??= loadDirectoryModule(`
		export { repairGeneratedAgentCatalog } from "@/app/data/directory/repair-agent-result";
	`);
	return modulePromise;
}

test("resolves ids to display names and repairs near-misses across all four arrays", async () => {
	const { repairGeneratedAgentCatalog } = await loadRepair();

	const out = repairGeneratedAgentCatalog({
		tools: ["jira", "jira-cloud"], // exact + near-miss → both → "Jira" (de-duped)
		skills: ["review-pull-request"],
		knowledge: ["confluence"], // bare app id fuzzes to the two-segment "all" entry
		subagents: ["rovo-dev"],
	});

	assert.deepEqual(out.tools, ["Jira"]);
	assert.deepEqual(out.skills, ["Review pull request"]);
	assert.deepEqual(out.knowledge, ["Confluence - all content"]);
	assert.deepEqual(out.subagents, ["Rovo Dev"]);
});

test("drops ids with no catalog match", async () => {
	const { repairGeneratedAgentCatalog } = await loadRepair();

	const out = repairGeneratedAgentCatalog({
		tools: ["jira", "totally-made-up-widget-xyz"],
	});

	assert.deepEqual(out.tools, ["Jira"]);
});

test("unions body-referenced lozenge ids (as names) into the matching config array", async () => {
	const { repairGeneratedAgentCatalog } = await loadRepair();

	const out = repairGeneratedAgentCatalog({
		tools: ["jira"],
		instructions: "Use @[tool:github] and @[skill:review-pull-request] to ship.",
	});

	// github (body) unioned with jira (config) as names; skill arrives from the body.
	assert.deepEqual(out.tools, ["Jira", "GitHub"]);
	assert.deepEqual(out.skills, ["Review pull request"]);
	// Tokens stay id-based in the instructions so the editor renders lozenges.
	assert.match(out.instructions, /@\[tool:github\]/u);
	assert.match(out.instructions, /@\[skill:review-pull-request\]/u);
});

test("two-segment knowledge tokens resolve and round-trip", async () => {
	const { repairGeneratedAgentCatalog } = await loadRepair();

	const out = repairGeneratedAgentCatalog({
		knowledge: ["confluence:all"],
		instructions: "Ground answers in @[knowledge:confluence:all].",
	});

	assert.deepEqual(out.knowledge, ["Confluence - all content"]);
	assert.match(out.instructions, /@\[knowledge:confluence:all\]/u);
});

test("de-dupes when a body token repeats a config entry", async () => {
	const { repairGeneratedAgentCatalog } = await loadRepair();

	const out = repairGeneratedAgentCatalog({
		tools: ["jira"],
		instructions: "Always check @[tool:jira] first.",
	});

	assert.deepEqual(out.tools, ["Jira"]);
});

test("repairs a near-miss token id in the instructions body", async () => {
	const { repairGeneratedAgentCatalog } = await loadRepair();

	const out = repairGeneratedAgentCatalog({
		instructions: "Open @[tool:jira-cloud] to triage.",
	});

	// Token rewritten to the resolved id; array gets the resolved name.
	assert.match(out.instructions, /@\[tool:jira\]/u);
	assert.doesNotMatch(out.instructions, /jira-cloud/u);
	assert.deepEqual(out.tools, ["Jira"]);
});

test("leaves a from-scratch result pristine (no empty arrays, no instructions key)", async () => {
	const { repairGeneratedAgentCatalog } = await loadRepair();

	const out = repairGeneratedAgentCatalog({});

	assert.equal("tools" in out, false);
	assert.equal("skills" in out, false);
	assert.equal("knowledge" in out, false);
	assert.equal("subagents" in out, false);
	assert.equal("instructions" in out, false);
});

test("preserves an explicit empty array and empty instructions string", async () => {
	const { repairGeneratedAgentCatalog } = await loadRepair();

	const out = repairGeneratedAgentCatalog({ tools: [], instructions: "" });

	assert.deepEqual(out.tools, []);
	assert.equal(out.instructions, "");
});

test("keeps valid mode values and clears invalid ones", async () => {
	const { repairGeneratedAgentCatalog } = await loadRepair();

	const ok = repairGeneratedAgentCatalog({
		memoryMode: "off",
		reasoningMode: "deep-auto",
		knowledgeMode: "custom",
	});
	assert.equal(ok.memoryMode, "off");
	assert.equal(ok.reasoningMode, "deep-auto");
	assert.equal(ok.knowledgeMode, "custom");

	const bad = repairGeneratedAgentCatalog({
		memoryMode: "sometimes",
		reasoningMode: "ultra",
		knowledgeMode: "everything",
	});
	// Present-but-invalid → emitted as undefined so the caller's spread clears it.
	assert.ok("memoryMode" in bad && bad.memoryMode === undefined);
	assert.ok("reasoningMode" in bad && bad.reasoningMode === undefined);
	assert.ok("knowledgeMode" in bad && bad.knowledgeMode === undefined);

	// Absent modes are not introduced.
	const none = repairGeneratedAgentCatalog({});
	assert.equal("memoryMode" in none, false);
	assert.equal("reasoningMode" in none, false);
	assert.equal("knowledgeMode" in none, false);
});

test("ignores tokens inside fenced/inline code regions", async () => {
	const { repairGeneratedAgentCatalog } = await loadRepair();

	const out = repairGeneratedAgentCatalog({
		instructions: [
			"Use @[tool:jira] for triage.",
			"```",
			"Example syntax: @[tool:github]",
			"```",
			"Inline `@[tool:slack]` is also just an example.",
		].join("\n"),
	});

	// Only the real (non-code) reference is unioned in.
	assert.deepEqual(out.tools, ["Jira"]);
	// Code regions are preserved verbatim (not rewritten, not stripped).
	assert.match(out.instructions, /Example syntax: @\[tool:github\]/u);
	assert.match(out.instructions, /`@\[tool:slack\]`/u);
});

test("caps the union to the backend per-category maximum", async () => {
	const { repairGeneratedAgentCatalog } = await loadRepair();

	const toolIds = [
		"atlassian", "search-jira", "read-confluence", "inspect-goals", "list-teams",
		"google-drive", "github-copilot", "slack", "servicenow", "asana",
		"salesforce", "miro", "sentry", "outlook",
	];
	const out = repairGeneratedAgentCatalog({ tools: toolIds });

	// 14 distinct valid tools → capped at the backend's tools maximum (12).
	assert.equal(out.tools.length, 12);
});

