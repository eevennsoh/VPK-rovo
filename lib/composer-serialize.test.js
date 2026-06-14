const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const esbuild = require("esbuild");
const { Schema } = require("@tiptap/pm/model");
const { loadCjsModuleFromText } = require(path.join(process.cwd(), "scripts/lib/esbuild-cjs-loader.js"));

// lib/composer-serialize.ts is pure (only `import type` from tiptap), so it
// bundles to plain CJS with no mocks. We exercise it against REAL ProseMirror
// nodes built from a schema that mirrors the mentions-only composer document
// (doc > paragraph > text|hardBreak|mention), the same shape composer-extensions
// defines.

let serialize;
let schema;

test.before(async () => {
	const result = await esbuild.build({
		entryPoints: [path.join(process.cwd(), "lib/composer-serialize.ts")],
		bundle: true,
		format: "cjs",
		platform: "node",
		write: false,
	});
	serialize = loadCjsModuleFromText(result.outputFiles[0].text, "composer-serialize.cjs");

	schema = new Schema({
		nodes: {
			doc: { content: "block+" },
			paragraph: { group: "block", content: "inline*" },
			text: { group: "inline" },
			hardBreak: { group: "inline", inline: true },
			mention: {
				group: "inline",
				inline: true,
				atom: true,
				attrs: { category: { default: null }, label: { default: null }, id: { default: null } },
			},
		},
	});
});

// --- node builders ---
const mention = (attrs) => schema.nodes.mention.create(attrs);
const br = () => schema.nodes.hardBreak.create();
const para = (...inline) => schema.nodes.paragraph.create(null, inline);
const doc = (...blocks) => schema.nodes.doc.create(null, blocks);

test("plain text serializes verbatim", () => {
	assert.equal(serialize.serializeComposerNode(doc(para(schema.text("hello world")))), "hello world");
});

test("paragraph boundaries and hard breaks both become newlines", () => {
	assert.equal(
		serialize.serializeComposerNode(doc(para(schema.text("a")), para(schema.text("b")))),
		"a\nb",
	);
	assert.equal(
		serialize.serializeComposerNode(doc(para(schema.text("line1"), br(), schema.text("line2")))),
		"line1\nline2",
	);
});

test("@-surface categories (human, team, subagent) serialize with the @ sigil", () => {
	assert.equal(
		serialize.serializeComposerNode(doc(para(mention({ category: "human", label: "Andrea Wilson", id: "u-1" })))),
		"@Andrea Wilson",
	);
	assert.equal(
		serialize.serializeComposerNode(doc(para(mention({ category: "team", label: "Growth", id: "t-1" })))),
		"@Growth",
	);
	assert.equal(
		serialize.serializeComposerNode(doc(para(mention({ category: "subagent", label: "Code reviewer", id: "subagent-1" })))),
		"@Code reviewer",
	);
});

test("/-surface categories (skill, tool, knowledge, app) serialize with the / sigil", () => {
	const cases = [
		["skill", "Summarize"],
		["tool", "Jira"],
		["knowledge", "Confluence"],
		["app", "Slack"],
	];
	for (const [category, label] of cases) {
		assert.equal(
			serialize.serializeComposerNode(doc(para(mention({ category, label, id: `${category}-1` })))),
			`/${label}`,
			`${category} should use the / sigil`,
		);
	}
});

test("a null/missing category defaults to the @ sigil; any other category string is a / reference", () => {
	// No category info at all -> neutral "@" mention.
	assert.equal(
		serialize.serializeComposerNode(doc(para(mention({ category: null, label: "Mystery", id: "x" })))),
		"@Mystery",
	);
	// Only human/team are "@"; every other (incl. a hypothetical future) category
	// is treated as a "/" reference, matching getMentionSigil's intent.
	assert.equal(
		serialize.serializeComposerNode(doc(para(mention({ category: "future-thing", label: "New", id: "y" })))),
		"/New",
	);
});

test("a mention with no usable label falls back to its id", () => {
	assert.equal(
		serialize.serializeComposerNode(doc(para(mention({ category: "skill", label: "   ", id: "build-report" })))),
		"/build-report",
	);
});

test("a trailing empty paragraph (the caret line) does not leak a newline", () => {
	assert.equal(serialize.serializeComposerNode(doc(para(schema.text("done")), para())), "done");
});

test("intentional trailing spaces on the last line are preserved (only blank lines are trimmed)", () => {
	// A trailing space the user typed must survive serialization...
	assert.equal(serialize.serializeComposerNode(doc(para(schema.text("hello ")))), "hello ");
	// ...while a trailing empty caret paragraph is still dropped, even after a
	// line that itself ends in a space.
	assert.equal(
		serialize.serializeComposerNode(doc(para(schema.text("hello ")), para())),
		"hello ",
	);
});

test("text and mentions interleave in document order", () => {
	const node = doc(
		para(
			schema.text("Hey "),
			mention({ category: "human", label: "Andrea", id: "u-1" }),
			schema.text(", please run "),
			mention({ category: "skill", label: "Summarize", id: "s-1" }),
			schema.text(" on this"),
		),
	);
	assert.equal(serialize.serializeComposerNode(node), "Hey @Andrea, please run /Summarize on this");
});

test("buildComposerDocJSON maps lines to paragraphs (blank lines -> empty paragraphs) with no mention nodes", () => {
	const json = serialize.buildComposerDocJSON("a\n\nb");
	assert.equal(json.type, "doc");
	assert.equal(json.content.length, 3);
	assert.deepEqual(json.content[0], { type: "paragraph", content: [{ type: "text", text: "a" }] });
	assert.deepEqual(json.content[1], { type: "paragraph" }); // blank line -> empty paragraph
	assert.deepEqual(json.content[2], { type: "paragraph", content: [{ type: "text", text: "b" }] });
	// Plain text never resurrects tokens: no mention nodes anywhere.
	const serialized = JSON.stringify(json);
	assert.ok(!serialized.includes('"mention"'), "buildComposerDocJSON must not produce mention nodes");
});

test("plain text round-trips through buildComposerDocJSON + serialize (sigil chars stay literal text)", () => {
	for (const text of ["hello", "a\nb", "first line\nsecond line", "email me @ 5pm or use / for help", "x\n\ny"]) {
		const node = schema.nodeFromJSON(serialize.buildComposerDocJSON(text));
		assert.equal(serialize.serializeComposerNode(node), text, `round-trip failed for: ${JSON.stringify(text)}`);
	}
});
