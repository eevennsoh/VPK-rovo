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
		readProjectFile("components/blocks/gallery/components/gallery-selected-stage.tsx"),
		/useReducedMotion/u,
	);
	assert.match(
		readProjectFile("components/blocks/gallery/components/gallery-selected-surface.tsx"),
		/useReducedMotion/u,
	);
});

test("Gallery is now an in-page selector instead of a lightbox morph", () => {
	const gallerySource = readProjectFile("components/blocks/gallery/components/gallery.tsx");
	assert.match(gallerySource, /selectedId\?: string;/u);
	assert.match(gallerySource, /defaultSelectedId\?: string;/u);
	assert.match(gallerySource, /onSelectedChange\?: \(selectedId: string\) => void;/u);
	assert.match(gallerySource, /renderSelectedItem\?: \(item: GalleryItem\) => ReactNode;/u);
	assert.match(gallerySource, /GallerySelectedStage/u);
	assert.match(gallerySource, /scrollIntoView/u);
	assert.doesNotMatch(gallerySource, /GalleryExpanded/u);
	assert.doesNotMatch(gallerySource, /expandedId/u);
	assert.equal(
		fs.existsSync(
			path.join(process.cwd(), "components/blocks/gallery/components/gallery-expanded.tsx"),
		),
		false,
	);
});

test("Gallery cards remain mounted toggle buttons with origin-aware selection state", () => {
	const source = readProjectFile("components/blocks/gallery/components/gallery-card.tsx");
	assert.match(source, /aria-pressed/u);
	assert.match(source, /getGallerySelectionOriginFromPoint/u);
	assert.match(source, /DEFAULT_GALLERY_SELECTION_ORIGIN/u);
});

test("Gallery centers the card strip by default without breaking overflow reachability", () => {
	const source = readProjectFile("components/blocks/gallery/components/gallery-track.tsx");
	assert.match(source, /justify-center-safe/u);
	assert.match(source, /overflow-x-auto/u);
});

test("Gallery suppresses click-to-expand after a drag-to-pan gesture", () => {
	const cardSource = readProjectFile("components/blocks/gallery/components/gallery-card.tsx");
	const dragScrollSource = readProjectFile("components/blocks/gallery/hooks/use-drag-scroll.ts");
	assert.ok(
		/wasDragged/u.test(cardSource) || /wasDragged/u.test(dragScrollSource),
		"wasDragged must be referenced in the card click path (gallery-card.tsx and/or use-drag-scroll.ts)",
	);
});

test("Gallery selected surface preserves the organic ink-bloom contract", () => {
	const source = readProjectFile("components/blocks/gallery/components/gallery-selected-surface.tsx");
	assert.match(source, /const ENTER_EASE = \[0\.45, 0, 0\.55, 1\] as const;/u);
	assert.match(source, /const EXIT_EASE = \[0, 0\.4, 0, 1\] as const;/u);
	assert.match(source, /const DUR_ENTER = 1\.4;/u);
	assert.match(source, /const inkMaskSeed = seed \+ visual\.key \* 7919;/u);
	assert.match(
		source,
		/useMemo\(\(\) => createInkMaskImage\(inkMaskSeed\), \[inkMaskSeed\]\)/u,
	);
	assert.match(source, /feTurbulence/u);
	assert.match(source, /feDisplacementMap/u);
	assert.match(source, /feGaussianBlur/u);
	assert.match(source, /const originX = \(width \* visual\.origin\.xPercent\) \/ 100;/u);
	assert.match(source, /const originY = \(height \* visual\.origin\.yPercent\) \/ 100;/u);
	assert.match(source, /return `\$\{originX - offset\}px \$\{originY - offset\}px`;/u);
	assert.match(source, /const targetRadius = isExitPhase \? 0 : revealRadius;/u);
	assert.match(source, /if \(shouldReduceMotion\) \{\s*radius\.set\(targetRadius\);/u);
	assert.match(source, /MASK_FEATHER_PX/u);
	assert.match(source, /maskPosition,/u);
	assert.match(source, /maskSize,/u);
	assert.match(source, /maskImage: inkMaskImage/u);
	assert.equal((source.match(/\bmaskImage:/gu) ?? []).length, 1);
	assert.match(source, /maskMode: "alpha"/u);
	assert.match(source, /BLUE_PALETTE/u);
	assert.match(source, /LiquidGradient/u);
	assert.match(source, /highlightTextRef/u);
	assert.match(source, /text-text-inverse/u);
});

test("Gallery keeps the WebGL shader timeline continuous during selection exit", () => {
	const source = readProjectFile("components/blocks/gallery/components/gallery-selected-surface.tsx");
	const gallerySource = readProjectFile("components/blocks/gallery/components/gallery.tsx");
	const selectionSource = readProjectFile("components/blocks/gallery/lib/gallery-selection.ts");
	assert.doesNotMatch(source, /speed=\{visual\.phase/u);
	assert.match(source, /speed=\{0\.18\}/u);
	assert.doesNotMatch(source, /colors=\{\[\.\.\.BLUE_PALETTE\]\}/u);
	assert.match(source, /colors=\{BLUE_PALETTE\}/u);
	assert.doesNotMatch(source, /const DUR_EXIT = 0\.1/u);
	assert.match(selectionSource, /GALLERY_SELECTION_SHADER_EXIT_SECONDS = 0\.6;/u);
	assert.match(
		selectionSource,
		/GALLERY_SELECTION_SHADER_EXIT_OVERLAP_MS =\s*GALLERY_SELECTION_SHADER_EXIT_SECONDS \* 1000 \+ 40;/u,
	);
	assert.match(source, /GALLERY_SELECTION_SHADER_EXIT_SECONDS/u);
	assert.match(gallerySource, /GALLERY_SELECTION_SHADER_EXIT_OVERLAP_MS/u);
	assert.doesNotMatch(gallerySource, /EXIT_OVERLAP_MS = 140/u);
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

test("Gallery demo swaps middle content in place", () => {
	const source = readProjectFile("components/blocks/gallery/page.tsx");
	assert.match(source, /renderSelectedItem/u);
	assert.match(source, /\{item\.title\}/u);
	assert.doesNotMatch(source, /article/u);
	assert.doesNotMatch(source, /Placeholder middle-page content/u);
	assert.doesNotMatch(source, /Click any card to morph it into a centered detail view/u);
});

test("Gallery controls expose state-aware tooltips and reset the selected prototype", () => {
	const gallerySource = readProjectFile("components/blocks/gallery/components/gallery.tsx");
	const stageSource = readProjectFile("components/blocks/gallery/components/gallery-selected-stage.tsx");
	const toggleSource = readProjectFile("components/blocks/gallery/components/gallery-toggle.tsx");

	assert.match(gallerySource, /setResetKey\(\(current\) => current \+ 1\)/u);
	assert.match(gallerySource, /onReset\?\.\(selectedItem\)/u);
	assert.match(stageSource, /key=\{`\$\{item\.id\}:\$\{resetKey\}`\}/u);
	assert.match(toggleSource, /<TooltipContent side="bottom">Reset<\/TooltipContent>/u);
	assert.match(toggleSource, /<TooltipContent side="bottom">\{themeLabel\}<\/TooltipContent>/u);
	assert.match(toggleSource, /<TooltipContent side="bottom">\{galleryToggleLabel\}<\/TooltipContent>/u);
	assert.match(toggleSource, /open \? "Close gallery" : "Open gallery"/u);
	assert.doesNotMatch(toggleSource, /window\.location\.reload/u);
});
