const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const esbuild = require("esbuild");
const { loadCjsModuleFromText } = require(path.join(process.cwd(), "scripts/lib/esbuild-cjs-loader.js"));

const COLUMN_CHROME_SOURCE = readFileSync(
	path.join(__dirname, "column-chrome.ts"),
	"utf8",
);

async function loadColumnChromeHarness() {
	const result = await esbuild.build({
		stdin: {
			contents: `
				export {
					DEFAULT_KANBAN_COLUMN_CHROME,
					resolveKanbanColumnChrome,
				} from "./components/blocks/jira-kanban/column-chrome";
				export { token } from "./lib/tokens";
			`,
			loader: "ts",
			resolveDir: process.cwd(),
			sourcefile: "column-chrome-harness.ts",
		},
		bundle: true,
		format: "cjs",
		platform: "node",
		tsconfig: path.join(process.cwd(), "tsconfig.json"),
		write: false,
	});

	return loadCjsModuleFromText(result.outputFiles[0].text, "column-chrome-harness.cjs");
}

test("default names bg-surface-sunken and the well tokens", async () => {
	const harness = await loadColumnChromeHarness();
	const chrome = harness.resolveKanbanColumnChrome("default");

	assert.equal(harness.DEFAULT_KANBAN_COLUMN_CHROME, "default");
	assert.equal(chrome.columnClassName, "bg-surface-sunken");
	assert.equal(chrome.cardChrome, "raised");
	assert.equal(chrome.header.paddingTop, harness.token("space.100"));
	assert.equal(chrome.header.paddingInline, harness.token("space.150"));
	assert.equal(chrome.header.paddingBottom, harness.token("space.050"));
	assert.equal(chrome.cardList.paddingTop, harness.token("space.050"));
	assert.equal(chrome.cardList.paddingBottom, harness.token("space.100"));
	assert.equal(chrome.cardList.paddingInline, harness.token("space.050"));
	assert.equal(chrome.cardList.gap, harness.token("space.050"));
	assert.equal(chrome.footer.paddingInline, harness.token("space.050"));
	assert.equal(chrome.resizeButtonClassName, "pt-2 pb-1");
});

test("simple has an empty class and undefined insets", async () => {
	const harness = await loadColumnChromeHarness();
	const chrome = harness.resolveKanbanColumnChrome("simple");

	assert.equal(chrome.columnClassName, "");
	assert.equal(chrome.cardChrome, "stroke");
	assert.equal(chrome.header.paddingTop, undefined);
	assert.equal(chrome.header.paddingInline, undefined);
	assert.equal("paddingBottom" in chrome.header, false);
	assert.equal(chrome.cardList.paddingTop, undefined);
	assert.equal(chrome.cardList.paddingBottom, undefined);
	assert.equal(chrome.cardList.paddingInline, undefined);
	assert.equal("gap" in chrome.cardList, false);
	assert.equal(chrome.footer.paddingInline, undefined);
	assert.equal(chrome.resizeButtonClassName, "");
	assert.equal(Object.hasOwn(chrome.header, "paddingTop"), true);
	assert.notEqual(chrome.header.paddingTop, 0);
	assert.notEqual(chrome.cardList.paddingInline, 0);
});

test("omit and undefined resolve to the default well", async () => {
	const harness = await loadColumnChromeHarness();
	const omitted = harness.resolveKanbanColumnChrome();
	const explicitUndefined = harness.resolveKanbanColumnChrome(undefined);
	const namedDefault = harness.resolveKanbanColumnChrome("default");

	assert.equal(omitted, namedDefault);
	assert.equal(explicitUndefined, namedDefault);
	assert.equal(omitted.columnClassName, "bg-surface-sunken");
	assert.equal(omitted.cardChrome, "raised");
});

test("repeated resolve returns the same frozen object", async () => {
	const harness = await loadColumnChromeHarness();
	const firstDefault = harness.resolveKanbanColumnChrome("default");
	const secondDefault = harness.resolveKanbanColumnChrome("default");
	const firstSimple = harness.resolveKanbanColumnChrome("simple");
	const secondSimple = harness.resolveKanbanColumnChrome("simple");

	assert.equal(firstDefault, secondDefault);
	assert.equal(firstSimple, secondSimple);
	assert.notEqual(firstDefault, firstSimple);
	assert.equal(Object.isFrozen(firstDefault), true);
	assert.equal(Object.isFrozen(firstSimple), true);
});

test("the recipe module does not import design-variants", () => {
	assert.doesNotMatch(COLUMN_CHROME_SOURCE, /design-variants/u);
	assert.doesNotMatch(COLUMN_CHROME_SOURCE, /useDesignVariants/u);
	assert.doesNotMatch(COLUMN_CHROME_SOURCE, /isKanbanColumnChrome/u);
});
