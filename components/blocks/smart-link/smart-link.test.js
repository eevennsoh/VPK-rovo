const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const DIR = __dirname;
const COMPONENT_SOURCE = fs.readFileSync(path.join(DIR, "components", "smart-link.tsx"), "utf8");
const DATA_SOURCE = fs.readFileSync(path.join(DIR, "data", "demo-smart-links.tsx"), "utf8");
const PAGE_SOURCE = fs.readFileSync(path.join(DIR, "page.tsx"), "utf8");
const INDEX_SOURCE = fs.readFileSync(path.join(DIR, "index.ts"), "utf8");
const COMPONENTS_SOURCE = fs.readFileSync(path.join(process.cwd(), "app", "data", "components.ts"), "utf8");
const COMPONENT_MANIFEST_SOURCE = fs.readFileSync(path.join(process.cwd(), "app", "data", "component-manifest.ts"), "utf8");
const NAV_ADS_SOURCE = fs.readFileSync(path.join(process.cwd(), "app", "data", "nav-ads.ts"), "utf8");
const BLOCK_DETAILS_SOURCE = fs.readFileSync(path.join(process.cwd(), "app", "data", "details", "blocks.ts"), "utf8");
const REGISTRY_SOURCE = fs.readFileSync(path.join(process.cwd(), "components", "website", "registry.ts"), "utf8");

test("SmartLink is powered by the shared HoverCard primitive", () => {
	assert.match(COMPONENT_SOURCE, /HoverCard, HoverCardContent, HoverCardTrigger/u);
	assert.match(COMPONENT_SOURCE, /<HoverCard[\s\S]*openDelay=\{openDelay\}/u);
	assert.match(COMPONENT_SOURCE, /<HoverCardTrigger render=\{<SmartLinkTrigger/u);
	assert.match(COMPONENT_SOURCE, /<HoverCardContent[\s\S]*<SmartLinkCard/u);
});

test("SmartLink exports the public component and type API", () => {
	for (const source of [PAGE_SOURCE, INDEX_SOURCE]) {
		assert.match(source, /SmartLinkCard/u);
		assert.match(source, /SmartLinkAction/u);
		assert.match(source, /SmartLinkItem/u);
		assert.match(source, /SmartLinkProps/u);
		assert.match(source, /SmartLinkVariant/u);
	}
});

test("demo data covers every required production variant", () => {
	for (const variant of ["confluence", "jira", "team", "goal", "loom", "article", "file", "generic"]) {
		assert.match(DATA_SOURCE, new RegExp(`variant: "${variant}"`, "u"));
	}

	assert.match(DATA_SOURCE, /SMART_LINK_VARIANT_EXAMPLES/u);
	assert.match(DATA_SOURCE, /Existing-assets-only/u);
});

test("catalog details and registry expose smart-link demos", () => {
	assert.match(COMPONENTS_SOURCE, /blockComponent\("smart-link", "Smart Link"\)/u);
	assert.match(COMPONENT_MANIFEST_SOURCE, /blockComponent\("smart-link", "Smart Link"\)/u);
	assert.match(NAV_ADS_SOURCE, /"smart-link"/u);
	assert.match(BLOCK_DETAILS_SOURCE, /"smart-link": \{/u);
	assert.match(BLOCK_DETAILS_SOURCE, /smart-link-demo-rich/u);
	assert.match(BLOCK_DETAILS_SOURCE, /smart-link-demo-article/u);
	assert.match(BLOCK_DETAILS_SOURCE, /smart-link-demo-team/u);
	assert.match(BLOCK_DETAILS_SOURCE, /smart-link-demo-goal/u);
	assert.match(BLOCK_DETAILS_SOURCE, /smart-link-demo-loom/u);
	assert.match(BLOCK_DETAILS_SOURCE, /smart-link-demo-generic/u);
	assert.match(REGISTRY_SOURCE, /"smart-link": dynamic\(\(\) => import\("\.\/demos\/blocks\/smart-link-demo"\)/u);

	for (const exportName of [
		"SmartLinkDemoRich",
		"SmartLinkDemoArticle",
		"SmartLinkDemoTeam",
		"SmartLinkDemoGoal",
		"SmartLinkDemoLoom",
		"SmartLinkDemoGeneric",
	]) {
		assert.match(REGISTRY_SOURCE, new RegExp(exportName, "u"));
	}
});

test("SmartLink implementation uses semantic tokens instead of raw ds variable utilities", () => {
	for (const source of [COMPONENT_SOURCE, PAGE_SOURCE]) {
		assert.doesNotMatch(source, /(?:bg|text)-\[var\(--ds-/u);
	}
});
