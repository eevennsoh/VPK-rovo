"use client";

import CursorIcon from "@atlaskit/icon-lab/core/cursor";
import { motion, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import { useEffect, useRef } from "react";

const CURSOR_NATURAL_ANGLE = -135;
const ROTATION_SPRING = { damping: 18, stiffness: 260, mass: 0.35 };

interface RovoCursorTrackingIconProps {
	active: boolean;
	label?: string;
}

export function RovoCursorTrackingIcon({
	active,
	label = "",
}: Readonly<RovoCursorTrackingIconProps>) {
	const iconRef = useRef<HTMLSpanElement | null>(null);
	const prefersReducedMotion = useReducedMotion();
	const rotation = useMotionValue(0);
	const smoothRotation = useSpring(rotation, ROTATION_SPRING);

	useEffect(() => {
		if (!active || prefersReducedMotion) {
			rotation.set(0);
			return;
		}

		const icon = iconRef.current;
		if (!icon) {
			return;
		}

		let centerX = 0;
		let centerY = 0;

		const updateCenter = () => {
			const rect = icon.getBoundingClientRect();
			centerX = rect.left + rect.width / 2;
			centerY = rect.top + rect.height / 2;
		};

		const handlePointerMove = (event: PointerEvent) => {
			const angle = Math.atan2(event.clientY - centerY, event.clientX - centerX) * (180 / Math.PI);
			rotation.set(angle - CURSOR_NATURAL_ANGLE);
		};

		updateCenter();
		window.addEventListener("pointermove", handlePointerMove, { passive: true });
		window.addEventListener("resize", updateCenter);
		window.addEventListener("scroll", updateCenter, { passive: true, capture: true });

		return () => {
			window.removeEventListener("pointermove", handlePointerMove);
			window.removeEventListener("resize", updateCenter);
			window.removeEventListener("scroll", updateCenter, { capture: true });
		};
	}, [active, prefersReducedMotion, rotation]);

	return (
		<motion.span
			ref={iconRef}
			data-slot="rovo-cursor-tracking-icon"
			aria-hidden={label ? undefined : true}
			className="inline-flex origin-center"
			style={{
				rotate: smoothRotation,
				willChange: active && !prefersReducedMotion ? "transform" : undefined,
			}}
		>
			<CursorIcon label={label} />
		</motion.span>
	);
}
