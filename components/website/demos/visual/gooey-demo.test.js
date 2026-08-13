const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const ROOT = path.join(__dirname, "../../../..");
const COMPONENTS = fs.readFileSync(path.join(ROOT, "app/data/components.ts"), "utf8");
const MANIFEST = fs.readFileSync(path.join(ROOT, "app/data/component-manifest.ts"), "utf8");
const DETAILS_INDEX = fs.readFileSync(path.join(ROOT, "app/data/details/visual.ts"), "utf8");
const DETAIL = fs.readFileSync(path.join(ROOT, "app/data/details/visual/gooey.ts"), "utf8");
const REGISTRY = fs.readFileSync(path.join(ROOT, "components/website/registry/visual.ts"), "utf8");
const DEMO = fs.readFileSync(path.join(__dirname, "gooey-demo.tsx"), "utf8");
const EXAMPLES = fs.readFileSync(path.join(__dirname, "gooey-examples.tsx"), "utf8");
const INDEX = fs.readFileSync(path.join(ROOT, "components/visual/gooey/index.ts"), "utf8");
const ROOT_SOURCE = fs.readFileSync(path.join(ROOT, "components/visual/gooey/gooey-root.tsx"), "utf8");
const VARIANT_REGISTRY = REGISTRY.slice(REGISTRY.indexOf("export const VISUAL_VARIANT_DEMOS"));

test("Gooey is a top-level Visual component with local source attribution", () => {
	for (const source of [COMPONENTS, MANIFEST]) {
		assert.match(source, /visualComponent\("gooey", "Gooey", "@\/components\/visual\/gooey"\)/u);
	}
	assert.match(DETAILS_INDEX, /import \{ GOOEY_DETAIL \} from "\.\/visual\/gooey"/u);
	assert.match(DETAILS_INDEX, /gooey: GOOEY_DETAIL/u);
	assert.match(REGISTRY, /VISUAL_DEMOS[\s\S]*gooey: dynamic\(\(\) => import\("\.\.\/demos\/visual\/gooey-demo"\)/u);
	assert.match(REGISTRY, /VISUAL_VARIANT_DEMOS[\s\S]*"gooey-morph-menu"/u);
	assert.match(INDEX, /export const Gooey = Object\.assign\(GooeyRoot, \{ Item: GooeyItem \}\)/u);
	assert.ok(DETAIL.includes("https://gooey.jakubantalik.com/"));
	assert.ok(DETAIL.includes("cfa51e10f4bc581445248b75c3e9e81c9afac0ef"));
	assert.ok(fs.existsSync(path.join(ROOT, "components/visual/gooey/LICENSE")));
});

test("all six upstream compositions are registered and documented", () => {
	for (const [slug, exportName, title] of [
		["gooey-morph-menu", "GooeyMorphMenuExample", "Morph plus menu"],
		["gooey-morph-email", "GooeyMorphEmailExample", "Morph email input"],
		["gooey-morph-avatars", "GooeyMorphAvatarExample", "Morph avatar group with dissolve"],
		["gooey-morph-cards", "GooeyMorphCardsExample", "Morph melting cards"],
		["gooey-move-tabs", "GooeyMoveTabsExample", "Move gooey tabs"],
		["gooey-move-slider", "GooeyMoveSliderExample", "Move liquid-rubber slider"],
	]) {
		assert.ok(VARIANT_REGISTRY.includes(`"${slug}": dynamic(`), slug);
		assert.ok(VARIANT_REGISTRY.includes(`default: mod.${exportName}`), exportName);
		assert.ok(DETAIL.includes(`title: "${title}"`), title);
		assert.ok(EXAMPLES.includes(`export function ${exportName}`), exportName);
	}
	assert.ok(EXAMPLES.includes('h-[280px]'));
	assert.ok(EXAMPLES.includes('max-w-[294px]'));
});

test("playground exposes the complete root, item, transition, morph, evolve, move, and dissolve surface", () => {
	for (const section of ["Root", "Item", "Transition", "Morph", "Evolve", "Move", "Dissolve"]) {
		assert.ok(DEMO.includes(`title="${section}"`), section);
	}
	for (const control of [
		"Blur", "Contrast", "Fill", "Shadow", "Filter padding", "Effect", "X", "Y", "Scale", "Delay", "Observe",
		"Radius", "Item className", "Item style JSON", "Children text", "Transition", "Spring stiffness", "Spring damping", "Spring mass", "Duration", "Easing",
		"Shape", "Speed", "Bounce", "Content blur", "Blob inset", "Bridge grow",
		"Mass stiffness", "Mass damping", "Size stiffness", "Size damping", "Radius stiffness", "Radius damping", "Evolve content blur", "Roundness", "Corner duration", "Corner delay", "Corner ease", "Anticipation", "Travel",
		"Springiness", "Wobble", "Stretch", "Trail", "Raw stiffness", "Raw damping", "Raw stretch", "Raw tail",
		"Dissolve", "Dissolve blur", "Warp", "Pull", "Range", "Zone", "Mix", "Gravity", "Taper", "Warp frequency", "Flow speed", "Warp style", "Detail", "Active", "Release", "Fade", "Strength", "Sink",
	]) {
		assert.ok(DEMO.includes(`label: "${control}"`) || DEMO.includes(`label="${control}"`), control);
	}
	assert.match(DEMO, /<GUI\.Panel title="Gooey controls" values=\{copiedValues\}>/u);
});

test("silhouette and dissolve overlays are hidden, inert SVG while content stays DOM", () => {
	assert.equal((ROOT_SOURCE.match(/aria-hidden="true"/gu) || []).length, 2);
	assert.equal((ROOT_SOURCE.match(/focusable="false"/gu) || []).length, 2);
	assert.equal((ROOT_SOURCE.match(/pointerEvents: 'none'/gu) || []).length, 2);
	assert.match(EXAMPLES, /<button/u);
	assert.match(EXAMPLES, /<input/u);
});

test("observed items retain a concrete wrapper for className and style positioning", () => {
	const itemSource = fs.readFileSync(path.join(ROOT, "components/visual/gooey/item-core.tsx"), "utf8");
	assert.match(itemSource, /style=\{\{ display: 'inline-block', \.\.\.style \}\}/u);
});

test("GUI slider labels reach Base UI thumb inputs", () => {
	const sliderSource = fs.readFileSync(path.join(ROOT, "components/ui/slider.tsx"), "utf8");
	assert.match(sliderSource, /<SliderPrimitive\.Thumb[\s\S]*aria-label=\{ariaLabel/u);
});
