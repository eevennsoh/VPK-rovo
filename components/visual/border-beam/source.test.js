import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const ROOT = process.cwd();

function readProjectFile(filePath) {
	return readFileSync(path.join(ROOT, filePath), "utf8");
}

test("Border Beam only handles its own wrapper fade animation events", () => {
	const source = readProjectFile("components/visual/border-beam/index.tsx");

	assert.match(source, /e\.target === e\.currentTarget/u);
	assert.match(source, /animationName === `beam-fade-out-\$\{id\}`/u);
	assert.match(source, /animationName === `beam-fade-in-\$\{id\}`/u);
	assert.doesNotMatch(source, /animationName\.includes\('fade-(?:in|out)'\)/u);
});

test("Border Beam pulse effects stay visible when reduced motion disables animation", () => {
	const wrapperSource = readProjectFile("components/visual/border-beam/styles.ts");
	const source = readProjectFile("components/visual/border-beam/styles-generated.ts");
	const reducedMotionOpacityBlocks = source.match(
		/@media \(prefers-reduced-motion: reduce\) \{[\s\S]*?\[data-beam="\$\{id\}"\]\[data-active\] \{\s*--beam-opacity-\$\{id\}: 1;\s*\}[\s\S]*?\[data-beam="\$\{id\}"\]\[data-fading\] \{\s*--beam-opacity-\$\{id\}: 0;\s*\}/gu,
	);

	assert.match(wrapperSource, /from "\.\/styles-generated"/u);
	assert.equal(reducedMotionOpacityBlocks?.length, 2);
});
