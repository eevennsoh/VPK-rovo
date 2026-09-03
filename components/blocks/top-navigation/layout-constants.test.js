const assert = require("node:assert/strict");
const test = require("node:test");

const {
	getCenteredSearchInsetPx,
	getCollapsedHeaderPaddingPx,
	TOP_NAV_CENTERED_SEARCH_CLUSTER_GAP_PX,
	TOP_NAV_PADDING_PX,
	TOP_NAV_RIGHT_CLUSTER_FALLBACK_WIDTH_PX,
	TOP_NAV_SEARCH_MAX_WIDTH_PX,
} = require("./layout-constants.ts");

/**
 * Regression: at 1200px with the sidebar collapsed the centered search overlay
 * spanned the whole bar, so a 780px search + Create ran straight over the
 * "Ask Rovo" pill. The reserve has to cover the right cluster, not just the
 * bar's own 12px padding.
 */
test("the centered search reserves the whole right cluster, not just the bar padding", () => {
	// Measured on the live Jira bar: cluster 286px wide, sitting 12px in.
	const inset = getCenteredSearchInsetPx("jira", 286);

	assert.equal(inset, 286 + TOP_NAV_PADDING_PX + TOP_NAV_CENTERED_SEARCH_CLUSTER_GAP_PX);

	// The overlay is centered by padding both sides equally, so at the center
	// breakpoint the search + Create group has to fit inside what is left, with
	// the gap intact — the old behaviour overflowed it by ~37px.
	const groupWidthAt1200 = 1200 - 2 * inset;
	assert.ok(groupWidthAt1200 > 0, `expected room for the middle zone, got ${groupWidthAt1200}`);
	assert.ok(
		groupWidthAt1200 < TOP_NAV_SEARCH_MAX_WIDTH_PX,
		"a full-width search cannot fit at 1200px, so it must be squeezed rather than overlap",
	);
});

test("the reserve never shrinks below the collapsed left chrome", () => {
	// A narrow right cluster (Ask Rovo hidden) must not pull the centered group
	// left over the collapsed product button, which admin's long label widens.
	const adminLeftChrome = getCollapsedHeaderPaddingPx("admin");
	assert.equal(getCenteredSearchInsetPx("admin", 1), adminLeftChrome);
	assert.ok(getCenteredSearchInsetPx("jira", 1) >= getCollapsedHeaderPaddingPx("jira"));
});

test("an unmeasured right cluster falls back to an estimate instead of zero", () => {
	// First paint runs before the ResizeObserver reports, and reserving 0 there
	// would flash exactly the overlap this guard exists to prevent.
	assert.equal(
		getCenteredSearchInsetPx("jira", 0),
		TOP_NAV_RIGHT_CLUSTER_FALLBACK_WIDTH_PX
			+ TOP_NAV_PADDING_PX
			+ TOP_NAV_CENTERED_SEARCH_CLUSTER_GAP_PX,
	);
});

test("a wider right cluster pushes the reserve out one-for-one", () => {
	const base = getCenteredSearchInsetPx("jira", 286);
	assert.equal(getCenteredSearchInsetPx("jira", 386), base + 100);
});
