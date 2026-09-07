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

const FOOTER = readFileSync(join(__dirname, "create-work-item-drop-zone.tsx"), "utf8");
const DROPZONE = readFileSync(
	join(__dirname, "../../../jira-dropzone/jira-dropzone.tsx"),
	"utf8",
);

test("create button and dropzone share dashed well chrome", () => {
	assert.match(
		FOOTER,
		/const CREATE_WORK_ITEM_WELL_CHROME_CLASS = "rounded-lg border border-dashed";/u,
	);
	assert.match(
		DROPZONE,
		/export const JIRA_DROPZONE_WELL_CHROME_CLASS = "rounded-lg border border-dashed";/u,
	);
	assert.match(
		FOOTER,
		/<Button[\s\S]*aria-label=\{`Create in \$\{title\}`\}[\s\S]*CREATE_WORK_ITEM_WELL_CHROME_CLASS/u,
	);
	assert.match(
		DROPZONE,
		/className=\{cn\([\s\S]*JIRA_DROPZONE_WELL_CHROME_CLASS[\s\S]*selected[\s\S]*\? "border-border-selected bg-bg-selected text-text-selected"[\s\S]*: "border-border bg-surface text-text-subtlest"/u,
	);
});

test("create button rests icon-subtlest and solidifies on hover", () => {
	assert.match(
		FOOTER,
		/<Button[\s\S]*aria-label=\{`Create in \$\{title\}`\}[\s\S]*\[&_\[data-slot=icon\]\]:text-icon-subtlest \[&_svg\]:text-icon-subtlest/u,
	);
	assert.match(
		FOOTER,
		/<Button[\s\S]*aria-label=\{`Create in \$\{title\}`\}[\s\S]*hover:border-solid hover:\[&_\[data-slot=icon\]\]:text-icon-subtle hover:\[&_svg\]:text-icon-subtle/u,
	);
});
