import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE = readFileSync(join(__dirname, "uncaptured-work-chin.tsx"), "utf8");

test("captured work is removed from the keyboard action sequence", () => {
	const capturedBranch = SOURCE.match(/captured \? \(([\s\S]*?)\) : \(/u)?.[1];

	assert.ok(capturedBranch, "expected the captured-state branch");
	assert.match(capturedBranch, /<Button\s+disabled\s+aria-label=\{createLabel\}/u);
	assert.doesNotMatch(capturedBranch, /aria-disabled/u);
});
