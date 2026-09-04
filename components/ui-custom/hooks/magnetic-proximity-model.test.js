const assert = require("node:assert/strict");
const test = require("node:test");

const { resolveMagneticPointerRelation } = require("./magnetic-proximity-model.ts");

const TARGET_RECT = {
	bottom: 140,
	left: 100,
	right: 200,
	top: 100,
};

test("magnetic pointer relation distinguishes the target, its 24px halo, and outside", () => {
	assert.equal(resolveMagneticPointerRelation({ x: 150, y: 120 }, TARGET_RECT, 24), "target");
	assert.equal(resolveMagneticPointerRelation({ x: 90, y: 120 }, TARGET_RECT, 24), "near");
	assert.equal(resolveMagneticPointerRelation({ x: 76, y: 120 }, TARGET_RECT, 24), "near");
	assert.equal(resolveMagneticPointerRelation({ x: 75, y: 120 }, TARGET_RECT, 24), "outside");
	assert.equal(resolveMagneticPointerRelation({ x: 150, y: 165 }, TARGET_RECT, 24), "outside");
});
