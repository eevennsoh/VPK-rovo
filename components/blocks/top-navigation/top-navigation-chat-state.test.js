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

test("top navigation centers search actions between equal side rails", () => {
	assert.match(USE_TOP_NAVIGATION_SOURCE, /const TOP_NAV_CENTER_SECTION_SIDE_RAIL_WIDTH_PX = 330;/);
	assert.match(USE_TOP_NAVIGATION_SOURCE, /width: `\$\{centeredWidthPx\}px`/);
	assert.match(USE_TOP_NAVIGATION_SOURCE, /flex: "0 0 auto"/);
	assert.match(TOP_NAVIGATION_SOURCE, /flex: "1 1 0", minWidth: 0/);
	assert.match(TOP_NAVIGATION_SOURCE, /justifyContent: "flex-end"/);
});

test("right navigation collapses into an overflow popover at narrow widths", () => {
	assert.match(LAYOUT_CONSTANTS_SOURCE, /export const TOP_NAV_OVERFLOW_BREAKPOINT_PX = 768;/);
	assert.match(RIGHT_NAVIGATION_SOURCE, /TOP_NAV_OVERFLOW_BREAKPOINT_PX/);
	assert.match(RIGHT_NAVIGATION_SOURCE, /windowWidth < TOP_NAV_OVERFLOW_BREAKPOINT_PX/);
	assert.match(RIGHT_NAVIGATION_SOURCE, /<Popover /);
	assert.match(RIGHT_NAVIGATION_SOURCE, /ShowMoreHorizontalIcon/);
	assert.match(RIGHT_NAVIGATION_SOURCE, /aria-label="More"/);
});
