const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");

const SOURCE = readFileSync(join(__dirname, "animated-dots.tsx"), "utf8");
const GLOBALS_SOURCE = readFileSync(join(__dirname, "../../app/globals.css"), "utf8");

test("animation styles do not leak CSS into parent accessible names", () => {
	assert.doesNotMatch(SOURCE, /<style|DOT_REVEAL_KEYFRAMES/u);
	assert.match(GLOBALS_SOURCE, /@keyframes dot-reveal \{/u);
	assert.match(SOURCE, /<span[\s\S]*aria-hidden="true"/u);
});
