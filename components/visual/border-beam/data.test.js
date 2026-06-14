import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

import {
	BORDER_BEAM_COLOR_VARIANT_OPTIONS,
	BORDER_BEAM_CONTROL_RANGES,
	BORDER_BEAM_DEFAULTS,
	BORDER_BEAM_SIZE_OPTIONS,
	BORDER_BEAM_THEME_OPTIONS,
	getBorderBeamDefaultsForSize,
	getBorderBeamSizeOptions,
} from "./data.ts";
import { generateBeamCSS } from "./styles.ts";

const ROOT = process.cwd();

function readProjectFile(filePath) {
	return readFileSync(path.join(ROOT, filePath), "utf8");
}

const BASE_STYLE_OPTIONS = {
	id: "test-beam",
	borderRadius: 16,
	borderWidth: 1,
	duration: 2.3,
	strokeOpacity: 0.8,
	innerOpacity: 0.6,
	bloomOpacity: 0.4,
	innerShadow: "rgba(0, 0, 0, 0.35)",
	colorVariant: "colorful",
	staticColors: false,
	brightness: 1.3,
	saturation: 1.2,
	hueRange: 30,
	theme: "dark",
};

test("Border Beam exposes every upstream size, color, and theme option", () => {
	assert.deepEqual(
		BORDER_BEAM_SIZE_OPTIONS.map((option) => option.value),
		["md", "sm", "line", "pulse-inner", "pulse-outside"],
	);
	assert.deepEqual(
		BORDER_BEAM_COLOR_VARIANT_OPTIONS.map((option) => option.value),
		["colorful", "mono", "ocean", "sunset"],
	);
	assert.deepEqual(
		BORDER_BEAM_THEME_OPTIONS.map((option) => option.value),
		["dark", "light", "auto"],
	);
});

test("Border Beam family options constrain size controls to matching presets", () => {
	assert.deepEqual(
		getBorderBeamSizeOptions("rotate").map((option) => option.value),
		["md", "sm", "line"],
	);
	assert.deepEqual(
		getBorderBeamSizeOptions("pulse").map((option) => option.value),
		["pulse-inner", "pulse-outside"],
	);
});

test("Border Beam size defaults preserve upstream duration and geometry defaults", () => {
	assert.equal(getBorderBeamDefaultsForSize("md").duration, 1.96);
	assert.equal(getBorderBeamDefaultsForSize("line").duration, 3.1);
	assert.equal(getBorderBeamDefaultsForSize("pulse-inner").duration, 2.3);
	assert.equal(getBorderBeamDefaultsForSize("sm").borderRadius, 32);
	assert.equal(getBorderBeamDefaultsForSize("pulse-outside").brightness, 1.9);
	assert.equal(BORDER_BEAM_DEFAULTS.size, "md");
});

test("Border Beam GUI ranges cover all numeric render controls", () => {
	for (const key of ["duration", "borderRadius", "brightness", "saturation", "hueRange", "strength"]) {
		assert.ok(Object.hasOwn(BORDER_BEAM_CONTROL_RANGES, key), `${key} range should exist`);
		assert.ok(BORDER_BEAM_CONTROL_RANGES[key].max > BORDER_BEAM_CONTROL_RANGES[key].min);
		assert.ok(BORDER_BEAM_CONTROL_RANGES[key].step > 0);
	}
});

test("Border Beam ignores bubbled child animation names for wrapper state", () => {
	const source = readProjectFile("components/visual/border-beam/index.tsx");

	assert.match(source, /e\.target === e\.currentTarget/u);
	assert.match(source, /animationName === `beam-fade-out-\$\{id\}`/u);
	assert.match(source, /animationName === `beam-fade-in-\$\{id\}`/u);
	assert.doesNotMatch(source, /animationName\.includes\('fade-(?:in|out)'\)/u);
});

test("Border Beam pulse variants remain visible under reduced motion", () => {
	for (const size of ["pulse-inner", "pulse-outside"]) {
		const css = generateBeamCSS({
			...BASE_STYLE_OPTIONS,
			id: `test-${size}`,
			size,
		});

		assert.match(css, /@media \(prefers-reduced-motion: reduce\)/u);
		assert.match(
			css,
			new RegExp(
				`\\[data-beam="test-${size}"\\]\\[data-active\\] \\{\\n\\s+--beam-opacity-test-${size}: 1;`,
				"u",
			),
		);
		assert.match(
			css,
			new RegExp(
				`\\[data-beam="test-${size}"\\]\\[data-fading\\] \\{\\n\\s+--beam-opacity-test-${size}: 0;`,
				"u",
			),
		);
	}
});
