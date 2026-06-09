const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");

const ROOT = join(__dirname, "..", "..", "..");

function readProjectFile(...segments) {
	return readFileSync(join(ROOT, ...segments), "utf8");
}

const COMPONENTS_SOURCE = readProjectFile("app/data/components.ts");
const MANIFEST_SOURCE = readProjectFile("app/data/component-manifest.ts");
const DETAILS_SOURCE = readProjectFile("app/data/details/ui-custom.ts");
const REGISTRY_SOURCE = readProjectFile("components/website/registry.ts");
const DEMO_SOURCE = readProjectFile("components/website/demos/ui-custom/entity-card-demo.tsx");
const COMPONENT_PAGE_SOURCE = readProjectFile("app/components/[category]/[slug]/page.tsx");
const PREVIEW_PAGE_SOURCE = readProjectFile("app/preview/ui-custom/[slug]/page.tsx");

test("Entity Card is the visible ui-custom catalog entry", () => {
	assert.match(COMPONENTS_SOURCE, /customComponent\("entity-card", "Entity Card"\)/u);
	assert.match(MANIFEST_SOURCE, /customComponent\("entity-card", "Entity Card"\)/u);
	assert.doesNotMatch(COMPONENTS_SOURCE, /customComponent\("skill-card", "Skill Card"\)/u);
	assert.doesNotMatch(MANIFEST_SOURCE, /customComponent\("skill-card", "Skill Card"\)/u);
});

test("Entity Card docs and demo use EntityCard instead of the SkillCard shim", () => {
	assert.match(DETAILS_SOURCE, /"entity-card": \{/u);
	assert.match(DETAILS_SOURCE, /from "@\/components\/ui-custom\/entity-card"/u);
	assert.match(DETAILS_SOURCE, /<EntityCard\.Skill/u);
	assert.doesNotMatch(DETAILS_SOURCE, /from "@\/components\/ui-custom\/skill-card"/u);
	assert.match(DEMO_SOURCE, /from "@\/components\/ui-custom\/entity-card"/u);
	assert.match(DEMO_SOURCE, /<EntityCard\.Skill/u);
	assert.doesNotMatch(DEMO_SOURCE, /SkillCard/u);
});

test("legacy skill-card docs and preview URLs redirect to Entity Card", () => {
	assert.match(COMPONENT_PAGE_SOURCE, /slug === "skill-card"[\s\S]*redirect\("\/components\/ui-custom\/entity-card"\)/u);
	assert.match(PREVIEW_PAGE_SOURCE, /slug === "skill-card"[\s\S]*redirect\("\/preview\/ui-custom\/entity-card"\)/u);
	assert.match(REGISTRY_SOURCE, /"entity-card": dynamic\(\(\) => import\("\.\/demos\/ui-custom\/entity-card-demo"\)/u);
	assert.doesNotMatch(REGISTRY_SOURCE, /"skill-card": dynamic/u);
	assert.doesNotMatch(REGISTRY_SOURCE, /"skill-card-demo-/u);
});
