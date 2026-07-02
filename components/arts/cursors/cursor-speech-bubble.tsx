"use client";

import { motion, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import { useEffect } from "react";

// Mirror the ClickyOverlay cursor so this bubble sits and moves exactly like the
// cursor's own "Yo, let's cook" welcome bubble: same follow spring, same tracking
// offset, same "above" placement, and the same scale-pop enter/exit.
const FOLLOW_SPRING = { damping: 12, stiffness: 250, mass: 0.4 } as const;
const TRACKING_OFFSET_X = 35;
const TRACKING_OFFSET_Y = 25;
// ClickySpeechBubble's "above" placement offsets, replicated here.
const ABOVE_LEFT = 18;
const ABOVE_TOP = -44;

interface CursorSpeechBubbleProps {
	text: string;
}

/**
 * A custom black text box that trails the live Rovo cursor and enters/exits with
 * the exact same pop as the cursor's welcome bubble. Long replies wrap (max-w)
 * instead of the welcome's single-line no-wrap.
 */
export function CursorSpeechBubble({ text }: Readonly<CursorSpeechBubbleProps>) {
	const reduced = useReducedMotion();
	const x = useMotionValue(typeof window === "undefined" ? 0 : window.innerWidth / 2 + TRACKING_OFFSET_X);
	const y = useMotionValue(typeof window === "undefined" ? 0 : window.innerHeight * 0.55 + TRACKING_OFFSET_Y);
	const springX = useSpring(x, FOLLOW_SPRING);
	const springY = useSpring(y, FOLLOW_SPRING);

	useEffect(() => {
		const handleMove = (event: PointerEvent) => {
			x.set(event.clientX + TRACKING_OFFSET_X);
			y.set(event.clientY + TRACKING_OFFSET_Y);
		};
		window.addEventListener("pointermove", handleMove, { passive: true });
		return () => window.removeEventListener("pointermove", handleMove);
	}, [x, y]);

	return (
		<motion.div
			aria-hidden="true"
			className="pointer-events-none fixed top-0 left-0 z-[9998]"
			style={{ x: reduced ? x : springX, y: reduced ? y : springY, willChange: "transform" }}
		>
			<motion.div
				className="absolute w-max max-w-xs rounded-md bg-bg-neutral-bold px-3 py-1.5 text-xs text-text-inverse shadow-md"
				style={{ left: ABOVE_LEFT, top: ABOVE_TOP, transformOrigin: "left bottom", willChange: "transform, opacity" }}
				initial={{ scale: 0.5, opacity: 0 }}
				animate={{ scale: 1, opacity: 1 }}
				exit={{ scale: 0.5, opacity: 0 }}
				transition={{ type: "spring", duration: 0.4, bounce: 0.4 }}
			>
				{text}
			</motion.div>
		</motion.div>
	);
}
