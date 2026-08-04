const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");
const { readDetailCategorySource } = require(process.cwd() + "/app/data/details/test-source.cjs");
const { readWebsiteRegistrySource } = require(process.cwd() + "/components/website/registry/test-source.cjs");

const ROOT = join(__dirname, "..", "..");
const SOURCE = readFileSync(join(__dirname, "tabs.tsx"), "utf8");
const DEMO_SOURCE = readFileSync(
	join(ROOT, "components", "website", "demos", "ui", "tabs-demo.tsx"),
	"utf8",
);
const DETAILS_SOURCE = readDetailCategorySource("ui");
const REGISTRY_SOURCE = readWebsiteRegistrySource();

test("TabsList exposes default and compact sizes with inset pill treatment", () => {
	assert.match(SOURCE, /size: \{\s*default: "group-data-horizontal\/tabs:h-8",\s*compact: "group-data-horizontal\/tabs:h-6"/u);
	assert.match(SOURCE, /variant: "default",\s*size: "default",\s*className: "p-\[3px\]"/u);
	assert.match(SOURCE, /variant: "default",\s*size: "compact",\s*className: "p-0\.5"/u);
	assert.match(SOURCE, /data-size=\{size\}/u);
	assert.match(SOURCE, /tabsListVariants\(\{ variant, size \}\)/u);
});

test("Tabs compact size scales trigger padding and un-sized icons", () => {
	assert.match(SOURCE, /group-data-\[size=compact\]\/tabs-list:px-2/u);
	assert.match(SOURCE, /group-data-\[size=compact\]\/tabs-list:\[&_svg:not\(\[class\*='size-'\]\)\]:size-3/u);
});

test("Tabs docs register the compact variant demo", () => {
	assert.match(DEMO_SOURCE, /export function TabsDemoCompact\(\)[\s\S]*<TabsList size="compact">/u);
	assert.match(REGISTRY_SOURCE, /"tabs-demo-compact"[\s\S]*default: mod\.TabsDemoCompact/u);
	assert.match(DETAILS_SOURCE, /title: "Compact"[\s\S]*demoSlug: "tabs-demo-compact"/u);
});
