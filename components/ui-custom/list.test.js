const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");

const SOURCE = readFileSync(join(__dirname, "list.tsx"), "utf8");
const STUDIO_TABLE_SOURCE = readFileSync(
	join(
		__dirname,
		"..",
		"projects",
		"studio",
		"components",
		"rovo-app-custom-agents-table.tsx",
	),
	"utf8",
);

test("List is a presentational compound: Root section, Heading h2, Table colgroup+body", () => {
	// Compound namespace mirrors the skill-card pattern.
	assert.match(
		SOURCE,
		/export const List = \{[\s\S]*Root: ListRoot,[\s\S]*Heading: ListHeading,[\s\S]*Table: ListTable,[\s\S]*\} as const/,
	);
	// Root renders a <section> and forwards props (so aria-labelledby passes through).
	assert.match(SOURCE, /function ListRoot\(\{ className, \.\.\.props \}[\s\S]*<section/);
	assert.match(SOURCE, /flex w-full flex-col gap-2/);
	// Heading renders an <h2> with the studio section-label classes.
	assert.match(SOURCE, /function ListHeading\([\s\S]*<h2/);
	assert.match(SOURCE, /px-1\.5 text-xs font-semibold leading-4 text-text-subtlest/);
	// Table renders one <col> per column inside a Table + TableBody.
	assert.match(
		SOURCE,
		/columns\.map\(\(column, columnIndex\) => \([\s\S]*<col key=\{columnIndex\} className=\{column\.className\} \/>/,
	);
	assert.match(SOURCE, /<TableBody>\{children\}<\/TableBody>/);
	assert.match(SOURCE, /min-w-full table-fixed/);
});

test("List stays presentational: no studio/state logic leaks in", () => {
	assert.doesNotMatch(SOURCE, /localStorage|pinned|useState|useEffect/i);
});

test("Studio agents table composes List with the five-column layout", () => {
	assert.match(STUDIO_TABLE_SOURCE, /import \{ List, type ListColumn \} from "@\/components\/ui-custom\/list"/);
	assert.match(
		STUDIO_TABLE_SOURCE,
		/STUDIO_CUSTOM_AGENTS_LIST_COLUMNS: readonly ListColumn\[\] = \[\s*\{\},\s*\{ className: "w-\[92px\]" \},\s*\{ className: "w-\[72px\]" \},\s*\{ className: "w-\[116px\]" \},\s*\{ className: "w-\[72px\]" \},\s*\]/,
	);
	assert.match(
		STUDIO_TABLE_SOURCE,
		/<List\.Root aria-labelledby="studio-custom-agents-heading"[\s\S]*<List\.Heading id="studio-custom-agents-heading">[\s\S]*<List\.Table columns=\{STUDIO_CUSTOM_AGENTS_LIST_COLUMNS\}>/,
	);
	// Studio retains its own state logic rather than pushing it into ui-custom.
	assert.match(STUDIO_TABLE_SOURCE, /writePinnedAgentIds/);
});
