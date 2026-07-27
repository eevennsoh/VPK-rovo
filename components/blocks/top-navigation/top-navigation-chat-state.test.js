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
const TOP_NAVIGATION_DEMO_SOURCE = fs.readFileSync(
	path.join(__dirname, "..", "..", "website", "demos", "blocks", "top-navigation-demo.tsx"),
	"utf8",
);
const STUDIO_ROVO_APP_SHELL_SOURCE = fs.readFileSync(
	path.join(__dirname, "..", "..", "projects", "studio", "components", "rovo-app-shell.tsx"),
	"utf8",
);
const ROVO_APP_SHELL_SOURCE = fs.readFileSync(
	path.join(__dirname, "..", "..", "projects", "rovo", "components", "rovo-app-shell.tsx"),
	"utf8",
);

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
	assert.match(TOP_NAVIGATION_SOURCE, /isChatOpen=\{nav\.isSidebarChatOpen\}/);
});

test("top navigation caps search globally and centers it only when the persistent sidebar is collapsed", () => {
	// The search lives in a middle zone that grows but caps at a max / floors at a
	// min width, centering at wide widths (Figma) and left-aligning below the
	// center breakpoint.
	assert.match(
		LAYOUT_CONSTANTS_SOURCE,
		/export const TOP_NAV_SEARCH_MAX_WIDTH_PX = 780;/,
	);
	assert.match(
		LAYOUT_CONSTANTS_SOURCE,
		/export const TOP_NAV_SEARCH_MIN_WIDTH_PX = 180;/,
	);
	assert.match(
		LAYOUT_CONSTANTS_SOURCE,
		/export const TOP_NAV_SEARCH_CENTER_BREAKPOINT_PX = 1200;/,
	);
	assert.match(
		LAYOUT_CONSTANTS_SOURCE,
		/export const TOP_NAV_SEARCH_ICON_BREAKPOINT_PX = 360;/,
	);
	assert.match(
		LAYOUT_CONSTANTS_SOURCE,
		/export const TOP_NAV_HEADER_HEIGHT_PX = 56;/,
	);
	// Page wires the center/left alignment and the capped search width. The search
	// grows to the cap but uses its min as a flex-basis (not a hard floor) so it
	// shrinks under pressure instead of clipping the right cluster.
	assert.match(TOP_NAVIGATION_SOURCE, /const isPersistentSidebarVisible = variant === "header" \? nav\.isVisible : sidebarOpen;/);
	assert.match(TOP_NAVIGATION_SOURCE, /const centerSearch = !isPersistentSidebarVisible/);

	for (const source of [TOP_NAVIGATION_SOURCE, STUDIO_ROVO_APP_SHELL_SOURCE, ROVO_APP_SHELL_SOURCE]) {
		assert.match(source, /maxWidth: `\$\{TOP_NAV_SEARCH_MAX_WIDTH_PX\}px`/);
		assert.match(source, /flexBasis: `\$\{TOP_NAV_SEARCH_MIN_WIDTH_PX\}px`/);
		assert.match(source, /TOP_NAV_SEARCH_CENTER_BREAKPOINT_PX/);
	}

	for (const source of [STUDIO_ROVO_APP_SHELL_SOURCE, ROVO_APP_SHELL_SOURCE]) {
		assert.match(source, /!chat\.sidebarOpen/);
		assert.match(source, /onToggleSidebar=\{\(\) => chat\.setSidebarOpen\(!chat\.sidebarOpen\)\}/u);
		assert.match(source, /\? "pointer-events-none absolute inset-x-0 justify-center px-3 \[&>\*\]:pointer-events-auto"/u);
		assert.match(source, /&& "justify-end"/u);
	}
});

test("top navigation keeps the legacy sidebar inset without overriding collapsed centering", () => {
	assert.match(TOP_NAVIGATION_SOURCE, /searchAlignment\?: "responsive" \| "sidebar";/);
	assert.match(TOP_NAVIGATION_SOURCE, /searchAlignment = "responsive"/);
	assert.match(TOP_NAVIGATION_SOURCE, /const centerSearch = !isPersistentSidebarVisible/);
	assert.match(TOP_NAVIGATION_SOURCE, /searchAlignment === "sidebar" \? "ps-2" : undefined/);
});

test("top navigation can fill a height-constrained parent", () => {
	assert.match(TOP_NAVIGATION_SOURCE, /shellHeight\?: "viewport" \| "parent";/);
	assert.match(TOP_NAVIGATION_SOURCE, /shellHeight = "viewport"/);
	assert.match(
		TOP_NAVIGATION_SOURCE,
		/shellHeight === "parent" \? "h-full! min-h-0!" : "h-svh"/,
	);
});

test("top navigation collapses the search to an icon button on very narrow viewports", () => {
	assert.match(TOP_NAVIGATION_SOURCE, /TOP_NAV_SEARCH_ICON_BREAKPOINT_PX/);
	assert.match(TOP_NAVIGATION_SOURCE, /isSearchCollapsible/);
	assert.match(TOP_NAVIGATION_SOURCE, /handleExpandSearchIcon/);
});

test("top navigation block omits the theme toggle (matches the Figma cluster)", () => {
	// The Figma global top navigation cluster is Ask Rovo + notifications + help +
	// settings + avatar — no theme toggle. The shared cluster keeps the toggle as
	// an opt-in prop (other shells use it), so the invariant is that the block's
	// page does NOT pass onToggleTheme, and the toggle is conditionally rendered.
	assert.doesNotMatch(TOP_NAVIGATION_SOURCE, /onToggleTheme/);
	assert.match(RIGHT_NAVIGATION_ACTIONS_SOURCE, /onToggleTheme \?/);
});

test("right navigation settings button can render optional dropdown actions", () => {
	assert.match(RIGHT_NAVIGATION_ACTIONS_SOURCE, /interface RightNavigationSettingsMenuItem/);
	assert.match(RIGHT_NAVIGATION_ACTIONS_SOURCE, /settingsMenuItems\?: ReadonlyArray<RightNavigationSettingsMenuItem>/);
	assert.match(RIGHT_NAVIGATION_ACTIONS_SOURCE, /const hasSettingsMenu = Boolean\(settingsMenuItems && settingsMenuItems\.length > 0\);/);
	assert.match(RIGHT_NAVIGATION_ACTIONS_SOURCE, /hasSettingsMenu \? \([\s\S]*<DropdownMenu>/u);
	assert.match(RIGHT_NAVIGATION_ACTIONS_SOURCE, /aria-label="Settings"[\s\S]*<DropdownMenuContent align="end" className="w-64">/u);
	assert.match(RIGHT_NAVIGATION_ACTIONS_SOURCE, /onSelect=\{item\.onSelect\}/);
	assert.match(RIGHT_NAVIGATION_SOURCE, /settingsMenuItems\?: ReadonlyArray<RightNavigationSettingsMenuItem>/);
	assert.match(RIGHT_NAVIGATION_SOURCE, /settingsMenuItems=\{settingsMenuItems\}/);
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

test("Create button keeps its full label at every breakpoint (Figma 1768 → 320)", () => {
	// Figma shows the labelled "+ Create" pill at every frame down to 320, so the
	// button must never collapse to an icon-only state (no `max-md` hide/shrink).
	assert.match(CREATE_BUTTON_SOURCE, /<span>Create<\/span>/);
	assert.doesNotMatch(CREATE_BUTTON_SOURCE, /max-md:hidden/);
	assert.doesNotMatch(CREATE_BUTTON_SOURCE, /max-md:size-8/);
});

test("block demo forces the Ask Rovo pill so the right cluster matches Figma", () => {
	// The Figma global top navigation always renders Ask Rovo in the right
	// cluster. Studio normally suppresses it, so the standalone block demo opts in
	// via forceShowRovoAction, which the page threads through to RightNavigation.
	assert.match(TOP_NAVIGATION_DEMO_SOURCE, /forceShowRovoAction/);
	assert.match(TOP_NAVIGATION_SOURCE, /forceShowRovoAction = false/);
	assert.match(TOP_NAVIGATION_SOURCE, /forceShowRovoAction=\{forceShowRovoAction\}/);
});
