// Parameter model for the Rovo p5 sketch.
//
// The sketch morphs the Rovo mark — reconstructed as the isometric cube it is
// drawn as — into a temporal force-directed teamwork graph, with the mark's
// four facets becoming four communities.
//
// The descriptor table drives the GUI panel so the art shell stays a layout
// file rather than a wall of sliders.

// Declared as a type alias rather than an interface on purpose: TypeScript only
// grants implicit index signatures to aliases, and `GUI.Panel` takes its
// `values` prop as `Record<string, unknown>` for the copy-as-JSON action.
export type RovoP5Params = {
	/** When on, the timeline owns the choreographed channels. */
	timeline: boolean;
	/** 0 = readable Rovo mark, 1 = the teamwork graph. */
	form: number;
	particles: number;
	zoom: number;
	extrude: number;
	thickness: number;
	spin: number;
	tilt: number;
	perspective: number;
	graphNodes: number;
	graphSpread: number;
	graphLink: number;
	graphTravel: number;
	graphGrowth: number;
	graphLinkOpacity: number;
	speed: number;
	shimmer: number;
	shimmerSpeed: number;
	twinkle: number;
	starlight: number;
	trails: boolean;
	trailFade: number;
	brandColor: boolean;
	alpha: number;
	pointSize: number;
};

/** `PI / 80`, the per-frame time step in the original sketch. */
export const ROVO_P5_BASE_SPEED = Math.PI / 80;

export const ROVO_P5_DEFAULTS: RovoP5Params = {
	// The piece plays itself: the cycle assembles the graph and resolves it into
	// the mark. Turn the timeline off to drive the form by hand.
	timeline: true,
	form: 0,
	particles: 10000,
	zoom: 1,
	extrude: 0.4,
	thickness: 0.22,
	spin: 0,
	tilt: 0,
	perspective: 1,
	graphNodes: 96,
	graphSpread: 120,
	graphLink: 0.42,
	graphTravel: 0.35,
	graphGrowth: 22,
	graphLinkOpacity: 0.15,
	speed: ROVO_P5_BASE_SPEED,
	shimmer: 1.8,
	shimmerSpeed: 0.9,
	twinkle: 0.45,
	starlight: 0.6,
	// On by default: the reference sketches fade the previous frame instead of
	// clearing it, which is what turns each particle's little orbit into the
	// glowing arcs and rings that read as a galaxy.
	trails: true,
	trailFade: 0.28,
	brandColor: true,
	alpha: 96,
	pointSize: 1,
};

type KeysOfType<TValue> = {
	[K in keyof RovoP5Params]: RovoP5Params[K] extends TValue ? K : never;
}[keyof RovoP5Params];

export type RovoP5NumericKey = KeysOfType<number>;
export type RovoP5ToggleKey = KeysOfType<boolean>;

interface ControlBase {
	readonly label: string;
	readonly description?: string;
	/** Greyed out when this toggle is off. */
	readonly dependsOn?: RovoP5ToggleKey;
	/** Greyed out when the visitor prefers reduced motion. */
	readonly motionOnly?: boolean;
	/** Owned by the timeline; greyed out unless the timeline is switched off. */
	readonly directed?: boolean;
}

export interface RovoP5SliderControl extends ControlBase {
	readonly kind: "slider";
	readonly key: RovoP5NumericKey;
	readonly min: number;
	readonly max: number;
	readonly step: number;
	readonly unit?: string;
	/** Render through `GUI.PercentControl` instead of `GUI.Control`. */
	readonly percent?: boolean;
}

export interface RovoP5ToggleControl extends ControlBase {
	readonly kind: "toggle";
	readonly key: RovoP5ToggleKey;
}

export type RovoP5Control = RovoP5SliderControl | RovoP5ToggleControl;

export interface RovoP5Section {
	readonly title: string;
	readonly controls: readonly RovoP5Control[];
}

export const ROVO_P5_SECTIONS: readonly RovoP5Section[] = [	{
		title: "Form",
		controls: [
			{
				kind: "toggle",
				key: "timeline",
				label: "Timeline",
				description: "Plays the cycle. Switch off to drive the form and camera by hand.",
			},
			{
				kind: "slider",
				key: "form",
				directed: true,
				label: "Graph to mark",
				description: "100% is the teamwork graph, 0% the Rovo mark it resolves into.",
				min: 0,
				max: 1,
				step: 0.01,
				percent: true,
			},
			{ kind: "slider", key: "particles", label: "Particles", min: 1000, max: 30000, step: 500 },
			{ kind: "slider", key: "zoom", label: "Zoom", min: 0.3, max: 2.5, step: 0.01 },
		],
	},
	{
		title: "3D",
		controls: [
			{
				kind: "slider",
				key: "extrude",
				directed: true,
				label: "Extrude",
				description: "Depth of the cube the mark is drawn as. Drag the canvas to orbit.",
				min: 0.05,
				max: 1.2,
				step: 0.01,
			},
			{
				kind: "slider",
				key: "thickness",
				label: "Thickness",
				description: "Depth spread of each face. Invisible head-on, solid once orbited.",
				min: 0,
				max: 1,
				step: 0.01,
			},
			{
				kind: "slider",
				key: "spin",
				directed: true,
				label: "Spin",
				min: 0,
				max: 0.03,
				step: 0.001,
				motionOnly: true,
			},
			{ kind: "slider", key: "tilt", directed: true, label: "Tilt", min: -1, max: 1, step: 0.01 },
			{ kind: "slider", key: "perspective", directed: true, label: "Perspective", min: 0.1, max: 3, step: 0.05 },
		],
	},
	{
		title: "Graph",
		controls: [
			{
				kind: "slider",
				key: "graphNodes",
				label: "Nodes",
				description: "The mark's four facets become four communities, bridged by cross links.",
				min: 16,
				max: 200,
				step: 4,
			},
			{ kind: "slider", key: "graphSpread", label: "Spread", min: 40, max: 220, step: 1 },
			{
				kind: "slider",
				key: "graphLink",
				label: "Link length",
				description: "Rest length of the springs the layout relaxes toward.",
				min: 0.1,
				max: 1.2,
				step: 0.01,
			},
			{
				kind: "slider",
				key: "graphTravel",
				label: "Traffic",
				description: "Speed of the packets travelling along each link.",
				min: 0,
				max: 2,
				step: 0.01,
				motionOnly: true,
			},
			{
				kind: "slider",
				key: "graphGrowth",
				directed: true,
				label: "Growth cycle",
				description: "Seconds for the graph to accrete from empty to complete, then repeat.",
				min: 0,
				max: 60,
				step: 1,
				unit: "s",
				motionOnly: true,
			},
			{
				kind: "slider",
				key: "graphLinkOpacity",
				directed: true,
				label: "Link lines",
				min: 0,
				max: 1,
				step: 0.01,
				percent: true,
			},
		],
	},
	{
		title: "Life",
		controls: [
			{
				kind: "slider",
				key: "shimmer",
				label: "Shimmer",
				description: "Radius of each particle's own little orbit. With trails on, these draw the arcs and rings.",
				min: 0,
				max: 12,
				step: 0.1,
				motionOnly: true,
			},
			{
				kind: "slider",
				key: "shimmerSpeed",
				label: "Shimmer rate",
				min: 0,
				max: 4,
				step: 0.05,
				motionOnly: true,
			},
			{
				kind: "slider",
				key: "twinkle",
				label: "Twinkle",
				description: "How much each point pulses in size.",
				min: 0,
				max: 1,
				step: 0.01,
				percent: true,
			},
			{
				kind: "slider",
				key: "starlight",
				label: "Starlight",
				description: "Size of the bright minority of points against the faint dust.",
				min: 0,
				max: 1,
				step: 0.01,
				percent: true,
			},
		],
	},
	{
		title: "Motion",
		controls: [
			{
				kind: "slider",
				key: "speed",
				label: "Speed",
				min: 0,
				max: 0.2,
				step: 0.001,
				motionOnly: true,
			},
			{
				kind: "toggle",
				key: "trails",
				label: "Trails",
				description: "Fade the previous frame instead of clearing it.",
				motionOnly: true,
			},
			{
				kind: "slider",
				key: "trailFade",
				label: "Trail fade",
				description:
					"Held above 0.2: 8-bit compositing stops converging below that, leaving a permanent smear.",
				min: 0.2,
				max: 0.6,
				step: 0.01,
				percent: true,
				dependsOn: "trails",
				motionOnly: true,
			},
		],
	},
	{
		title: "Render",
		controls: [
			{
				kind: "toggle",
				key: "brandColor",
				label: "Brand colour",
				description: "Off falls back to the reference's translucent white.",
			},
			{ kind: "slider", key: "alpha", label: "Opacity", min: 8, max: 255, step: 1 },
			{ kind: "slider", key: "pointSize", label: "Point size", min: 0.5, max: 4, step: 0.1 },
		],
	},
];

const SLIDER_RANGES: Partial<Record<RovoP5NumericKey, { min: number; max: number; step: number }>> = {};
for (const section of ROVO_P5_SECTIONS) {
	for (const control of section.controls) {
		if (control.kind !== "slider") continue;
		SLIDER_RANGES[control.key] = { min: control.min, max: control.max, step: control.step };
	}
}

/** Decimal places implied by a step, so snapping does not reintroduce error. */
function precisionOf(step: number): number {
	const text = String(step);
	const dot = text.indexOf(".");
	return dot < 0 ? 0 : text.length - dot - 1;
}

/**
 * `GUI.Control` pairs a bounded slider with a free-text box that commits any
 * parseable number, so a typed value can otherwise fling the sketch off-screen
 * with no visible way back. Clamp to the declared slider range instead.
 */
export function clampRovoP5Param(key: RovoP5NumericKey, value: number): number {
	if (!Number.isFinite(value)) return ROVO_P5_DEFAULTS[key];
	const range = SLIDER_RANGES[key];
	if (!range) return value;

	const clamped = Math.min(range.max, Math.max(range.min, value));
	// Snap to the declared step. Repeated arrow-key nudges accumulate binary
	// float error, which `GUI.PercentControl` then multiplies by 100 and renders
	// as "55.000000" instead of "55".
	if (!(range.step > 0)) return clamped;
	const snapped = range.min + Math.round((clamped - range.min) / range.step) * range.step;
	return Number(snapped.toFixed(precisionOf(range.step)));
}
