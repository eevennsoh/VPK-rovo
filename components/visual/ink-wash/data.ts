export type InkWashMode = "pen" | "water" | "white";
export type InkWashView = "painting" | "pigment" | "water" | "flow";
export type InkWashQuality = "low" | "medium" | "high";

export interface InkWashParams {
	size: number;
	flow: number;
	bleed: number;
	dry: number;
	color: number;
	brushInk: number;
	inkStrength: number;
	edgeStrength: number;
	grainStrength: number;
	paper: boolean;
	wetSheen: boolean;
	vignette: boolean;
}

export interface InkWashConfig extends InkWashParams {
	mode: InkWashMode;
	inkColor: string;
	view: InkWashView;
	quality: InkWashQuality;
	playing: boolean;
	interactive: boolean;
}

export type InkWashPoint = readonly [number, number];
export type InkWashPath = (progress: number) => InkWashPoint;
export type InkWashPressure = number | ((progress: number) => number);
export type InkWashAbsorption = readonly [number, number, number];

export type InkWashStrokeAction = Readonly<{
	t0: number;
	t1: number;
	path: InkWashPath;
	pressure?: InkWashPressure;
	mode?: InkWashMode;
	brushInk?: number;
	inkAbsorption?: InkWashAbsorption;
}>;

export type InkWashCommandAction = Readonly<{
	at: number;
	command: "fix" | "clear";
}>;

export type InkWashScriptAction = InkWashStrokeAction | InkWashCommandAction;

export type InkWashPreset = Readonly<{
	id: string;
	label: string;
	description: string;
	aspect: number;
	duration: number;
	config: Partial<InkWashConfig>;
	script: readonly InkWashScriptAction[];
}>;

export const DEFAULT_INK_WASH_CONFIG: InkWashConfig = {
	mode: "pen",
	inkColor: "#16161e",
	size: 0.5,
	flow: 0.6,
	bleed: 0.5,
	dry: 0.45,
	color: 0.5,
	brushInk: 0,
	view: "painting",
	inkStrength: 1.9,
	edgeStrength: 1.35,
	grainStrength: 0.55,
	paper: true,
	wetSheen: true,
	vignette: true,
	quality: "medium",
	playing: true,
	interactive: true,
};

export const INK_WASH_VIEW_OPTIONS: readonly { value: InkWashView; label: string }[] = [
	{ value: "painting", label: "Painting" },
	{ value: "pigment", label: "Pigment" },
	{ value: "water", label: "Water" },
	{ value: "flow", label: "Flow" },
];

export const INK_WASH_MODE_OPTIONS: readonly { value: InkWashMode; label: string }[] = [
	{ value: "pen", label: "Pen" },
	{ value: "water", label: "Water" },
	{ value: "white", label: "White" },
];

export const INK_WASH_QUALITY_OPTIONS: readonly { value: InkWashQuality; label: string }[] = [
	{ value: "low", label: "Low" },
	{ value: "medium", label: "Medium" },
	{ value: "high", label: "High" },
];

export const INK_WASH_CONTROL_RANGES = {
	size: { min: 0, max: 1, step: 0.01 },
	flow: { min: 0, max: 1, step: 0.01 },
	bleed: { min: 0, max: 1, step: 0.01 },
	dry: { min: 0, max: 1, step: 0.01 },
	color: { min: 0, max: 1, step: 0.01 },
	brushInk: { min: 0, max: 1, step: 0.01 },
	inkStrength: { min: 0.2, max: 4, step: 0.05 },
	edgeStrength: { min: 0, max: 4, step: 0.05 },
	grainStrength: { min: 0, max: 1.5, step: 0.01 },
} as const;

export const HOUSE_INK_ABSORPTION: InkWashAbsorption = [1, 0.97, 0.88];

const TAU = Math.PI * 2;

function clamp(value: number, min: number, max: number): number {
	return Math.min(Math.max(value, min), max);
}

export function clampInkWashParams(config: InkWashConfig): InkWashConfig {
	return {
		...config,
		size: clamp(config.size, 0, 1),
		flow: clamp(config.flow, 0, 1),
		bleed: clamp(config.bleed, 0, 1),
		dry: clamp(config.dry, 0, 1),
		color: clamp(config.color, 0, 1),
		brushInk: clamp(config.brushInk, 0, 1),
		inkStrength: clamp(config.inkStrength, 0.2, 4),
		edgeStrength: clamp(config.edgeStrength, 0, 4),
		grainStrength: clamp(config.grainStrength, 0, 1.5),
	};
}

export function mergeInkWashConfig(
	...configs: readonly (Partial<InkWashConfig> | undefined)[]
): InkWashConfig {
	return clampInkWashParams(Object.assign({}, DEFAULT_INK_WASH_CONFIG, ...configs));
}

function normalizeHexColor(value: string): string | null {
	const color = value.trim();
	if (/^#[0-9a-f]{6}$/iu.test(color)) return color.toLowerCase();
	if (/^#[0-9a-f]{3}$/iu.test(color)) {
		const [, r = "0", g = "0", b = "0"] = color;
		return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
	}
	return null;
}

export function inkWashAbsorptionFromHex(value: string): InkWashAbsorption {
	const normalized = normalizeHexColor(value);
	if (!normalized) return HOUSE_INK_ABSORPTION;

	const r = Number.parseInt(normalized.slice(1, 3), 16) / 255;
	const g = Number.parseInt(normalized.slice(3, 5), 16) / 255;
	const b = Number.parseInt(normalized.slice(5, 7), 16) / 255;
	if (Math.max(r, g, b) < 0.09) return HOUSE_INK_ABSORPTION;

	const absorption = [r, g, b].map((channel) => -Math.log(Math.max(channel, 0.02)));
	const maxAbsorption = Math.max(absorption[0] ?? 0, absorption[1] ?? 0, absorption[2] ?? 0, 0.25);
	return [
		(absorption[0] ?? 0) / maxAbsorption,
		(absorption[1] ?? 0) / maxAbsorption,
		(absorption[2] ?? 0) / maxAbsorption,
	];
}

function taper(progress: number): number {
	return 0.22 + 0.78 * Math.sin(Math.PI * clamp(progress, 0, 1));
}

export const INK_WASH_PRESETS = [
	{
		id: "landscape",
		label: "Landscape wash",
		description: "Scripted linework, hill washes, a sun wash, and white water highlights.",
		aspect: 1.85,
		duration: 19,
		config: { color: 1, bleed: 0.55, dry: 0.35 },
		script: [
			{ t0: 0.2, t1: 1.3, path: (s) => [0.06 + 0.42 * s, 0.3 + 0.3 * Math.sin(Math.PI * s)], pressure: taper },
			{ t0: 1.5, t1: 2.7, path: (s) => [0.36 + 0.57 * s, 0.3 + 0.21 * Math.sin(Math.PI * s)], pressure: taper },
			{ t0: 2.9, t1: 3.7, path: (s) => [0.04 + 0.92 * s, 0.295 + 0.006 * Math.sin(s * 9)], pressure: 0.4 },
			{ t0: 3.9, t1: 4.8, path: (s) => [0.8 + 0.038 * Math.cos(TAU * s + 1.57), 0.74 + 0.07 * Math.sin(TAU * s + 1.57)], pressure: 0.5 },
			{ t0: 5, t1: 5.28, path: (s) => [0.26 + 0.055 * s, 0.79 + 0.03 * Math.abs(2 * s - 1)], pressure: 0.35 },
			{ t0: 5.4, t1: 5.62, path: (s) => [0.385 + 0.042 * s, 0.84 + 0.024 * Math.abs(2 * s - 1)], pressure: 0.3 },
			{ t0: 6.4, t1: 8.2, mode: "water", pressure: 0.55, brushInk: 0.35, path: (s) => [0.09 + 0.37 * s, 0.33 + 0.17 * Math.sin(Math.PI * s) * (0.55 + 0.45 * Math.sin(s * 16))] },
			{ t0: 8.4, t1: 10, mode: "water", pressure: 0.5, brushInk: 0.35, path: (s) => [0.43 + 0.49 * s, 0.32 + 0.12 * Math.sin(Math.PI * s) * (0.6 + 0.4 * Math.sin(s * 14))] },
			{ t0: 10.3, t1: 11.6, mode: "water", pressure: 0.7, brushInk: 0.25, path: (s) => [0.1 + 0.74 * s, 0.205 + 0.03 * Math.sin(s * 11)] },
			{ t0: 11.9, t1: 13.4, mode: "water", pressure: 0.5, brushInk: 0.9, inkAbsorption: [0.04, 0.15, 1], path: (s) => [0.8 + 0.062 * Math.cos(TAU * 2 * s) / 1.85, 0.74 + 0.062 * Math.sin(TAU * 2 * s)] },
			{ at: 14.8, command: "fix" },
			{ t0: 15.3, t1: 15.55, mode: "white", path: (s) => [0.33 + 0.07 * s, 0.225], pressure: 0.5 },
			{ t0: 15.7, t1: 15.9, mode: "white", path: (s) => [0.52 + 0.05 * s, 0.185], pressure: 0.45 },
			{ t0: 16.05, t1: 16.25, mode: "white", path: (s) => [0.68 + 0.045 * s, 0.24], pressure: 0.45 },
		],
	},
	{
		id: "flow-low",
		label: "Low flow",
		description: "A damp, obedient wash with little momentum.",
		aspect: 1,
		duration: 9,
		config: { flow: 0.08, bleed: 0.45, quality: "low" },
		script: [
			{ t0: 0.2, t1: 1.2, path: (s) => [0.5, 0.18 + 0.64 * s], pressure: taper },
			{ t0: 1.5, t1: 5.3, mode: "water", pressure: 0.6, path: (s) => [0.5 + 0.26 * Math.cos(TAU * 2 * s - 1.57), 0.5 + 0.26 * Math.sin(TAU * 2 * s - 1.57)] },
		],
	},
	{
		id: "flow-high",
		label: "High flow",
		description: "A lively wash with stronger velocity and vorticity.",
		aspect: 1,
		duration: 9,
		config: { flow: 0.95, bleed: 0.45, quality: "low" },
		script: [
			{ t0: 0.2, t1: 1.2, path: (s) => [0.5, 0.18 + 0.64 * s], pressure: taper },
			{ t0: 1.5, t1: 5.3, mode: "water", pressure: 0.6, path: (s) => [0.5 + 0.26 * Math.cos(TAU * 2 * s - 1.57), 0.5 + 0.26 * Math.sin(TAU * 2 * s - 1.57)] },
		],
	},
	{
		id: "dry-window",
		label: "Drying window",
		description: "Water brushed over one half of a line, then drying closes the working window.",
		aspect: 2,
		duration: 11,
		config: { dry: 0.45 },
		script: [
			{ t0: 0.2, t1: 1.5, path: (s) => [0.1 + 0.8 * s, 0.5 + 0.18 * Math.sin(TAU * 1.5 * s)], pressure: taper },
			{ t0: 2, t1: 3.4, mode: "water", pressure: 0.6, path: (s) => [0.12 + 0.35 * s, 0.5 + 0.2 * Math.sin(TAU * 2 * s)] },
		],
	},
	{
		id: "bleed-chroma",
		label: "Bleed and chroma",
		description: "A circling water brush pulls blue-violet chromatic halos from dense ink.",
		aspect: 2,
		duration: 11,
		config: { bleed: 1, color: 1, size: 0.65 },
		script: [
			{ t0: 0.2, t1: 1.2, path: (s) => [0.32 + 0.075 * Math.cos(TAU * 6 * s) / 2, 0.5 + 0.075 * Math.sin(TAU * 9 * s)], pressure: 0.95 },
			{ t0: 1.6, t1: 4.8, mode: "water", pressure: 0.5, path: (s) => {
				const radius = 0.13 + 0.12 * s;
				const angle = TAU * 2.6 * s;
				return [0.32 + radius * Math.cos(angle) / 2, 0.5 + radius * Math.sin(angle)];
			} },
		],
	},
	{
		id: "layered-white",
		label: "Layered white ink",
		description: "A loaded brush field is fixed, white ink is baked in, then dark ink crosses it.",
		aspect: 2,
		duration: 11,
		config: { size: 0.6, brushInk: 1, bleed: 0.3, dry: 0.65, flow: 0.3 },
		script: [
			{ t0: 0.2, t1: 1.6, mode: "water", pressure: 0.9, path: (s) => [0.26 + 0.48 * s, 0.6 + 0.04 * Math.sin(TAU * s)] },
			{ t0: 1.8, t1: 3.2, mode: "water", pressure: 0.9, path: (s) => [0.26 + 0.48 * s, 0.4 - 0.04 * Math.sin(TAU * s)] },
			{ at: 3.8, command: "fix" },
			{ t0: 4.4, t1: 5.8, mode: "white", pressure: 0.95, path: (s) => [0.5 + 0.1 * Math.cos(TAU * 1.6 * s + 1.57) / 2, 0.5 + 0.13 * Math.sin(TAU * 1.6 * s + 1.57)] },
			{ at: 6.4, command: "fix" },
			{ t0: 7, t1: 7.9, path: (s) => [0.3 + 0.4 * s, 0.26 + 0.48 * s], pressure: 0.75 },
		],
	},
	{
		id: "leaf",
		label: "Leaf",
		description: "A compact gallery preset with contour strokes and a light wash.",
		aspect: 1,
		duration: 9.5,
		config: { color: 0.65, bleed: 0.6, dry: 0.4, quality: "low" },
		script: [
			{ t0: 0.2, t1: 1.1, path: (s) => [0.18 + 0.62 * s, 0.5 + 0.26 * Math.sin(Math.PI * s)], pressure: taper },
			{ t0: 1.25, t1: 2.15, path: (s) => [0.18 + 0.62 * s, 0.5 - 0.26 * Math.sin(Math.PI * s)], pressure: taper },
			{ t0: 2.3, t1: 2.9, path: (s) => [0.2 + 0.56 * s, 0.5], pressure: 0.4 },
			{ t0: 3.9, t1: 5.6, mode: "water", pressure: 0.5, path: (s) => [0.22 + 0.5 * s, 0.5 + 0.17 * Math.sin(Math.PI * s) * Math.sin(TAU * 2.5 * s)] },
		],
	},
	{
		id: "bloom",
		label: "Bloom",
		description: "Water first, ink second: dots bloom through a wet field.",
		aspect: 1,
		duration: 9.5,
		config: { dry: 0.2, bleed: 0.65, color: 0.55, quality: "low" },
		script: [
			{ t0: 0.2, t1: 2, mode: "water", pressure: 0.75, path: (s) => {
				const angle = TAU * 1.8 * s;
				const radius = 0.3 - 0.12 * s;
				return [0.5 + radius * Math.cos(angle), 0.5 + radius * Math.sin(angle)];
			} },
			{ t0: 2.2, t1: 2.9, mode: "water", pressure: 0.7, path: (s) => [0.5 + 0.1 * Math.cos(TAU * s), 0.5 + 0.1 * Math.sin(TAU * s)] },
			{ t0: 3.1, t1: 3.55, path: () => [0.4, 0.58], pressure: 0.85 },
			{ t0: 3.7, t1: 4.1, path: () => [0.58, 0.46], pressure: 0.85 },
			{ t0: 4.25, t1: 4.6, path: () => [0.47, 0.35], pressure: 0.75 },
			{ t0: 4.75, t1: 5.1, path: () => [0.6, 0.62], pressure: 0.75 },
		],
	},
	{
		id: "night",
		label: "Night",
		description: "A dark loaded brush field with fixed white star marks.",
		aspect: 1,
		duration: 14,
		config: { size: 0.6, brushInk: 1, dry: 0.6, bleed: 0.3, flow: 0.25, quality: "low" },
		script: [
			{ t0: 0.2, t1: 1.9, mode: "water", pressure: 0.95, path: (s) => [0.18 + 0.64 * s, 0.8 + 0.03 * Math.sin(TAU * s)] },
			{ t0: 2.1, t1: 3.8, mode: "water", pressure: 0.95, path: (s) => [0.82 - 0.64 * s, 0.62 - 0.03 * Math.sin(TAU * s)] },
			{ t0: 4, t1: 5.7, mode: "water", pressure: 0.95, path: (s) => [0.18 + 0.64 * s, 0.46 + 0.03 * Math.sin(TAU * s)] },
			{ t0: 5.9, t1: 7.3, mode: "water", pressure: 0.95, path: (s) => [0.82 - 0.64 * s, 0.72 + 0.03 * Math.sin(TAU * s)] },
			{ t0: 7.5, t1: 8.9, mode: "water", pressure: 0.95, path: (s) => [0.18 + 0.64 * s, 0.55 - 0.03 * Math.sin(TAU * s)] },
			{ at: 9.4, command: "fix" },
			{ t0: 9.9, t1: 10.2, mode: "white", path: () => [0.3, 0.78], pressure: 0.6 },
			{ t0: 10.35, t1: 10.6, mode: "white", path: () => [0.52, 0.86], pressure: 0.55 },
			{ t0: 10.75, t1: 11, mode: "white", path: () => [0.74, 0.7], pressure: 0.6 },
			{ t0: 11.15, t1: 11.4, mode: "white", path: () => [0.4, 0.58], pressure: 0.5 },
			{ t0: 11.6, t1: 12.5, mode: "white", pressure: 0.85, path: (s) => [0.63 + 0.05 * Math.cos(TAU * 0.7 * s + 2.2), 0.7 + 0.06 * Math.sin(TAU * 0.7 * s + 2.2)] },
		],
	},
] as const satisfies readonly InkWashPreset[];

export type InkWashPresetId = (typeof INK_WASH_PRESETS)[number]["id"];

export const INK_WASH_PRESET_OPTIONS: readonly { value: InkWashPresetId; label: string }[] =
	INK_WASH_PRESETS.map((preset) => ({ value: preset.id as InkWashPresetId, label: preset.label }));

export function getInkWashPreset(id: InkWashPresetId | string): InkWashPreset {
	return INK_WASH_PRESETS.find((preset) => preset.id === id) ?? INK_WASH_PRESETS[0];
}
