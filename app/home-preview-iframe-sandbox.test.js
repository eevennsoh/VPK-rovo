const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const appDir = __dirname;

function readAppSource(fileName) {
	return fs.readFileSync(path.join(appDir, fileName), "utf8");
}

test("first-party preview iframes keep a normal origin for Next dev assets", () => {
	const catalogSource = readAppSource("home-catalog-section.tsx");
	const homeSource = readAppSource("home-content.tsx");

	assert.match(catalogSource, /sandbox="allow-same-origin allow-scripts"/);

	const homePreviewSandboxMatches =
		homeSource.match(/sandbox="allow-same-origin allow-scripts"/g) ?? [];

	assert.equal(homePreviewSandboxMatches.length, 2);
	assert.doesNotMatch(catalogSource, /sandbox="allow-scripts"/);
	assert.doesNotMatch(homeSource, /sandbox="allow-scripts"/);
});

test("full-width preview catalogs defer only trailing offscreen cards", () => {
	const catalogSource = readAppSource("home-catalog-section.tsx");
	const homeSource = readAppSource("home-content.tsx");
	const websiteCardSource = fs.readFileSync(
		path.join(process.cwd(), "components/website/website-card.tsx"),
		"utf8",
	);

	assert.match(websiteCardSource, /deferOffscreen \? "cv-auto" : null/);
	assert.match(websiteCardSource, /containIntrinsicSize: "auto 1000px"/);
	assert.match(catalogSource, /deferOffscreen=\{index > 0\}/);
	assert.equal((homeSource.match(/deferOffscreen=\{index > 0\}/g) ?? []).length, 2);
});
