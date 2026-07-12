const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");
const esbuild = require("esbuild");

const { loadCjsModuleFromText } = require(
	path.join(process.cwd(), "scripts", "lib", "esbuild-cjs-loader.js"),
);

let modulePromise;
function loadComposer() {
	modulePromise ??= esbuild
		.build({
			entryPoints: [path.join(process.cwd(), "components/blocks/html-selector/lib/prompt-composer.ts")],
			bundle: true,
			format: "cjs",
			platform: "node",
			tsconfig: path.join(process.cwd(), "tsconfig.json"),
			write: false,
		})
		.then((result) => loadCjsModuleFromText(result.outputFiles[0].text));
	return modulePromise;
}

function createPin(overrides = {}) {
	return {
		id: "pin-1",
		pagePath: "index.html",
		diskPath: ".agents/skills/vpk-html/index.html",
		selector: "main:nth-of-type(1) > h1:nth-of-type(1)",
		outerHtmlSnippet: "<h1>Inspectable plain HTML</h1>",
		tagSummary: "h1",
		comment: "Make the heading less loud.",
		scope: "element",
		createdAt: "2026-07-11T00:00:00.000Z",
		...overrides,
	};
}

test("composeHtmlSelectorPrompt returns an empty string without pins", async () => {
	const { composeHtmlSelectorPrompt } = await loadComposer();

	assert.equal(composeHtmlSelectorPrompt([]), "");
});

test("composeHtmlSelectorPrompt includes architecture preamble and per-pin fields", async () => {
	const { composeHtmlSelectorPrompt } = await loadComposer();
	const prompt = composeHtmlSelectorPrompt([createPin()]);

	assert.match(prompt, /source pages live under \.agents\/skills\/vpk-html\//u);
	assert.match(prompt, /served at \/api\/vpk-html\/<path>/u);
	assert.match(prompt, /- file: \.agents\/skills\/vpk-html\/index\.html/u);
	assert.match(prompt, /- page: \/api\/vpk-html\/index\.html/u);
	assert.match(prompt, /- selector: main:nth-of-type\(1\) > h1:nth-of-type\(1\)/u);
	assert.match(prompt, /- outerHTML: <h1>Inspectable plain HTML<\/h1>/u);
	assert.match(prompt, /#1: "Make the heading less loud\."/u);
});

test("composeHtmlSelectorPrompt switches scope instructions", async () => {
	const { composeHtmlSelectorPrompt } = await loadComposer();
	const elementPrompt = composeHtmlSelectorPrompt([createPin({ scope: "element" })]);
	const everywherePrompt = composeHtmlSelectorPrompt([createPin({ scope: "everywhere" })]);

	assert.match(elementPrompt, /make page-local edits after the vpk-shared:end sentinel/u);
	assert.match(everywherePrompt, /edit \.agents\/skills\/vpk-html\/references\/tokens\.json/u);
	assert.match(everywherePrompt, /node scripts\/build\.mjs --write-styles/u);
});

test("composeHtmlSelectorPrompt omits file line for srcDoc pins", async () => {
	const { composeHtmlSelectorPrompt } = await loadComposer();
	const prompt = composeHtmlSelectorPrompt([createPin({
		diskPath: undefined,
		pagePath: "srcdoc",
	})]);

	assert.doesNotMatch(prompt, /- file:/u);
	assert.match(prompt, /- page: srcdoc/u);
});

test("composeHtmlSelectorPrompt includes recorded style edits", async () => {
	const { composeHtmlSelectorPrompt } = await loadComposer();
	const prompt = composeHtmlSelectorPrompt([createPin({
		styleEdits: [
			{ property: "padding-x", previousValue: "12px", nextValue: "16px" },
			{ property: "text color", previousValue: "rgb(23, 43, 77)", nextValue: "#172b4d" },
		],
	})]);

	assert.match(prompt, /- style change: padding-x 12px -> 16px/u);
	assert.match(prompt, /- style change: text color rgb\(23, 43, 77\) -> #172b4d/u);
});
