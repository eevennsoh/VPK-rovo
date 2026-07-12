const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { readDetailCategorySource } = require(process.cwd() + "/app/data/details/test-source.cjs");
const { readWebsiteRegistrySource } = require(process.cwd() + "/components/website/registry/test-source.cjs");

function readProjectFile(relativePath) {
	return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

test("HTML Selector is registered as a website block in both catalog files", () => {
	assert.match(
		readProjectFile("app/data/components.ts"),
		/blockComponent\(\s*"html-selector",\s*"HTML Selector"\s*\)/u,
	);
	assert.match(
		readProjectFile("app/data/component-manifest.ts"),
		/blockComponent\(\s*"html-selector",\s*"HTML Selector"\s*\)/u,
	);
});

test("HTML Selector detail is imported and mapped in the blocks details barrel", () => {
	const source = readDetailCategorySource("blocks");
	assert.match(
		source,
		/import\s*\{\s*HTML_SELECTOR_DETAIL\s*\}\s*from\s*"\.\/blocks\/html-selector";/u,
	);
	assert.match(source, /"html-selector"\s*:\s*HTML_SELECTOR_DETAIL\s*,/u);
});

test("HTML Selector demo is registered as an ssr:false dynamic import", () => {
	assert.match(
		readWebsiteRegistrySource(),
		/(?:"html-selector")\s*:\s*dynamic\(\s*\(\)\s*=>\s*import\(\s*"\.\/demos\/blocks\/html-selector-demo"\s*\)\s*,\s*\{\s*ssr\s*:\s*false\s*,?\s*\}\s*\)/u,
	);
});

test("HTML Selector block files exist", () => {
	assert.ok(fs.existsSync(path.join(process.cwd(), "components/blocks/html-selector/index.ts")));
	assert.ok(fs.existsSync(path.join(process.cwd(), "components/blocks/html-selector/page.tsx")));
	assert.ok(fs.existsSync(path.join(process.cwd(), "components/website/demos/blocks/html-selector-demo.tsx")));
	assert.ok(fs.existsSync(path.join(process.cwd(), "app/data/details/blocks/html-selector.ts")));
});

test("HTML Selector uses the vanilla overlay UI instead of parent panels", () => {
	const rootSource = readProjectFile("components/blocks/html-selector/components/html-selector.tsx");
	const bridgeSource = readProjectFile("components/blocks/html-selector/lib/bridge.ts");

	assert.ok(fs.existsSync(path.join(process.cwd(), "public/html-selector/core-ui.js")));
	assert.doesNotMatch(rootSource, /SelectorToolbar|CommentListPanel|CommentPopover|StylesPanel|DispatchStatus/u);
	assert.match(bridgeSource, /HTML_SELECTOR_UI_SCRIPT_ID/u);
	assert.match(
		bridgeSource,
		/HTML_SELECTOR_UTILS_SCRIPT_ID[\s\S]*HTML_SELECTOR_UI_SCRIPT_ID[\s\S]*HTML_SELECTOR_SCRIPT_ID/u,
	);
	for (const fileName of [
		"selector-toolbar.tsx",
		"comment-list-panel.tsx",
		"comment-popover.tsx",
		"styles-panel.tsx",
		"dispatch-status.tsx",
	]) {
		assert.equal(
			fs.existsSync(path.join(process.cwd(), "components/blocks/html-selector/components", fileName)),
			false,
		);
	}
});

test("HTML Selector bridge recomputes stale pins after page-specific pin sync", () => {
	const hookSource = readProjectFile("components/blocks/html-selector/hooks/use-selector-bridge.ts");

	assert.match(hookSource, /function getPinsForPage\(/u);
	assert.match(hookSource, /function getStaleSelectors\(/u);
	assert.match(
		hookSource,
		/const page = resolveIframePage\(iframe\);[\s\S]*const activePagePins = getPinsForPage\(pagePins, page\.pagePath\);[\s\S]*bridge\.setPins\(activePagePins, pinMeta\);[\s\S]*onStaleSelectorsChange\([\s\S]*page\.pagePath,[\s\S]*getStaleSelectors\(bridge, activePagePins\)/u,
	);
});
