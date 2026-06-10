/**
 * Tunable parameters for the Text Morphing effect, ported from Raphael Salaja's
 * Calligraph (https://github.com/raphaelsalaja/calligraph).
 *
 * The Calligraph lab drives these through an inline parameter panel; VPK mirrors
 * that — the demo (`text-morphing-demo.tsx`) renders a lab-style panel where each
 * parameter is tweakable.
 */

import type { Transition } from "motion/react";

/** Which renderer drives the morph. */
export type MorphVariant = "text" | "number" | "slots";

export const VARIANT_OPTIONS: readonly MorphVariant[] = ["text", "number", "slots"];

/** Named transition presets, transcribed 1:1 from Calligraph `shared.ts`. */
export type MorphAnimation = "default" | "smooth" | "snappy" | "bouncy";

export const MORPH_ANIMATIONS = {
	default: { duration: 0.38, ease: [0.19, 1, 0.22, 1] },
	smooth: { type: "spring", duration: 0.4, bounce: 0 },
	snappy: { type: "spring", duration: 0.35, bounce: 0.15 },
	bouncy: { type: "spring", duration: 0.5, bounce: 0.3 },
} satisfies Record<MorphAnimation, Transition>;

export const ANIMATION_OPTIONS: readonly MorphAnimation[] = ["default", "smooth", "snappy", "bouncy"];

/** The full parameter surface for one morph. Mirrors Calligraph's text props. */
export type TextMorphConfig = Readonly<{
	/** Which renderer to use. */
	variant: MorphVariant;
	/** Transition preset applied to every glyph via `MotionConfig`. */
	animation: MorphAnimation;
	/** Horizontal swirl of entering/leaving glyphs, in px, scaled by change size. */
	driftX: number;
	/** Vertical swirl of entering/leaving glyphs, in px, scaled by change size. */
	driftY: number;
	/** Directional bias for the `text` variant: 1 = rise, -1 = fall, 0 = none. */
	trend: -1 | 0 | 1;
	/** Per-glyph delay step, in seconds. */
	stagger: number;
	/** Whether the very first mount animates in (vs. appearing settled). */
	initial: boolean;
	/** Animate container width with the content via a ResizeObserver. */
	autoSize: boolean;
}>;

/** Default horizontal drift, in px (Calligraph's `drift.x` default). */
export const DEFAULT_DRIFT_X = 15;

/** Calligraph's defaults (text variant). */
export const DEFAULT_CONFIG: TextMorphConfig = {
	variant: "text",
	animation: "default",
	driftX: DEFAULT_DRIFT_X,
	driftY: 0,
	trend: 0,
	stagger: 0.02,
	initial: false,
	autoSize: true,
};

/**
 * Number/slots default to the springy `snappy` preset in Calligraph; text uses
 * the `default` tween. Used when the demo switches variant.
 */
export function defaultAnimationForVariant(variant: MorphVariant): MorphAnimation {
	return variant === "text" ? "default" : "snappy";
}

/**
 * Value rotations the demo cycles through per variant (the effect only fires
 * when the value changes). Mirrors the sets shown in the Calligraph lab.
 */
export const VALUE_SETS: Readonly<Record<MorphVariant, readonly string[]>> = {
	text: ["Calligraph", "Craft", "Creative", "Create"],
	number: ["$35.99", "$24.89", "$17.38", "$3.15"],
	slots: ["$1.47", "$34.44", "$148.21", "$3.09"],
};
