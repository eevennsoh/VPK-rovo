const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const SOURCE = fs.readFileSync(path.join(__dirname, "nav-ads.ts"), "utf8");

test("ADS blocks are marked in sidebar nav metadata", () => {
	const blockSlugSet = SOURCE.match(/const ADS_BLOCK_SLUGS = new Set\(\[\n(?<body>[\s\S]*?)\n\]\);/u);

	assert.ok(blockSlugSet, "ADS block slug set should be present");
	assert.match(blockSlugSet.groups.body, /"rovo-canvas"/u);
	assert.match(blockSlugSet.groups.body, /"smart-link"/u);
});
