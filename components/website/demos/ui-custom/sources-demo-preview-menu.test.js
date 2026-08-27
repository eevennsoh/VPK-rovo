const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");

const DEMO_SOURCE = readFileSync(join(__dirname, "sources-demo-preview-menu.tsx"), "utf8");

test("preview-menu demo reuses the shared SourcesPreviewMenu owner", () => {
	assert.match(
		DEMO_SOURCE,
		/import \{\s*SOURCES_PREVIEW_PAGES,\s*SourcesPreviewMenu,\s*\} from "@\/components\/ui-custom\/sources-preview-menu";/u,
	);
	assert.match(DEMO_SOURCE, /<SourcesPreviewMenu/u);
	assert.match(DEMO_SOURCE, /pages=\{SOURCES_PREVIEW_PAGES\}/u);
	assert.match(
		DEMO_SOURCE,
		/<p className="font-medium">Used \{SOURCES_PREVIEW_PAGES\.length\} sources<\/p>/u,
	);
	assert.doesNotMatch(DEMO_SOURCE, /function SourcePreviewCard/u);
	assert.doesNotMatch(DEMO_SOURCE, /Open preview modal/u);
});
