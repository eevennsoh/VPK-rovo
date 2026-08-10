const assert = require("node:assert/strict");
const test = require("node:test");

const { loadRovoCoreModule } = require("../test-utils/load-rovo-core-module.cjs");

const { getResistedMinimumWidth } = loadRovoCoreModule("hooks/use-sidebar-resize.ts");

test("minimum-width resistance becomes progressively firmer without crossing the cutoff", () => {
	const minWidth = 440;
	const startWidth = 720;
	const firstWidth = getResistedMinimumWidth(470, startWidth, minWidth);
	const secondWidth = getResistedMinimumWidth(450, startWidth, minWidth);
	const thirdWidth = getResistedMinimumWidth(430, startWidth, minWidth);

	assert.ok(firstWidth > secondWidth);
	assert.ok(secondWidth > thirdWidth);
	assert.ok(thirdWidth > minWidth);
	assert.ok(firstWidth - secondWidth > secondWidth - thirdWidth);
	assert.equal(getResistedMinimumWidth(600, startWidth, minWidth), 600);
	assert.equal(getResistedMinimumWidth(400, minWidth, minWidth), minWidth);
});
