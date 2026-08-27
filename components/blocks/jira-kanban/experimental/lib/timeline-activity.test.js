const assert = require("node:assert/strict");
const test = require("node:test");

const {
	countUnviewedTimelineSnapshots,
	EXPERIMENTAL_BOARD_LAST_VIEWED_AT,
	latestTimelineTimestamp,
	markTimelineViewed,
} = require("./timeline-activity.ts");

const SNAPSHOTS = [
	{ timestamp: "2026-08-17T08:12:00Z" },
	{ timestamp: "2026-08-19T02:30:00Z" },
	{ timestamp: "2026-08-19T15:20:00Z" },
	{ timestamp: "2026-08-20T09:45:00Z" },
	{ timestamp: "2026-08-21T17:30:00Z" },
];

test("never-viewed boards count every snapshot as unread", () => {
	assert.equal(countUnviewedTimelineSnapshots(SNAPSHOTS, null), SNAPSHOTS.length);
});

test("the demo last visit leaves the later-week snapshots unread", () => {
	assert.equal(
		countUnviewedTimelineSnapshots(SNAPSHOTS, EXPERIMENTAL_BOARD_LAST_VIEWED_AT),
		3,
	);
});

test("marking the timeline viewed uses the latest snapshot clock", () => {
	assert.equal(latestTimelineTimestamp(SNAPSHOTS), "2026-08-21T17:30:00Z");
	assert.equal(markTimelineViewed({ snapshots: SNAPSHOTS }), "2026-08-21T17:30:00Z");
	assert.equal(
		countUnviewedTimelineSnapshots(SNAPSHOTS, markTimelineViewed({ snapshots: SNAPSHOTS })),
		0,
	);
});
