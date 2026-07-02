const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const ROOT = path.join(__dirname, "../../../..");
const COMPONENTS_SOURCE = fs.readFileSync(path.join(ROOT, "app/data/components.ts"), "utf8");
const MANIFEST_SOURCE = fs.readFileSync(path.join(ROOT, "app/data/component-manifest.ts"), "utf8");
const DETAILS_SOURCE = fs.readFileSync(path.join(ROOT, "app/data/details/visual.ts"), "utf8");
const NAV_UTILS_SOURCE = fs.readFileSync(path.join(ROOT, "app/data/nav-utils.ts"), "utf8");
const REGISTRY_SOURCE = fs.readFileSync(path.join(ROOT, "components/website/registry.ts"), "utf8");
const DEMO_SOURCE = fs.readFileSync(path.join(__dirname, "paper-shaders-demo.tsx"), "utf8");
const PACKAGE_SOURCE = fs.readFileSync(path.join(ROOT, "package.json"), "utf8");

const PAPER_SHADER_SLUGS = [
	"paper-color-panels",
	"paper-dithering",
	"paper-dot-grid",
	"paper-dot-orbit",
	"paper-fluted-glass",
	"paper-gem-smoke",
	"paper-god-rays",
	"paper-grain-gradient",
	"paper-halftone-cmyk",
	"paper-halftone-dots",
	"paper-heatmap",
	"paper-image-dithering",
	"paper-liquid-metal",
	"paper-mesh-gradient",
	"paper-metaballs",
	"paper-neuro-noise",
	"paper-paper-texture",
	"paper-perlin-noise",
	"paper-pulsing-border",
	"paper-simplex-noise",
	"paper-smoke-ring",
	"paper-spiral",
	"paper-static-mesh-gradient",
	"paper-static-radial-gradient",
	"paper-swirl",
	"paper-voronoi",
	"paper-warp",
	"paper-water",
	"paper-waves",
];

const IMAGE_BACKED_RUNTIME_SLUGS = [
	"paper-fluted-glass",
	"paper-gem-smoke",
	"paper-halftone-cmyk",
	"paper-halftone-dots",
	"paper-heatmap",
	"paper-image-dithering",
	"paper-liquid-metal",
	"paper-paper-texture",
	"paper-water",
];

function getPaperShaderGroupBody() {
	const match = NAV_UTILS_SOURCE.match(/"paper-shaders": \[([\s\S]*?)\n\t\],/u);
	assert.ok(match, "Paper Shaders nav group should be present");
	return match[1];
}

test("Paper Shaders dependency is declared", () => {
	assert.match(PACKAGE_SOURCE, /"@paper-design\/shaders-react": "\^0\.0\.76"/u);
});

test("Paper Shaders catalog wiring covers every shader route", () => {
	const navGroupBody = getPaperShaderGroupBody();

	for (const slug of PAPER_SHADER_SLUGS) {
		assert.ok(COMPONENTS_SOURCE.includes(`"${slug}"`), `components.ts missing ${slug}`);
		assert.ok(MANIFEST_SOURCE.includes(`"${slug}"`), `component-manifest.ts missing ${slug}`);
		assert.ok(DETAILS_SOURCE.includes(`slug: "${slug}"`), `visual details missing ${slug}`);
		assert.ok(REGISTRY_SOURCE.includes(`"${slug}": dynamic(() => import("./demos/visual/paper-shaders-demo")`), `registry missing ${slug}`);
		assert.ok(navGroupBody.includes(`"${slug}"`), `Paper Shaders nav group missing ${slug}`);
		assert.ok(DEMO_SOURCE.includes(`"${slug}"`), `demo runtime missing ${slug}`);
	}
});

test("Paper Shaders stay grouped and do not expose ShaderMount as a route", () => {
	assert.match(NAV_UTILS_SOURCE, /"paper-shaders": \[/u);
	assert.doesNotMatch(COMPONENTS_SOURCE, /paper-shader-mount|ShaderMount/u);
	assert.doesNotMatch(MANIFEST_SOURCE, /paper-shader-mount|ShaderMount/u);
	assert.doesNotMatch(REGISTRY_SOURCE, /paper-shader-mount/u);
});

test("Paper image-backed runtime demos use a stable local image", () => {
	assert.match(DEMO_SOURCE, /const DEMO_IMAGE = "\/ambient\/ado\/combo\/primary\/blue\.svg";/u);

	for (const slug of IMAGE_BACKED_RUNTIME_SLUGS) {
		const start = DEMO_SOURCE.indexOf(`"${slug}":`);
		assert.notEqual(start, -1, `${slug} should be present`);
		const end = DEMO_SOURCE.indexOf("\n\t},", start);
		assert.notEqual(end, -1, `${slug} block should be parseable`);
		assert.match(DEMO_SOURCE.slice(start, end), /image: DEMO_IMAGE/u, `${slug} should use DEMO_IMAGE`);
	}
});

test("Paper shader route count matches the package export surface", () => {
	assert.equal(PAPER_SHADER_SLUGS.length, 29);
	assert.equal((DEMO_SOURCE.match(/\n\t\tcomponent: /gu) ?? []).length, PAPER_SHADER_SLUGS.length);
	assert.equal((getPaperShaderGroupBody().match(/"paper-[a-z-]+"/gu) ?? []).length, PAPER_SHADER_SLUGS.length);
});
