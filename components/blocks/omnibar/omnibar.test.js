import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
	OMNIBAR_COLLAPSE_DELAY_MS,
	OMNIBAR_INITIAL_STATE,
	omnibarReducer,
} from "./omnibar-machine.ts";
import {
	OMNIBAR_CONTENT,
	OMNIBAR_CONTENT_EXIT,
	OMNIBAR_CONTEXT_ENTER,
	OMNIBAR_CONTEXT_EXIT,
	OMNIBAR_MORPH_ENTER,
	OMNIBAR_MORPH_EXIT,
	OMNIBAR_PANEL_ENTER,
	OMNIBAR_PANEL_EXIT,
	OMNIBAR_RAIL_ENTER,
	OMNIBAR_RAIL_EXIT,
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

test("Omnibar collapse returns any geometry to the pill", () => {
	// Host-owned panels (Ask Rovo sidebar) collapse instead of docking.
	assert.deepEqual(omnibarReducer(EXPANDED_PINNED, { type: "collapse" }), {
		state: "collapsed",
		pinned: false,
	});
	assert.deepEqual(
		omnibarReducer({ state: "docked", pinned: false }, { type: "collapse" }),
		{ state: "collapsed", pinned: false },
	);
	assert.equal(
		omnibarReducer(OMNIBAR_INITIAL_STATE, { type: "collapse" }),
		OMNIBAR_INITIAL_STATE,
	);
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
	assert.ok(OMNIBAR_CONTENT_EXIT.duration < OMNIBAR_CONTENT.duration);
	assert.ok(OMNIBAR_CONTEXT_EXIT.duration < OMNIBAR_CONTEXT_ENTER.duration);
	assert.ok(OMNIBAR_PANEL_EXIT.duration < OMNIBAR_PANEL_ENTER.duration);
	assert.ok(OMNIBAR_RAIL_EXIT.duration < OMNIBAR_RAIL_ENTER.duration);
});

test("Omnibar morph uses the large in-place signature, not a 200ms snap", () => {
	// Pill → 720px bar is a large in-place transform. duration-medium (0.2s) sits
	// under the trackability threshold; duration-slower + ease-in-out is the
	// recipe for that role. Content waits until the surface has started growing.
	assert.deepEqual(OMNIBAR_MORPH_ENTER, { duration: 0.4, ease: [0.4, 0, 0, 1] });
	assert.deepEqual(OMNIBAR_MORPH_EXIT, { duration: 0.25, ease: [0.6, 0, 0.8, 0.6] });
	assert.equal(OMNIBAR_CONTENT.delay, 0.15);
	assert.equal(OMNIBAR_CONTENT.duration, 0.15);
	assert.ok(!("delay" in OMNIBAR_CONTENT_EXIT));
	// Timeline staggers in after the prompt has started, and leaves with no delay
	// so it is gone before the composer morphs back.
	assert.ok(OMNIBAR_CONTEXT_ENTER.delay > OMNIBAR_CONTENT.delay);
	assert.ok(!("delay" in OMNIBAR_CONTEXT_EXIT));
});

test("Omnibar edge rail enters on the practical curve, not the bold one", () => {
	// A small, high-frequency surface. The bold `ease-out` belongs to the prominent
	// entrances (the docked panel); using it here would overstate a rail toggle.
	assert.deepEqual(OMNIBAR_RAIL_ENTER.ease, [0.4, 1, 0.6, 1]);
	assert.deepEqual(OMNIBAR_RAIL_EXIT.ease, [0.6, 0, 0.8, 0.6]);
	assert.notDeepEqual(OMNIBAR_RAIL_ENTER.ease, OMNIBAR_PANEL_ENTER.ease);
});

test("Omnibar zeroes every transition under reduced motion", () => {
	for (const transition of [
		OMNIBAR_MORPH_ENTER,
		OMNIBAR_MORPH_EXIT,
		OMNIBAR_CONTENT,
		OMNIBAR_CONTENT_EXIT,
		OMNIBAR_CONTEXT_ENTER,
		OMNIBAR_CONTEXT_EXIT,
		OMNIBAR_PANEL_ENTER,
		OMNIBAR_PANEL_EXIT,
		OMNIBAR_RAIL_ENTER,
		OMNIBAR_RAIL_EXIT,
	]) {
		assert.equal(resolveOmnibarTransition(transition, true), OMNIBAR_REDUCED);
		assert.equal(resolveOmnibarTransition(transition, false), transition);
		assert.equal(resolveOmnibarTransition(transition, null), transition);
	}
	assert.equal(OMNIBAR_REDUCED.delay, 0);
	assert.equal(OMNIBAR_REDUCED.duration, 0);
});

test("Omnibar pill uses the brand-color Rovo sparkle, not the inverse glyph", () => {
	const source = readFileSync(new URL("./components/omnibar-pill.tsx", import.meta.url), "utf8");
	assert.match(source, /<RovoSparkleMark active selected=\{false\} size="default" \/>/u);
	assert.doesNotMatch(source, /active=\{false\}/u);
});

test("Omnibar collapsed chrome matches the floating Rovo button, not a light pill", () => {
	const source = readFileSync(new URL("./components/omnibar.tsx", import.meta.url), "utf8");
	const pill = readFileSync(new URL("./components/omnibar-pill.tsx", import.meta.url), "utf8");
	assert.match(source, /isDefaultTone\s*\?\s*"overflow-visible bg-transparent shadow-none"/u);
	assert.match(source, /overflow-hidden bg-bg-neutral-bold shadow-overlay/u);
	assert.match(source, /paintChrome=\{isDefaultTone\}/u);
	assert.match(pill, /bg-bg-neutral-bold/u);
	assert.match(pill, /token\("elevation.shadow.overlay"\)/u);
	assert.doesNotMatch(source, /bg-surface-raised/u);
});

test("Omnibar hoists the Timeline chip off the composer layout surface", () => {
	const source = readFileSync(new URL("./components/omnibar.tsx", import.meta.url), "utf8");
	const bar = readFileSync(new URL("./components/omnibar-bar.tsx", import.meta.url), "utf8");
	assert.match(source, /hideContextPill=\{hoistContextPill\}/u);
	assert.match(source, /<OmnibarContextPill/u);
	assert.match(source, /onExitComplete=\{handleContextExitComplete\}/u);
	assert.match(source, /const composerExpanded = isExpanded \|\| holdComposer/u);
	assert.match(bar, /!hideContextPill \?/u);
	assert.match(bar, /data-slot="omnibar-context-pill"/u);
	assert.doesNotMatch(source, /key="omnibar-surface"\n\s+layout/u);
	assert.doesNotMatch(source, /key="omnibar-hover"\n\s+layout/u);
});

test("Omnibar morphs width and height instead of layout-scaling prompt text", () => {
	// Motion `layout` projects size with transform:scale, which enlarges
	// placeholder and button labels while the 96px pill becomes the 720px bar.
	const source = readFileSync(new URL("./components/omnibar.tsx", import.meta.url), "utf8");
	const bar = readFileSync(new URL("./components/omnibar-bar.tsx", import.meta.url), "utf8");
	const pill = readFileSync(new URL("./components/omnibar-pill.tsx", import.meta.url), "utf8");
	assert.match(source, /const EXPANDED_WIDTH = "min\(720px, calc\(100% - 32px\)\)"/u);
	assert.match(source, /width: surfaceWidth/u);
	assert.match(source, /height: surfaceHeight/u);
	assert.doesNotMatch(source, /^\s+layout\s*$/mu);
	assert.match(bar, /layout="position"/u);
	assert.match(pill, /layout="position"/u);
});
