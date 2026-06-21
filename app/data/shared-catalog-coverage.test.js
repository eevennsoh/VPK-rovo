const assert = require("node:assert/strict");
const { existsSync, readFileSync } = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const ROOT = path.join(__dirname, "..", "..");

function readProjectFile(...segments) {
	return readFileSync(path.join(ROOT, ...segments), "utf8");
}

test("retired shared surfaces have explicit visible catalog demos", () => {
	const manifestSource = readProjectFile("app/data/component-manifest.ts");
	const componentSource = readProjectFile("app/data/components.ts");
	const uiDetailsSource = readProjectFile("app/data/details/ui.ts");
	const utilityDetailsSource = readProjectFile("app/data/details/utility.ts");
	const blockDetailsSource = readProjectFile("app/data/details/blocks.ts");
	const registrySource = readProjectFile("components/website/registry.ts");
	const navAdsSource = readProjectFile("app/data/nav-ads.ts");

	assert.match(manifestSource, /uiComponent\("heading", "Heading"\)/u);
	assert.match(componentSource, /uiComponent\("heading", "Heading"\)/u);
	assert.match(uiDetailsSource, /heading: \{/u);
	assert.match(registrySource, /heading: dynamic\(\(\) => import\("\.\/demos\/ui\/heading-demo"\)/u);
	assert.match(registrySource, /"heading-demo-scale": dynamic\(/u);
	assert.match(registrySource, /"heading-demo-semantics": dynamic\(/u);
	assert.doesNotMatch(manifestSource, /customComponent\("heading"/u);
	assert.doesNotMatch(componentSource, /customComponent\("heading"/u);

	for (const [slug, name] of [
		["chat-configuration", "Chat Configuration"],
		["elapsed-time", "Elapsed Time"],
	]) {
		assert.match(manifestSource, new RegExp(`utilityComponent\\("${slug}", "${name}"\\)`, "u"));
		assert.match(componentSource, new RegExp(`utilityComponent\\("${slug}", "${name}"\\)`, "u"));
		assert.match(utilityDetailsSource, new RegExp(`"${slug}": \\{`, "u"));
		assert.match(registrySource, new RegExp(`"${slug}": dynamic\\(\\s*\\(\\) => import\\("\\./demos/utils/${slug}-demo"\\)`, "u"));
		assert.equal(existsSync(path.join(ROOT, "components/website/demos/utils", `${slug}-demo.tsx`)), true);
	}

	assert.equal(existsSync(path.join(ROOT, "components/website/demos/ui/heading-demo.tsx")), true);
	assert.equal(existsSync(path.join(ROOT, "components/ui/heading.tsx")), true);
	assert.equal(existsSync(path.join(ROOT, "components/ui-custom/heading.tsx")), false);

	assert.doesNotMatch(manifestSource, /importPath: "@\/components\/blocks\/chat-configuration"/u);
	assert.doesNotMatch(componentSource, /category: "blocks"[\s\S]*slug: "chat-configuration"|slug: "chat-configuration"[\s\S]*category: "blocks"/u);
	assert.doesNotMatch(blockDetailsSource, /"chat-configuration": \{/u);
	assert.doesNotMatch(registrySource, /demos\/blocks\/(?:chat-configuration|shared-ui-demo)/u);
	assert.doesNotMatch(navAdsSource, /"chat-configuration"/u);

	assert.equal(existsSync(path.join(ROOT, "components/blocks/shared")), false);
	assert.equal(existsSync(path.join(ROOT, "components/blocks/chat-configuration")), false);
	assert.equal(existsSync(path.join(ROOT, "components/blocks/shared-ui")), false);
});
