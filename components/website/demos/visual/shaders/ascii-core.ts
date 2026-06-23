export const ASCII_CHARSETS = {
	light: " .:-=+*#%@",
	dense: " .',:;!|({#@",
	blocks: " ░▒▓█",
	hatching: " ╱╲╳░▒",
	binary: "01",
} as const;

export const ASCII_DEFAULT_CHARACTERS = ASCII_CHARSETS.light;

export const ASCII_BLEND_MODES = [
	"normal",
	"multiply",
	"screen",
	"overlay",
	"darken",
	"lighten",
	"color-dodge",
	"color-burn",
	"hard-light",
	"soft-light",
	"difference",
	"exclusion",
	"hue",
	"saturation",
	"color",
	"luminosity",
] as const;

export const ASCII_CONTROL_BLEND_MODES = ["normal", "multiply", "screen", "overlay", "darken", "lighten"] as const;
export const ASCII_COMPOSITE_MODES = ["filter", "mask"] as const;
export const ASCII_MASK_SOURCES = ["luminance", "alpha", "red", "green", "blue"] as const;
export const ASCII_MASK_MODES = ["multiply", "stencil"] as const;
export const ASCII_FONT_WEIGHTS = ["thin", "regular", "bold"] as const;
export const ASCII_COLOR_MODES = ["source", "monochrome", "green-terminal"] as const;
export const ASCII_CONTROL_COLOR_MODES = ["source", "monochrome"] as const;
export const ASCII_COLOR_SOURCE_MODES = ["source", "luminance", "lightness", "red", "green", "blue"] as const;
export const ASCII_CHARACTER_MODES = ["signal", "sequence"] as const;
export const ASCII_ANIMATION_STYLES = ["wave", "cascade-left-right", "cascade-right-left", "cascade-top-bottom", "reveal", "pulse"] as const;
export const ASCII_BACKGROUND_MODES = ["blurred-image", "solid-black", "original-image", "transparent"] as const;
export const ASCII_SIGNAL_MODES = ["luminance", "lightness", "red", "green", "blue"] as const;
export const ASCII_TONE_MAPPING_MODES = ["none", "aces", "reinhard", "totos", "cinematic"] as const;
export const ASCII_DEFAULT_SOURCE_COLORS = ["#1868DB", "#FCA700", "#AF59E1", "#6A9A23"] as const;
export const ASCII_MAX_SOURCE_COLORS = 8;

export type AsciiBlendMode = (typeof ASCII_BLEND_MODES)[number];
export type AsciiBackgroundMode = (typeof ASCII_BACKGROUND_MODES)[number];
export type LegacyAsciiBackgroundMode = "solid" | "source" | "blurred-source";
export type EffectAmount = boolean | number;
export type AsciiCharset = keyof typeof ASCII_CHARSETS | "custom";
export type AsciiAnimationStyle = (typeof ASCII_ANIMATION_STYLES)[number];
export type AsciiCharacterMode = (typeof ASCII_CHARACTER_MODES)[number];
export type AsciiColorMode = (typeof ASCII_COLOR_MODES)[number];
export type AsciiColorSourceMode = (typeof ASCII_COLOR_SOURCE_MODES)[number];
export type AsciiCompositeMode = (typeof ASCII_COMPOSITE_MODES)[number];
export type AsciiFontWeight = (typeof ASCII_FONT_WEIGHTS)[number];
export type AsciiMaskMode = (typeof ASCII_MASK_MODES)[number];
export type AsciiMaskSource = (typeof ASCII_MASK_SOURCES)[number];
export type AsciiSignalMode = (typeof ASCII_SIGNAL_MODES)[number];
export type AsciiSourceMode = "field" | "image";
export type AsciiToneMappingMode = (typeof ASCII_TONE_MAPPING_MODES)[number];
