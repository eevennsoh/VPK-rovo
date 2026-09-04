export interface JiraListHorizontalUnderlapMetrics {
	panelLeadingEdge: number;
	scrollLeft: number;
	scrollportLeft: number;
	scrollWidth: number;
	trailingInset: number;
}

const SCROLL_END_TOLERANCE_PX = 1;

/**
 * Whether real list content still crosses the leading edge of a docked
 * trailing panel. The reserved inset is scroll room, not list content.
 */
export function hasTrailingContentUnderlap({
	panelLeadingEdge,
	scrollLeft,
	scrollportLeft,
	scrollWidth,
	trailingInset,
}: JiraListHorizontalUnderlapMetrics): boolean {
	if (trailingInset <= 0) {
		return false;
	}

	const contentEnd = scrollportLeft + scrollWidth - trailingInset - scrollLeft;

	return contentEnd - panelLeadingEdge > SCROLL_END_TOLERANCE_PX;
}
