const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const ROVO_GENERATION_SOURCE = fs.readFileSync(path.join(__dirname, "rovo-generation-components.tsx"), "utf8");
const ROVO_GENERATION_API_SOURCE = fs.readFileSync(path.join(__dirname, "rovo-generation.ts"), "utf8");

test("RovoGeneration rainbow stops are sourced from theme variables", () => {
	assert.match(ROVO_GENERATION_SOURCE, /--rovo-generation-stop-orange": "var\(--color-orange-300\)"/u);
	assert.match(ROVO_GENERATION_SOURCE, /--rovo-generation-stop-lime": "var\(--color-lime-400\)"/u);
	assert.match(ROVO_GENERATION_SOURCE, /--rovo-generation-stop-blue": "var\(--color-blue-600\)"/u);
	assert.match(ROVO_GENERATION_SOURCE, /--rovo-generation-stop-purple": "var\(--color-purple-500\)"/u);
	assert.match(ROVO_GENERATION_SOURCE, /var\(--rovo-generation-stop-orange\) 0deg 73deg/u);
	assert.doesNotMatch(ROVO_GENERATION_SOURCE, /#fca700|#6a9a23|#1868db|#af59e0|#AF59E1/u);
});

test("RovoGeneration exposes a Highlight sub-component", () => {
	assert.match(ROVO_GENERATION_API_SOURCE, /Highlight: RovoGenerationHighlight/u);
	assert.match(ROVO_GENERATION_SOURCE, /function RovoGenerationHighlight\(/u);
});

test("RovoGeneration.Highlight band reuses the token-backed rainbow stops", () => {
	assert.match(ROVO_GENERATION_SOURCE, /ROVO_GENERATION_HIGHLIGHT_STOPS\s*=\s*\[/u);
	assert.match(ROVO_GENERATION_SOURCE, /"var\(--rovo-generation-stop-orange\)"/u);
	assert.match(ROVO_GENERATION_SOURCE, /"var\(--rovo-generation-stop-purple\)"/u);
	// The highlight must not introduce hardcoded mosaic hex values.
	assert.doesNotMatch(ROVO_GENERATION_SOURCE, /#fca700|#6a9a23|#1868db|#af59e0/iu);
});

test("RovoGeneration.Highlight makes one legible 12 o'clock-to-12 o'clock perimeter pass", () => {
	// The larger suggestion surface needs a slower trace than the reference shimmer.
	assert.match(ROVO_GENERATION_SOURCE, /HIGHLIGHT_DURATION_MS = 2400/u);
	assert.match(ROVO_GENERATION_SOURCE, /HIGHLIGHT_DELAY_MS = 200/u);
	assert.match(ROVO_GENERATION_SOURCE, /HIGHLIGHT_BAND_FRAC = 0\.35/u);
	// The closed path begins and ends at the top-center rather than a corner.
	assert.match(ROVO_GENERATION_SOURCE, /`M \$\{width \/ 2\} 0`[\s\S]*`L \$\{width \/ 2\} 0`[\s\S]*"Z"/u);
	// Travels once and dissolves — no infinite repeat.
	assert.doesNotMatch(ROVO_GENERATION_SOURCE, /repeat:\s*Infinity/u);
	// Reduced motion hides the band and reports completion.
	assert.match(ROVO_GENERATION_SOURCE, /shouldReduceMotion/u);
});
