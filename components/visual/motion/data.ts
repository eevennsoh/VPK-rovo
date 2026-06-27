// Motion token tables for the Visual → Motion gallery.
// Mirrors the vpk motion tokens defined in app/tailwind-theme.css and the
// resolved-value map in .agents/rules/motion-decisions.md. The bezier control
// points and the spring sample exist only to *draw* the curve in SVG; the live
// shapes animate via the real var(--ease-*)/var(--duration-*) tokens.

export interface EasingToken {
	/** Tailwind utility alias, also the curve label key. */
	name: string;
	/** CSS custom property consumed at runtime, e.g. "--ease-out". */
	cssVar: string;
	/** Human label. */
	label: string;
	/** Display value (the literal token definition). */
	value: string;
	/** Cubic-bezier control points [x1, y1, x2, y2] for drawing. Omitted for spring. */
	points?: readonly [number, number, number, number];
	/** Equally-spaced y samples across x=0→1 for non-bezier easings (spring linear()). */
	spring?: readonly number[];
	/** Short note shown under the curve. */
	note?: string;
}

export const EASINGS: readonly EasingToken[] = [
	{
		name: "ease-linear",
		cssVar: "--ease-linear",
		label: "Linear",
		value: "cubic-bezier(0, 0, 1, 1)",
		points: [0, 0, 1, 1],
		note: "Constant speed — progress bars, continuous motion.",
	},
	{
		name: "ease-out",
		cssVar: "--ease-out",
		label: "Ease out · bold",
		value: "cubic-bezier(0, 0.4, 0, 1)",
		points: [0, 0.4, 0, 1],
		note: "Transition entrances on prominent surfaces (flag, blanket).",
	},
	{
		name: "ease-out-practical",
		cssVar: "--ease-out-practical",
		label: "Ease out · practical",
		value: "cubic-bezier(0.4, 1, 0.6, 1)",
		points: [0.4, 1, 0.6, 1],
		note: "Popup family + interactions — restrained, high-frequency.",
	},
	{
		name: "ease-in",
		cssVar: "--ease-in",
		label: "Ease in · practical",
		value: "cubic-bezier(0.6, 0, 0.8, 0.6)",
		points: [0.6, 0, 0.8, 0.6],
		note: "Every exit — element leaving view.",
	},
	{
		name: "ease-in-out",
		cssVar: "--ease-in-out",
		label: "Ease in-out · bold",
		value: "cubic-bezier(0.4, 0, 0, 1)",
		points: [0.4, 0, 0, 1],
		note: "In-place transforms — modal/spotlight scale, reposition.",
	},
	{
		name: "ease-spring",
		cssVar: "--ease-spring",
		label: "Spring",
		value: "linear(…) · overshoot",
		// 65-stop linear() sample from app/tailwind-theme.css. Peaks at 1.024 (the
		// overshoot past the resting value) then settles back to 1.
		spring: [
			0, 0.021, 0.058, 0.107, 0.164, 0.227, 0.292, 0.359, 0.425, 0.49, 0.552, 0.61, 0.664, 0.714,
			0.759, 0.8, 0.837, 0.869, 0.898, 0.922, 0.943, 0.961, 0.976, 0.988, 0.998, 1.006, 1.013,
			1.017, 1.02, 1.023, 1.024, 1.024, 1.024, 1.024, 1.023, 1.022, 1.02, 1.019, 1.017, 1.015,
			1.014, 1.012, 1.011, 1.009, 1.008, 1.007, 1.006, 1.005, 1.004, 1.003, 1.002, 1.002, 1.001,
			1.001, 1.001, 1, 1, 1, 1, 1, 0.999, 0.999, 0.999, 0.999, 1,
		],
		note: "The only spring in the system — tactile branded motion (avatar hover).",
	},
] as const;

export interface DurationToken {
	name: string;
	cssVar: string;
	ms: number;
}

export const DURATIONS: readonly DurationToken[] = [
	{ name: "duration-instant", cssVar: "--duration-instant", ms: 0 },
	{ name: "duration-xxshort", cssVar: "--duration-xxshort", ms: 50 },
	{ name: "duration-fast", cssVar: "--duration-fast", ms: 100 },
	{ name: "duration-normal", cssVar: "--duration-normal", ms: 150 },
	{ name: "duration-medium", cssVar: "--duration-medium", ms: 200 },
	{ name: "duration-slow", cssVar: "--duration-slow", ms: 250 },
	{ name: "duration-slower", cssVar: "--duration-slower", ms: 400 },
	{ name: "duration-slowest", cssVar: "--duration-slowest", ms: 600 },
] as const;

// --- Semantic / component recipes ---------------------------------------------
// vpk ships NO --ds-motion-* semantic tokens; each role is a recipe COMPOSED from
// the base --ease-*/--duration-* tokens (see .agents/rules/motion-decisions.md).
// These mirror that per-role table and the ADS spec cards. Each state animates
// via the shared `.motion-demo-anim` class using its real token vars.

export interface MotionRecipeState {
	/** Display label: Enter / Exit / Hover / Reposition. */
	state: string;
	/** ADS semantic token name, e.g. "motion.avatar.hovered". */
	adsName: string;
	/** @keyframes name (defined in index.tsx MOTION_DEMO_CSS). */
	keyframe: string;
	/** Duration token var, e.g. "--duration-normal". */
	durationVar: string;
	/** Easing token var, e.g. "--ease-out-practical". */
	easeVar: string;
	/** Property summary, e.g. "scale 80→100 + fade". */
	property: string;
}

export interface MotionRecipe {
	role: string;
	blurb: string;
	/** When true the card shows a direction selector (popup). */
	directional?: boolean;
	states: readonly MotionRecipeState[];
}

export const SEMANTIC_RECIPES: readonly MotionRecipe[] = [
	{
		role: "Avatar",
		blurb: "Small, granular — practical enter/exit, the system's only spring on hover.",
		states: [
			{ state: "Enter", adsName: "motion.avatar.enter", keyframe: "recipe-scale-md-fade", durationVar: "--duration-normal", easeVar: "--ease-out-practical", property: "scale 80→100 + fade" },
			{ state: "Exit", adsName: "motion.avatar.exit", keyframe: "recipe-scale-md-fade", durationVar: "--duration-fast", easeVar: "--ease-in", property: "scale 100→80 + fade" },
			{ state: "Hover", adsName: "motion.avatar.hovered", keyframe: "recipe-scale-hover", durationVar: "--duration-slow", easeVar: "--ease-spring", property: "scale 100→112 (spring)" },
		],
	},
	{
		role: "Popup",
		blurb: "Dropdown / tooltip / inline — practical, 8px directional slide. Pick a direction.",
		directional: true,
		states: [
			{ state: "Enter", adsName: "motion.popup.enter", keyframe: "recipe-popup", durationVar: "--duration-normal", easeVar: "--ease-out-practical", property: "8px slide + fade" },
			{ state: "Exit", adsName: "motion.popup.exit", keyframe: "recipe-popup", durationVar: "--duration-fast", easeVar: "--ease-in", property: "8px slide + fade" },
		],
	},
	{
		role: "Flag",
		blurb: "Interrupting notification — bold arrival, practical exit, in-place reposition.",
		states: [
			{ state: "Enter", adsName: "motion.flag.enter", keyframe: "recipe-flag-enter", durationVar: "--duration-slow", easeVar: "--ease-out", property: "50% slide + fade" },
			{ state: "Exit", adsName: "motion.flag.exit", keyframe: "recipe-flag-exit", durationVar: "--duration-medium", easeVar: "--ease-in", property: "15% slide + fade" },
			{ state: "Reposition", adsName: "motion.flag.reposition", keyframe: "recipe-reposition", durationVar: "--duration-slow", easeVar: "--ease-in-out", property: "transform" },
		],
	},
	{
		role: "Modal",
		blurb: "Scales in place — bold in-out enter, practical exit.",
		states: [
			{ state: "Enter", adsName: "motion.modal.enter", keyframe: "recipe-scale-sm", durationVar: "--duration-slow", easeVar: "--ease-in-out", property: "scale 95→100" },
			{ state: "Exit", adsName: "motion.modal.exit", keyframe: "recipe-scale-sm", durationVar: "--duration-medium", easeVar: "--ease-in", property: "scale 100→95" },
		],
	},
	{
		role: "Spotlight",
		blurb: "Same as modal — scales in place, with a fade.",
		states: [
			{ state: "Enter", adsName: "motion.spotlight.enter", keyframe: "recipe-scale-sm-fade", durationVar: "--duration-slow", easeVar: "--ease-in-out", property: "scale 95→100 + fade" },
			{ state: "Exit", adsName: "motion.spotlight.exit", keyframe: "recipe-scale-sm-fade", durationVar: "--duration-medium", easeVar: "--ease-in", property: "scale 100→95 + fade" },
		],
	},
	{
		role: "Blanket",
		blurb: "Modal underlay — bold fade-in asserts the surface is locked.",
		states: [
			{ state: "Enter", adsName: "motion.blanket.enter", keyframe: "motion-demo-fade", durationVar: "--duration-slow", easeVar: "--ease-out", property: "fade" },
			{ state: "Exit", adsName: "motion.blanket.exit", keyframe: "motion-demo-fade", durationVar: "--duration-medium", easeVar: "--ease-in", property: "fade" },
		],
	},
] as const;

export interface PopupDirection {
	name: string;
	/** translateX offset at the slide extreme. */
	tx: string;
	/** translateY offset at the slide extreme. */
	ty: string;
}

// Signs mirror components/ui/popover.tsx data-[side=*]:data-starting-style:*translate-*-2.
export const POPUP_DIRECTIONS: readonly PopupDirection[] = [
	{ name: "bottom", tx: "0px", ty: "-8px" },
	{ name: "top", tx: "0px", ty: "8px" },
	{ name: "left", tx: "8px", ty: "0px" },
	{ name: "right", tx: "-8px", ty: "0px" },
	{ name: "inline-start", tx: "8px", ty: "0px" },
	{ name: "inline-end", tx: "-8px", ty: "0px" },
] as const;
