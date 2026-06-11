const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

function readProjectFile(relativePath) {
	return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

test("Artifact List is registered as a website block in all four registries", () => {
	assert.match(
		readProjectFile("app/data/components.ts"),
		/blockComponent\("artifact-list", "Artifact List"\)/u,
	);
	assert.match(
		readProjectFile("app/data/component-manifest.ts"),
		/blockComponent\("artifact-list", "Artifact List"\)/u,
	);
	assert.match(
		readProjectFile("app/data/details/blocks.ts"),
		/import \{ ArtifactList \} from "@\/components\/blocks\/artifact-list";/u,
	);
	assert.match(
		readProjectFile("components/website/registry.ts"),
		/"artifact-list": dynamic\(\(\) => import\("\.\/demos\/blocks\/artifact-list-demo"\)/u,
	);
});

test("Artifact List card uses the raised-surface elevation skin from Figma", () => {
	const source = readProjectFile(
		"components/blocks/artifact-list/components/artifact-list.tsx",
	);

	assert.match(source, /overflow-hidden rounded-lg bg-surface-raised/u);
	assert.match(source, /boxShadow: token\("elevation\.shadow\.raised"\)/u);
});

test("Artifact List rows are 64px, hover to surface-hovered, and the last row is borderless", () => {
	const source = readProjectFile(
		"components/blocks/artifact-list/components/artifact-list.tsx",
	);

	assert.match(source, /flex h-16 items-center gap-3 px-3 transition-colors hover:bg-surface-hovered/u);
	// Every row except the last draws a bottom border.
	assert.match(source, /!isLast && "border-b border-border"/u);
	assert.match(source, /isLast=\{index === items\.length - 1\}/u);
});

test("Artifact List leading visual is a neutral tile at the ADS tile radius", () => {
	const source = readProjectFile(
		"components/blocks/artifact-list/components/artifact-list.tsx",
	);

	assert.match(source, /<Tile[\s\S]*variant="neutral"[\s\S]*size="medium"[\s\S]*className="rounded-tile"/u);
	// Logo path renders inset on the same tile; icon is the fallback.
	assert.match(source, /item\.logoSrc \?[\s\S]*<img[\s\S]*src=\{item\.logoSrc\}[\s\S]*\) : \([\s\S]*item\.icon/u);
});

test("Artifact List metadata renders source • owner with the subtlest dot", () => {
	const source = readProjectFile(
		"components/blocks/artifact-list/components/artifact-list.tsx",
	);

	assert.match(source, /<span className="text-text-subtle">\{item\.source\}<\/span>/u);
	assert.match(source, /<span className="text-text-subtlest">•<\/span>/u);
	assert.match(source, /<span className="truncate text-text-subtle">\{item\.owner\}<\/span>/u);
});

test("Artifact List Open button is hover/focus-revealed and stays keyboard-reachable", () => {
	const source = readProjectFile(
		"components/blocks/artifact-list/components/artifact-list.tsx",
	);
	const primitive = readProjectFile("components/ui-custom/hover-reveal-row.tsx");

	// The row opts into the reveal group and renders the button through the
	// reveal-actions overlay (a real, focusable Button — never inert/hidden).
	assert.match(source, /hoverRevealRowClassName/u);
	assert.match(source, /<HoverRevealActions[\s\S]*action=\{[\s\S]*<Button variant="outline" size="default" type="button" onClick=\{\(\) => onOpen\?\.\(item\)\}/u);
	assert.doesNotMatch(source, /\binert\b/u);
	// The primitive reveals on keyboard focus, not hover alone, so the button is
	// reachable for keyboard users.
	assert.match(primitive, /group-has-\[:focus-visible\]\/hover-reveal-row:opacity-100/u);
});

test("Artifact List docs demo renders the sample items card", () => {
	const page = readProjectFile("components/blocks/artifact-list/page.tsx");
	const demo = readProjectFile("components/website/demos/blocks/artifact-list-demo.tsx");

	assert.match(page, /import \{ ArtifactList \} from "@\/components\/blocks\/artifact-list";/u);
	assert.match(page, /items=\{SAMPLE_ARTIFACT_ITEMS\}/u);
	assert.match(demo, /import ArtifactListPage from "@\/components\/blocks\/artifact-list\/page";/u);
});
