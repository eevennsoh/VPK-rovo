/** Pinned upstream "Figma soft" surface treatment. Every layer is rendered
 * from the merged SVG silhouette so its ring and elevation morph with the goo.
 * `light-dark()` follows VPK's document color-scheme without duplicating DOM
 * borders on the interactive children. */
export const GOOEY_SOURCE_SHADOW = [
	"0 0 0 1px light-dark(transparent, rgba(255, 255, 255, 0.04)) inset",
	"0 1px 0 0 light-dark(transparent, rgba(255, 255, 255, 0.03)) inset",
	"0 0 0 1px rgba(0, 0, 0, 0.06)",
	"0 2px 6px 0 rgba(0, 0, 0, 0.05)",
	"0 4px 42px 0 light-dark(rgba(0, 0, 0, 0.06), rgba(0, 0, 0, 0.24))",
].join(", ");
