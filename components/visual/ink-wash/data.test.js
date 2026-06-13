import assert from "node:assert/strict";
import test from "node:test";

import {
	DEFAULT_INK_WASH_CONFIG,
	HOUSE_INK_ABSORPTION,
	getInkWashPreset,
	inkWashAbsorptionFromHex,
	mergeInkWashConfig,
} from "./data.ts";

test("mergeInkWashConfig applies defaults, preset overrides, and clamps numeric controls", () => {
	const config = mergeInkWashConfig(
		{ flow: 0.2, mode: "water" },
		{ flow: 2, bleed: -1, inkStrength: 10 },
	);

	assert.equal(config.mode, "water");
	assert.equal(config.flow, 1);
	assert.equal(config.bleed, 0);
	assert.equal(config.inkStrength, 4);
	assert.equal(config.dry, DEFAULT_INK_WASH_CONFIG.dry);
});

test("inkWashAbsorptionFromHex keeps near-black values on the house ink", () => {
	assert.deepEqual(inkWashAbsorptionFromHex("#000000"), HOUSE_INK_ABSORPTION);
	assert.deepEqual(inkWashAbsorptionFromHex("#111"), HOUSE_INK_ABSORPTION);
});

test("inkWashAbsorptionFromHex converts saturated colors into normalized absorption", () => {
	const absorption = inkWashAbsorptionFromHex("#ff8800");

	assert.equal(absorption.length, 3);
	assert.ok(absorption[2] > absorption[1], "blue channel should absorb more for orange ink");
	assert.ok(absorption[1] > absorption[0], "green channel should absorb more than red for orange ink");
	assert.equal(Math.max(...absorption), 1);
});

test("getInkWashPreset falls back to the landscape preset", () => {
	assert.equal(getInkWashPreset("landscape").id, "landscape");
	assert.equal(getInkWashPreset("missing").id, "landscape");
});
