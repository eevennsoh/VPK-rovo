const assert = require("node:assert/strict");
const test = require("node:test");

// Node's test runner strips types from the dynamically-imported .ts module; the
// explicit extension is required. Matches components/visual/svg-tracing/lib.test.js.
const helpers = import("./lib.ts");

test("splitGraphemes treats a multi-codepoint emoji as one unit", async () => {
	const { splitGraphemes } = await helpers;
	// Family emoji = several code points joined by ZWJ; must be one grapheme.
	assert.deepEqual(splitGraphemes("a👍b"), ["a", "👍", "b"]);
	assert.equal(splitGraphemes("👩‍👩‍👧‍👦").length, 1);
});

test("reconcileTextKeys: identical text keeps every key and reports no change", async () => {
	const { reconcileTextKeys } = await helpers;
	const prevKeys = ["c0", "c1", "c2"];
	const result = reconcileTextKeys("abc", "abc", prevKeys, 3);

	assert.deepEqual(result.keys, prevKeys);
	assert.equal(result.changeRatio, 0);
	assert.equal(result.nextId, 3);
});

test("reconcileTextKeys: a pure insertion keeps shared keys and mints exactly one", async () => {
	const { reconcileTextKeys } = await helpers;
	// "ac" -> "abc": 'a' and 'c' persist, 'b' is inserted in the middle.
	const result = reconcileTextKeys("ac", "abc", ["c0", "c1"], 2);

	assert.equal(result.keys[0], "c0"); // 'a' retained
	assert.equal(result.keys[2], "c1"); // 'c' retained
	assert.equal(result.keys[1], "c2"); // 'b' newly minted
	assert.equal(result.nextId, 3);
	// 1 inserted + 0 removed over max length 3.
	assert.ok(Math.abs(result.changeRatio - 1 / 3) < 1e-9);
});

test("reconcileTextKeys: an equal-length full replacement mints all-new keys and drifts hardest", async () => {
	const { reconcileTextKeys } = await helpers;
	const result = reconcileTextKeys("abc", "xyz", ["c0", "c1", "c2"], 3);

	assert.deepEqual(result.keys, ["c3", "c4", "c5"]);
	// 3 inserted + 3 removed over max length 3 = 2.0. changeRatio is intentionally
	// unclamped (it scales drift), so a total swap drifts twice as hard as a half edit.
	assert.equal(result.changeRatio, 2);
	assert.equal(result.nextId, 6);
});

test("reconcileTextKeys: empty -> empty is treated as fully changed (no divide by zero)", async () => {
	const { reconcileTextKeys } = await helpers;
	const result = reconcileTextKeys("", "", [], 0);

	assert.deepEqual(result.keys, []);
	assert.equal(result.changeRatio, 1);
	assert.equal(result.nextId, 0);
});

test("reconcileDigitKeys: counting up reports a positive direction and reuses aligned trailing digits", async () => {
	const { reconcileDigitKeys } = await helpers;
	// "$9" -> "$10": '$' prefix stays; trailing '9'->'0' keeps its key, a new
	// leading '1' is minted. Direction is +1 (value increased).
	const result = reconcileDigitKeys("$9", "$10", [0, 1], 2);

	assert.equal(result.direction, 1);
	assert.equal(result.keys.length, 3); // '$', '1', '0'
	assert.equal(result.keys[0], 0); // '$' prefix retained
});

test("reconcileDigitKeys: counting down reports a negative direction", async () => {
	const { reconcileDigitKeys } = await helpers;
	const result = reconcileDigitKeys("$10", "$9", [0, 1, 2], 3);
	assert.equal(result.direction, -1);
});
