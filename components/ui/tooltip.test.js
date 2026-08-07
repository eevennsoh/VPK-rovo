const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const source = fs.readFileSync(path.join(__dirname, "tooltip.tsx"), "utf8");

test("tooltip content fades without side-axis translate or origin scale", () => {
	assert.match(source, /transition-opacity duration-fast ease-out/u);
	assert.match(source, /motion-reduce:transition-none/u);
	assert.match(source, /data-starting-style:opacity-0/u);
	assert.match(source, /data-ending-style:opacity-0/u);
	assert.doesNotMatch(source, /origin-\(--transform-origin\)/u);
	assert.doesNotMatch(source, /data-starting-style:scale-/u);
	assert.doesNotMatch(source, /data-ending-style:scale-/u);
	assert.doesNotMatch(source, /data-\[side=[^\]]+\]:data-starting-style:[-\w]*translate/u);
	assert.doesNotMatch(source, /data-\[side=[^\]]+\]:data-ending-style:[-\w]*translate/u);
	assert.doesNotMatch(source, /transition-\[opacity,translate\]/u);
	assert.doesNotMatch(source, /transition-\[opacity,scale,translate\]/u);
});

test("tooltip content keeps the shared portal positioner layer hook", () => {
	assert.match(source, /positionerClassName\?: string/u);
	assert.match(
		source,
		/className=\{cn\("isolate z-\[200\]", positionerClassName\)\}/u,
	);
});
