"use client";

import { motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";

import { cn } from "@/lib/utils";

import { AGENT_SESSION_ARRIVAL_TRANSITION } from "./agent-session-arrival-motion";
import {
	AGENT_SESSION_NOTCH_NO_NEAREST,
	AGENT_SESSION_NOTCH_POINTER_AWAY,
	toAgentSessionNotchLength,
	toAgentSessionNotchMagnification,
	toAgentSessionNotchOpacity,
	type AgentSessionNotchProximity,
} from "./agent-session-notch-magnify";

/** A newly synced notch rests in the same emphasized state hover reveals. */
const NOTCH_EMPHASIS = "scale-x-[1.6] bg-icon";

/** Reviewed notches stay quiet until their shared row is hovered or focused. */
const NOTCH_AT_REST = cn(
	"bg-icon-subtlest",
	"group-hover/notch:scale-x-[1.6] group-hover/notch:bg-icon",
	"group-has-[:focus-visible]/notch:scale-x-[1.6] group-has-[:focus-visible]/notch:bg-icon",
);

/**
 * Unmagnified, the mark is a 12px hairline that swells by transform on its own
 * row's hover — the only affordance available to a mark with no rail behind it.
 * `w-3` must stay in step with `AGENT_SESSION_NOTCH_LENGTH.rest`, which is the
 * length the magnified path rests at.
 */
const NOTCH_STANDALONE = cn(
	"w-3 transition-[background-color,scale] duration-xxshort ease-out-practical",
	"motion-reduce:transition-none",
);

/**
 * The canonical 1px mark shared by the Small variant and the collapsed column.
 *
 * One hairline, same weight as a Pulse ruler rule, because the two are the same
 * idea: a mini rule that names the thing behind it. What differs is what drives
 * its length. On its own — the Small session card — the mark has no rail and no
 * neighbours, so hovering its row swells it by transform. Given `proximity`, it
 * joins a shared dock instead: length and colour come off the rail's pointer
 * position through motion values, which write straight to the DOM, so a whole
 * rail of notches follows the cursor without one React render.
 *
 * Length and colour answer different questions. Length is continuous — every
 * notch on the slope grows by its distance, which is what makes the rail read as
 * one surface being pushed. Colour is not: `color.icon` lands on the selected
 * notch alone and every other notch holds `color.icon.subtlest`, so the mark the
 * pointer is actually on stays findable inside its own swell.
 *
 * The dock animates `width` rather than `scaleX` for two reasons. The arrival
 * beat already owns the transform, and a mark absolutely has to be able to grow
 * and arrive at once; and length here is a real measurement against a 24px
 * channel, which a scale factor would only approximate. Each mark is the sole
 * child of its own fixed-size row, so the per-frame layout is scoped to that row
 * and never reaches a sibling.
 */
export function AgentSessionNotchMark({
	isArriving = false,
	isNew = false,
	proximity,
}: Readonly<{
	isArriving?: boolean;
	isNew?: boolean;
	proximity?: AgentSessionNotchProximity;
}>) {
	const shouldReduceMotion = useReducedMotion();
	const shouldPlayArrival = isArriving && !shouldReduceMotion;
	// Hooks cannot be conditional, so a mark with no dock transforms a pointer
	// that is parked forever: the falloff is a constant zero, the motion values
	// are never read, and the standalone classes own the paint.
	const parkedPointerY = useMotionValue(AGENT_SESSION_NOTCH_POINTER_AWAY);
	const parkedMagnify = useMotionValue(0);
	const parkedNearestIndex = useMotionValue(AGENT_SESSION_NOTCH_NO_NEAREST);
	const pointerY = proximity?.pointerY ?? parkedPointerY;
	const magnify = proximity?.magnify ?? parkedMagnify;
	const nearestIndex = proximity?.nearestIndex ?? parkedNearestIndex;
	const centersRef = proximity?.centersRef ?? null;
	const index = proximity?.index ?? AGENT_SESSION_NOTCH_NO_NEAREST;
	const falloff = useTransform([pointerY, magnify], ([pointer, amount]: number[]) => {
		if (centersRef === null || pointer < 0 || amount <= 0) {
			return 0;
		}
		const center = centersRef.current[index];
		if (center === undefined) {
			return 0;
		}
		return toAgentSessionNotchMagnification(pointer - center) * amount;
	});
	const width = useTransform(falloff, (value) => toAgentSessionNotchLength(value, isNew));
	// Selection is binary, but it still rides `magnify` so the colour arrives and
	// retreats on the same beat as the swell instead of snapping a frame apart.
	const opacity = useTransform([nearestIndex, magnify], ([nearest, amount]: number[]) => (
		toAgentSessionNotchOpacity(index >= 0 && nearest === index ? amount : 0, isNew)
	));

	return (
		<motion.span
			animate={shouldPlayArrival ? { scaleX: 1 } : undefined}
			aria-hidden="true"
			className={cn(
				// `shrink-0` because the mark is a flex item and its swell is meant to
				// outgrow its row: the rail reserves a 4px focus-ring gutter either
				// side, which leaves a 16px row inside a 24px plane. Without this the
				// peak silently clamps to 16px and the slope flattens at the crest.
				"h-px shrink-0",
				proximity === undefined
					? cn(NOTCH_STANDALONE, isNew ? NOTCH_EMPHASIS : NOTCH_AT_REST)
					// Selection hops from notch to notch as the pointer travels, and a
					// hop is a state change, not a slope: CSS carries it at the
					// list-item interaction profile so the handover cross-fades rather
					// than cutting. Width is deliberately left off this transition —
					// it tracks the pointer per frame and must not lag behind it.
					: "bg-icon transition-opacity duration-fast ease-out-practical motion-reduce:transition-none",
			)}
			initial={shouldPlayArrival ? { scaleX: 0 } : false}
			style={{
				opacity: proximity === undefined ? undefined : opacity,
				width: proximity === undefined ? undefined : width,
				willChange: shouldPlayArrival ? "transform" : undefined,
			}}
			transition={AGENT_SESSION_ARRIVAL_TRANSITION}
		/>
	);
}
