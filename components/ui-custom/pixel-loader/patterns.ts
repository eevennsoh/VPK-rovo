/**
 * Pixel Loader pattern data.
 *
 * A pattern is a 3x3 grid of start offsets. Every cell runs the same
 * `pixel-loader-pulse` keyframe (dim -> full -> dim); staggering the offsets is
 * what makes the grid read as a wavefront travelling in a direction.
 *
 * The 50 directional patterns are transcribed from the Flutter original at
 * https://github.com/ksokolovskyi/dessn_loader (MIT). Its per-frame maths is
 *
 *   progress = ((elapsed - delay).clamp(0, inf) % duration) / duration
 *   opacity  = sin(easeInOut(progress) * pi)
 *
 * which is a pure function of wall-clock time, so it collapses into a CSS
 * keyframe plus `animation-delay` with no JS animation loop. `chevron` is the
 * 51st pattern, carried over from the original VPK-facing Pixel Loader so its
 * look stays reachable by name.
 *
 * Pure data. No React, no DOM.
 */

/** Start offset in ms, or `null` for a cell this pattern leaves unlit. */
export type PixelDelay = number | null;

/** Nine cells, row-major. The tuple length is the grid contract. */
export type PixelDelayGrid = readonly [
	PixelDelay,
	PixelDelay,
	PixelDelay,
	PixelDelay,
	PixelDelay,
	PixelDelay,
	PixelDelay,
	PixelDelay,
	PixelDelay,
];

export interface PixelLoaderPatternConfig {
	/** One full pulse in ms — half fading in, half fading back out. */
	readonly duration: number;
	/** Per-cell start offsets, row-major. */
	readonly delays: PixelDelayGrid;
}

/** Reads better than a bare `null` inside the 3x3 literals below. */
const OFF = null;

export const PIXEL_LOADER_PATTERNS = {
	// -- Waves: a solid bar crossing the grid ------------------------------
	"wave-left-to-right": {
		duration: 600,
		delays: [0, 100, 200, 0, 100, 200, 0, 100, 200],
	},
	"wave-right-to-left": {
		duration: 600,
		delays: [200, 100, 0, 200, 100, 0, 200, 100, 0],
	},
	"wave-top-to-bottom": {
		duration: 600,
		delays: [0, 0, 0, 100, 100, 100, 200, 200, 200],
	},
	"wave-bottom-to-top": {
		duration: 600,
		delays: [200, 200, 200, 100, 100, 100, 0, 0, 0],
	},

	// -- Diagonals: the bar tilts 45deg and sweeps from a corner -----------
	"diagonal-top-left": {
		duration: 500,
		delays: [0, 100, 200, 100, 200, 300, 200, 300, 400],
	},
	"diagonal-top-right": {
		duration: 500,
		delays: [200, 100, 0, 300, 200, 100, 400, 300, 200],
	},
	"diagonal-bottom-left": {
		duration: 500,
		delays: [200, 300, 400, 100, 200, 300, 0, 100, 200],
	},
	"diagonal-bottom-right": {
		duration: 500,
		delays: [400, 300, 200, 300, 200, 100, 200, 100, 0],
	},

	// -- Ripples: concentric rings from or toward the centre ---------------
	"ripple-out": {
		duration: 700,
		delays: [300, 150, 300, 150, 0, 150, 300, 150, 300],
	},
	"ripple-in": {
		duration: 700,
		delays: [0, 150, 0, 150, 300, 150, 0, 150, 0],
	},

	// -- Shapes: a figure holds while the rest of the grid counter-pulses ---
	cross: {
		duration: 600,
		delays: [300, 0, 300, 0, 0, 0, 300, 0, 300],
	},
	x: {
		duration: 600,
		delays: [0, 300, 0, 300, 0, 300, 0, 300, 0],
	},
	diamond: {
		duration: 625,
		delays: [400, 200, 400, 200, 0, 200, 400, 200, 400],
	},
	plus: {
		duration: 550,
		delays: [OFF, 0, OFF, 100, OFF, 200, OFF, 300, OFF],
	},

	// -- Bands: whole rows or columns firing together ----------------------
	"stripes-horizontal": {
		duration: 500,
		delays: [200, 200, 200, 0, 0, 0, 300, 300, 300],
	},
	"stripes-vertical": {
		duration: 500,
		delays: [300, 0, 200, 300, 0, 200, 300, 0, 200],
	},
	rows: {
		duration: 500,
		delays: [300, 300, 300, 0, 0, 0, 300, 300, 300],
	},

	// -- Spirals: perimeter winding inward to the centre -------------------
	"spiral-clockwise": {
		duration: 900,
		delays: [0, 100, 200, 700, 800, 300, 600, 500, 400],
	},
	"spiral-counter-clockwise": {
		duration: 900,
		delays: [200, 100, 0, 300, 800, 700, 400, 500, 600],
	},

	// -- Snakes: boustrophedon, reversing direction each row ---------------
	snake: {
		duration: 900,
		delays: [0, 100, 200, 500, 400, 300, 600, 700, 800],
	},
	"snake-reversed": {
		duration: 900,
		delays: [800, 700, 600, 300, 400, 500, 200, 100, 0],
	},

	// -- Rain: diagonal cascade, tighter than the wave patterns ------------
	rain: {
		duration: 700,
		delays: [0, 100, 200, 200, 300, 400, 400, 500, 600],
	},
	"rain-reversed": {
		duration: 700,
		delays: [600, 500, 400, 400, 300, 200, 200, 100, 0],
	},
	waterfall: {
		duration: 450,
		delays: [0, 50, 100, 100, 150, 200, 200, 250, 300],
	},

	// -- Pulse: every cell in lockstep, distinguished only by tempo --------
	breathing: {
		duration: 1200,
		delays: [0, 0, 0, 0, 0, 0, 0, 0, 0],
	},
	heartbeat: {
		duration: 450,
		delays: [0, 0, 0, 0, 0, 0, 0, 0, 0],
	},

	// -- Solo: a single cell, for the quietest inline contexts -------------
	solo: {
		duration: 700,
		delays: [OFF, OFF, OFF, OFF, 0, OFF, OFF, OFF, OFF],
	},
	"solo-top-left": {
		duration: 700,
		delays: [0, OFF, OFF, OFF, OFF, OFF, OFF, OFF, OFF],
	},
	"solo-bottom-right": {
		duration: 700,
		delays: [OFF, OFF, OFF, OFF, OFF, OFF, OFF, OFF, 0],
	},

	// -- Lines: one row, column or diagonal chasing along itself -----------
	"line-horizontal-top": {
		duration: 450,
		delays: [0, 100, 200, OFF, OFF, OFF, OFF, OFF, OFF],
	},
	"line-horizontal-middle": {
		duration: 450,
		delays: [OFF, OFF, OFF, 0, 100, 200, OFF, OFF, OFF],
	},
	"line-horizontal-bottom": {
		duration: 450,
		delays: [OFF, OFF, OFF, OFF, OFF, OFF, 0, 100, 200],
	},
	"line-vertical-left": {
		duration: 450,
		delays: [0, OFF, OFF, 100, OFF, OFF, 200, OFF, OFF],
	},
	"line-vertical-middle": {
		duration: 450,
		delays: [OFF, 0, OFF, OFF, 100, OFF, OFF, 200, OFF],
	},
	"line-vertical-right": {
		duration: 450,
		delays: [OFF, OFF, 0, OFF, OFF, 100, OFF, OFF, 200],
	},
	"line-diagonal-left-to-right": {
		duration: 450,
		delays: [0, OFF, OFF, OFF, 100, OFF, OFF, OFF, 200],
	},
	"line-diagonal-right-to-left": {
		duration: 450,
		delays: [OFF, OFF, 0, OFF, 100, OFF, 200, OFF, OFF],
	},

	// -- Corners: the four corner cells only -------------------------------
	corners: {
		duration: 550,
		delays: [0, OFF, 100, OFF, OFF, OFF, 200, OFF, 300],
	},
	"corners-sync": {
		duration: 700,
		delays: [0, OFF, 0, OFF, OFF, OFF, 0, OFF, 0],
	},

	// -- Elbows: L and T figures tracing their own stroke ------------------
	"l-top-left": {
		duration: 450,
		delays: [0, 100, OFF, 200, OFF, OFF, OFF, OFF, OFF],
	},
	"l-top-right": {
		duration: 450,
		delays: [OFF, 100, 0, OFF, OFF, 200, OFF, OFF, OFF],
	},
	"l-bottom-left": {
		duration: 450,
		delays: [OFF, OFF, OFF, 200, OFF, OFF, 0, 100, OFF],
	},
	"l-bottom-right": {
		duration: 450,
		delays: [OFF, OFF, OFF, OFF, OFF, 200, OFF, 100, 0],
	},
	"t-top": {
		duration: 550,
		delays: [0, 100, 200, OFF, 300, OFF, OFF, OFF, OFF],
	},
	"t-bottom": {
		duration: 550,
		delays: [OFF, OFF, OFF, OFF, 0, OFF, 100, 200, 300],
	},

	// -- Duo: two cells trading off ----------------------------------------
	"duo-horizontal": {
		duration: 450,
		delays: [OFF, OFF, OFF, 0, OFF, 100, OFF, OFF, OFF],
	},
	"duo-vertical": {
		duration: 450,
		delays: [OFF, 0, OFF, OFF, OFF, OFF, OFF, 100, OFF],
	},

	// -- Frame: a comet lapping the perimeter, centre left dark ------------
	frame: {
		duration: 800,
		delays: [0, 100, 200, 700, OFF, 300, 600, 500, 400],
	},
	"frame-reversed": {
		duration: 800,
		delays: [200, 100, 0, 300, OFF, 700, 400, 500, 600],
	},
	"frame-sync": {
		duration: 900,
		delays: [0, 0, 0, 0, OFF, 0, 0, 0, 0],
	},

	// -- Classic: the original VPK Pixel Loader wavefront ------------------
	// delays[i] = (col + |row - 1|) * 90 — a chevron driving right. The 650ms
	// cycle is shorter than the sweep, so two fronts are always in flight.
	chevron: {
		duration: 650,
		delays: [90, 180, 270, 0, 90, 180, 90, 180, 270],
	},
} as const satisfies Record<string, PixelLoaderPatternConfig>;

export type PixelLoaderPattern = keyof typeof PIXEL_LOADER_PATTERNS;

export const DEFAULT_PIXEL_LOADER_PATTERN: PixelLoaderPattern = "chevron";

export interface PixelLoaderPatternFamily {
	readonly name: string;
	readonly patterns: readonly PixelLoaderPattern[];
}

/**
 * Display grouping for the pattern browser. Covers every key in
 * `PIXEL_LOADER_PATTERNS` exactly once — `pixel-loader.test.js` enforces that,
 * so a new pattern cannot be added without also being surfaced.
 */
export const PIXEL_LOADER_PATTERN_FAMILIES: readonly PixelLoaderPatternFamily[] = [
	{
		name: "Waves",
		patterns: [
			"wave-left-to-right",
			"wave-right-to-left",
			"wave-top-to-bottom",
			"wave-bottom-to-top",
		],
	},
	{
		name: "Diagonals",
		patterns: [
			"diagonal-top-left",
			"diagonal-top-right",
			"diagonal-bottom-left",
			"diagonal-bottom-right",
		],
	},
	{ name: "Ripples", patterns: ["ripple-out", "ripple-in"] },
	{ name: "Shapes", patterns: ["cross", "x", "diamond", "plus"] },
	{ name: "Bands", patterns: ["stripes-horizontal", "stripes-vertical", "rows"] },
	{ name: "Spirals", patterns: ["spiral-clockwise", "spiral-counter-clockwise"] },
	{ name: "Snakes", patterns: ["snake", "snake-reversed"] },
	{ name: "Rain", patterns: ["rain", "rain-reversed", "waterfall"] },
	{ name: "Pulse", patterns: ["breathing", "heartbeat"] },
	{ name: "Solo", patterns: ["solo", "solo-top-left", "solo-bottom-right"] },
	{
		name: "Lines",
		patterns: [
			"line-horizontal-top",
			"line-horizontal-middle",
			"line-horizontal-bottom",
			"line-vertical-left",
			"line-vertical-middle",
			"line-vertical-right",
			"line-diagonal-left-to-right",
			"line-diagonal-right-to-left",
		],
	},
	{ name: "Corners", patterns: ["corners", "corners-sync"] },
	{
		name: "Elbows",
		patterns: ["l-top-left", "l-top-right", "l-bottom-left", "l-bottom-right", "t-top", "t-bottom"],
	},
	{ name: "Duo", patterns: ["duo-horizontal", "duo-vertical"] },
	{ name: "Frame", patterns: ["frame", "frame-reversed", "frame-sync"] },
	{ name: "Classic", patterns: ["chevron"] },
];

/**
 * The four Rovo spot colours, in wheel order (blue, orange, purple, green).
 *
 * Deliberately raw hex rather than `--ds-icon-accent-*`: the Rovo spot must
 * render identically in light and dark, and the ADS accent tokens shift value
 * between themes. Same four values as the Rovo mark in
 * `components/ui-custom/animated-rovo.tsx`.
 */
export const ROVO_SPOT_COLORS = ["#1868DB", "#FCA700", "#AF59E0", "#6A9A23"] as const;

function isLit(delay: PixelDelay): delay is number {
	return delay !== null;
}

/**
 * Map the four Rovo colours onto a pattern's nine cells.
 *
 * Colour follows the *delay rank*, not the cell index, so the wavefront itself
 * cycles blue -> orange -> purple -> green as it crosses the grid.
 *
 * Patterns whose cells all share one delay (`breathing`, `heartbeat`,
 * `frame-sync`, `corners-sync`) have a single rank and would otherwise pulse in
 * one flat colour. Those fall back to cycling by *lit-cell ordinal* — not by
 * grid index, which would strand sparse patterns on a subset of the palette
 * (`corners-sync` lights only even indices, so `index % 4` yields just two
 * colours).
 *
 * Unlit cells return `null`; the caller leaves those on the ghost colour.
 */
export function resolveRovoColors(delays: PixelDelayGrid): readonly (string | null)[] {
	const ranks = [...new Set(delays.filter(isLit))].sort((a, b) => a - b);
	const cycleByOrdinal = ranks.length < 2;
	let litOrdinal = 0;

	return delays.map((delay) => {
		if (!isLit(delay)) {
			return null;
		}
		const slot = cycleByOrdinal ? litOrdinal++ : ranks.indexOf(delay);
		return ROVO_SPOT_COLORS[slot % ROVO_SPOT_COLORS.length];
	});
}
