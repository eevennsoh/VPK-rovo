const assert = require("node:assert/strict");
const { test } = require("node:test");

const {
	hasTrailingContentUnderlap,
} = require("./jira-list-horizontal-underlap.ts");

test("trailing content underlap stays visible until the measured scroll end", () => {
	assert.equal(hasTrailingContentUnderlap({
		clientWidth: 1158,
		scrollLeft: 0,
		scrollWidth: 1602,
		trailingInset: 32,
	}), true);

	assert.equal(hasTrailingContentUnderlap({
		clientWidth: 1158,
		scrollLeft: 412,
		scrollWidth: 1602,
		trailingInset: 32,
	}), true);

	assert.equal(hasTrailingContentUnderlap({
		clientWidth: 1158,
		scrollLeft: 444,
		scrollWidth: 1602,
		trailingInset: 32,
	}), false);
});

test("trailing content underlap is disabled without reserved panel space", () => {
	assert.equal(hasTrailingContentUnderlap({
		clientWidth: 1000,
		scrollLeft: 0,
		scrollWidth: 1400,
		trailingInset: 0,
	}), false);
});

test("trailing content underlap tolerates fractional scroll metrics at the end", () => {
	assert.equal(hasTrailingContentUnderlap({
		clientWidth: 1000,
		scrollLeft: 399.4,
		scrollWidth: 1400,
		trailingInset: 32,
	}), false);
});
