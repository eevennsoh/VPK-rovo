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
const app = (id, label, description = "") => ({
	category: "app",
	description,
	id: `app:${id}`,
	label,
});
const human = (id, label, description = "") => ({
	category: "human",
	description,
	id: `human:${id}`,
	label,
});
const team = (id, label, description = "") => ({
	category: "team",
	description,
	id: `team:${id}`,
	label,
});
const subagent = (id, label, description = "") => ({
	category: "subagent",
	description,
	id: `subagent:${id}`,
	label,
});
const sources = {
	app: [
		app("jira", "Jira"),
		app("confluence", "Confluence"),
	],
	human: [
		human("andrea", "Andrea Wilson"),
	],
	skill: [
		skill("generate-diagram", "Generate diagram", "Create professional diagrams"),
		skill("create-work-item", "Create work item", "Create Jira issues"),
		skill("summarize", "Summarize", "Condense content"),
	],
	subagent: [
		subagent("code-reviewer", "Code reviewer"),
	],
	team: [
		team("growth", "Growth"),
	],
	tool: [
		tool("google-docs", "Create Google Doc", "Draft a new document"),
		tool("gmail", "Send email", "Send a Gmail message"),
	],
};

const exactSources = {
	app: [
		app("jira", "Jira", "Track work"),
	],
	human: [
		human("andrea", "Andrea Wilson", "Designer"),
	],
	skill: [
		skill("generate-diagram", "Generate diagram", "Create professional diagrams"),
		skill("create-work-item", "Create work item", "Create Jira issues"),
		skill("ai", "AI", "Too short to auto-tag"),
	],
	subagent: [
		subagent("code-reviewer", "Code reviewer", "Review implementation changes"),
	],
	team: [
		team("growth", "Growth Team", "Growth team"),
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

test("caps visible matches at nine by default", () => {
	const manySources = {
		skill: Array.from({ length: 12 }, (_, index) => skill(`send-${index}`, `Send ${index}`)),
		tool: [],
	};
	assert.equal(autocomplete.getDirectoryAutocompleteMatches("send", manySources).length, 9);
});

test("supports an explicit eight-match cap for balanced two-column layouts", () => {
	const manySources = {
		skill: Array.from({ length: 12 }, (_, index) => skill(`send-${index}`, `Send ${index}`)),
		tool: [],
	};
	assert.equal(autocomplete.getDirectoryAutocompleteMatches("send", manySources, 8).length, 8);
	assert.equal(
		autocomplete.getDirectoryAutocompleteState({
			cursorPosition: "send".length,
			limit: 8,
			sources: manySources,
			textBeforeCursor: "send",
		}).matches.length,
		8,
	);
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

test("suppresses the ghost hint once whitespace separates the caret from the matched word", () => {
	const text = "please create g ";
	const state = autocomplete.getDirectoryAutocompleteState({
		cursorPosition: text.length,
		sources,
		textBeforeCursor: text,
	});

	// Matches still surface for the dropdown / multi-word typing...
	assert.equal(state.matches[0].mention.label, "Create Google Doc");
	// ...but the inline hint is cleared so it can't slide past the space.
	assert.equal(state.ghostText, "");
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

test("exact label auto-tagging matches repeated bounded skill and tool labels case-insensitively", () => {
	const text = 'Generate diagram, "create google doc" (Generate diagram)/done';
	const matches = autocomplete.getDirectoryAutocompleteExactLabelMatches({
		sources: exactSources,
		text,
	});

	assert.deepEqual(
		matches.map((match) => [match.label, match.mention.label, match.trigger, text.slice(match.from, match.to)]),
		[
			["Generate diagram", "Generate diagram", "plain", "Generate diagram"],
			["Create Google Doc", "Create Google Doc", "plain", "create google doc"],
			["Generate diagram", "Generate diagram", "plain", "Generate diagram"],
		],
	);
});

test("exact label auto-tagging rejects short labels and partial-word matches", () => {
	const text = "PreGenerate diagram Generate diagrams /Send email @Send email AI";
	const matches = autocomplete.getDirectoryAutocompleteExactLabelMatches({
		sources: exactSources,
		text,
	});

	assert.deepEqual(matches, []);
});

test("exact label auto-tagging scopes slash and at-prefixed labels to their palette sources", () => {
	const text = "/Generate diagram, /Jira, /Send email, @Andrea Wilson, @Growth Team, @Code reviewer, @Create Google Doc";
	const matches = autocomplete.getDirectoryAutocompleteExactLabelMatches({
		sources: exactSources,
		text,
	});

	assert.deepEqual(
		matches.map((match) => [match.label, match.trigger, text.slice(match.from, match.to), text.slice(match.traceFrom, match.traceTo)]),
		[
			["Generate diagram", "slash", "/Generate diagram", "Generate diagram"],
			["Jira", "slash", "/Jira", "Jira"],
			["Andrea Wilson", "mention", "@Andrea Wilson", "Andrea Wilson"],
			["Growth Team", "mention", "@Growth Team", "Growth Team"],
			["Code reviewer", "mention", "@Code reviewer", "Code reviewer"],
		],
	);
});

test("exact label auto-tagging keeps the longest non-overlapping match with source order as tie-breaker", () => {
	const matchingSources = {
		skill: [
			skill("build", "Build"),
			skill("build-report", "Build report"),
			skill("deploy-skill", "Deploy"),
		],
		tool: [
			tool("build-report-tool", "Build report"),
			tool("deploy-tool", "Deploy"),
		],
	};
	const text = "Build report then Deploy";
	const matches = autocomplete.getDirectoryAutocompleteExactLabelMatches({
		sources: matchingSources,
		text,
	});

	assert.deepEqual(
		matches.map((match) => [match.label, match.mention.id]),
		[
			["Build report", "skill:build-report"],
			["Deploy", "skill:deploy-skill"],
		],
	);
});

test("exact label matching finds unprefixed app, skill, and tool labels with canonical casing", () => {
	const matches = autocomplete.getDirectoryAutocompleteExactLabelMatches({
		sources,
		text: "please use jira, create work item, then CREATE GOOGLE DOC.",
	});

	assert.deepEqual(
		matches.map((match) => [match.from, match.to, match.traceFrom, match.traceTo, match.label, match.mention.category, match.trigger]),
		[
			[11, 15, 11, 15, "Jira", "app", "plain"],
			[17, 33, 17, 33, "Create work item", "skill", "plain"],
			[40, 57, 40, 57, "Create Google Doc", "tool", "plain"],
		],
	);
});

test("exact label matching consumes slash prefixes for skills and apps only", () => {
	const matches = autocomplete.getDirectoryAutocompleteExactLabelMatches({
		sources,
		text: "Use /Create work item, /Jira, and /Create Google Doc.",
	});

	assert.deepEqual(
		matches.map((match) => [match.from, match.to, match.traceFrom, match.traceTo, match.label, match.mention.category, match.trigger]),
		[
			[4, 21, 5, 21, "Create work item", "skill", "slash"],
			[23, 28, 24, 28, "Jira", "app", "slash"],
		],
	);
});

test("exact label matching consumes at prefixes for people, teams, and subagents", () => {
	const matches = autocomplete.getDirectoryAutocompleteExactLabelMatches({
		sources,
		text: "Ask @Andrea Wilson, @Growth, and @Code reviewer.",
	});

	assert.deepEqual(
		matches.map((match) => [match.from, match.to, match.traceFrom, match.traceTo, match.label, match.mention.category, match.trigger]),
		[
			[4, 18, 5, 18, "Andrea Wilson", "human", "mention"],
			[20, 27, 21, 27, "Growth", "team", "mention"],
			[33, 47, 34, 47, "Code reviewer", "subagent", "mention"],
		],
	);
});

test("exact label matching respects boundaries and converts repeated occurrences", () => {
	const matches = autocomplete.getDirectoryAutocompleteExactLabelMatches({
		sources,
		text: "xCreate work item Create work item (Create work item) Create work items",
	});

	assert.deepEqual(
		matches.map((match) => [match.from, match.to, match.label]),
		[
			[18, 34, "Create work item"],
			[36, 52, "Create work item"],
		],
	);
});

test("exact label matching prefers the longest non-overlapping label", () => {
	const matches = autocomplete.getDirectoryAutocompleteExactLabelMatches({
		sources: {
			skill: [
				skill("create", "Create"),
				skill("create-work-item", "Create work item"),
			],
		},
		text: "Create work item",
	});

	assert.deepEqual(
		matches.map((match) => match.label),
		["Create work item"],
	);
});

test("exact label matching can suppress trailing shorter labels while a longer label is still being typed", () => {
	const matchingSources = {
		app: [
			app("jira", "Jira"),
			app("jira-service-management", "Jira Service Management"),
		],
		skill: [
			skill("create", "Create"),
			skill("create-work-item", "Create work item"),
		],
	};

	assert.deepEqual(
		autocomplete.getDirectoryAutocompleteExactLabelMatches({
			sources: matchingSources,
			suppressTrailingPrefixMatches: true,
			text: "Create ",
		}),
		[],
	);
	assert.deepEqual(
		autocomplete.getDirectoryAutocompleteExactLabelMatches({
			sources: matchingSources,
			text: "Create ",
		}).map((match) => match.label),
		["Create"],
	);
	assert.deepEqual(
		autocomplete.getDirectoryAutocompleteExactLabelMatches({
			sources: matchingSources,
			suppressTrailingPrefixMatches: true,
			text: "Create,",
		}).map((match) => match.label),
		["Create"],
	);
	assert.deepEqual(
		autocomplete.getDirectoryAutocompleteExactLabelMatches({
			sources: matchingSources,
			suppressTrailingPrefixMatches: true,
			text: "Create then",
		}).map((match) => match.label),
		["Create"],
	);
	assert.deepEqual(
		autocomplete.getDirectoryAutocompleteExactLabelMatches({
			sources: matchingSources,
			suppressTrailingPrefixMatches: true,
			text: "/Jira ",
		}).map((match) => [match.label, match.trigger]),
		[["Jira", "slash"]],
	);
});

test("exact label matching skips labels shorter than three characters", () => {
	const shortSources = {
		skill: [
			skill("ai", "AI"),
			skill("ask", "Ask"),
		],
	};
	const matches = autocomplete.getDirectoryAutocompleteExactLabelMatches({
		sources: shortSources,
		text: "AI Ask",
	});

	assert.deepEqual(
		matches.map((match) => match.label),
		["Ask"],
	);
});
