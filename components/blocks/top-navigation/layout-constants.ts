export const TOP_NAV_CONTROL_GAP_PX = 4;
export const TOP_NAV_ICON_BUTTON_SIZE_PX = 32;
export const TOP_NAV_COLLAPSED_CONTROL_STEP_PX =
	TOP_NAV_ICON_BUTTON_SIZE_PX + TOP_NAV_CONTROL_GAP_PX;

export const TOP_NAV_PADDING_PX = 12;
export const TOP_NAV_LEFT_SECTION_WIDTH_PX = 230;
export const TOP_NAV_COLLAPSED_LEFT_SECTION_WIDTH_PX = 144;
// Fallback collapsed left padding for the top bar. Used when the product is not
// known to `getCollapsedHeaderPaddingPx` below. Prefer the helper so the search
// always clears the collapsed product button (icon + label), which overflows the
// 144px collapsed chrome once the product label becomes visible (>=1028px).
export const TOP_NAV_COLLAPSED_HEADER_PADDING_PX = 160;

// Gap kept between the collapsed product button's right edge and the start of the
// search field so they never visually touch.
const TOP_NAV_COLLAPSED_PRODUCT_GAP_PX = 12;

// Internal width of the product button chrome that sits left of the label text:
// button padding (space.050 = 4) + product icon (24) + icon/label gap (gap-1.5 = 6).
const TOP_NAV_PRODUCT_BUTTON_LEADING_PX = 4 + 24 + 6;
// Width to the right of the label text: label paddingRight (space.025 = 2) +
// button padding (space.050 = 4).
const TOP_NAV_PRODUCT_BUTTON_TRAILING_PX = 2 + 4;

// Estimated rendered width (px) of each product label at the top-nav button font
// (text-sm / font-bold). Measured against the live styles; only needs to be a
// safe upper bound so the search never overlaps the label.
const TOP_NAV_PRODUCT_LABEL_WIDTH_PX: Record<string, number> = {
	admin: 90,
	confluence: 72,
	search: 44,
	agents: 44,
	studio: 40,
	home: 36,
	rovo: 32,
	jira: 24,
};

const TOP_NAV_PRODUCT_LABEL_FALLBACK_WIDTH_PX = 90;

/**
 * Collapsed-state left padding for the top navigation bar so the search field
 * clears the (absolutely positioned) product button, which extends past the
 * 144px collapsed chrome once its label is visible. Derived from the same
 * geometry constants the chrome itself uses, plus a fixed gap.
 */
export function getCollapsedHeaderPaddingPx(product: string): number {
	const labelWidth =
		TOP_NAV_PRODUCT_LABEL_WIDTH_PX[product] ?? TOP_NAV_PRODUCT_LABEL_FALLBACK_WIDTH_PX;
	// Collapsed product button left offset: the app-switcher step plus the
	// sidebar-toggle step (both present while collapsed).
	const productButtonLeftPx = 2 * TOP_NAV_COLLAPSED_CONTROL_STEP_PX;
	const productButtonRightEdgePx =
		TOP_NAV_PADDING_PX +
		productButtonLeftPx +
		TOP_NAV_PRODUCT_BUTTON_LEADING_PX +
		labelWidth +
		TOP_NAV_PRODUCT_BUTTON_TRAILING_PX;
	return Math.ceil(productButtonRightEdgePx + TOP_NAV_COLLAPSED_PRODUCT_GAP_PX);
}
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
