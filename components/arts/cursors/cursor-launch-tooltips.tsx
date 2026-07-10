"use client";

import { motion, useReducedMotion } from "motion/react";

import { CURSOR_AGENTS } from "./cursor-agents";
import { buildFanAgents, type CursorFanOutBurst, LAUNCH_STAGGER } from "./cursor-fan-math";

interface CursorLaunchTooltipsProps {
	burst: CursorFanOutBurst | null;
	/** While true, pops each agent's send-off word in launch order. */
	launching: boolean;
}

const REDUCED_MOTION_STAGGER = 0.08;

/**
 * The per-agent send-off tooltip chips shown while the fanned-out team
 * launches — ported from the (now-deleted) `cursor-fan-out.tsx`'s DOM
 * tooltips so `CursorSceneFan`'s 3D meshes stay purely visual. Positions
 * come straight from `burst` + `cursor-fan-math` (screen px — no 3D
 * conversion needed for a DOM overlay).
 */
export function CursorLaunchTooltips({ burst, launching }: Readonly<CursorLaunchTooltipsProps>) {
	const shouldReduceMotion = useReducedMotion();

	if (!burst || !launching) {
		return null;
	}

	const agents = buildFanAgents(CURSOR_AGENTS.length);

	return (
		<div className="pointer-events-none fixed inset-0 z-[9998]" aria-hidden="true">
			{agents.map((agent) => {
				const launchWord = CURSOR_AGENTS[agent.index]?.launchWord;
				if (!launchWord) {
					return null;
				}

				return (
					<motion.div
						key={agent.index}
						className="absolute w-max rounded-md bg-bg-neutral-bold px-2 py-1 text-xs whitespace-nowrap text-text-inverse shadow-md"
						style={{
							left: burst.x + agent.dx + 5,
							top: burst.y + agent.dy - 1,
							willChange: "transform, opacity",
						}}
						initial={{ opacity: 0, scale: 0.6 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={
							shouldReduceMotion
								? { duration: 0.1, delay: agent.index * REDUCED_MOTION_STAGGER }
								: { type: "spring", visualDuration: 0.3, bounce: 0.4, delay: agent.index * LAUNCH_STAGGER }
						}
					>
						{launchWord}
					</motion.div>
				);
			})}
		</div>
	);
}
