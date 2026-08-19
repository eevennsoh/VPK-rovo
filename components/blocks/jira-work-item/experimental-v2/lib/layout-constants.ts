/** Shared bounds for the metadata rail and embedded chat panel. */
export const METADATA_PANEL_DEFAULT_WIDTH_PX = 440;
export const METADATA_PANEL_MIN_WIDTH_PX = 440;
export const METADATA_PANEL_FALLBACK_MAX_WIDTH_PX = 720;
export const DESCRIPTION_PANEL_MIN_WIDTH_PX = METADATA_PANEL_MIN_WIDTH_PX;

export function resolveMetadataPanelMaxWidth(dialogWidth: number) {
	return Math.max(METADATA_PANEL_MIN_WIDTH_PX, dialogWidth - DESCRIPTION_PANEL_MIN_WIDTH_PX);
}
