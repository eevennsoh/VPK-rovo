const assert = require("node:assert/strict");
const test = require("node:test");

const { splitProfitLossSegments } = require("./profit-loss-segments.ts");

function xAccessor(point) {
	return point.date;
}

test("splitProfitLossSegments preserves zero crossings as segment boundaries", () => {
	const segments = splitProfitLossSegments({
		data: [
			{ date: new Date(0), pnl: 10 },
			{ date: new Date(1000), pnl: -10 },
			{ date: new Date(2000), pnl: 10 },
		],
		dataKey: "pnl",
		xAccessor,
	});

	assert.deepEqual(
		segments.map((segment) => segment.isPositive),
		[true, false, true],
	);
	assert.deepEqual(
		segments.map((segment) =>
			segment.data.map((point) => ({
				time: point.date.getTime(),
				pnl: point.pnl,
			})),
		),
		[
			[
				{ time: 0, pnl: 10 },
				{ time: 500, pnl: 0 },
			],
			[
				{ time: 500, pnl: 0 },
				{ time: 1000, pnl: -10 },
				{ time: 1500, pnl: 0 },
			],
			[
				{ time: 1500, pnl: 0 },
				{ time: 2000, pnl: 10 },
			],
		],
	);
});
