const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");
const { readDetailCategorySource } = require(process.cwd() + "/app/data/details/test-source.cjs");
const { readWebsiteRegistrySource } = require(process.cwd() + "/components/website/registry/test-source.cjs");

const ROOT = join(__dirname, "..", "..");
const SOURCE = readFileSync(join(__dirname, "twg-appstack.tsx"), "utf8");
const COMPONENTS_SOURCE = readFileSync(join(ROOT, "app/data/components.ts"), "utf8");
const MANIFEST_SOURCE = readFileSync(join(ROOT, "app/data/component-manifest.ts"), "utf8");
const DETAILS_SOURCE = readDetailCategorySource("ui-custom");
const REGISTRY_SOURCE = readWebsiteRegistrySource();
const DEMO_SOURCE = readFileSync(join(ROOT, "components/website/demos/ui-custom/twg-appstack-demo.tsx"), "utf8");

test("TWG Appstack exposes the shared 16/20/24/32 tile size scale", () => {
	assert.match(SOURCE, /export function TWGAppstack/u);
	assert.match(
		SOURCE,
		/export type TwgToolSourceIconSize = "xxsmall" \| "xsmall" \| "small" \| "medium";/u,
	);
	assert.match(SOURCE, /xxsmall: \{ box: "size-4", imagePx: 16, overlap: "-ml-0\.5", countText: "text-\[10px\]" \}/u);
	assert.match(SOURCE, /xsmall: \{ box: "size-5", imagePx: 20, overlap: "-ml-1", countText: "text-\[10px\]" \}/u);
	assert.match(SOURCE, /small: \{ box: "size-6", imagePx: 24, overlap: "-ml-1", countText: "text-xs" \}/u);
	assert.match(SOURCE, /medium: \{ box: "size-8", imagePx: 32, overlap: "-ml-1\.5", countText: "text-xs" \}/u);
	assert.match(SOURCE, /as const satisfies Record<TwgToolSourceIconSize, \{/u);
	assert.match(SOURCE, /"relative flex shrink-0 items-center justify-center"/u);
});

test("TWG Appstack defaults to 24px and passes the size straight to the tile scale", () => {
	assert.match(SOURCE, /size = "small",/u);
	assert.match(SOURCE, /iconSize = "small",/u);
	assert.match(SOURCE, /const sizing = APPSTACK_SIZES\[iconSize\];/u);
	assert.match(SOURCE, /sizing\.box,\s*index > 0 && sizing\.overlap/u);
	// The four names are shared with `components/ui/tile`, so no translation
	// table sits between the prop and the Tile / logo primitives.
	assert.doesNotMatch(SOURCE, /getSourceTileSize|getAppstackItemClassName|getSourceImageSize/u);
	assert.doesNotMatch(SOURCE, /size === "md"/u);
});

test("TWG Appstack rejects caller children that its source render path discards", () => {
	assert.match(
		SOURCE,
		/export type TWGAppstackProps = Omit<ComponentProps<"div">, "children"> & \{\s*children\?: never;/u,
	);
	assert.match(SOURCE, /\{visibleSources\.map\(\(source, index\) => \(/u);
});

test("TWG Appstack uses a solid fill on stacked tiles", () => {
	assert.match(SOURCE, /const APPSTACK_TILE_FILL_CLASS = "bg-surface"/u);
	assert.match(SOURCE, /cn\("shrink-0", APPSTACK_TILE_FILL_CLASS, className\)/u);
	assert.match(SOURCE, /className="shrink-0 bg-surface text-text-subtlest"/u);
	assert.match(
		SOURCE,
		/<span className=\{cn\("font-medium leading-none", sizing\.countText\)\}>\+\{hiddenCount\}<\/span>/u,
	);
});

test("TWG Appstack animation is optional and preserves source stack rotation", () => {
	assert.match(SOURCE, /animated = true/u);
	assert.match(SOURCE, /const shouldAnimate = animated && !shouldReduceMotion/u);
	assert.match(SOURCE, /if \(!shouldAnimate\)/u);
	assert.match(SOURCE, /const APPSTACK_ROTATIONS = \[\s*0,\s*6,\s*0,\s*-8,\s*\] as const/u);
	assert.match(SOURCE, /const APPSTACK_ENTER_ROTATION_OFFSET = 18/u);
	assert.match(SOURCE, /rotate: \{ type: "spring", stiffness: 260, damping: 30, mass: 0\.85/u);
	assert.match(SOURCE, /transform: `rotate\(\$\{rotation\}deg\)`/u);
	assert.match(SOURCE, /animate=\{\{ filter: "blur\(0px\)", opacity: 1, rotate: rotation, scale: 1, x: 0 \}\}/u);
});

test("TWG Appstack only staggers its first reveal and layout-animates later sources", () => {
	assert.match(SOURCE, /const hasRenderedSources = useRef\(false\);/u);
	assert.match(SOURCE, /const shouldStaggerEntrance = !hasRenderedSources\.current;/u);
	assert.match(SOURCE, /if \(sources\.length > 0\) hasRenderedSources\.current = true;/u);
	assert.match(
		SOURCE,
		/const delay = shouldStaggerEntrance[\s\S]*\? getAppstackDelay\(index, itemCount, direction\)[\s\S]*: 0;/u,
	);
	assert.match(SOURCE, /layout=\{shouldReduceMotion \? false : "position"\}/u);
	assert.match(SOURCE, /layout: \{ duration: 0\.25, ease: \[0\.4, 0, 0, 1\] \}/u);
});

test("TWG Appstack keeps the legacy TwgToolSourceStack adapter", () => {
	assert.match(SOURCE, /export function TwgToolSourceStack\(props: TWGAppstackProps\)/u);
	assert.match(SOURCE, /return <TWGAppstack \{\.\.\.props\} \/>/u);
});

test("TWG Appstack is wired into the ui-custom catalog", () => {
	assert.match(COMPONENTS_SOURCE, /customComponent\("twg-appstack", "TWG Appstack"\)/u);
	assert.match(MANIFEST_SOURCE, /customComponent\("twg-appstack", "TWG Appstack"\)/u);
	assert.match(DETAILS_SOURCE, /"twg-appstack": \{/u);
	assert.match(REGISTRY_SOURCE, /"twg-appstack": dynamic\(\(\) => import\("\.\/demos\/ui-custom\/twg-appstack-demo"\)/u);
	assert.match(REGISTRY_SOURCE, /"twg-appstack-demo-sizes": dynamic\(/u);
	assert.match(DETAILS_SOURCE, /demoSlug: "twg-appstack-demo-sizes"/u);
	assert.match(DEMO_SOURCE, /export function TWGAppstackDemoSizes\(\)/u);
	assert.match(DEMO_SOURCE, /export default function TWGAppstackDemo/u);
	assert.match(DEMO_SOURCE, /aria-label="Replay TWG app stack animation"/u);
	assert.match(DEMO_SOURCE, /setReplayKey\(\(currentKey\) => currentKey \+ 1\)/u);
	assert.match(DEMO_SOURCE, /<div key=\{replayKey\}/u);
});
