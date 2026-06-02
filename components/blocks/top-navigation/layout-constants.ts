export const TOP_NAV_CONTROL_GAP_PX = 4;
export const TOP_NAV_ICON_BUTTON_SIZE_PX = 32;
export const TOP_NAV_COLLAPSED_CONTROL_STEP_PX =
	TOP_NAV_ICON_BUTTON_SIZE_PX + TOP_NAV_CONTROL_GAP_PX;

export const TOP_NAV_PADDING_PX = 12;
export const TOP_NAV_LEFT_SECTION_WIDTH_PX = 230;
// Below this window width the Create button collapses to an icon and the right
// cluster collapses into a single "…" overflow popover (matches production).
export const TOP_NAV_OVERFLOW_BREAKPOINT_PX = 768;
// Below this window width the persistent (pinned) sidebar is automatically
// released so it no longer reserves horizontal space and overlaps the top
// navigation. Matches the breakpoint where the sidebar switches to a mobile
// overlay drawer (`useIsMobile`) and where the right cluster overflows.
export const TOP_NAV_SIDEBAR_PIN_RELEASE_BREAKPOINT_PX = TOP_NAV_OVERFLOW_BREAKPOINT_PX;
export const ROVO_APP_SEPARATOR_LINE_OFFSET_PX = 320;
export const TOP_NAV_SIDEBAR_TOGGLE_SEPARATOR_GAP_PX = 12;
