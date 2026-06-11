const assert = require("node:assert/strict");
const test = require("node:test");

const {
	filterHeatmapColumns,
	formatHeatmapContributionLabel,
	getHeatmapContributionLevel,
	getHeatmapTimeExtent,
} = require("./heatmap-utils.ts");
const {
	generateHeatmapSkeletonFromTarget,
} = require("./generate-heatmap-skeleton-data.ts");

function makeDate(day) {
	return new Date(2026, 0, day);
}

function makeColumn(columnIndex, startDay, counts = [0, 1, 2, 3, 4, 5, 6]) {
	return {
		bin: columnIndex,
		bins: counts.map((count, rowIndex) => ({
			bin: rowIndex,
			count,
			date: makeDate(startDay + rowIndex),
		})),
	};
}

test("getHeatmapTimeExtent returns the first and final bin dates", () => {
	const first = makeColumn(0, 1);
	const second = makeColumn(1, 8);

	assert.deepEqual(getHeatmapTimeExtent([first, second]), [
		first.bins[0].date,
		second.bins.at(-1).date,
	]);
	assert.equal(getHeatmapTimeExtent([]), null);
	assert.equal(getHeatmapTimeExtent([{ bin: 0, bins: [] }]), null);
});

test("filterHeatmapColumns keeps columns overlapping the date domain", () => {
	const columns = [
		makeColumn(0, 1),
		makeColumn(1, 8),
		makeColumn(2, 15),
		{ bin: 3, bins: [] },
	];

	assert.equal(filterHeatmapColumns(columns), columns);
	assert.deepEqual(
		filterHeatmapColumns(columns, [makeDate(15), makeDate(9)]).map((column) => column.bin),
		[1, 2],
	);
	assert.deepEqual(
		filterHeatmapColumns(columns, [makeDate(22), makeDate(30)]),
		[],
	);
});

test("heatmap contribution labels and levels match the public legend contract", () => {
	assert.equal(formatHeatmapContributionLabel(1, makeDate(2)), "1 contribution on January 2");
	assert.equal(formatHeatmapContributionLabel(4, makeDate(2)), "4 contributions on January 2");

	assert.deepEqual(
		[-2, 0, 1, 2, 3, 4, 10].map(getHeatmapContributionLevel),
		[0, 0, 1, 2, 3, 4, 4],
	);
});

test("heatmap skeleton data preserves week/day shape while zeroing counts", () => {
	const target = [makeColumn(0, 1, [3, 4]), makeColumn(1, 8, [5])];

	const skeleton = generateHeatmapSkeletonFromTarget(target);

	assert.deepEqual(skeleton, [{
		bin: 0,
		bins: [
			{ bin: 0, count: 0, date: target[0].bins[0].date },
			{ bin: 1, count: 0, date: target[0].bins[1].date },
		],
	}, {
		bin: 1,
		bins: [
			{ bin: 0, count: 0, date: target[1].bins[0].date },
		],
	}]);
	assert.equal(target[0].bins[0].count, 3);
});
