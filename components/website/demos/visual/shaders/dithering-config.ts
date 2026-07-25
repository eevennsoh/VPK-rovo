export const DITHERING_BLEND_MODES = [
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

export const DITHERING_COMPOSITE_MODES = ["filter", "mask"] as const;
export const DITHERING_PRESETS = ["custom", "gameboy"] as const;
export const DITHERING_ALGORITHMS = ["bayer-2x2", "bayer-4x4", "bayer-8x8", "noise"] as const;
export const DITHERING_COLOR_MODES = ["monochrome", "source", "duo-tone"] as const;

export type DitheringPreset = (typeof DITHERING_PRESETS)[number];
export type DitheringAlgorithm = (typeof DITHERING_ALGORITHMS)[number];
export type DitheringColorMode = (typeof DITHERING_COLOR_MODES)[number];
export type DitheringBlendMode = (typeof DITHERING_BLEND_MODES)[number];
export type DitheringCompositeMode = (typeof DITHERING_COMPOSITE_MODES)[number];

export interface DitheringPresetValues {
	algorithm?: DitheringAlgorithm;
	colorMode?: DitheringColorMode;
	highlightColor?: string;
	levels?: number;
	monoColor?: string;
	pixelSize?: number;
	shadowColor?: string;
	spread?: number;
}

export const DITHERING_PRESET_DEFAULTS = {
	gameboy: {
		algorithm: "bayer-2x2",
		colorMode: "duo-tone",
		highlightColor: "#9bbc0f",
		levels: 4,
		pixelSize: 3,
		shadowColor: "#0f380f",
		spread: 0.5,
	},
} as const satisfies Record<Exclude<DitheringPreset, "custom">, DitheringPresetValues>;

export function getDitheringPresetDefaults(preset: DitheringPreset): DitheringPresetValues {
	return preset === "gameboy" ? DITHERING_PRESET_DEFAULTS.gameboy : {};
}
