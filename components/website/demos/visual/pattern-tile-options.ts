import type { PatternBlendMode, PatternFill, PatternPosition, PatternType } from "./pattern-tile";

export const PATTERN_TYPES: { value: PatternType; label: string }[] = [
	{ value: "grid", label: "Grid" },
	{ value: "wave-lines", label: "Wave Lines" },
	{ value: "clouds", label: "Clouds" },
	{ value: "wiggle", label: "Wiggle" },
	{ value: "groovy", label: "Groovy" },
	{ value: "plus", label: "Plus" },
	{ value: "circles", label: "Circles" },
	{ value: "rectangles", label: "Rectangles" },
	{ value: "lines", label: "Lines" },
	{ value: "lines-vertical", label: "Lines Vertical" },
	{ value: "diagonal", label: "Diagonal" },
	{ value: "diagonal-two", label: "Diagonal 2" },
	{ value: "blocks", label: "Blocks" },
	{ value: "wave", label: "Wave" },
	{ value: "zigzag", label: "ZigZag" },
	{ value: "polka", label: "Polka" },
	{ value: "rhombus", label: "Rhombus" },
	{ value: "stars", label: "Stars" },
	{ value: "stars-two", label: "Stars 2" },
	{ value: "paper", label: "Paper" },
	{ value: "crosses", label: "Crosses" },
];

export const FILL_TYPES: { value: PatternFill; label: string }[] = [
	{ value: "tile", label: "Tile" },
	{ value: "fill", label: "Fill" },
	{ value: "fit", label: "Fit" },
	{ value: "stretch", label: "Stretch" },
];

export const POSITION_TYPES: { value: PatternPosition; label: string }[] = [
	{ value: "top-left", label: "Top Left" },
	{ value: "top-center", label: "Top Center" },
	{ value: "top-right", label: "Top Right" },
	{ value: "left", label: "Left" },
	{ value: "center", label: "Center" },
	{ value: "right", label: "Right" },
	{ value: "bottom-left", label: "Bottom Left" },
	{ value: "bottom-center", label: "Bottom Center" },
	{ value: "bottom-right", label: "Bottom Right" },
];

export const BLEND_MODE_TYPES: { value: PatternBlendMode; label: string }[] = [
	{ value: "normal", label: "Normal" },
	{ value: "darken", label: "Darken" },
	{ value: "multiply", label: "Multiply" },
	{ value: "color-burn", label: "Color Burn" },
	{ value: "lighten", label: "Lighten" },
	{ value: "screen", label: "Screen" },
	{ value: "plus-lighter", label: "Plus Lighter" },
	{ value: "color-dodge", label: "Color Dodge" },
	{ value: "overlay", label: "Overlay" },
	{ value: "soft-light", label: "Soft Light" },
	{ value: "hard-light", label: "Hard Light" },
	{ value: "difference", label: "Difference" },
	{ value: "exclusion", label: "Exclusion" },
	{ value: "hue", label: "Hue" },
	{ value: "saturation", label: "Saturation" },
	{ value: "color", label: "Color" },
	{ value: "luminosity", label: "Luminosity" },
];

export const ANIMATABLE_PATTERNS: PatternType[] = [
	"wave-lines",
	"wiggle",
	"clouds",
	"stars",
	"groovy",
];
