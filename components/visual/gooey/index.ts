import { Liquid } from "liquid-gooey";

/**
 * VPK-facing alias for liquid-gooey 0.2.1 at commit 37835a9.
 * Original: https://gooey.jakubantalik.com/
 * Source: https://github.com/Jakubantalik/Libraries/tree/37835a94a54de606ebe6e3a5a1f8d30ddf4303b0/packages/liquid-gooey
 */
export const Gooey = Liquid;

export { GOOEY_DEFAULTS } from "./tuning-model";
export type {
	BendTuning,
	LiquidEffect as GooeyEffect,
	LiquidItemProps as GooeyItemProps,
	LiquidProps as GooeyProps,
	ImageMeltOptions,
} from "liquid-gooey";
export { IMAGE_MELT_DEFAULTS } from "liquid-gooey";
export {
	DISSOLVE_DEFAULTS,
	MORPH_DEFAULTS,
	MOVE_TUNING_DEFAULTS,
	resolveDissolveTuning,
	resolveMorphTuning,
	resolveMoveTuning,
} from "./tuning";
export type { MorphTuning, MoveTuning } from "./tuning";
export type { DissolveOptions, EvolveOptions, MoveOptions } from "liquid-gooey";
export { EVOLVE_DEFAULTS, MOVE_DEFAULTS, easingFunction, presets } from "liquid-gooey";
export type {
	SpringConfig,
	Transition,
	TransitionPreset,
} from "liquid-gooey";
export type { CornerRadii } from "liquid-gooey";
