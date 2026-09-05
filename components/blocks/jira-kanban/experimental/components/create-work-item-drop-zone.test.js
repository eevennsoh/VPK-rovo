/**
 * Create-well chrome source contracts.
 *
 * Split out of `jira-golden-journeys-v4.test.js` so that suite stays under the
 * 1000-line file-size budget. These assertions belong with the drop-zone owner,
 * not the v4 page harness.
 */

const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");

const SOURCE = readFileSync(join(__dirname, "create-work-item-drop-zone.tsx"), "utf8");

test("create button and dropzone share dashed well chrome", () => {
	assert.match(
		SOURCE,
		/const CREATE_WORK_ITEM_WELL_CHROME_CLASS = "rounded-lg border border-dashed";/u,
	);
	assert.match(
		SOURCE,
		/<Button[\s\S]*aria-label=\{`Create in \$\{title\}`\}[\s\S]*CREATE_WORK_ITEM_WELL_CHROME_CLASS/u,
	);
	assert.match(
		SOURCE,
		/className=\{cn\([\s\S]*CREATE_WORK_ITEM_WELL_CHROME_CLASS[\s\S]*armed \? "border-border-selected bg-bg-selected text-text-selected" : "border-border bg-surface text-text-subtlest"/u,
	);
});

test("create button rests icon-subtlest and solidifies on hover", () => {
	assert.match(
		SOURCE,
		/<Button[\s\S]*aria-label=\{`Create in \$\{title\}`\}[\s\S]*\[&_\[data-slot=icon\]\]:text-icon-subtlest \[&_svg\]:text-icon-subtlest/u,
	);
	assert.match(
		SOURCE,
		/<Button[\s\S]*aria-label=\{`Create in \$\{title\}`\}[\s\S]*hover:border-solid hover:\[&_\[data-slot=icon\]\]:text-icon-subtle hover:\[&_svg\]:text-icon-subtle/u,
	);
});
