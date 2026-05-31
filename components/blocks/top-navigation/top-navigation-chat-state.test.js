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
const CREATE_BUTTON_SOURCE = fs.readFileSync(path.join(__dirname, "components", "create-button.tsx"), "utf8");

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

test("top navigation lets the search cluster fill available space without overlapping", () => {
	// The old viewport-centering math (fixed pixel width derived from symmetric
	// side rails) is gone — that fixed, non-shrinkable width is what caused the
	// Create/Ask Rovo overlap at narrow widths.
	assert.doesNotMatch(USE_TOP_NAVIGATION_SOURCE, /centeredWidthPx/);
	assert.doesNotMatch(USE_TOP_NAVIGATION_SOURCE, /SIDE_RAIL_WIDTH_PX/);

	// The center cluster now grows and shrinks to fill the gap between the side
	// clusters.
	assert.match(USE_TOP_NAVIGATION_SOURCE, /flex: "1 1 auto"/);

	// Left and right clusters are content-sized; the right cluster is anchored to
	// the trailing edge with an auto margin so it is never pushed off-screen.
	assert.match(TOP_NAVIGATION_SOURCE, /flex: "0 0 auto", minWidth: 0/);
	assert.match(TOP_NAVIGATION_SOURCE, /flex: "0 0 auto", marginLeft: "auto"/);
});

test("top navigation sizes its breakpoints from its own width, not the window", () => {
	// The nav also renders inside narrow preview frames, so responsive decisions
	// must be driven by the measured container width (ResizeObserver) rather than
	// window.innerWidth, which overstates the available room and causes overlap.
	assert.match(USE_TOP_NAVIGATION_SOURCE, /useElementWidth/);
	assert.doesNotMatch(USE_TOP_NAVIGATION_SOURCE, /useWindowWidth/);
	assert.match(USE_TOP_NAVIGATION_SOURCE, /\[navRef, availableWidth\] = useElementWidth/);
	assert.match(TOP_NAVIGATION_SOURCE, /ref=\{navRef\}/);

	// The Create button collapses to an icon from the same measured width instead
	// of a viewport media query.
	assert.match(CREATE_BUTTON_SOURCE, /collapsed/);
	assert.doesNotMatch(CREATE_BUTTON_SOURCE, /max-md:/);
});

test("right navigation collapses into an overflow popover at narrow widths", () => {
	assert.match(LAYOUT_CONSTANTS_SOURCE, /export const TOP_NAV_OVERFLOW_BREAKPOINT_PX = 768;/);
	assert.match(RIGHT_NAVIGATION_SOURCE, /TOP_NAV_OVERFLOW_BREAKPOINT_PX/);
	assert.match(RIGHT_NAVIGATION_SOURCE, /availableWidth < TOP_NAV_OVERFLOW_BREAKPOINT_PX/);
	assert.match(RIGHT_NAVIGATION_SOURCE, /<Popover /);
	assert.match(RIGHT_NAVIGATION_SOURCE, /ShowMoreHorizontalIcon/);
	assert.match(RIGHT_NAVIGATION_SOURCE, /aria-label="More"/);
});
