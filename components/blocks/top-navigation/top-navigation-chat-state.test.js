const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const TOP_NAVIGATION_SOURCE = fs.readFileSync(path.join(__dirname, "page.tsx"), "utf8");
const USE_TOP_NAVIGATION_SOURCE = fs.readFileSync(path.join(__dirname, "hooks", "use-top-navigation.ts"), "utf8");
const RIGHT_NAVIGATION_SOURCE = fs.readFileSync(path.join(__dirname, "components", "right-navigation.tsx"), "utf8");
const RIGHT_NAVIGATION_ACTIONS_SOURCE = fs.readFileSync(
	path.join(__dirname, "components", "right-navigation-actions.tsx"),
	"utf8",
);
const LAYOUT_CONSTANTS_SOURCE = fs.readFileSync(path.join(__dirname, "layout-constants.ts"), "utf8");

test("Ask Rovo button exposes sidebar chat open state as pressed state", () => {
	assert.match(RIGHT_NAVIGATION_SOURCE, /isChatOpen = false/);

	// Ask Rovo is a single full-text button rendered once (inline or inside the
	// overflow popover, never both), so exactly one aria-pressed binding exists.
	const pressedStateMatches = RIGHT_NAVIGATION_ACTIONS_SOURCE.match(/aria-pressed=\{isChatOpen\}/g) ?? [];
	assert.equal(pressedStateMatches.length, 1);

	// The old narrow-width standalone Ask Rovo icon button is gone.
	assert.doesNotMatch(RIGHT_NAVIGATION_ACTIONS_SOURCE, /aria-label="Ask Rovo"/);
	assert.match(RIGHT_NAVIGATION_ACTIONS_SOURCE, /Ask Rovo/);
});

test("top navigation derives Ask Rovo pressed state from the sidebar chat surface", () => {
	assert.match(USE_TOP_NAVIGATION_SOURCE, /toggleChat,.*chatSurface.*\} = useRovoChat\(\);/);
	assert.match(USE_TOP_NAVIGATION_SOURCE, /const isSidebarChatOpen = chatSurface === "sidebar";/);
	assert.match(USE_TOP_NAVIGATION_SOURCE, /isSidebarChatOpen,/);
	assert.match(TOP_NAVIGATION_SOURCE, /isChatOpen=\{isSidebarChatOpen\}/);
});

test("top navigation grows the capped center search section between balanced side rails", () => {
	// The center search section grows to fill available width but caps at a max,
	// and the parent's space-between plus content-sized side sections keep it
	// centered on wide layouts (replaced the old fixed side-rail computation).
	assert.match(USE_TOP_NAVIGATION_SOURCE, /const TOP_NAV_CENTER_SECTION_MAX_WIDTH_PX = 762;/);
	assert.match(USE_TOP_NAVIGATION_SOURCE, /flex: "1 1 auto"/);
	assert.match(USE_TOP_NAVIGATION_SOURCE, /maxWidth: `\$\{TOP_NAV_CENTER_SECTION_MAX_WIDTH_PX\}px`/);
	assert.match(TOP_NAVIGATION_SOURCE, /flex: "0 1 auto", minWidth: 0/);
	assert.match(TOP_NAVIGATION_SOURCE, /justifyContent: "space-between"/);
	assert.match(TOP_NAVIGATION_SOURCE, /justifyContent: "flex-end"/);
});

test("top navigation auto-releases the pinned sidebar at small viewports", () => {
	// A dedicated, well-named breakpoint drives the release (reusing the overflow
	// breakpoint value so the sidebar un-pins exactly when the right cluster
	// overflows and the sidebar becomes a mobile overlay).
	assert.match(
		LAYOUT_CONSTANTS_SOURCE,
		/export const TOP_NAV_SIDEBAR_PIN_RELEASE_BREAKPOINT_PX = TOP_NAV_OVERFLOW_BREAKPOINT_PX;/,
	);

	// The hook releases the pin below the breakpoint and remembers it did so.
	assert.match(USE_TOP_NAVIGATION_SOURCE, /setSidebarVisible/);
	assert.match(USE_TOP_NAVIGATION_SOURCE, /windowWidth < TOP_NAV_SIDEBAR_PIN_RELEASE_BREAKPOINT_PX/);
	assert.match(USE_TOP_NAVIGATION_SOURCE, /didAutoReleaseSidebarRef/);
	assert.match(USE_TOP_NAVIGATION_SOURCE, /setSidebarVisible\(false\)/);
	// And restores the prior pinned state when the viewport grows back.
	assert.match(USE_TOP_NAVIGATION_SOURCE, /setSidebarVisible\(true\)/);
	// Guard against acting on the SSR/first-paint measurement.
	assert.match(USE_TOP_NAVIGATION_SOURCE, /if \(windowWidth === 0\)/);
});

test("right navigation collapses into an overflow popover at narrow widths", () => {
	assert.match(LAYOUT_CONSTANTS_SOURCE, /export const TOP_NAV_OVERFLOW_BREAKPOINT_PX = 768;/);
	assert.match(RIGHT_NAVIGATION_SOURCE, /TOP_NAV_OVERFLOW_BREAKPOINT_PX/);
	assert.match(RIGHT_NAVIGATION_SOURCE, /windowWidth < TOP_NAV_OVERFLOW_BREAKPOINT_PX/);
	assert.match(RIGHT_NAVIGATION_SOURCE, /<Popover /);
	assert.match(RIGHT_NAVIGATION_SOURCE, /ShowMoreHorizontalIcon/);
	assert.match(RIGHT_NAVIGATION_SOURCE, /aria-label="More"/);

	// The collapse is gated on mount so the SSR/first-paint width of 0 does not
	// briefly render the overflow popover before the real width arrives.
	assert.match(RIGHT_NAVIGATION_SOURCE, /useIsMounted/);
	assert.match(RIGHT_NAVIGATION_SOURCE, /isMounted && windowWidth < TOP_NAV_OVERFLOW_BREAKPOINT_PX/);
});
