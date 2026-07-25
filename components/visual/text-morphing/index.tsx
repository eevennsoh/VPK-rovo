"use client";

/**
 * Text Morphing — fluid character-level text/number transitions, ported from
 * Raphael Salaja's Calligraph (https://github.com/raphaelsalaja/calligraph).
 * When `text` changes, surviving characters slide to their new position while
 * inserted characters animate in and removed ones animate out, producing a
 * single graceful morph. Three variants:
 *
 * - `text`   — per-character LCS morph (drift + trend).
 * - `number` — per-digit roll in the direction of the change.
 * - `slots`  — slot-machine digit columns behind a fade mask.
 *
 * Parameters are exposed via `config` (see `./data`); the demo renders a
 * lab-style panel for tweaking them. Degrades to static text under
 * prefers-reduced-motion.
 */

import { motion, type Transition, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useState } from "react";

import { DEFAULT_CONFIG, MORPH_ANIMATIONS, type TextMorphConfig } from "./data";
import { NumberRenderer } from "./number";
import { SlotsRenderer } from "./slots";
import { TextRenderer } from "./text";

type TextMorphingProps = Readonly<{
	/** The value to render. Changing it triggers the morph. */
	text: string;
	/** Tunable parameters; defaults to Calligraph's text-variant defaults. */
	config?: TextMorphConfig;
	className?: string;
	style?: React.CSSProperties;
}>;

/**
 * Animates its width to the measured content size so the surrounding layout
 * eases as the value grows or shrinks. Ported from Calligraph's `AutoSizeWrapper`.
 */
function AutoSizeWrapper({ children, transition }: { children: React.ReactNode; transition: Transition }) {
	const [element, setElement] = useState<HTMLElement | null>(null);
	const [width, setWidth] = useState(0);

	const ref = useCallback((node: HTMLElement | null) => {
		setElement(node);
	}, []);

	useEffect(() => {
		if (!element) return;
		const observer = new ResizeObserver(([entry]) => {
			setWidth(Math.ceil(entry.contentRect.width));
		});
		observer.observe(element);
		return () => observer.disconnect();
	}, [element]);

	return (
		<motion.span
			layout="size"
			transition={transition}
			style={{ display: "inline-flex", width: width > 0 ? width : "auto", willChange: "transform" }}
		>
			<span ref={ref} style={{ display: "inline-flex" }}>
				{children}
			</span>
		</motion.span>
	);
}

export default function TextMorphing({ text, config = DEFAULT_CONFIG, className, style }: TextMorphingProps) {
	const reduced = useReducedMotion();
	const transition = MORPH_ANIMATIONS[config.animation];

	// Reduced motion: render the value as plain, static text — no morphing.
	if (reduced) {
		return (
			<span className={className} style={{ display: "inline-flex", ...style }}>
				{text}
			</span>
		);
	}

	let content: React.ReactNode;
	if (config.variant === "number") {
		content = (
			<NumberRenderer
				text={text}
				transition={transition}
				stagger={config.stagger}
				animateInitial={config.initial}
				className={className}
				style={style}
			/>
		);
	} else if (config.variant === "slots") {
		content = (
			<SlotsRenderer
				text={text}
				transition={transition}
				stagger={config.stagger}
				animateInitial={config.initial}
				className={className}
				style={style}
			/>
		);
	} else {
		content = (
			<TextRenderer
				text={text}
				transition={transition}
				driftX={config.driftX}
				driftY={config.driftY}
				trend={config.trend}
				stagger={config.stagger}
				animateInitial={config.initial}
				className={className}
				style={style}
			/>
		);
	}

	if (config.autoSize) {
		return <AutoSizeWrapper transition={transition}>{content}</AutoSizeWrapper>;
	}
	return content;
}
