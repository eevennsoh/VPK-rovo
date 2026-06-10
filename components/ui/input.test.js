const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const test = require("node:test");

function readProjectFile(relativePath) {
	return readFileSync(join(process.cwd(), relativePath), "utf8");
}

const responsiveControlTextPattern = new RegExp(
	[
		"text-base",
		"[^\\n]*",
		"md:text-sm",
		"|",
		"md:text-sm",
		"[^\\n]*",
		"text-base",
	].join(""),
	"u",
);

test("text input primitives keep a fixed font size across viewport widths", () => {
	const inputSource = readProjectFile("components/ui/input.tsx");
	const textareaSource = readProjectFile("components/ui/textarea.tsx");

	assert.match(inputSource, /px-2\.5 py-1 text-sm transition-colors/u);
	assert.match(textareaSource, /px-2\.5 py-2 text-sm transition-colors/u);
	assert.doesNotMatch(inputSource, responsiveControlTextPattern);
	assert.doesNotMatch(textareaSource, responsiveControlTextPattern);
});

test("prompt input placeholder mirrors fixed input text sizing", () => {
	const promptInputSource = readProjectFile("components/ui-custom/prompt-input.tsx");

	assert.match(promptInputSource, /px-2\.5 text-sm text-text-subtlest/u);
	assert.doesNotMatch(promptInputSource, responsiveControlTextPattern);
});
