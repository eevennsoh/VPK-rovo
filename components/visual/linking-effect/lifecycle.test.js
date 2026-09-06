const assert = require("node:assert/strict");
const test = require("node:test");

const {
	LINKING_EFFECT_DEFAULT_RANGE_PX,
	LINKING_EFFECT_FUSE_DURATION_MS,
	LINKING_EFFECT_FUSE_MIN_PROGRESS,
	advanceLinkingEffectVelocity,
	isLinkingEffectActive,
	resolveLinkingEffectFuseNearness,
	resolveLinkingEffectFuseProgress,
	resolveLinkingEffectNearness,
	lerpLinkingEffectTarget,
} = require("./lifecycle.ts");

test("nearness is a smoothstep ramp, not a linear one", () => {
	assert.equal(resolveLinkingEffectNearness(0), 1);
	assert.equal(resolveLinkingEffectNearness(LINKING_EFFECT_DEFAULT_RANGE_PX), 0);
	assert.equal(resolveLinkingEffectNearness(9999), 0);
	// Halfway through the range a linear ramp would read 0.5; smoothstep agrees
	// only at the midpoint, and sits below it at the quarter mark.
	assert.equal(resolveLinkingEffectNearness(60), 0.5);
	assert.ok(resolveLinkingEffectNearness(90) < 0.25);
	assert.equal(resolveLinkingEffectNearness(30, 120), 0.84375);
});

test("nearness refuses to divide by a range it cannot use", () => {
	assert.equal(resolveLinkingEffectNearness(10, 0), 0);
	assert.equal(resolveLinkingEffectNearness(10, -5), 0);
	assert.equal(resolveLinkingEffectNearness(Number.NaN), 0);
});

test("reduced motion vetoes the effect even mid-fuse", () => {
	assert.equal(
		isLinkingEffectActive({ hasRelease: true, nearness: 1, shouldReduceMotion: true }),
		false,
	);
	assert.equal(
		isLinkingEffectActive({ hasRelease: false, nearness: 1, shouldReduceMotion: true }),
		false,
	);
});

test("the effect wakes on any approach and stays awake through the fuse", () => {
	assert.equal(
		isLinkingEffectActive({ hasRelease: false, nearness: 0, shouldReduceMotion: false }),
		false,
	);
	assert.equal(
		isLinkingEffectActive({ hasRelease: false, nearness: 0.01, shouldReduceMotion: null }),
		true,
	);
	assert.equal(
		isLinkingEffectActive({ hasRelease: true, nearness: 0, shouldReduceMotion: false }),
		true,
	);
});

test("an armed fuse never reports a clean zero, so the field cannot blink out", () => {
	assert.equal(resolveLinkingEffectFuseProgress(0), LINKING_EFFECT_FUSE_MIN_PROGRESS);
	assert.equal(resolveLinkingEffectFuseProgress(-16), LINKING_EFFECT_FUSE_MIN_PROGRESS);
	assert.equal(resolveLinkingEffectFuseProgress(Number.NaN), LINKING_EFFECT_FUSE_MIN_PROGRESS);
});

test("fuse progress reaches exactly 1 at the duration token and clamps beyond it", () => {
	assert.equal(resolveLinkingEffectFuseProgress(LINKING_EFFECT_FUSE_DURATION_MS / 2), 0.5);
	assert.equal(resolveLinkingEffectFuseProgress(LINKING_EFFECT_FUSE_DURATION_MS), 1);
	assert.equal(resolveLinkingEffectFuseProgress(5000), 1);
});

test("fuse nearness decays the approach value to zero so alpha can collapse", () => {
	assert.equal(resolveLinkingEffectFuseNearness(1, 0), 1);
	assert.equal(resolveLinkingEffectFuseNearness(1, 0.25), 0.75);
	assert.equal(resolveLinkingEffectFuseNearness(1, 1), 0);
	assert.equal(resolveLinkingEffectFuseNearness(0.4, 0.5), 0.2);
});

test("out-of-range nearness and progress are clamped rather than extrapolated", () => {
	assert.equal(resolveLinkingEffectFuseNearness(4, 0), 1);
	assert.equal(resolveLinkingEffectFuseNearness(1, 4), 0);
	assert.equal(resolveLinkingEffectFuseNearness(Number.NaN, 0), 0);
});

test("velocity smoothing eases toward the sample instead of snapping to it", () => {
	assert.deepEqual(
		advanceLinkingEffectVelocity({ x: 0, y: 0 }, { x: 10, y: -20 }, 0.5),
		{ x: 5, y: -10 },
	);
	assert.deepEqual(
		advanceLinkingEffectVelocity({ x: 4, y: 4 }, { x: 0, y: 0 }, 0),
		{ x: 4, y: 4 },
	);
	assert.deepEqual(
		advanceLinkingEffectVelocity({ x: 4, y: 4 }, { x: 9, y: 1 }, 1),
		{ x: 9, y: 1 },
	);
});

const CARD = { anchor: { x: 240, y: 372 }, height: 144, radius: 10, width: 272 };
const ROW = { anchor: { x: 240, y: 428 }, height: 24, radius: 6, width: 264 };

test("the landing shape morphs between two rects instead of swapping", () => {
	assert.deepEqual(lerpLinkingEffectTarget(CARD, ROW, 0), CARD);
	assert.deepEqual(lerpLinkingEffectTarget(CARD, ROW, 1), ROW);

	// easeInOut(0.5) is exactly 0.5, so the midpoint is a plain average.
	assert.deepEqual(lerpLinkingEffectTarget(CARD, ROW, 0.5), {
		anchor: { x: 240, y: 400 },
		height: 84,
		radius: 8,
		width: 268,
	});
});

test("a missing shape on either side means no morph, just the other one", () => {
	assert.deepEqual(lerpLinkingEffectTarget(undefined, ROW, 0), ROW);
	assert.deepEqual(lerpLinkingEffectTarget(null, ROW, 0.5), ROW);
	assert.deepEqual(lerpLinkingEffectTarget(CARD, null, 0.5), CARD);
	assert.equal(lerpLinkingEffectTarget(null, null, 0.5), null);
});

test("out-of-range fuse progress cannot overshoot the landing shape", () => {
	assert.deepEqual(lerpLinkingEffectTarget(CARD, ROW, -1), CARD);
	assert.deepEqual(lerpLinkingEffectTarget(CARD, ROW, 4), ROW);
	assert.deepEqual(lerpLinkingEffectTarget(CARD, ROW, Number.NaN), CARD);
});
