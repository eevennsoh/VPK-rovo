/**
 * Click-to-edit "treatment" for the experimental Context panel.
 *
 * These motion + className constants are COPIED (not imported) from
 * `components/blocks/agent/components/agent-config-profile.tsx`, where the
 * equivalents (`AGENT_PROFILE_INLINE_EDIT_MOTION_PROPS`, etc.) are module-private
 * and domain-bound. Duplicating them here keeps this bucket self-contained and
 * lets a plain `InlineEdit` reproduce the same subtle hover/focus padding-reveal.
 *
 * Reduced motion is NOT baked in here: the consumer (`context-editable-header`)
 * drops these props when `useReducedMotion()` is true, so the read view renders
 * statically with no animation and no lingering backdrop.
 */

import type { CSSProperties } from "react";
import type { MotionProps } from "motion/react";

import { token } from "@/lib/tokens";

export const CONTEXT_INLINE_EDIT_MOTION_PROPS = {
	initial: "rest",
	animate: "rest",
	whileHover: "active",
	whileFocus: "active",
	variants: {
		rest: { paddingLeft: 0, paddingRight: 0 },
		active: { paddingLeft: "0.375rem", paddingRight: "0.375rem" },
	},
	transition: { type: "spring", bounce: 0.08, visualDuration: 0.18 },
} satisfies Pick<MotionProps, "initial" | "animate" | "whileHover" | "whileFocus" | "variants" | "transition">;

export const CONTEXT_INLINE_EDIT_BACKDROP_MOTION_PROPS = {
	variants: {
		rest: { opacity: 0, scaleX: 0.98 },
		active: { opacity: 1, scaleX: 1 },
	},
	transition: { type: "spring", bounce: 0.08, visualDuration: 0.18 },
} satisfies Pick<MotionProps, "variants" | "transition">;

export const CONTEXT_INLINE_EDIT_BACKDROP_CLASS_NAME = "-inset-0.5 bg-bg-neutral-subtle-hovered";

/** ADS heading medium (20px / 1.25rem) for the editable work-item title. */
export const CONTEXT_TITLE_FONT_STYLE = {
	font: token("font.heading.medium"),
} satisfies CSSProperties;

/** Editable title read view — typography comes from `CONTEXT_TITLE_FONT_STYLE`. */
export const CONTEXT_TITLE_READ_VIEW_CLASS_NAME =
	"relative h-auto overflow-visible border-0 bg-transparent px-0 py-1 hover:bg-transparent active:bg-transparent focus-visible:border-transparent focus-visible:bg-transparent";

export const CONTEXT_TITLE_INPUT_CLASS_NAME =
	"h-auto border-2 px-1.5 py-1 focus:border-ring";

/** Multiline editable description read view + textarea (mirrors the description field). */
export const CONTEXT_DESCRIPTION_READ_VIEW_CLASS_NAME =
	"relative overflow-visible border-2 bg-transparent px-0 hover:bg-transparent active:bg-transparent focus-visible:bg-transparent";

export const CONTEXT_DESCRIPTION_TEXTAREA_CLASS_NAME =
	"min-h-24 border-2 bg-bg-neutral-subtle px-1.5 focus:border-ring focus-visible:border-ring focus-visible:ring-0 focus-visible:ring-offset-0 data-[variant=default]:border-transparent data-[variant=default]:focus:border-ring data-[variant=default]:focus-visible:border-ring";
