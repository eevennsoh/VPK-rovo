import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const ROOT = process.cwd();
const DATA_SOURCE = readFileSync(path.join(ROOT, "components/visual/liquid-metal/data.ts"), "utf8");
const PRESETS_SOURCE = readFileSync(path.join(ROOT, "components/visual/liquid-metal/vendor/metal-fx/src/engine/presets.ts"), "utf8");
const TYPES_SOURCE = readFileSync(path.join(ROOT, "components/visual/liquid-metal/vendor/metal-fx/src/types.ts"), "utf8");

function unionValues(source, typeName) {
	const match = source.match(new RegExp(`export type ${typeName} = ([^;]+);`, "u"));
	assert.ok(match, `missing ${typeName}`);
	return [...match[1].matchAll(/["']([^"']+)["']/gu)].map((valueMatch) => valueMatch[1]);
}

function optionValues(source, constName) {
	const match = source.match(new RegExp(`export const ${constName}[\\s\\S]*?\\];`, "u"));
	assert.ok(match, `missing ${constName}`);
	return [...match[0].matchAll(/value: "([^"]+)"/gu)].map((valueMatch) => valueMatch[1]);
}

test("Liquid Metal exposes the upstream metal-fx option contract", () => {
	assert.deepEqual(unionValues(TYPES_SOURCE, "MetalFxVariant"), ["button", "circle"]);
	assert.deepEqual(unionValues(TYPES_SOURCE, "MetalFxPreset"), ["chromatic", "silver", "gold"]);
	assert.deepEqual(unionValues(TYPES_SOURCE, "MetalFxTheme").sort(), ["auto", "dark", "light"]);
	assert.deepEqual(unionValues(DATA_SOURCE, "LiquidMetalReflectionTargetsMode"), ["none", "refs"]);
	assert.deepEqual(optionValues(DATA_SOURCE, "LIQUID_METAL_VARIANT_OPTIONS"), ["button", "circle"]);
	assert.match(PRESETS_SOURCE, /export const PRESETS: Record<PresetName, Preset> = \{\s+chromatic: CHROMATIC,\s+silver: SILVER,\s+gold: GOLD,\s+\};/u);
	assert.deepEqual(optionValues(DATA_SOURCE, "LIQUID_METAL_THEME_OPTIONS"), ["auto", "dark", "light"]);
	assert.deepEqual(optionValues(DATA_SOURCE, "LIQUID_METAL_REFLECTION_TARGET_MODE_OPTIONS"), ["none", "refs"]);
});

test("Liquid Metal keeps upstream source metadata available", () => {
	assert.match(DATA_SOURCE, /repository: "https:\/\/github\.com\/Jakubantalik\/metal-fx"/u);
	assert.match(DATA_SOURCE, /commit: "be1bf89c63056521a4e8224f368768314c9006f7"/u);
	assert.match(DATA_SOURCE, /packageName: "metal-fx"/u);
	assert.match(DATA_SOURCE, /packageVersion: "1\.0\.4"/u);
	assert.match(DATA_SOURCE, /license: "MIT"/u);
	assert.match(DATA_SOURCE, /archiveSha256: "[a-f0-9]{64}"/u);
});

test("Liquid Metal numeric controls cover all upstream numeric effect props", () => {
	for (const key of ["strength", "borderRadius", "shaderScale", "ringCssPx", "scale"]) {
		assert.match(DATA_SOURCE, new RegExp(`${key}: \\{ min: [^}]+defaultValue: [^}]+\\}`, "u"));
	}
});

test("Liquid Metal data does not add presentation-only upstream aliases", () => {
	assert.doesNotMatch(DATA_SOURCE, /LiquidMetal(?:Variant|Preset|Theme)/u);
	assert.doesNotMatch(DATA_SOURCE, /graphite|pearl|reflectionMode|PRESENTATION/u);
});
