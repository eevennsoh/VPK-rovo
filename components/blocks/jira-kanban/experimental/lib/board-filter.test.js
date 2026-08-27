const assert = require("node:assert/strict");
const test = require("node:test");

const {
	BOARD_FILTER_DEMO_NOW_ISO,
	countBoardFilterSelections,
	EMPTY_BOARD_FILTER_DAYS,
	EMPTY_BOARD_FILTER_VALUE_SELECTIONS,
	filterPulseTimelineByDays,
	isTimestampInDaysRange,
	resolveBoardFilterDaysRange,
	toggleBoardFilterValue,
} = require("./board-filter.ts");

const NOW = new Date(BOARD_FILTER_DEMO_NOW_ISO);

function snapshotIds(timeline) {
	return timeline.snapshots.map((snapshot) => snapshot.id);
}

test("Today on the demo clock covers the last Pulse snapshot day", () => {
	const range = resolveBoardFilterDaysRange({ preset: "today" }, NOW);
	assert.ok(range);
	assert.equal(isTimestampInDaysRange("2026-08-21T17:30:00Z", range), true);
	assert.equal(isTimestampInDaysRange("2026-08-20T09:45:00Z", range), false);
});

test("Yesterday and lookback windows are inclusive UTC days", () => {
	const yesterday = resolveBoardFilterDaysRange({ preset: "yesterday" }, NOW);
	assert.ok(yesterday);
	assert.equal(isTimestampInDaysRange("2026-08-20T09:45:00Z", yesterday), true);
	assert.equal(isTimestampInDaysRange("2026-08-21T17:30:00Z", yesterday), false);

	const lastThree = resolveBoardFilterDaysRange({ preset: "last-3-days" }, NOW);
	assert.ok(lastThree);
	assert.equal(isTimestampInDaysRange("2026-08-19T02:30:00Z", lastThree), true);
	assert.equal(isTimestampInDaysRange("2026-08-18T11:05:00Z", lastThree), false);
});

test("Custom ranges swap inverted bounds and ignore incomplete picks", () => {
	assert.equal(resolveBoardFilterDaysRange({ preset: "custom" }, NOW), null);
	const inverted = resolveBoardFilterDaysRange({
		customEnd: "2026-08-18",
		customStart: "2026-08-21",
		preset: "custom",
	}, NOW);
	assert.ok(inverted);
	assert.equal(isTimestampInDaysRange("2026-08-19T15:20:00Z", inverted), true);
	assert.equal(isTimestampInDaysRange("2026-08-17T08:12:00Z", inverted), false);
});

test("Days filter keeps Pulse snapshot order and drops out-of-window entries", () => {
	const timeline = {
		looseWork: [],
		members: [],
		projectLabel: "PAY · test",
		snapshots: [
			{ id: "s1", timestamp: "2026-08-17T08:12:00Z" },
			{ id: "s6", timestamp: "2026-08-20T09:45:00Z" },
			{ id: "s7", timestamp: "2026-08-21T17:30:00Z" },
		],
		workItems: [],
	};
	assert.deepEqual(
		snapshotIds(filterPulseTimelineByDays(timeline, { preset: "yesterday" }, NOW)),
		["s6"],
	);
	assert.deepEqual(
		snapshotIds(filterPulseTimelineByDays(timeline, EMPTY_BOARD_FILTER_DAYS, NOW)),
		["s1", "s6", "s7"],
	);
});

test("Selection count treats days as one chip and toggles value ids", () => {
	const withAssignee = toggleBoardFilterValue(
		EMPTY_BOARD_FILTER_VALUE_SELECTIONS,
		"assignee",
		"maya",
	);
	assert.deepEqual(withAssignee.assignee, ["maya"]);
	assert.equal(countBoardFilterSelections(withAssignee, EMPTY_BOARD_FILTER_DAYS), 1);
	assert.equal(countBoardFilterSelections(withAssignee, { preset: "today" }), 2);
	assert.equal(
		countBoardFilterSelections(withAssignee, { preset: "custom" }),
		1,
		"an unfinished custom range is not a selection",
	);
});
