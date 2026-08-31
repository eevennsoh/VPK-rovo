import assert from "node:assert/strict";
import test from "node:test";

import {
	OMNIBAR_COLLAPSE_DELAY_MS,
	OMNIBAR_INITIAL_STATE,
	omnibarReducer,
} from "./omnibar-machine.ts";
import {
	OMNIBAR_CONTENT,
	OMNIBAR_MORPH_ENTER,
	OMNIBAR_MORPH_EXIT,
	OMNIBAR_PANEL_ENTER,
	OMNIBAR_PANEL_EXIT,
	OMNIBAR_REDUCED,
	resolveOmnibarTransition,
} from "./omnibar-motion.ts";

const EXPANDED_UNPINNED = { state: "expanded", pinned: false };
const EXPANDED_PINNED = { state: "expanded", pinned: true };

test("Omnibar expands from the pill on pointer enter", () => {
	assert.deepEqual(omnibarReducer(OMNIBAR_INITIAL_STATE, { type: "pointer-enter" }), {
		state: "expanded",
		pinned: false,
	});
});

test("Omnibar collapses on pointer leave while unpinned", () => {
	assert.deepEqual(omnibarReducer(EXPANDED_UNPINNED, { type: "pointer-leave" }), {
		state: "collapsed",
		pinned: false,
	});
});

test("Omnibar keeps a pinned bar open when the pointer leaves", () => {
	// The behavior the bar exists for: clicking in to type must survive the pointer leaving.
	const next = omnibarReducer(EXPANDED_PINNED, { type: "pointer-leave" });

	assert.equal(next, EXPANDED_PINNED, "a pinned bar must not collapse on pointer leave");
});

test("Omnibar pins the bar on pointer down", () => {
	assert.deepEqual(omnibarReducer(EXPANDED_UNPINNED, { type: "pin" }), {
		state: "expanded",
		pinned: true,
	});
	assert.deepEqual(omnibarReducer(OMNIBAR_INITIAL_STATE, { type: "pin" }), {
		state: "expanded",
		pinned: true,
	});
});

test("Omnibar unpins and collapses on an outside click", () => {
	assert.deepEqual(omnibarReducer(EXPANDED_PINNED, { type: "outside-click" }), {
		state: "collapsed",
		pinned: false,
	});
});

test("Omnibar docking clears the pin and closing returns to the pill", () => {
	const docked = omnibarReducer(EXPANDED_PINNED, { type: "open-panel" });
	assert.deepEqual(docked, { state: "docked", pinned: false });

	assert.deepEqual(omnibarReducer(docked, { type: "close-panel" }), {
		state: "collapsed",
		pinned: false,
	});
});

test("Omnibar ignores hover events while docked", () => {
	const docked = { state: "docked", pinned: false };

	assert.equal(omnibarReducer(docked, { type: "pointer-enter" }), docked);
	assert.equal(omnibarReducer(docked, { type: "pointer-leave" }), docked);
	assert.equal(omnibarReducer(docked, { type: "pin" }), docked);
});

test("Omnibar returns the same object when a transition is a no-op", () => {
	// Identity preservation is what lets React bail out of the re-render.
	assert.equal(
		omnibarReducer(OMNIBAR_INITIAL_STATE, { type: "pointer-leave" }),
		OMNIBAR_INITIAL_STATE,
	);
	assert.equal(omnibarReducer(EXPANDED_PINNED, { type: "pin" }), EXPANDED_PINNED);
	assert.equal(
		omnibarReducer(OMNIBAR_INITIAL_STATE, { type: "close-panel" }),
		OMNIBAR_INITIAL_STATE,
	);
});

test("Omnibar collapse delay stays short enough to feel immediate", () => {
	assert.ok(
		OMNIBAR_COLLAPSE_DELAY_MS > 0 && OMNIBAR_COLLAPSE_DELAY_MS <= 250,
		"the grace period must debounce edge grazes without feeling sticky",
	);
});

test("Omnibar exits are shorter than the matching entrances", () => {
	assert.ok(OMNIBAR_MORPH_EXIT.duration < OMNIBAR_MORPH_ENTER.duration);
	assert.ok(OMNIBAR_PANEL_EXIT.duration < OMNIBAR_PANEL_ENTER.duration);
});

test("Omnibar zeroes every transition under reduced motion", () => {
	for (const transition of [
		OMNIBAR_MORPH_ENTER,
		OMNIBAR_MORPH_EXIT,
		OMNIBAR_CONTENT,
		OMNIBAR_PANEL_ENTER,
		OMNIBAR_PANEL_EXIT,
	]) {
		assert.equal(resolveOmnibarTransition(transition, true), OMNIBAR_REDUCED);
		assert.equal(resolveOmnibarTransition(transition, false), transition);
		assert.equal(resolveOmnibarTransition(transition, null), transition);
	}
});
