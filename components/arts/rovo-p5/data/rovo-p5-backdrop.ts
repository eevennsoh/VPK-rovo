// Backdrop palette for the sketch.
//
// The reference sketch is `background(9)` — near-black — which the particle
// colours are tuned against. That cannot simply become an ADS surface token:
// the art wants a deeper black than `--ds-surface` in dark mode, and a flat
// neutral rather than pure white in light mode, so translucent brand-coloured
// points still read.
//
// The canvas itself stays transparent and this colour is painted by the shell
// behind it, so there is exactly one backdrop colour rather than two that have
// to agree. See the trail-fade note in the sketch for why that matters.

export interface RovoP5Backdrop {
	/** The backdrop, painted by the shell behind a transparent canvas. */
	readonly shell: string;
	/** Caption colour with enough contrast against `shell`. */
	readonly text: string;
	/**
	 * Multiplier on the opacity parameter. Translucent ink composites
	 * asymmetrically: over black a 38%-alpha brand colour reads as a dim version
	 * of itself, but over near-white the same alpha is 62% white-mixed and turns
	 * pastel. Light mode needs more ink for the same visual weight.
	 */
	readonly alphaScale: number;
}

export const ROVO_P5_BACKDROPS: Record<"light" | "dark", RovoP5Backdrop> = {
	// `#090909` is the original sketch's `background(9)`.
	dark: { shell: "#090909", text: "#F5F6F7", alphaScale: 1 },
	light: { shell: "#F2F3F5", text: "#172B4D", alphaScale: 2.4 },
};

export function resolveRovoP5Backdrop(theme: "light" | "dark"): RovoP5Backdrop {
	return ROVO_P5_BACKDROPS[theme] ?? ROVO_P5_BACKDROPS.dark;
}
