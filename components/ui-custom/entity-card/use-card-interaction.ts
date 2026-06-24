import { useReducedMotion } from "motion/react";

import { token } from "@/lib/tokens";

const OVERLAY_SHADOW = token("elevation.shadow.overlay");
const HOVER_ANIMATION = {
	boxShadow: OVERLAY_SHADOW,
} as const;
const REDUCED_HOVER_ANIMATION = {
	boxShadow: OVERLAY_SHADOW,
} as const;

export const CARD_HOVER_TRANSITION = {
	type: "spring",
	bounce: 0.16,
	visualDuration: 0.22,
} as const;

export interface CardInteraction {
	interactive: boolean;
	hoverAnimation: typeof HOVER_ANIMATION | typeof REDUCED_HOVER_ANIMATION;
	handleSelect: () => void;
}

/**
 * Shared interaction contract for the entity-card shell.
 *
 * When `onSelect` is provided the card renders a dedicated overlay `<button>`
 * (see `EntityCardShell`) that owns selection. The native button handles
 * Enter/Space and focus, so no manual key handling is needed here — keeping the
 * whole-card affordance free of an invalid `role="button"` wrapper around nested
 * controls. Hover elevation respects reduced motion.
 */
export function useCardInteraction(onSelect?: () => void): CardInteraction {
	const interactive = Boolean(onSelect);
	const shouldReduceMotion = useReducedMotion();
	const hoverAnimation = shouldReduceMotion ? REDUCED_HOVER_ANIMATION : HOVER_ANIMATION;

	const handleSelect = () => onSelect?.();

	return { interactive, hoverAnimation, handleSelect };
}
