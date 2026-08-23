export const DEFAULT_CHROMATIC_ABERRATION_MEDIA_SRC = "/3p/framer/chromatic-aberration-default.png";

export type ChromaticMode = "radial" | "uniform" | "edges";
export type ChromaticSymmetry = "point" | "mirror";
export type ChromaticAnimation = "off" | "pulse";

export const CHROMATIC_DEFAULTS = {
	mode: "radial",
	zoom: 0.5,
	focusX: 0.5,
	focusY: 0.5,
	radius: 60,
	angle: 90,
	symmetry: "point",
	edgeAmount: 100,
	edges: 1,
	falloff: 3,
	swirl: 0,
	dispersion: 0.5,
	animate: "pulse",
	animationAmount: 0.5,
	speed: 1,
} as const satisfies Readonly<Record<string, number | string>>;
