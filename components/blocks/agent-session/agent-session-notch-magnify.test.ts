import assert from "node:assert/strict";
import test from "node:test";

// @ts-expect-error Node's strip-types test runner requires the explicit .ts extension here.
import { AGENT_SESSION_NOTCH_LENGTH, AGENT_SESSION_NOTCH_MAGNIFY_RADIUS, AGENT_SESSION_NOTCH_NO_NEAREST, AGENT_SESSION_NOTCH_POINTER_AWAY, toAgentSessionNotchLength, toAgentSessionNotchMagnification, toAgentSessionNotchOpacity, toNearestAgentSessionNotchIndex } from "./agent-session-notch-magnify.ts";

/** The rail's pitch: a 20px notch row plus the list's 4px gap. */
const PITCH = 24;

/** Sixteen notches on the rail's pitch, centred like the measured ones. */
const CENTERS = Array.from({ length: 16 }, (_unused, index) => index * PITCH + 10);

test("the notch under the pointer is the peak, and the radius is the floor", () => {
	assert.equal(toAgentSessionNotchMagnification(0), 1);
	assert.equal(toAgentSessionNotchMagnification(AGENT_SESSION_NOTCH_MAGNIFY_RADIUS), 0);
	assert.equal(toAgentSessionNotchMagnification(AGENT_SESSION_NOTCH_MAGNIFY_RADIUS * 4), 0);
});

test("the profile is a mountain: monotonic falloff, symmetric either side", () => {
	// This is the whole visual promise — each notch further from the cursor is
	// strictly shorter than the one before it, so the rail reads as one slope
	// rather than a cluster of equally lit marks.
	let previous = Number.POSITIVE_INFINITY;
	for (let step = 0; step * PITCH <= AGENT_SESSION_NOTCH_MAGNIFY_RADIUS; step += 1) {
		const distance = step * PITCH;
		const current = toAgentSessionNotchMagnification(distance);
		assert.ok(current < previous, `expected ${distance}px to fall below ${distance - PITCH}px`);
		assert.equal(
			toAgentSessionNotchMagnification(-distance),
			current,
			"a notch above the pointer must match the one the same distance below",
		);
		previous = current;
	}
});

test("the slope tapers rather than cutting off — it is smooth at both ends", () => {
	// Quartic, so the derivative vanishes under the cursor and at the radius: the
	// notch nearest the pointer does not snap to peak, and the outermost one does
	// not pop as it enters range.
	const nearPeak = toAgentSessionNotchMagnification(0) - toAgentSessionNotchMagnification(4);
	const nearEdge = toAgentSessionNotchMagnification(AGENT_SESSION_NOTCH_MAGNIFY_RADIUS - 4);
	assert.ok(nearPeak < 0.02, "the crest must be flat, not a spike");
	assert.ok(nearEdge < 0.01, "the tail must reach zero, not step to it");
	// Three neighbours either side still move — a seven-notch slope — which is
	// what makes it read as a surface being pushed instead of one mark lighting
	// up, without the whole rail lifting at once.
	assert.ok(toAgentSessionNotchMagnification(PITCH * 3) > 0);
	assert.equal(toAgentSessionNotchMagnification(PITCH * 4), 0);
});

test("a parked pointer and non-finite input leave every notch at rest", () => {
	assert.ok(AGENT_SESSION_NOTCH_POINTER_AWAY < 0, "the parked pointer must read as out of range");
	assert.ok(Number.isFinite(AGENT_SESSION_NOTCH_POINTER_AWAY), "an Infinity would poison the motion value");
	assert.equal(toAgentSessionNotchMagnification(Number.NaN), 0);
	assert.equal(toAgentSessionNotchMagnification(Number.POSITIVE_INFINITY), 0);
	assert.equal(toAgentSessionNotchMagnification(10, 0), 0);
});

test("length interpolates between the resting mark and the rail's 24px channel", () => {
	assert.equal(toAgentSessionNotchLength(0, false), AGENT_SESSION_NOTCH_LENGTH.rest);
	assert.equal(toAgentSessionNotchLength(1, false), AGENT_SESSION_NOTCH_LENGTH.peak);
	assert.equal(toAgentSessionNotchLength(0.5, false), 18);
	// A newly synced notch rests part-way up the ramp — already lit — and still
	// tops out at the same channel, so it can never overrun the rail.
	assert.equal(toAgentSessionNotchLength(0, true), AGENT_SESSION_NOTCH_LENGTH.newRest);
	assert.equal(toAgentSessionNotchLength(1, true), AGENT_SESSION_NOTCH_LENGTH.peak);
});

test("out-of-range magnification is clamped, never extrapolated", () => {
	// The transform multiplies falloff by the swell amount; a stray value must not
	// be able to grow a notch past the 24px channel or invert it.
	assert.equal(toAgentSessionNotchLength(4, false), AGENT_SESSION_NOTCH_LENGTH.peak);
	assert.equal(toAgentSessionNotchLength(-3, false), AGENT_SESSION_NOTCH_LENGTH.rest);
	assert.equal(toAgentSessionNotchLength(Number.NaN, false), AGENT_SESSION_NOTCH_LENGTH.rest);
	assert.equal(toAgentSessionNotchOpacity(4, false), 1);
	assert.equal(toAgentSessionNotchOpacity(-3, false), 0.69);
	assert.equal(toAgentSessionNotchOpacity(Number.NaN, true), 1);
});

test("a resting notch is as legible as the unmagnified mark beside it", () => {
	// 0.69 alpha of `color.icon` over `elevation.surface.sunken` resolves to
	// `color.icon.subtlest` in both themes — the exact alphas are 0.681 light and
	// 0.692 dark, so one number lands within a channel level or two of each. A
	// 1px hairline has no weight to spare, so the swell brightens from that floor
	// rather than dimming below it.
	const blend = (fg: number, bg: number, alpha: number) => Math.round(alpha * fg + (1 - alpha) * bg);
	const rest = toAgentSessionNotchOpacity(0, false);
	const near = (actual: number, target: number, theme: string) => {
		assert.ok(
			Math.abs(actual - target) <= 2,
			`${theme}: resting notch resolved to ${actual}, expected within 2 of icon.subtlest ${target}`,
		);
	};
	// light: color.icon #292A2E over elevation.surface.sunken #F8F8F8 → #6B6E76
	near(blend(0x29, 0xf8, rest), 0x6b, "light");
	// dark: color.icon #CECFD2 over elevation.surface.sunken #18191A → #96999E
	near(blend(0xce, 0x18, rest), 0x96, "dark");
});

test("colour marks the selected notch alone, never the slope around it", () => {
	// The regression this guards: darkening every notch in proportion to its
	// distance turned seven marks into one grey gradient, and the notch actually
	// under the pointer stopped being findable. Length carries proximity; colour
	// carries selection, and selection is one notch.
	const selected = toAgentSessionNotchOpacity(1, false);
	const neighbour = toAgentSessionNotchOpacity(0, false);
	assert.equal(selected, 1, "the selected notch takes full color.icon");
	assert.equal(neighbour, 0.69, "an unselected notch holds color.icon.subtlest");
	// Its neighbour is still visibly longer — the slope is intact, unpainted.
	assert.ok(
		toAgentSessionNotchLength(toAgentSessionNotchMagnification(PITCH), false)
			> toAgentSessionNotchLength(0, false),
		"the notch beside the selected one must still ride the swell",
	);
});

test("the nearest notch owns the pointer, with no gap between two of them", () => {
	assert.equal(toNearestAgentSessionNotchIndex(CENTERS, 10), 0);
	assert.equal(toNearestAgentSessionNotchIndex(CENTERS, 178), 7);
	assert.equal(toNearestAgentSessionNotchIndex(CENTERS, CENTERS[15]), 15);
	// Exactly between two centres, and one pixel either side of that midpoint:
	// somebody always owns the pointer, and the winner flips where it should.
	assert.equal(toNearestAgentSessionNotchIndex(CENTERS, 21), 0);
	assert.equal(toNearestAgentSessionNotchIndex(CENTERS, 22), 0, "a tie resolves to the first, never to nothing");
	assert.equal(toNearestAgentSessionNotchIndex(CENTERS, 23), 1);
	// Past either end the outermost notch still claims it, so sliding off the
	// top of the rail does not blank the selection before the pointer leaves.
	assert.equal(toNearestAgentSessionNotchIndex(CENTERS, 0), 0);
	assert.equal(toNearestAgentSessionNotchIndex(CENTERS, 9000), 15);
});

test("a parked pointer or an unmeasured rail selects nothing", () => {
	assert.ok(AGENT_SESSION_NOTCH_NO_NEAREST < 0, "no-selection must read as out of range");
	assert.ok(Number.isFinite(AGENT_SESSION_NOTCH_NO_NEAREST), "an Infinity would poison the motion value");
	assert.equal(toNearestAgentSessionNotchIndex(CENTERS, AGENT_SESSION_NOTCH_POINTER_AWAY), AGENT_SESSION_NOTCH_NO_NEAREST);
	assert.equal(toNearestAgentSessionNotchIndex(CENTERS, Number.NaN), AGENT_SESSION_NOTCH_NO_NEAREST);
	// Before the first measure the centres array is empty; no notch may claim it.
	assert.equal(toNearestAgentSessionNotchIndex([], 100), AGENT_SESSION_NOTCH_NO_NEAREST);
});
