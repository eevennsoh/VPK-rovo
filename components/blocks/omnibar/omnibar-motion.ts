/**
 * Motion signatures for the Omnibar's three geometries.
 *
 * The pill -> bar change is an *in-place transform*, not an entrance, so it takes the bold
 * `ease-in-out` curve rather than `ease-out` (see `.agents/rules/motion-decisions.md`). The
 * docked panel is a separate medium surface that enters and leaves on its own signature.
 *
 * Motion for React cannot read `var()`, so these are the resolved token values with the
 * token name kept in the comment.
 */

export const OMNIBAR_MORPH_ENTER = {
	duration: 0.2,
	ease: [0.4, 0, 0, 1],
} as const; // duration-medium + ease-in-out

export const OMNIBAR_MORPH_EXIT = {
	duration: 0.1,
	ease: [0.6, 0, 0.8, 0.6],
} as const; // duration-fast + ease-in

export const OMNIBAR_CONTENT = {
	duration: 0.1,
	ease: [0.4, 1, 0.6, 1],
} as const; // duration-fast + ease-out-practical

export const OMNIBAR_PANEL_ENTER = {
	duration: 0.25,
	ease: [0, 0.4, 0, 1],
} as const; // duration-slow + ease-out

export const OMNIBAR_PANEL_EXIT = {
	duration: 0.2,
	ease: [0.6, 0, 0.8, 0.6],
} as const; // duration-medium + ease-in

export const OMNIBAR_REDUCED = { duration: 0 } as const;

/**
 * VPK duration tokens resolve to literal milliseconds and keep playing when the user has
 * asked for reduced motion, so every consumer has to collapse them explicitly.
 */
export function resolveOmnibarTransition<T>(
	transition: T,
	shouldReduceMotion: boolean | null,
): T | typeof OMNIBAR_REDUCED {
	return shouldReduceMotion ? OMNIBAR_REDUCED : transition;
}
