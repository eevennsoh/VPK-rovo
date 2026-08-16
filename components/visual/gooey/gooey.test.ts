import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

// @ts-expect-error Node's strip-types runner requires explicit .ts extensions.
import { normalizeRadius, roundedRectPath } from "./geometry.ts";
// @ts-expect-error Node's strip-types runner requires explicit .ts extensions.
import { parseShadow } from "./shadow.ts";
// @ts-expect-error Node's strip-types runner requires explicit .ts extensions.
import { easingFunction, resolveTransition } from "./spring.ts";
// @ts-expect-error Node's strip-types runner requires explicit .ts extensions.
import { EVOLVE_DEFAULTS, MOVE_DEFAULTS, resolveDissolveTimings, resolveDissolveTuning, resolveMorphTuning, resolveMoveTuning } from "./tuning-model.ts";

test("parses multiple outer and inset shadow layers without splitting colors", () => {
	assert.deepEqual(
		parseShadow("0 8px 20px 2px rgba(9, 30, 66, 0.25), inset 0 1px 0 #fff"),
		[
			{ x: 0, y: 8, blur: 20, spread: 2, color: "rgba(9, 30, 66, 0.25)", inset: false },
			{ x: 0, y: 1, blur: 0, spread: 0, color: "#fff", inset: true },
		],
	);
	assert.deepEqual(parseShadow("none"), []);
});

test("normalizes radii and clamps overlapping corners in rounded geometry", () => {
	assert.deepEqual(normalizeRadius(12), [12, 12, 12, 12]);
	assert.deepEqual(normalizeRadius([1, 2, 3, 4]), [1, 2, 3, 4]);
	const path = roundedRectPath(0, 0, 100, 40, [100, 100, 100, 100]);
	assert.match(path, /^M 20 0 H 80 A 20 20/u);
	assert.match(path, /V 20 A 20 20 0 0 1 80 40/u);
});

test("resolves presets, duration/easing transitions, and reduced-motion snapping", () => {
	assert.deepEqual(resolveTransition({ duration: 420, ease: "ease-in-out" }), {
		duration: 420,
		easing: "ease-in-out",
	});
	assert.deepEqual(resolveTransition("bouncy", true), { duration: 0, easing: "linear" });
	const preset = resolveTransition("snappy");
	assert.ok(preset.duration > 0);
	assert.match(preset.easing, /^(linear|cubic-bezier)\(/u);
	assert.ok(Math.abs(easingFunction("linear(0, 0.5, 1)")(0.25) - 0.25) < 0.0001);
	assert.deepEqual(resolveDissolveTimings(0, 0), { lifetimeMs: 0, fadeMs: 0 });
	assert.deepEqual(resolveDissolveTimings(110, 240), { lifetimeMs: 240, fadeMs: 240 });
});

test("maps normalized morph, move, and dissolve tuning into raw engine values", () => {
	assert.deepEqual(resolveMorphTuning(undefined), {
		massStiffness: EVOLVE_DEFAULTS.massStiffness,
		massDamping: EVOLVE_DEFAULTS.massDamping,
		sizeStiffness: EVOLVE_DEFAULTS.sizeStiffness,
		sizeDamping: EVOLVE_DEFAULTS.sizeDamping,
		radiusStiffness: EVOLVE_DEFAULTS.radiusStiffness,
		radiusDamping: EVOLVE_DEFAULTS.radiusDamping,
		cornerDuration: EVOLVE_DEFAULTS.cornerDuration,
		contentBlur: EVOLVE_DEFAULTS.contentBlur,
	});
	const fastMorph = resolveMorphTuning({ speed: 2, bounce: 0.5 });
	assert.equal(fastMorph.massStiffness, EVOLVE_DEFAULTS.massStiffness * 4);
	assert.equal(fastMorph.massDamping, EVOLVE_DEFAULTS.massDamping * 2);

	const defaultMove = resolveMoveTuning(undefined);
	assert.equal(defaultMove.stiffness, MOVE_DEFAULTS.stiffness);
	assert.equal(defaultMove.damping, MOVE_DEFAULTS.damping);
	assert.equal(defaultMove.stretch, 0.18);
	assert.ok(Math.abs((defaultMove.tail ?? 0) - 0.46) < 0.000001);
	assert.equal(resolveMoveTuning({ advanced: { stiffness: 777 } }).stiffness, 777);
	assert.equal(resolveDissolveTuning(4).strength, 1);
	assert.equal(resolveDissolveTuning(-1).strength, 0);
});

test("observer and reduced-motion subscriptions have deterministic cleanup", () => {
	const observerSource = fs.readFileSync(new URL("./observer.ts", import.meta.url), "utf8");
	const hooksSource = fs.readFileSync(new URL("./hooks.ts", import.meta.url), "utf8");
	for (const expected of [
		"cancelAnimationFrame(this.raf)",
		"this.mo?.disconnect()",
		"this.removeListeners.forEach(off => off())",
		"clearInterval(this.interval)",
		"this.items.forEach(i => i.ro.disconnect())",
		"item.ro.disconnect()",
	]) {
		assert.ok(observerSource.includes(expected), expected);
	}
	assert.match(hooksSource, /mq\.removeEventListener\('change', onChange\)/u);
});
