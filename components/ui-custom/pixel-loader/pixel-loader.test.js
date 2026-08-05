import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

import {
	DEFAULT_PIXEL_LOADER_PATTERN,
	PIXEL_LOADER_PATTERN_FAMILIES,
	PIXEL_LOADER_PATTERNS,
	resolveRovoColors,
	ROVO_SPOT_COLORS,
} from "./patterns.ts";

const PATTERN_ENTRIES = Object.entries(PIXEL_LOADER_PATTERNS);

test("every pixel loader pattern describes a full 3x3 grid", () => {
	assert.equal(PATTERN_ENTRIES.length, 51);

	for (const [name, { duration, delays }] of PATTERN_ENTRIES) {
		assert.equal(delays.length, 9, `${name} must have 9 cells`);
		assert.ok(duration > 0, `${name} must have a positive duration`);

		for (const delay of delays) {
			if (delay === null) {
				continue;
			}
			assert.ok(
				Number.isInteger(delay) && delay >= 0,
				`${name} delays must be null or a non-negative integer, got ${delay}`,
			);
			assert.ok(delay < duration, `${name} delay ${delay} must stay inside its ${duration}ms cycle`);
		}

		assert.ok(
			delays.some((delay) => delay !== null),
			`${name} would render a dead widget with no lit cells`,
		);
	}
});

test("pattern families surface every pattern exactly once", () => {
	const grouped = PIXEL_LOADER_PATTERN_FAMILIES.flatMap((family) => family.patterns);

	assert.equal(
		new Set(grouped).size,
		grouped.length,
		"a pattern is listed in more than one family",
	);
	assert.deepEqual(
		[...grouped].sort(),
		Object.keys(PIXEL_LOADER_PATTERNS).sort(),
		"every pattern must appear in exactly one family so the browser can reach it",
	);
});

test("the default pattern is a real pattern", () => {
	assert.ok(DEFAULT_PIXEL_LOADER_PATTERN in PIXEL_LOADER_PATTERNS);
});

test("rovo colours follow the wavefront and skip unlit cells", () => {
	for (const [name, { delays }] of PATTERN_ENTRIES) {
		const colors = resolveRovoColors(delays);

		assert.equal(colors.length, 9, `${name} must colour all 9 cells`);

		for (const [index, delay] of delays.entries()) {
			if (delay === null) {
				assert.equal(colors[index], null, `${name} cell ${index} is unlit and must not be coloured`);
			} else {
				assert.ok(
					ROVO_SPOT_COLORS.includes(colors[index]),
					`${name} cell ${index} must use a Rovo spot colour, got ${colors[index]}`,
				);
			}
		}
	}
});

test("rovo colouring never collapses a pattern to a single hue", () => {
	// Multi-delay patterns cycle by delay rank; single-delay patterns fall back
	// to cycling by index. Either way all four spot colours must be reachable
	// on any pattern with at least four lit cells.
	for (const [name, { delays }] of PATTERN_ENTRIES) {
		const litCount = delays.filter((delay) => delay !== null).length;
		if (litCount < ROVO_SPOT_COLORS.length) {
			continue;
		}

		const used = new Set(resolveRovoColors(delays).filter(Boolean));
		assert.ok(used.size > 1, `${name} must not render as one flat colour in Rovo mode`);
	}
});

test("single-delay patterns still show all four rovo colours", () => {
	for (const name of ["breathing", "heartbeat", "frame-sync", "corners-sync"]) {
		const { delays } = PIXEL_LOADER_PATTERNS[name];
		const distinctDelays = new Set(delays.filter((delay) => delay !== null));
		assert.equal(distinctDelays.size, 1, `${name} is expected to have one delay rank`);

		const used = new Set(resolveRovoColors(delays).filter(Boolean));
		assert.equal(used.size, ROVO_SPOT_COLORS.length, `${name} must fall back to per-ordinal colouring`);
	}
});

test("rovo spot colours are raw hex so they do not shift between themes", () => {
	// Deliberately not --ds-icon-accent-*: those tokens resolve to different
	// values in dark mode, and the Rovo spot must be identical in both.
	assert.deepEqual([...ROVO_SPOT_COLORS], ["#1868DB", "#FCA700", "#AF59E0", "#6A9A23"]);
});

test("the dim opacity floor matches the pixel-loader-pulse keyframe", () => {
	const root = process.cwd();
	const component = readFileSync(
		path.join(root, "components/ui-custom/pixel-loader/pixel-loader.tsx"),
		"utf8",
	);
	const theme = readFileSync(path.join(root, "app/tailwind-theme.css"), "utf8");

	const dimOpacity = component.match(/const DIM_OPACITY = ([\d.]+);/u)?.[1];
	assert.ok(dimOpacity, "DIM_OPACITY must stay a literal so the keyframe can be checked against it");

	// The keyframe is declared at top level (Tailwind v4 drops keyframes inside
	// `@theme` unless an `--animate-*` variable references them), so the block
	// closes on a non-indented brace.
	const keyframe = theme.match(/@keyframes pixel-loader-pulse \{([\s\S]*?)\n\}/u)?.[1];
	assert.ok(keyframe, "pixel-loader-pulse keyframe is missing from app/tailwind-theme.css");

	const restingStop = keyframe.match(/0%,\s*100%\s*\{\s*opacity:\s*([\d.]+);/u)?.[1];
	assert.equal(
		restingStop,
		dimOpacity,
		"the keyframe's resting opacity and DIM_OPACITY have drifted apart",
	);
	assert.match(keyframe, /50%\s*\{\s*opacity:\s*1;/u, "the pulse must peak at full opacity");
});

test("the loader animates without a JS frame loop and honours reduced motion", () => {
	const component = readFileSync(
		path.join(process.cwd(), "components/ui-custom/pixel-loader/pixel-loader.tsx"),
		"utf8",
	);

	assert.doesNotMatch(
		component,
		/requestAnimationFrame|setInterval/u,
		"cell motion must stay in CSS; the pattern delays are a pure function of time",
	);
	// Inline styles outrank `motion-reduce:` utilities, so the guard has to be in JS.
	assert.match(component, /delay === null \|\| reducedMotion/u);
	assert.match(component, /var\(--ease-linear\)/u, "timing must come from a motion token");
});
