const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const esbuild = require("esbuild");
const { loadCjsModuleFromText } = require(path.join(process.cwd(), "scripts/lib/esbuild-cjs-loader.js"));

let autocomplete;

const skill = (id, label, description = "") => ({
	category: "skill",
	description,
	id: `skill:${id}`,
	label,
});
const tool = (id, label, description = "") => ({
	category: "tool",
	description,
	id: `tool:${id}`,
	label,
});

const sources = {
	skill: [
		skill("generate-diagram", "Generate diagram", "Create professional diagrams"),
		skill("create-work-item", "Create work item", "Create Jira issues"),
		skill("summarize", "Summarize", "Condense content"),
	],
	tool: [
		tool("google-docs", "Create Google Doc", "Draft a new document"),
		tool("gmail", "Send email", "Send a Gmail message"),
	],
};

test.before(async () => {
	const result = await esbuild.build({
		entryPoints: [path.join(process.cwd(), "lib/directory-autocomplete.ts")],
		bundle: true,
		format: "cjs",
		platform: "node",
		write: false,
	});
	autocomplete = loadCjsModuleFromText(result.outputFiles[0].text, "directory-autocomplete.cjs");
});

test("filters skills and tools with a two-character minimum", () => {
	assert.deepEqual(autocomplete.getDirectoryAutocompleteMatches("g", sources), []);

	const matches = autocomplete.getDirectoryAutocompleteMatches("ge", sources);
	assert.equal(matches[0].mention.label, "Generate diagram");
	assert.ok(matches.every((match) => match.mention.category === "skill" || match.mention.category === "tool"));
});

test("suppresses explicit slash and at commands", () => {
	assert.deepEqual(autocomplete.getDirectoryAutocompleteMatches("/ge", sources), []);
	assert.deepEqual(autocomplete.getDirectoryAutocompleteMatches("@ge", sources), []);
});

test("ranks prefix, word-boundary, then substring matches with catalog order as tie-breaker", () => {
	const matches = autocomplete.getDirectoryAutocompleteMatches("create", sources);

	assert.deepEqual(
		matches.slice(0, 2).map((match) => match.mention.label),
		["Create work item", "Create Google Doc"],
	);
	assert.equal(matches.at(-1).mention.label, "Generate diagram");
});

test("caps visible matches at nine", () => {
	const manySources = {
		skill: Array.from({ length: 12 }, (_, index) => skill(`send-${index}`, `Send ${index}`)),
		tool: [],
	};
	assert.equal(autocomplete.getDirectoryAutocompleteMatches("send", manySources).length, 9);
});

test("ghost text is prefix-only while visible matches can come from descriptions", () => {
	const state = autocomplete.getDirectoryAutocompleteState({
		cursorPosition: "diagram".length,
		sources,
		textBeforeCursor: "diagram",
	});

	assert.equal(state.matches[0].mention.label, "Generate diagram");
	assert.equal(state.ghostText, "");
});

test("detects a matching trailing phrase and preserves the absolute replacement range", () => {
	const text = "please create g";
	const state = autocomplete.getDirectoryAutocompleteState({
		cursorPosition: text.length,
		sources,
		textBeforeCursor: text,
	});

	assert.equal(state.query, "create g");
	assert.equal(state.queryFrom, "please ".length);
	assert.equal(state.queryTo, text.length);
	assert.equal(state.ghostText, "oogle Doc");
	assert.equal(state.matches[0].mention.label, "Create Google Doc");
});

test("returns no-match state for eligible unmatched trailing words", () => {
	const text = "please zzz";
	const state = autocomplete.getDirectoryAutocompleteState({
		cursorPosition: text.length,
		sources,
		textBeforeCursor: text,
	});

	assert.equal(state.query, "zzz");
	assert.deepEqual(state.matches, []);
	assert.equal(state.ghostText, "");
});
