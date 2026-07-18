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

test("getVpkHtmlOutputSlug derives stable artifact folders", async () => {
	const { getVpkHtmlOutputSlug } = await loadComposer();

	assert.equal(getVpkHtmlOutputSlug("assets/demos/demo-design-system.html"), "demo-design-system");
	assert.equal(getVpkHtmlOutputSlug("index.html"), "index");
	assert.equal(getVpkHtmlOutputSlug("assets/demos/Annual Report.html"), "annual-report");
});

test("composeVpkHtmlVideoPrompt includes skills, absolute artifact path, notes, sound, and artifact folder", async () => {
	const { composeVpkHtmlVideoPrompt } = await loadComposer();
	const prompt = composeVpkHtmlVideoPrompt({
		artifactAbsolutePath: "/repo/.agents/skills/vpk-html/assets/demos/demo-design-system.html",
		narration: { source: "notes", content: "Explain the token shifts." },
		pagePath: "assets/demos/demo-design-system.html",
		sound: { source: "description", content: "quiet mechanical pulse" },
	});

	assert.match(prompt, /Load and follow the repo-local vpk-html skill and the hyperframes skill/u);
	assert.match(prompt, /Artifact absolute path: \/repo\/\.agents\/skills\/vpk-html\/assets\/demos\/demo-design-system\.html/u);
	assert.match(prompt, /Write all generated video project files[\s\S]*under artifacts\/vpk-html\/demo-design-system\//u);
	assert.match(prompt, /Narration source: speaker notes/u);
	assert.match(prompt, /Explain the token shifts\./u);
	assert.match(prompt, /Background sound: generate or source audio from this description: quiet mechanical pulse\./u);
});

test("composeVpkHtmlVideoPrompt supports inline scripts and path-based sound", async () => {
	const { composeVpkHtmlVideoPrompt } = await loadComposer();
	const prompt = composeVpkHtmlVideoPrompt({
		artifactAbsolutePath: "/repo/.agents/skills/vpk-html/index.html",
		narration: { source: "script", content: "Open on the catalog." },
		outputSlug: "catalog-video",
		pagePath: "index.html",
		sound: { source: "path", content: "audio/bed.wav" },
	});

	assert.match(prompt, /Narration source: inline script/u);
	assert.match(prompt, /Open on the catalog\./u);
	assert.match(prompt, /Background sound: use this local file path if it exists: audio\/bed\.wav\./u);
	assert.match(prompt, /artifacts\/vpk-html\/catalog-video\//u);
});
