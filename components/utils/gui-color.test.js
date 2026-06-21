const assert = require("node:assert/strict");
const test = require("node:test");

const helpers = import("./gui-color.ts");

function roundTuple(values) {
	return values.map((value) => Number(value.toFixed(4)));
}

test("GUI color helpers resolve picker-compatible RGB hex values", async () => {
	const {
		parseGUIColorToRgbHex,
		resolveGUIColorPickerValue,
	} = await helpers;

	assert.equal(parseGUIColorToRgbHex("#36f"), "#3366FF");
	assert.equal(parseGUIColorToRgbHex("#3366FF80"), "#3366FF");
	assert.equal(parseGUIColorToRgbHex("rgb(34, 160, 107)"), "#22A06B");
	assert.equal(parseGUIColorToRgbHex("rgb(100% 0% 0% / 50%)"), "#FF0000");
	assert.equal(parseGUIColorToRgbHex("hsl(120 100% 50%)"), "#00FF00");
	assert.equal(resolveGUIColorPickerValue("not-a-color", "rgba(53, 125, 232, 0.5)"), "#357DE8");
	assert.equal(resolveGUIColorPickerValue("not-a-color"), "#000000");
});

test("GUI color helpers convert between RGBA, hex, CSS, and HSL", async () => {
	const {
		hexToRgbaUnit,
		hslaToRgbaUnit,
		rgbaUnitToCss,
		rgbaUnitToHex,
		rgbaUnitToHsla,
		rgbaUnitToRgb255,
		rgbaUnitToRgbHex,
	} = await helpers;

	assert.deepEqual(rgbaUnitToRgb255([1, 0.5, 0, 0.5]), [255, 128, 0]);
	assert.equal(rgbaUnitToRgbHex([1, 0.5, 0, 0.5]), "#FF8000");
	assert.equal(rgbaUnitToHex([1, 0.5, 0, 0.5]), "#FF800080");
	assert.equal(rgbaUnitToCss([1, 0.5, 0, 0.5]), "rgba(255, 128, 0, 0.500)");
	assert.deepEqual(roundTuple(hexToRgbaUnit("#0F08")), [0, 1, 0, 0.5333]);
	assert.deepEqual(roundTuple(hslaToRgbaUnit(120, 100, 50, 0.5)), [0, 1, 0, 0.5]);
	assert.deepEqual(roundTuple(rgbaUnitToHsla([0, 1, 0, 0.5])), [120, 100, 50, 0.5]);
});

test("GUI color list comparisons are normalized by trim and case", async () => {
	const {
		areGUIColorListsEqual,
		normalizeGUIColorValue,
	} = await helpers;

	assert.equal(normalizeGUIColorValue("  #AABBCC  "), "#aabbcc");
	assert.equal(areGUIColorListsEqual(["#AABBCC", " rgb(1, 2, 3) "], ["#aabbcc", "rgb(1, 2, 3)"]), true);
	assert.equal(areGUIColorListsEqual(["#AABBCC"], ["#AABBCC", "#000000"]), false);
});
