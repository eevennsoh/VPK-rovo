const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const ROOT = path.join(__dirname, "..", "..");

function readProjectFile(...segments) {
	return fs.readFileSync(path.join(ROOT, ...segments), "utf8");
}

function extractGroupSlugs(source, groupName) {
	const escapedGroupName = groupName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	const match = source.match(
		new RegExp(`(?:"${escapedGroupName}"|${escapedGroupName}): \\[(?<body>[\\s\\S]*?)\\n\\t\\]`, "u"),
	);

	assert.ok(match?.groups?.body, `${groupName} group should be present`);
	return [...match.groups.body.matchAll(/"([^"]+)"/gu)].map((slug) => slug[1]);
}

test("Visual Mesh catalog uses default slug for Framer mesh and mesh-v2 for SVG mesh", () => {
	const componentSource = readProjectFile("app/data/components.ts");
	const manifestSource = readProjectFile("app/data/component-manifest.ts");
	const detailsSource = readProjectFile("app/data/details/visual.ts");
	const registrySource = readProjectFile("components/website/registry.ts");

	for (const source of [componentSource, manifestSource]) {
		assert.match(
			source,
			/visualComponent\("mesh", "Mesh", "@\/components\/website\/demos\/visual\/shaders\/mesh"\)/u,
		);
		assert.match(
			source,
			/visualComponent\("mesh-v2", "Mesh v2", "@\/components\/website\/demos\/visual\/shaders\/mesh-v2"\)/u,
		);
		assert.doesNotMatch(source, /mesh-02/u);
		assert.doesNotMatch(source, /Mesh SVG/u);
		assert.doesNotMatch(source, /shaders\/mesh2/u);
	}

	assert.match(detailsSource, /"mesh": \{\n\t\tdescription: "3D wireframe mesh/u);
	assert.match(detailsSource, /"mesh-v2": \{\n\t\tdescription: "SVG animated mesh gradient/u);
	assert.doesNotMatch(detailsSource, /"mesh-02"/u);
	assert.match(registrySource, /mesh: dynamic\(\(\) => import\("\.\/demos\/visual\/mesh-demo"\)/u);
	assert.match(registrySource, /"mesh-v2": dynamic\(\(\) => import\("\.\/demos\/visual\/mesh-v2-demo"\)/u);
	assert.doesNotMatch(registrySource, /mesh-02/u);
});

test("Visual sidebar separates Framer shaders from general shaders", () => {
	const navUtilsSource = readProjectFile("app/data/nav-utils.ts");
	const shaderSlugs = extractGroupSlugs(navUtilsSource, "shaders");
	const framerShaderSlugs = extractGroupSlugs(navUtilsSource, "framer-shaders");
	const expectedFramerShaderSlugs = [
		"ripple",
		"logo-gradient",
		"logo-glass",
		"logo-spectrum",
		"logo-crystal",
		"liquid-gradient",
		"wave-gradient",
		"bands",
		"rings",
		"blockify",
		"pixels",
		"truchet",
		"fluted-glass",
		"mesh",
		"particles",
		"chromatic-aberration",
		"holo",
	];

	assert.deepEqual(framerShaderSlugs, expectedFramerShaderSlugs);
	assert.ok(shaderSlugs.includes("mesh-v2"));
	assert.ok(!shaderSlugs.includes("mesh"));
	assert.ok(!shaderSlugs.includes("mesh-02"));

	for (const slug of expectedFramerShaderSlugs) {
		assert.ok(!shaderSlugs.includes(slug), `${slug} moved out of shaders`);
	}
});
