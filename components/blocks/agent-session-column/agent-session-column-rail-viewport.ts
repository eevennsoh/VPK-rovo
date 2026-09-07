/** The tucked gutter rail shows the latest ten sessions; older sessions stay scrollable. */
export const AGENT_SESSION_RAIL_MAX_VISIBLE_ITEMS = 10;
export const AGENT_SESSION_RAIL_ITEM_HEIGHT_PX = 20;
export const AGENT_SESSION_RAIL_ITEM_GAP_PX = 4;
export const AGENT_SESSION_RAIL_FOCUS_GUTTER_PX = 8;

/**
 * Caps the collapsed gutter rail to a ten-notch window. Embedded / column
 * presentation omits `maxVisibleItems` so the list can show every session
 * inside the column height instead of faking a ten-dot viewport.
 */
export function toAgentSessionRailViewportMaxHeight(
	itemCount: number,
	maxVisibleItems: number | undefined,
): number | undefined {
	if (maxVisibleItems === undefined) {
		return undefined;
	}

	const visibleItemCount = Math.min(itemCount, maxVisibleItems);
	if (visibleItemCount === 0) {
		return 0;
	}

	return visibleItemCount * AGENT_SESSION_RAIL_ITEM_HEIGHT_PX
		+ (visibleItemCount - 1) * AGENT_SESSION_RAIL_ITEM_GAP_PX
		+ AGENT_SESSION_RAIL_FOCUS_GUTTER_PX;
}
