const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

function readProjectFile(relativePath) {
	return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

test("Artifact List is registered as a UI Custom component in all four registries", () => {
	assert.match(
		readProjectFile("app/data/components.ts"),
		/customComponent\("artifact-list", "Artifact List"\)/u,
	);
	assert.match(
		readProjectFile("app/data/component-manifest.ts"),
		/customComponent\("artifact-list", "Artifact List"\)/u,
	);
	assert.match(
		readProjectFile("app/data/details/ui-custom.ts"),
		/import \{ ArtifactList \} from "@\/components\/ui-custom\/artifact-list";/u,
	);
	assert.match(
		readProjectFile("components/website/registry.ts"),
		/"artifact-list": dynamic\(\(\) => import\("\.\/demos\/ui-custom\/artifact-list-demo"\)/u,
	);
});

test("Artifact List card uses the raised-surface elevation skin from Figma", () => {
	const source = readProjectFile(
		"components/ui-custom/artifact-list/components/artifact-list.tsx",
	);

	assert.match(source, /overflow-hidden rounded-lg bg-surface-raised/u);
	assert.match(source, /boxShadow: token\("elevation\.shadow\.raised"\)/u);
});

test("Artifact List rows are at least 64px, hover to surface-hovered, and the last row is borderless", () => {
	const source = readProjectFile(
		"components/ui-custom/artifact-list/components/artifact-list.tsx",
	);

	assert.match(source, /flex min-h-16 items-center gap-3 px-3 py-2 transition-colors hover:bg-surface-hovered/u);
	// Every row except the last draws a bottom border.
	assert.match(source, /!isLast && "border-b border-border"/u);
	assert.match(source, /isLast=\{index === items\.length - 1\}/u);
});

test("Artifact List leading visual uses the ADS tile radius and neutral inset-image rows", () => {
	const source = readProjectFile(
		"components/ui-custom/artifact-list/components/artifact-list.tsx",
	);

	assert.match(source, /const usesInsetImage = Boolean\(item\.avatarSrc \|\| item\.logoSrc\);/u);
	assert.match(source, /variant=\{usesInsetImage \? "neutral" : item\.tileVariant \?\? "neutral"\}/u);
	assert.match(source, /size="medium"[\s\S]*className=\{cn\([\s\S]*"rounded-tile"/u);
	// Avatar/logo paths render inset on the same tile; icon is the fallback.
	assert.match(source, /if \(item\.avatarSrc\)[\s\S]*<AgentAvatarVisual[\s\S]*avatarSrc=\{item\.avatarSrc\}/u);
	assert.match(source, /if \(item\.logoSrc\)[\s\S]*<img[\s\S]*src=\{item\.logoSrc\}/u);
	assert.match(source, /return item\.icon;/u);
});

test("Artifact List metadata renders source • owner with the subtlest dot", () => {
	const source = readProjectFile(
		"components/ui-custom/artifact-list/components/artifact-list.tsx",
	);

	assert.match(source, /<span className="shrink-0 text-text-subtle">\{item\.source\}<\/span>/u);
	assert.match(source, /<span className="shrink-0 text-text-subtlest">•<\/span>/u);
	// Owner is the truncating element; min-w-0 lets the flex child shrink below content.
	assert.match(source, /<span className="min-w-0 truncate text-text-subtle">\{item\.owner\}<\/span>/u);
});

test("Artifact List Open button is hover/focus-revealed and stays keyboard-reachable", () => {
	const source = readProjectFile(
		"components/ui-custom/artifact-list/components/artifact-list.tsx",
	);
	const primitive = readProjectFile("components/ui-custom/hover-reveal-row.tsx");

	// The row opts into the reveal group and renders the button through the
	// reveal-actions overlay (a real, focusable Button — never inert/hidden).
	assert.match(source, /hoverRevealRowClassName/u);
	assert.match(source, /<HoverRevealActions[\s\S]*action=\{[\s\S]*<Button[\s\S]*className="whitespace-nowrap"[\s\S]*variant="outline"[\s\S]*size="default"[\s\S]*type="button"[\s\S]*event\.stopPropagation\(\);[\s\S]*handleOpen\(\);/u);
	assert.match(source, /openOnRowClick\?: boolean;/u);
	assert.doesNotMatch(source, /\binert\b/u);
	// The primitive reveals on keyboard focus, not hover alone, so the button is
	// reachable for keyboard users.
	assert.match(primitive, /group-has-\[:focus-visible\]\/hover-reveal-row:opacity-100/u);
});

test("Artifact List reserves room for the Open action at compact widths", () => {
	const source = readProjectFile(
		"components/ui-custom/artifact-list/components/artifact-list.tsx",
	);

	assert.match(source, /className="min-w-0 flex-1 pr-\[92px\] transition-\[padding\] duration-normal ease-out"/u);
	assert.doesNotMatch(source, /group-hover\/hover-reveal-row:pr-\[72px\]/u);
});

test("Artifact List docs demo renders the sample items card", () => {
	const page = readProjectFile("components/ui-custom/artifact-list/page.tsx");
	const demo = readProjectFile("components/website/demos/ui-custom/artifact-list-demo.tsx");

	assert.match(page, /import \{ ArtifactList \} from "@\/components\/ui-custom\/artifact-list";/u);
	assert.match(page, /items=\{SAMPLE_ARTIFACT_ITEMS\}/u);
	assert.match(demo, /import ArtifactListPage from "@\/components\/ui-custom\/artifact-list\/page";/u);
});
