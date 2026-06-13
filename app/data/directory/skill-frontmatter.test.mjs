import assert from "node:assert/strict";
import { test } from "node:test";

import {
	frontmatterValueToList,
	frontmatterValueToString,
	getFrontmatterField,
	parseFrontmatterYaml,
	parseSkillMd,
	serializeFrontmatterYaml,
	serializeSkillMd,
	setFrontmatterField,
} from "./skill-frontmatter.ts";

test("parses scalar + block-list frontmatter into ordered entries", () => {
	const entries = parseFrontmatterYaml(
		["name: design-landing-page", "description: Build pages.", "allowed-tools:", "  - Jira", "  - Confluence"].join("\n"),
	);
	assert.deepEqual(entries, [
		{ key: "name", value: "design-landing-page" },
		{ key: "description", value: "Build pages." },
		{ key: "allowed-tools", value: ["Jira", "Confluence"] },
	]);
});

test("parses a flow list", () => {
	const entries = parseFrontmatterYaml("allowed-tools: [Jira, Confluence, Slack]");
	assert.deepEqual(getFrontmatterField(entries, "allowed-tools"), ["Jira", "Confluence", "Slack"]);
});

test("quotes + round-trips a scalar containing a colon", () => {
	const entries = [
		{ key: "name", value: "note-taker" },
		{ key: "description", value: "Summarize this: decisions and owners." },
	];
	const yaml = serializeFrontmatterYaml(entries);
	assert.match(yaml, /description: "Summarize this: decisions and owners\."/u);
	assert.deepEqual(parseFrontmatterYaml(yaml), entries);
});

test("parseSkillMd splits frontmatter and body; missing fence → body only", () => {
	const text = "---\nname: x\ndescription: y\n---\n\n# Heading\n\nBody text.";
	const { frontmatter, body } = parseSkillMd(text);
	assert.equal(getFrontmatterField(frontmatter, "name"), "x");
	assert.equal(body, "# Heading\n\nBody text.");

	const noFence = parseSkillMd("# Just a body");
	assert.deepEqual(noFence.frontmatter, []);
	assert.equal(noFence.body, "# Just a body");
});

test("serializeSkillMd → parseSkillMd round-trips frontmatter + body", () => {
	const frontmatter = [
		{ key: "name", value: "sprint-planner" },
		{ key: "description", value: "Break an epic into sprint-ready work items with estimates and owners." },
		{ key: "allowed-tools", value: ["Jira", "Confluence"] },
		{ key: "license", value: "Apache-2.0" },
		{ key: "version", value: "1.4.0" },
	];
	const body = "# Sprint planner\n\n## When to use\n\nUse when planning a sprint.";
	const text = serializeSkillMd(frontmatter, body);
	const parsed = parseSkillMd(text);
	assert.deepEqual(parsed.frontmatter, frontmatter);
	assert.equal(parsed.body, body);
	// Stable on a second pass.
	assert.equal(serializeSkillMd(parsed.frontmatter, parsed.body), text);
});

test("setFrontmatterField replaces in place and appends new keys", () => {
	const base = [
		{ key: "name", value: "x" },
		{ key: "description", value: "old" },
	];
	const replaced = setFrontmatterField(base, "description", "new");
	assert.deepEqual(replaced, [
		{ key: "name", value: "x" },
		{ key: "description", value: "new" },
	]);
	const appended = setFrontmatterField(base, "license", "MIT");
	assert.equal(getFrontmatterField(appended, "license"), "MIT");
	assert.equal(appended.length, 3);
});

test("value coercion helpers", () => {
	assert.equal(frontmatterValueToString(["a", "b"]), "a, b");
	assert.equal(frontmatterValueToString("solo"), "solo");
	assert.equal(frontmatterValueToString(undefined), "");
	assert.deepEqual(frontmatterValueToList("solo"), ["solo"]);
	assert.deepEqual(frontmatterValueToList(["a", "b"]), ["a", "b"]);
	assert.deepEqual(frontmatterValueToList(""), []);
});

test("multi-line scalar (e.g. a wrapped description) survives the round-trip", () => {
	const entries = [
		{ key: "name", value: "note-taker" },
		{ key: "description", value: "Summarize the thread.\nList owners and dates." },
	];
	const yaml = serializeFrontmatterYaml(entries);
	// Multi-line value is JSON-quoted onto one line (not emitted as an unindented
	// block that the parser would drop).
	assert.match(yaml, /description: "Summarize the thread\.\\nList owners and dates\."/u);
	assert.deepEqual(parseFrontmatterYaml(yaml), entries);
});

test("graceful passthrough: an unknown nested block preserves its value through the round-trip", () => {
	const yaml = ["name: x", "metadata:", "  version: 1.2.0", "  author: maia"].join("\n");
	const entries = parseFrontmatterYaml(yaml);
	assert.equal(getFrontmatterField(entries, "name"), "x");
	// The nested block is captured as a multi-line scalar; re-parsing the
	// serialized form yields the same entries (value-preserving, not byte-verbatim).
	assert.deepEqual(parseFrontmatterYaml(serializeFrontmatterYaml(entries)), entries);
});
