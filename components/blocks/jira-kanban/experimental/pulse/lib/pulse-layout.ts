/**
 * Pulse Insights split — default 320 / 8 / 300 work rail, resizable from `lg`.
 *
 * The article stays the flexible column. These bounds keep both card tracks
 * readable and leave the prose column enough width to hold its 36rem measure.
 */

export const PULSE_SCRUBBER_WIDTH_PX = 144;
export const PULSE_ARTICLE_MIN_WIDTH_PX = 360;
export const PULSE_INSIGHTS_GUTTER_PX = 40;
export const PULSE_WORK_RAIL_TRACK_GAP_PX = 8;
export const PULSE_WORK_ITEMS_DEFAULT_WIDTH_PX = 320;
export const PULSE_WORK_ITEMS_MIN_WIDTH_PX = 240;
export const PULSE_UNCAPTURED_DEFAULT_WIDTH_PX = 300;
export const PULSE_UNCAPTURED_MIN_WIDTH_PX = 240;
export const PULSE_WORK_RAIL_DEFAULT_WIDTH_PX =
	PULSE_WORK_ITEMS_DEFAULT_WIDTH_PX + PULSE_WORK_RAIL_TRACK_GAP_PX + PULSE_UNCAPTURED_DEFAULT_WIDTH_PX;
export const PULSE_WORK_RAIL_MIN_WIDTH_PX =
	PULSE_WORK_ITEMS_MIN_WIDTH_PX + PULSE_WORK_RAIL_TRACK_GAP_PX + PULSE_UNCAPTURED_MIN_WIDTH_PX;

export function resolvePulseWorkRailMaxWidth(rowWidth: number) {
	const reserved = PULSE_SCRUBBER_WIDTH_PX + PULSE_ARTICLE_MIN_WIDTH_PX + PULSE_INSIGHTS_GUTTER_PX;
	return Math.max(PULSE_WORK_RAIL_MIN_WIDTH_PX, rowWidth - reserved);
}

/**
 * Chat chrome against the insight intro: the article scrollport's `p-1`
 * (4px) and a 24px row (`h-6`) matching the eyebrow (`min-h-6`).
 */
export const PULSE_EMBEDDED_CHAT_HEADER_CLASS = "h-6 px-1 py-0";
