#!/usr/bin/env node

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const SKILL_ROOT = path.join(__dirname, "..");

async function loadEvals() {
	return import("./evals.mjs");
}

test("committed vpk-html evaluation corpus is complete and catalog claims are current", async () => {
	const { checkEvaluationSystem } = await loadEvals();
	const result = checkEvaluationSystem();

	assert.equal(result.ok, true, result.issues.join("\n"));
	assert.equal(result.evalCount, 7);
	assert.deepEqual(result.catalogCounts, {
		demos: 105,
		diagrams: 61,
		templates: 33,
	});
});

test("evaluation corpus rejects duplicate ids and incomplete reader jobs", async () => {
	const { validateEvalCorpus } = await loadEvals();
	const fixture = {
		version: 1,
		skill_name: "vpk-html",
		evals: [
			{
				id: 1,
				name: "first",
				category: "brief",
				template: "one-pager.html",
				prompt: "/vpk-html one-pager Create the supplied brief.",
				expected_output: "A single offline HTML brief.",
				files: [],
				viewport: { width: 1280, height: 800 },
				reader_job: { quick_read: "Decide whether to proceed." },
				expectations: ["The output is a single HTML file."],
				human_rubric: ["The decision is obvious."],
			},
			{
				id: 1,
				name: "second",
				category: "brief",
				template: "one-pager.html",
				prompt: "/vpk-html one-pager Create another supplied brief.",
				expected_output: "A single offline HTML brief.",
				files: [],
				viewport: { width: 1280, height: 800 },
				reader_job: {
					quick_read: "Decide whether to proceed.",
					deep_audit: "Verify the evidence.",
				},
				expectations: ["The output is a single HTML file."],
				human_rubric: ["The decision is obvious."],
			},
		],
	};

	const issues = validateEvalCorpus(fixture, { minimumEvalCount: 2, skillRoot: SKILL_ROOT });
	assert.match(issues.join("\n"), /duplicate id 1/);
	assert.match(issues.join("\n"), /reader_job\.deep_audit/);
});

test("catalog documentation check reports stale generated counts", async () => {
	const { validateCatalogSnapshot } = await loadEvals();
	const documents = {
		"README.md": "<!-- vpk-html-catalog-counts: templates=28 diagrams=39 demos=77 -->",
		"llms.txt": "# vpk-html-catalog-counts: templates=28 diagrams=39 demos=77",
	};
	const counts = { templates: 33, diagrams: 61, demos: 105 };

	const issues = validateCatalogSnapshot(documents, counts);
	assert.equal(issues.length, 2);
	assert.match(issues[0], /README\.md/);
	assert.match(issues.join("\n"), /expected templates=33 diagrams=61 demos=105/);
});

test("catalog documentation check catches stale prose even when its snapshot is current", async () => {
	const { validateCatalogClaims } = await loadEvals();
	const documents = {
		"README.md": [
			"<!-- vpk-html-catalog-counts: templates=33 diagrams=61 demos=105 -->",
			"- **28 document templates**",
			"- **61 SVG diagram/chart primitives**",
			"- **105 HTML demos**",
		].join("\n"),
	};

	const issues = validateCatalogClaims(documents, { templates: 33, diagrams: 61, demos: 105 });
	assert.equal(issues.length, 1);
	assert.match(issues[0], /README\.md: documented template count is 28; expected 33/);
});

test("build command exposes the vpk-html evaluation health check", () => {
	const buildSource = fs.readFileSync(path.join(__dirname, "build.mjs"), "utf8");
	const skillSource = fs.readFileSync(path.join(SKILL_ROOT, "SKILL.md"), "utf8");
	const evaluationSource = fs.readFileSync(path.join(SKILL_ROOT, "references", "evaluation.md"), "utf8");

	assert.match(buildSource, /--check-evals/);
	assert.match(skillSource, /references\/evaluation\.md/);
	assert.match(skillSource, /reader's job/i);
	assert.match(evaluationSource, /If no compatible viewer is installed/);
	assert.match(evaluationSource, /review\.md/);
});

test("design-system demo derives catalog metrics instead of hard-coding them", () => {
	const source = fs.readFileSync(path.join(__dirname, "generate-design-pages.mjs"), "utf8");

	assert.match(source, /collectCatalogCounts/);
	assert.doesNotMatch(source, /<strong>105<\/strong>/);
	assert.doesNotMatch(source, /<strong>33<\/strong>/);
});
