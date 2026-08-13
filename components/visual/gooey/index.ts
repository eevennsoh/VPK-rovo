import { GooeyRoot } from "./gooey-root";
import { GooeyItem } from "./gooey-item";

/**
 * VPK-owned adaptation of liquid-gooey 0.1.0 at commit cfa51e1.
 * Original: https://gooey.jakubantalik.com/
 * Source: https://github.com/Jakubantalik/Libraries/tree/cfa51e10f4bc581445248b75c3e9e81c9afac0ef/packages/liquid-gooey
 */
export const Gooey = Object.assign(GooeyRoot, { Item: GooeyItem });

export { GOOEY_DEFAULTS } from "./tuning-model";
export type { GooeyProps } from "./gooey-root";
export type { GooeyEffect, GooeyItemProps } from "./gooey-item";
export {
	DISSOLVE_DEFAULTS,
	MORPH_DEFAULTS,
	MOVE_TUNING_DEFAULTS,
	resolveDissolveTuning,
	resolveMorphTuning,
	resolveMoveTuning,
} from "./tuning";
export type { MorphTuning, MoveTuning } from "./tuning";
export type { DissolveOptions } from "./item-core";
export { EVOLVE_DEFAULTS, MOVE_DEFAULTS } from "./observer";
export type { EvolveOptions, MoveOptions } from "./observer";
export { easingFunction, presets } from "./spring";
export type {
	SpringConfig,
	Transition,
	TransitionPreset,
} from "./spring";
export type { CornerRadii } from "./geometry";
