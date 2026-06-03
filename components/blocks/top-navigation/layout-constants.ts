export const TOP_NAV_CONTROL_GAP_PX = 4;
export const TOP_NAV_ICON_BUTTON_SIZE_PX = 32;
export const TOP_NAV_COLLAPSED_CONTROL_STEP_PX =
	TOP_NAV_ICON_BUTTON_SIZE_PX + TOP_NAV_CONTROL_GAP_PX;

export const TOP_NAV_PADDING_PX = 12;
export const TOP_NAV_LEFT_SECTION_WIDTH_PX = 230;
// Below this window width the right cluster (Ask Rovo, notifications, help,
// settings, avatar) collapses into a single "…" overflow popover. Matches the
// Figma frames: 768 still shows the full inline cluster, 480 collapses it. The
// Create button keeps its full "+ Create" label at every breakpoint.
export const TOP_NAV_OVERFLOW_BREAKPOINT_PX = 768;
// Below this window width the persistent (pinned) sidebar is automatically
// released so it no longer reserves horizontal space and overlaps the top
// navigation. Matches the breakpoint where the sidebar switches to a mobile
// overlay drawer (`useIsMobile`) and where the right cluster overflows.
export const TOP_NAV_SIDEBAR_PIN_RELEASE_BREAKPOINT_PX = TOP_NAV_OVERFLOW_BREAKPOINT_PX;
export const ROVO_APP_SEPARATOR_LINE_OFFSET_PX = 320;
export const TOP_NAV_SIDEBAR_TOGGLE_SEPARATOR_GAP_PX = 12;

// Resizable persistent sidebar bounds (mirrors the studio shell). The default
// width matches `ROVO_APP_SEPARATOR_LINE_OFFSET_PX` so the collapse toggle and
// product button align with the resize divider.
export const ROVO_APP_SIDEBAR_MIN_WIDTH_PX = 240;
export const ROVO_APP_SIDEBAR_MAX_WIDTH_PX = 480;

// The header search grows to fill available space but caps here so it never
// stretches edge-to-edge on wide viewports. Matches the Figma spec (780px max,
// 180px min). It shrinks fluidly between these bounds, and collapses to an icon
// button below `TOP_NAV_SEARCH_ICON_BREAKPOINT_PX`.
export const TOP_NAV_SEARCH_MAX_WIDTH_PX = 780;
export const TOP_NAV_SEARCH_MIN_WIDTH_PX = 180;

// At/above this viewport width the middle zone centers the search (Figma centers
// it at 1440/1768). Below it, the search left-aligns next to the sidebar chrome.
export const TOP_NAV_SEARCH_CENTER_BREAKPOINT_PX = 1200;

// Below this viewport width the search field collapses to an icon-only button
// (Figma shows an icon at 320 but a field at 480, so the cutoff sits between).
export const TOP_NAV_SEARCH_ICON_BREAKPOINT_PX = 360;

// Top navigation bar height (Figma global top navigation is 56px tall).
export const TOP_NAV_HEADER_HEIGHT_PX = 56;
