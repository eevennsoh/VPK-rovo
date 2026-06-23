import {
	ASCII_ANIMATION_STYLES,
	ASCII_BACKGROUND_MODES,
	ASCII_CHARSETS,
	ASCII_COMPOSITE_MODES,
	ASCII_CONTROL_BLEND_MODES,
	ASCII_CONTROL_COLOR_MODES,
	ASCII_COLOR_SOURCE_MODES,
	ASCII_DEFAULT_CHARACTERS,
	ASCII_FONT_WEIGHTS,
	ASCII_MASK_MODES,
	ASCII_MASK_SOURCES,
	ASCII_SIGNAL_MODES,
	ASCII_TONE_MAPPING_MODES,
	type AsciiBackgroundMode,
	type AsciiBlendMode,
	type AsciiCharset,
	type AsciiSourceMode,
} from "./shaders/ascii-core";

export const SOURCE_MODE_OPTIONS = [
	{ value: "field", label: "Field" },
	{ value: "image", label: "Image" },
] as const satisfies ReadonlyArray<{ value: AsciiSourceMode; label: string }>;

export const ANIMATION_STYLE_OPTIONS = [
	{ value: "wave", label: "Wave" },
	{ value: "cascade-left-right", label: "Cascade Left -> Right" },
	{ value: "cascade-right-left", label: "Cascade Right -> Left" },
	{ value: "cascade-top-bottom", label: "Cascade Top -> Bottom" },
	{ value: "reveal", label: "Reveal" },
	{ value: "pulse", label: "Pulse" },
] satisfies ReadonlyArray<{ value: (typeof ASCII_ANIMATION_STYLES)[number]; label: string }>;

export function titleizeAsciiOption(value: string): string {
	return value
		.split("-")
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(" ");
}

export function asciiOptionsFromValues<const T extends readonly string[]>(values: T) {
	return values.map((value) => ({ value, label: titleizeAsciiOption(value) }));
}

export const BLEND_MODE_OPTIONS = asciiOptionsFromValues(ASCII_CONTROL_BLEND_MODES);
export const COMPOSITE_MODE_OPTIONS = asciiOptionsFromValues(ASCII_COMPOSITE_MODES);
export const CHARSET_OPTIONS = [
	...asciiOptionsFromValues(Object.keys(ASCII_CHARSETS) as Array<keyof typeof ASCII_CHARSETS>),
	{ value: "custom", label: "Custom" },
] as const;
export const FONT_WEIGHT_OPTIONS = asciiOptionsFromValues(ASCII_FONT_WEIGHTS);
export const COLOR_MODE_OPTIONS = asciiOptionsFromValues(ASCII_CONTROL_COLOR_MODES);
export const COLOR_SOURCE_OPTIONS = asciiOptionsFromValues(ASCII_COLOR_SOURCE_MODES);
export const MASK_SOURCE_OPTIONS = asciiOptionsFromValues(ASCII_MASK_SOURCES);
export const MASK_MODE_OPTIONS = asciiOptionsFromValues(ASCII_MASK_MODES);
export const SIGNAL_MODE_OPTIONS = asciiOptionsFromValues(ASCII_SIGNAL_MODES);
export const TONE_MAPPING_OPTIONS = asciiOptionsFromValues(ASCII_TONE_MAPPING_MODES);
export const BACKGROUND_MODE_OPTIONS = [
	{ value: "blurred-image", label: "Blurred Image" },
	{ value: "solid-black", label: "Solid Black" },
	{ value: "original-image", label: "Original Image" },
	{ value: "transparent", label: "None (Transparent)" },
] satisfies ReadonlyArray<{ value: (typeof ASCII_BACKGROUND_MODES)[number]; label: string }>;

export const DEFAULT_CHARSET_VALUES: Record<AsciiCharset, string> = {
	...ASCII_CHARSETS,
	custom: ASCII_DEFAULT_CHARACTERS,
};

export const DEFAULT_DENSITY = 0.82;
export const DEFAULT_PREVIEW_ASPECT_RATIO = "16 / 9";
export const IMAGE_BACKGROUND_OPACITY = 0.61;
export const IMAGE_BACKGROUND_BLUR_RADIUS = 60;
export const DEFAULT_ANIMATION_SPEED_SECONDS = 4.3;
export const DEFAULT_ANIMATION_INTENSITY = 0.83;
export const DEFAULT_ANIMATION_RANDOMNESS = 0.5;
export const DEFAULT_COLOR_OVERLAY_OPACITY = 0.3;
export const DEFAULT_VIGNETTE_INTENSITY = 0.5;
export const DEFAULT_SCAN_LINES_INTENSITY = 0.4;
export const DEFAULT_CRT_CURVATURE_INTENSITY = 0.3;
export const DEFAULT_CHROMATIC_OFFSET = 3;
export const DEFAULT_BLOOM_INTENSITY = 0.4;
export const DEFAULT_BLOOM_THRESHOLD = 0.6;
export const DEFAULT_BLOOM_RADIUS = 6;
export const DEFAULT_BLOOM_SOFTNESS = 0.35;
export const DEFAULT_CHARACTER_BLOOM_INTENSITY = 0.6;
export const DEFAULT_CHARACTER_CHROMATIC_OFFSET = 3;
export const DEFAULT_FILM_GRAIN_INTENSITY = 0.3;
export const DEFAULT_GLITCH_INTENSITY = 0.2;
export const DEFAULT_RGB_SPLIT_OFFSET = 2;
export const DEFAULT_BLUR_RADIUS = 2;
export const DEFAULT_PIXELATE_SIZE = 4;
export const DEFAULT_HALFTONE_SIZE = 4;
export const DEFAULT_FILM_DUST_DENSITY = 0.2;

export const COLOR_OVERLAY_BLEND_OPTIONS = [
	{ value: "multiply", label: "Multiply" },
	{ value: "overlay", label: "Overlay" },
	{ value: "screen", label: "Screen" },
	{ value: "color", label: "Color" },
	{ value: "hue", label: "Hue" },
	{ value: "saturation", label: "Saturation" },
	{ value: "luminosity", label: "Luminosity" },
	{ value: "soft-light", label: "Soft Light" },
	{ value: "hard-light", label: "Hard Light" },
	{ value: "color-burn", label: "Color Burn" },
	{ value: "color-dodge", label: "Color Dodge" },
] satisfies ReadonlyArray<{ value: AsciiBlendMode; label: string }>;

export interface AsciiUploadedImageDimensions {
	width: number;
	height: number;
}

export function animationDurationToCycleSpeed(durationSeconds: number, characterCount: number): number {
	return characterCount / Math.max(durationSeconds, 0.1);
}

export function getPreviewAspectRatio(image: AsciiUploadedImageDimensions | undefined): string {
	return image ? `${image.width} / ${image.height}` : DEFAULT_PREVIEW_ASPECT_RATIO;
}

export function resolveImageBackgroundDefaults(): {
	backgroundMode: AsciiBackgroundMode;
	backgroundOpacity: number;
	backgroundBlurRadius: number;
} {
	return {
		backgroundMode: "blurred-image",
		backgroundOpacity: IMAGE_BACKGROUND_OPACITY,
		backgroundBlurRadius: IMAGE_BACKGROUND_BLUR_RADIUS,
	};
}
