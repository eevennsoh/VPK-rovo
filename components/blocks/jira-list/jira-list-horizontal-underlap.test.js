const assert = require("node:assert/strict");
const { test } = require("node:test");

const {
	hasTrailingContentUnderlap,
} = require("./jira-list-horizontal-underlap.ts");

test("trailing content underlap ends when the table clears the measured panel edge", () => {
	const narrowMetrics = {
		panelLeadingEdge: 432,
		scrollportLeft: 17,
		scrollWidth: 1602,
		trailingInset: 32,
	};

	assert.equal(hasTrailingContentUnderlap({
		...narrowMetrics,
		scrollLeft: 0,
	}), true);

	assert.equal(hasTrailingContentUnderlap({
		...narrowMetrics,
		scrollLeft: 1153,
	}), true);

	assert.equal(hasTrailingContentUnderlap({
		...narrowMetrics,
		scrollLeft: 1155,
	}), false);

	assert.equal(hasTrailingContentUnderlap({
		...narrowMetrics,
		scrollLeft: 1172,
	}), false);
});

test("trailing content underlap is disabled without reserved panel space", () => {
	assert.equal(hasTrailingContentUnderlap({
		panelLeadingEdge: 968,
		scrollLeft: 0,
		scrollportLeft: 0,
		scrollWidth: 1400,
		trailingInset: 0,
	}), false);
});

test("trailing content underlap tolerates fractional scroll metrics at the end", () => {
	assert.equal(hasTrailingContentUnderlap({
		panelLeadingEdge: 968,
		scrollLeft: 399.4,
		scrollportLeft: 0,
		scrollWidth: 1400,
		trailingInset: 32,
	}), false);
});
