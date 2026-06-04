const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");

const SOURCE = readFileSync(join(__dirname, "list.tsx"), "utf8");

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

test("List is registered in the component catalog and demo registry", () => {
	const manifest = readFileSync(
		join(__dirname, "..", "..", "app", "data", "component-manifest.ts"),
		"utf8",
	);
	const components = readFileSync(
		join(__dirname, "..", "..", "app", "data", "components.ts"),
		"utf8",
	);
	const registry = readFileSync(
		join(__dirname, "..", "..", "components", "website", "registry.ts"),
		"utf8",
	);
	// Catalog/nav (manifest) and detail page (components) both expose the slug.
	assert.match(manifest, /customComponent\("list"\)/);
	assert.match(components, /customComponent\("list"\)/);
	// A live demo is registered so the docs page renders a preview.
	assert.match(registry, /list: dynamic\(\(\) => import\("\.\/demos\/ui-custom\/list-demo"\)/);
});
