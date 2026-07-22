const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const esbuild = require("esbuild");
const { loadCjsModuleFromText } = require(
	path.join(process.cwd(), "scripts/lib/esbuild-cjs-loader.js"),
);

const ROOT = path.join(__dirname, "..", "..", "..");
const COMPONENT_SOURCE = fs.readFileSync(
	path.join(__dirname, "ThinkingOrb.tsx"),
	"utf8",
);
const TYPES_SOURCE = fs.readFileSync(path.join(__dirname, "types.ts"), "utf8");
const THEME_SOURCE = fs.readFileSync(path.join(__dirname, "theme.ts"), "utf8");
const DEMO_SOURCE = fs.readFileSync(
	path.join(ROOT, "components/website/demos/visual/thinking-orbs-demo.tsx"),
	"utf8",
);
const DETAIL_SOURCE = fs.readFileSync(
	path.join(ROOT, "app/data/details/visual/thinking-orbs.ts"),
	"utf8",
);
const REGISTRY_SOURCE = fs.readFileSync(
	path.join(ROOT, "components/website/registry/visual.ts"),
	"utf8",
);

async function loadPresets() {
	const result = await esbuild.build({
		entryPoints: [path.join(__dirname, "presets.ts")],
		bundle: true,
		format: "cjs",
		platform: "node",
		write: false,
	});
	return loadCjsModuleFromText(result.outputFiles[0].text);
}

test("Thinking Orb resolves every state at both tuned sizes", async () => {
	const { resolvePreset } = await loadPresets();
	const states = [
		"working",
		"searching",
		"solving",
		"listening",
		"composing",
		"shaping",
	];
	for (const state of states) {
		for (const size of [64, 20]) {
			const preset = resolvePreset(state, size);
			assert.equal(typeof preset.speed, "number");
			assert.ok(preset.speed > 0);
			assert.equal(typeof preset.mode, "string");
		}
	}
});

test("Thinking Orb preserves accessibility, reduced motion, and visibility pausing", () => {
	assert.match(COMPONENT_SOURCE, /^"use client";/);
	assert.match(COMPONENT_SOURCE, /role="img"/);
	assert.match(
		COMPONENT_SOURCE,
		/aria-label=\{ariaLabel \?\? LABELS\[state\]\}/,
	);
	assert.match(COMPONENT_SOURCE, /if \(reduced\) \{\s*frame\(0\.6\);/);
	assert.match(COMPONENT_SOURCE, /IntersectionObserver/);
	assert.match(COMPONENT_SOURCE, /visibilitychange/);
	assert.match(THEME_SOURCE, /getAttribute\("data-color-mode"\)/);
	assert.match(
		THEME_SOURCE,
		/useState\(\s*\(\) =>\s*typeof matchMedia !== "undefined"/,
	);
});

test("Thinking Orb reserves canvas backing dimensions for the size prop", () => {
	assert.match(
		TYPES_SOURCE,
		/extends Omit<CanvasHTMLAttributes<HTMLCanvasElement>, "height" \| "style" \| "width">/,
	);
});

test("Thinking Orbs demo exposes the complete supported control and variant surface", () => {
	for (const state of [
		"working",
		"searching",
		"solving",
		"listening",
		"composing",
		"shaping",
	]) {
		assert.match(DEMO_SOURCE, new RegExp(`"${state}"`));
	}
	for (const id of [
		"thinking-orbs-state",
		"thinking-orbs-size",
		"thinking-orbs-theme",
		"thinking-orbs-speed",
		"thinking-orbs-paused",
		"thinking-orbs-label",
	]) {
		assert.match(DEMO_SOURCE, new RegExp(`id="${id}"`));
	}
	assert.match(DEMO_SOURCE, /ORB_STATES\.map/);
	assert.match(DEMO_SOURCE, /ORB_SIZES\.map/);
	assert.doesNotMatch(DEMO_SOURCE, /All tuned variants/);
	for (const state of [
		"working",
		"searching",
		"solving",
		"listening",
		"composing",
		"shaping",
	]) {
		assert.match(
			DETAIL_SOURCE,
			new RegExp(`demoSlug: "thinking-orbs-demo-${state}"`),
		);
		assert.match(REGISTRY_SOURCE, new RegExp(`"thinking-orbs-demo-${state}"`));
	}
	assert.match(DETAIL_SOURCE, /MIT-licensed Thinking Orbs/);
	assert.match(DETAIL_SOURCE, /github\.com\/JakubAntalik\/thinking-orbs/);
});
