const assert = require("node:assert/strict");
const test = require("node:test");

const { parseRunningCheckElapsedSeconds } = require("./pull-request-check-elapsed.ts");

test("parseRunningCheckElapsedSeconds reads bare-second fixture offsets", () => {
	assert.equal(parseRunningCheckElapsedSeconds("Running for 6s"), 6);
	assert.equal(parseRunningCheckElapsedSeconds("Running for 48s"), 48);
	assert.equal(parseRunningCheckElapsedSeconds("Running for 12s"), 12);
});

test("parseRunningCheckElapsedSeconds reads minute and minute+second forms", () => {
	assert.equal(parseRunningCheckElapsedSeconds("Running for 5m"), 300);
	assert.equal(parseRunningCheckElapsedSeconds("Running for 1m 12s"), 72);
	assert.equal(parseRunningCheckElapsedSeconds("Running for 2m 04s"), 124);
});

test("parseRunningCheckElapsedSeconds leaves non-live details alone", () => {
	assert.equal(parseRunningCheckElapsedSeconds("Queued"), null);
	assert.equal(parseRunningCheckElapsedSeconds("Waiting for CI"), null);
	assert.equal(parseRunningCheckElapsedSeconds("Failed after 42s · deliveryAddress may be null"), null);
	assert.equal(parseRunningCheckElapsedSeconds("418 tests in 2m 46s"), null);
	assert.equal(parseRunningCheckElapsedSeconds("Rerunning after delivery-address repair"), null);
	assert.equal(parseRunningCheckElapsedSeconds("Rerun completed in 1m 18s"), null);
	assert.equal(parseRunningCheckElapsedSeconds(""), null);
});
