const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { readDetailCategorySource } = require(process.cwd() + "/app/data/details/test-source.cjs");
const { readWebsiteRegistrySource } = require(process.cwd() + "/components/website/registry/test-source.cjs");

function readProjectFile(relativePath) {
	return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

test("Gallery is registered as a website block in both catalog files", () => {
	assert.match(
		readProjectFile("app/data/components.ts"),
		/blockComponent\(\s*"gallery",\s*"Gallery"\s*\)/u,
	);
	assert.match(
		readProjectFile("app/data/component-manifest.ts"),
		/blockComponent\(\s*"gallery",\s*"Gallery"\s*\)/u,
	);
});

test("Gallery detail is imported and mapped in the blocks details barrel", () => {
	const source = readDetailCategorySource("blocks");
	assert.match(
		source,
		/import\s*\{\s*GALLERY_DETAIL\s*\}\s*from\s*"\.\/blocks\/gallery";/u,
	);
	assert.match(source, /(?:"gallery"|gallery)\s*:\s*GALLERY_DETAIL\s*,/u);
});

test("Gallery demo is registered as an ssr:false dynamic import", () => {
	assert.match(
		readWebsiteRegistrySource(),
		/(?:"gallery"|gallery)\s*:\s*dynamic\(\s*\(\)\s*=>\s*import\(\s*"\.\/demos\/blocks\/gallery-demo"\s*\)\s*,\s*\{\s*ssr\s*:\s*false\s*,?\s*\}\s*\)/u,
	);
});

test("Gallery animation sources declare an explicit reduced-motion guard", () => {
	assert.match(
		readProjectFile("components/blocks/gallery/components/gallery-track.tsx"),
		/useReducedMotion/u,
	);
	assert.match(
		readProjectFile("components/blocks/gallery/components/gallery-card.tsx"),
		/useReducedMotion/u,
	);
	assert.match(
		readProjectFile("components/blocks/gallery/components/gallery-expanded.tsx"),
		/useReducedMotion/u,
	);
});

test("Gallery uses a shared layoutId for the click-to-expand morph", () => {
	assert.match(
		readProjectFile("components/blocks/gallery/components/gallery-card.tsx"),
		/layoutId/u,
	);
	assert.match(
		readProjectFile("components/blocks/gallery/components/gallery-expanded.tsx"),
		/layoutId/u,
	);
});

test("Gallery suppresses click-to-expand after a drag-to-pan gesture", () => {
	const cardSource = readProjectFile("components/blocks/gallery/components/gallery-card.tsx");
	const dragScrollSource = readProjectFile("components/blocks/gallery/hooks/use-drag-scroll.ts");
	assert.ok(
		/wasDragged/u.test(cardSource) || /wasDragged/u.test(dragScrollSource),
		"wasDragged must be referenced in the card click path (gallery-card.tsx and/or use-drag-scroll.ts)",
	);
});

test("Gallery clears expanded state when the controlled strip closes", () => {
	const source = readProjectFile("components/blocks/gallery/components/gallery.tsx");
	assert.match(source, /useEffect/u);
	assert.match(source, /!isOpen && expandedId !== null/u);
	assert.match(source, /setExpandedId\(null\)/u);
	assert.match(source, /hasExpandedOverlay/u);
});

test("Gallery drag scroll cancels stale pending presses", () => {
	const hookSource = readProjectFile("components/blocks/gallery/hooks/use-drag-scroll.ts");
	const trackSource = readProjectFile("components/blocks/gallery/components/gallery-track.tsx");
	assert.match(hookSource, /event\.buttons & 1/u);
	assert.match(hookSource, /onPointerLeave/u);
	assert.match(hookSource, /onLostPointerCapture/u);
	assert.match(trackSource, /onLostPointerCapture/u);
});

test("Gallery backdrop uses masked surface veils and is pointer-transparent", () => {
	const source = readProjectFile("components/blocks/gallery/components/gallery-backdrop.tsx");
	assert.match(source, /WebkitMaskImage/u);
	assert.doesNotMatch(source, /BackdropFilter/u);
	assert.match(source, /pointer-events-none/u);
});
