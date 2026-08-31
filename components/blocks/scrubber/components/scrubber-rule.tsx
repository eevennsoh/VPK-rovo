"use client";

import type { RefObject } from "react";
import { motion, useTransform, type MotionValue } from "motion/react";

import { toMagnification, type ScrubberRuleWeight } from "@/components/blocks/scrubber/lib/scrubber-geometry";

export interface ScrubberRuleProps {
	axis: "x" | "y";
	className?: string;
	magnify: MotionValue<number>;
	offset: number;
	pointerOffset: MotionValue<number>;
	railSizeRef: RefObject<number>;
	weight: ScrubberRuleWeight;
}

/**
 * One rule, sized by its distance from the pointer.
 *
 * `useTransform` keeps this off React's render path: the value lands on the
 * element directly, so the whole rail responds at frame rate while the
 * component tree stays still. Distance is converted to pixels before it reaches
 * the falloff — minors subdivide their major's gap, so index distance and
 * visual distance diverge exactly where the marks bunch up.
 *
 * A vertical rail draws horizontal ticks and animates width; a horizontal rail
 * draws vertical ticks and animates height. That is the whole axis difference.
 */
export function ScrubberRule({
	axis,
	className,
	magnify,
	offset,
	pointerOffset,
	railSizeRef,
	weight,
}: Readonly<ScrubberRuleProps>) {
	const falloff = useTransform([pointerOffset, magnify], ([pointer, amount]: number[]) => {
		if (pointer < 0 || amount <= 0) {
			return 0;
		}
		return toMagnification(Math.abs(offset - pointer) * railSizeRef.current) * amount;
	});
	const length = useTransform(falloff, (value) => weight.rest + (weight.peak - weight.rest) * value);
	const opacity = useTransform(
		falloff,
		(value) => weight.restOpacity + (weight.peakOpacity - weight.restOpacity) * value,
	);

	return (
		<motion.span
			aria-hidden="true"
			className={className}
			style={axis === "y" ? { width: length, opacity } : { height: length, opacity }}
		/>
	);
}
