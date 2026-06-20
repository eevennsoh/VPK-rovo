const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const UTILS_SOURCE = fs.readFileSync(
	path.join(process.cwd(), "components/ui-custom/twg-loader/utils.ts"),
	"utf8",
);

test("TWG loader dot colors are stable SVG attributes during hydration", () => {
	assert.match(UTILS_SOURCE, /const DOT_COLORS = \[/u);
	assert.match(UTILS_SOURCE, /"var\(--ds-icon-accent-orange, #FCA700\)"/u);
	assert.match(UTILS_SOURCE, /"var\(--ds-icon-accent-lime, #6A9A23\)"/u);
	assert.match(UTILS_SOURCE, /"var\(--ds-icon-accent-blue, #1868DB\)"/u);
	assert.match(UTILS_SOURCE, /"var\(--ds-icon-accent-purple, #AF59E0\)"/u);
	assert.match(
		UTILS_SOURCE,
		/export function getDotColors\(\): readonly string\[\] \{\s+return DOT_COLORS;\s+\}/u,
	);
	assert.doesNotMatch(UTILS_SOURCE, /getComputedStyle|document\.documentElement|typeof window/u);
});
