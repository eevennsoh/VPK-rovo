const assert = require("node:assert/strict");
const { join } = require("node:path");
const test = require("node:test");

const esbuild = require("esbuild");
const { loadCjsModuleFromText } = require(join(process.cwd(), "scripts/lib/esbuild-cjs-loader.js"));

const {
	firstUnviewedSnapshot,
	formatInsightsNudgeLabel,
	formatInsightsToggleAriaLabel,
	INSIGHTS_NUDGE_MAX_ROWS,
	selectInsightsNudgeRows,
	selectUnviewedSnapshots,
} = require("./board-insights-nudge.ts");
const {
	countUnviewedTimelineSnapshots,
	EXPERIMENTAL_BOARD_LAST_VIEWED_AT,
	latestTimelineTimestamp,
} = require("./timeline-activity.ts");

// The two modules under test are leaves — type-only relative imports — so they
// load through Node's own TypeScript support. The fixture is not: it pulls in
// sibling data modules by extensionless specifier, which Node's ESM resolver
// rejects. Bundling it is the smallest way to keep the real seven-snapshot
// timeline under test rather than substituting a hand-written stand-in.
const { PULSE_TIMELINE } = loadCjsModuleFromText(esbuild.buildSync({
	bundle: true,
	format: "cjs",
	platform: "node",
	stdin: {
		contents: 'export { PULSE_TIMELINE } from "./components/blocks/jira-kanban/experimental/pulse/data/pulse-timeline";',
		loader: "ts",
		resolveDir: process.cwd(),
		sourcefile: "board-insights-nudge-fixture.ts",
	},
	tsconfig: join(process.cwd(), "tsconfig.json"),
	write: false,
}).outputFiles[0].text);

const SNAPSHOTS = PULSE_TIMELINE.snapshots;
const BEFORE_EVERYTHING = "2026-01-01T00:00:00.000Z";
const NEWEST_TIMESTAMP = latestTimelineTimestamp(SNAPSHOTS);

function ids(snapshots) {
	return snapshots.map((snapshot) => snapshot.id);
}

/* ------------------------------------------------------------------ */
/* The real fixture                                                     */
/* ------------------------------------------------------------------ */

test("the demo last visit leaves exactly the later-week snapshots unviewed", () => {
	const unviewed = selectUnviewedSnapshots(SNAPSHOTS, EXPERIMENTAL_BOARD_LAST_VIEWED_AT);

	assert.equal(SNAPSHOTS.length, 7, "fixture should still be the seven-snapshot sprint week");
	assert.deepEqual(ids(unviewed), ["s5-design-review", "s6-rehearsal", "s7-ship-readiness"]);
});

test("contract: the nudge and the header pill can never disagree on the count", () => {
	// The pill on the Insights toggle is `countUnviewedTimelineSnapshots`; the
	// card body is `selectUnviewedSnapshots`. If these two ever drift, the board
	// promises three insights and then shows a different number of rows.
	const watermarks = [
		null,
		undefined,
		BEFORE_EVERYTHING,
		EXPERIMENTAL_BOARD_LAST_VIEWED_AT,
		NEWEST_TIMESTAMP,
		"not-a-date",
	];

	for (const watermark of watermarks) {
		assert.equal(
			selectUnviewedSnapshots(SNAPSHOTS, watermark).length,
			countUnviewedTimelineSnapshots(SNAPSHOTS, watermark ?? null),
			`disagreement at watermark ${String(watermark)}`,
		);
	}
});

/* ------------------------------------------------------------------ */
/* Ordering and the deep-link target                                    */
/* ------------------------------------------------------------------ */

test("unviewed snapshots come back oldest first, so the card reads forward", () => {
	const unviewed = selectUnviewedSnapshots(SNAPSHOTS, EXPERIMENTAL_BOARD_LAST_VIEWED_AT);
	const timestamps = unviewed.map((snapshot) => Date.parse(snapshot.timestamp));

	for (let index = 1; index < timestamps.length; index += 1) {
		assert.ok(timestamps[index] > timestamps[index - 1], "snapshots must ascend in time");
	}
});

test("the primary action deep-links to the OLDEST unviewed snapshot, not the newest", () => {
	// "Read forward from where you left off" — landing on the newest would skip
	// the two insights in between.
	const first = firstUnviewedSnapshot(SNAPSHOTS, EXPERIMENTAL_BOARD_LAST_VIEWED_AT);

	assert.equal(first.id, "s5-design-review");
	assert.notEqual(first.id, "s7-ship-readiness");
});

test("a fully-read board has no deep-link target", () => {
	assert.equal(firstUnviewedSnapshot(SNAPSHOTS, NEWEST_TIMESTAMP), null);
	assert.equal(firstUnviewedSnapshot([], null), null);
});

test("input order does not change output order", () => {
	const reversed = [...SNAPSHOTS].reverse();
	const shuffled = [SNAPSHOTS[6], SNAPSHOTS[0], SNAPSHOTS[4], SNAPSHOTS[2], SNAPSHOTS[5], SNAPSHOTS[1], SNAPSHOTS[3]];
	const expected = ids(selectUnviewedSnapshots(SNAPSHOTS, BEFORE_EVERYTHING));

	assert.deepEqual(ids(selectUnviewedSnapshots(reversed, BEFORE_EVERYTHING)), expected);
	assert.deepEqual(ids(selectUnviewedSnapshots(shuffled, BEFORE_EVERYTHING)), expected);
});

test("repeated calls are deterministic and do not mutate the caller's array", () => {
	const input = [...SNAPSHOTS];
	const inputOrder = ids(input);
	const first = ids(selectUnviewedSnapshots(input, BEFORE_EVERYTHING));

	for (let attempt = 0; attempt < 3; attempt += 1) {
		assert.deepEqual(ids(selectUnviewedSnapshots(input, BEFORE_EVERYTHING)), first);
	}
	assert.deepEqual(ids(input), inputOrder, "the caller's array must not be sorted in place");
});

/* ------------------------------------------------------------------ */
/* Row capping and overflow                                             */
/* ------------------------------------------------------------------ */

test("the card caps at three rows and reports the remainder as overflow", () => {
	const { overflowCount, rows, totalCount } = selectInsightsNudgeRows(SNAPSHOTS, BEFORE_EVERYTHING);

	assert.equal(totalCount, 7);
	assert.equal(rows.length, INSIGHTS_NUDGE_MAX_ROWS);
	assert.equal(rows.length, 3);
	assert.equal(overflowCount, 4);
	assert.deepEqual(ids(rows), ["s1-kickoff", "s2-spike", "s3-regression"]);
});

test("three unviewed snapshots fill the card with nothing left over", () => {
	const { overflowCount, rows, totalCount } = selectInsightsNudgeRows(
		SNAPSHOTS,
		EXPERIMENTAL_BOARD_LAST_VIEWED_AT,
	);

	assert.equal(totalCount, 3);
	assert.equal(rows.length, 3);
	assert.equal(overflowCount, 0);
});

test("zero state: a caught-up board produces no rows and no overflow", () => {
	const { overflowCount, rows, totalCount } = selectInsightsNudgeRows(SNAPSHOTS, NEWEST_TIMESTAMP);

	assert.equal(totalCount, 0);
	assert.equal(rows.length, 0);
	assert.equal(overflowCount, 0);
	assert.deepEqual(selectInsightsNudgeRows([], null), { overflowCount: 0, rows: [], totalCount: 0 });
});

test("a never-viewed board treats every snapshot as unviewed", () => {
	assert.equal(selectInsightsNudgeRows(SNAPSHOTS, null).totalCount, 7);
	assert.equal(selectInsightsNudgeRows(SNAPSHOTS, undefined).totalCount, 7);
});

/* ------------------------------------------------------------------ */
/* Copy                                                                 */
/* ------------------------------------------------------------------ */

test("zero state produces no visible copy and no aria-label", () => {
	assert.equal(formatInsightsNudgeLabel(0), "");
	assert.equal(formatInsightsNudgeLabel(-2), "");
	assert.equal(formatInsightsToggleAriaLabel(0), undefined);
	assert.equal(formatInsightsToggleAriaLabel(-2), undefined);
});

test("singular copy drops the plural in both the pill and the aria-label", () => {
	// One unviewed snapshot: the watermark sits between s6 and s7.
	const oneUnviewed = selectInsightsNudgeRows(SNAPSHOTS, "2026-08-21T00:00:00.000Z");

	assert.equal(oneUnviewed.totalCount, 1);
	assert.deepEqual(ids(oneUnviewed.rows), ["s7-ship-readiness"]);
	assert.equal(formatInsightsNudgeLabel(oneUnviewed.totalCount), "1 new insight");
	assert.equal(
		formatInsightsToggleAriaLabel(oneUnviewed.totalCount),
		"Insights, 1 new update since you last viewed",
	);
});

test("plural copy matches the demo's three unviewed insights", () => {
	const count = selectInsightsNudgeRows(SNAPSHOTS, EXPERIMENTAL_BOARD_LAST_VIEWED_AT).totalCount;

	assert.equal(formatInsightsNudgeLabel(count), "3 new insights");
	assert.equal(
		formatInsightsToggleAriaLabel(count),
		"Insights, 3 new updates since you last viewed",
	);
});

test("the aria-label reproduces the toggle's long-standing wording exactly", () => {
	// `PulseModeToggle` consumes this helper, so these strings are the rendered
	// screen-reader copy. Changing them is a copy decision, not a refactor.
	assert.equal(formatInsightsToggleAriaLabel(1), "Insights, 1 new update since you last viewed");
	assert.equal(formatInsightsToggleAriaLabel(2), "Insights, 2 new updates since you last viewed");
	assert.equal(formatInsightsToggleAriaLabel(12), "Insights, 12 new updates since you last viewed");
});

/* ------------------------------------------------------------------ */
/* Malformed input                                                      */
/* ------------------------------------------------------------------ */

test("a malformed snapshot clock never throws and never counts as new", () => {
	const withGarbage = [
		...SNAPSHOTS,
		{ ...SNAPSHOTS[0], id: "s0-broken-clock", timestamp: "whenever" },
	];

	assert.doesNotThrow(() => selectUnviewedSnapshots(withGarbage, EXPERIMENTAL_BOARD_LAST_VIEWED_AT));
	assert.deepEqual(
		ids(selectUnviewedSnapshots(withGarbage, EXPERIMENTAL_BOARD_LAST_VIEWED_AT)),
		["s5-design-review", "s6-rehearsal", "s7-ship-readiness"],
	);
});

test("malformed clocks sort last and stay in a stable order", () => {
	// With no watermark everything is unviewed, including the unparseable ones,
	// which must land at the end in a fixed order rather than wherever the
	// caller happened to put them.
	const broken = [
		{ ...SNAPSHOTS[0], id: "z-broken", timestamp: "whenever" },
		{ ...SNAPSHOTS[0], id: "a-broken", timestamp: "" },
		SNAPSHOTS[6],
		SNAPSHOTS[0],
	];

	assert.deepEqual(
		ids(selectUnviewedSnapshots(broken, null)),
		["s1-kickoff", "s7-ship-readiness", "a-broken", "z-broken"],
	);
	assert.deepEqual(
		ids(selectUnviewedSnapshots([...broken].reverse(), null)),
		["s1-kickoff", "s7-ship-readiness", "a-broken", "z-broken"],
	);
});

test("an unparseable watermark falls back to never-viewed rather than throwing", () => {
	assert.doesNotThrow(() => selectUnviewedSnapshots(SNAPSHOTS, "last tuesday"));
	assert.equal(selectUnviewedSnapshots(SNAPSHOTS, "last tuesday").length, SNAPSHOTS.length);
});

test("non-finite counts produce no copy instead of NaN strings", () => {
	assert.equal(formatInsightsNudgeLabel(Number.NaN), "");
	assert.equal(formatInsightsToggleAriaLabel(Number.NaN), undefined);
});
