"use client";

import { AnimatePresence, MotionConfig, motion, type Transition } from "motion/react";
import { useState } from "react";

import { reconcileTextKeys, splitGraphemes } from "./lib";

// Animated transforms + opacity + blur, declared once per the Motion perf rule.
const GLYPH_WILL_CHANGE = "transform, opacity, filter";

/**
 * Per-character text morphing, ported from Calligraph's `TextRenderer`.
 * Surviving characters keep their key (LCS) so `layout="position"` slides them;
 * inserts fade/blur/scale in, removals out. Drift scales with `changeRatio`.
 */
export function TextRenderer({
	text,
	transition,
	driftX,
	driftY,
	trend,
	stagger,
	animateInitial,
	className,
	style,
}: {
	text: string;
	transition: Transition;
	driftX: number;
	driftY: number;
	trend: number;
	stagger: number;
	animateInitial: boolean;
	className?: string;
	style?: React.CSSProperties;
}) {
	const graphemes = splitGraphemes(text);
	const [renderState, setRenderState] = useState(() => ({
		changeRatio: 0,
		charKeys: graphemes.map((_, index) => `c${index}`),
		nextId: graphemes.length,
		text,
	}));

	if (text !== renderState.text) {
		const result = reconcileTextKeys(
			renderState.text,
			text,
			renderState.charKeys,
			renderState.nextId,
		);
		setRenderState({
			changeRatio: result.changeRatio,
			charKeys: result.keys,
			nextId: result.nextId,
			text,
		});
	}
	const { changeRatio, charKeys } = renderState;

	return (
		<MotionConfig transition={transition}>
			<span aria-label={text} className={className} style={{ display: "inline-flex", ...style }}>
				<AnimatePresence mode="popLayout" initial={animateInitial}>
					{graphemes.map((char, i) => {
						const key = charKeys[i];
						const progress = graphemes.length <= 1 ? 0 : i / (graphemes.length - 1);
						const offsetX = (progress - 0.5) * driftX * changeRatio;
						const offsetY = (progress - 0.5) * driftY * changeRatio;
						const trendY = trend * 8 * changeRatio;
						const delay = i * stagger;

						return (
							<motion.span
								key={key}
								aria-hidden="true"
								layout="position"
								transition={{ ...transition, delay }}
								initial={{ opacity: 0, x: offsetX, y: offsetY + trendY, filter: "blur(4px)", scale: 0.85 }}
								animate={{ opacity: 1, x: 0, y: 0, filter: "blur(0px)", scale: 1 }}
								exit={{ opacity: 0, x: offsetX, y: offsetY - trendY, filter: "blur(4px)", scale: 0.85 }}
								style={{ display: "inline-block", whiteSpace: "pre", willChange: GLYPH_WILL_CHANGE }}
							>
								{char}
							</motion.span>
						);
					})}
				</AnimatePresence>
			</span>
		</MotionConfig>
	);
}
