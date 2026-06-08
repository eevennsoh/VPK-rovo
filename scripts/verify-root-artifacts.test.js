const assert = require("node:assert/strict");
const test = require("node:test");

const { findBlockedRootArtifacts } = require("./verify-root-artifacts");

test("blocks known extensionless agent-browser screenshot filenames", () => {
	assert.deepEqual(findBlockedRootArtifacts([
		"--full-page",
		"--out",
		"--output",
		"components/example.png",
	]), [
		"--full-page",
		"--out",
		"--output",
	]);
});

test("blocks root-level images while allowing nested assets", () => {
	assert.deepEqual(findBlockedRootArtifacts([
		"preview.png",
		"public/illustration/example.png",
		"components/icon.svg",
		"docs/diagram.webp",
		"hero.jpeg",
	]), [
		"preview.png",
		"hero.jpeg",
	]);
});
