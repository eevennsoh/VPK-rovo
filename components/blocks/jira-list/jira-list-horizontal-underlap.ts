export interface JiraListHorizontalUnderlapMetrics {
	clientWidth: number;
	scrollLeft: number;
	scrollWidth: number;
	trailingInset: number;
}

const SCROLL_END_TOLERANCE_PX = 1;

/**
 * Whether real list content still crosses the leading edge of a docked
 * trailing panel. The reserved inset is scroll room, not list content.
 */
export function hasTrailingContentUnderlap({
	clientWidth,
	scrollLeft,
	scrollWidth,
	trailingInset,
}: JiraListHorizontalUnderlapMetrics): boolean {
	if (trailingInset <= 0) {
		return false;
	}

	const contentEnd = scrollWidth - trailingInset;
	const panelLeadingEdge = scrollLeft + clientWidth - trailingInset;

	return contentEnd - panelLeadingEdge > SCROLL_END_TOLERANCE_PX;
}
