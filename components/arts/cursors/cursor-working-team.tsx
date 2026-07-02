"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

import { CURSOR_AGENTS } from "@/components/arts/cursors/cursor-agents";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { RovoCursor } from "@/components/ui-custom/rovo-cursor";

/** Small glyph unit for the working-team cursors. */
const CURSOR_SIZE = 16;
/** How often the tooltip trace cycles, in milliseconds. */
const TRACE_CYCLE_MS = 2000;
/** Subtle vertical bounce loop, staggered per agent so the team feels alive. */
const BOUNCE_TRANSITION = {
	duration: 2.4,
	repeat: Infinity,
	ease: "easeInOut",
} as const;

interface CursorWorkingTeamProps {
	/** Additional CSS classes applied to the row wrapper. */
	className?: string;
}

/**
 * A compact row of the four companion cursors "at work": each is a solid,
 * agent-colored RovoCursor doing a subtle staggered vertical bounce, wrapped in
 * a tooltip whose text cycles through that agent's thinking traces every ~2s.
 * Reads {@link CURSOR_AGENTS}; honors `prefers-reduced-motion` by dropping both
 * the bounce and the cycling (traces settle on index 0).
 */
export function CursorWorkingTeam({ className }: Readonly<CursorWorkingTeamProps>) {
	const reducedMotion = useReducedMotion();
	const [traceTick, setTraceTick] = useState(0);

	useEffect(() => {
		if (reducedMotion) {
			return;
		}
		const id = window.setInterval(() => {
			setTraceTick((prev) => prev + 1);
		}, TRACE_CYCLE_MS);
		return () => window.clearInterval(id);
	}, [reducedMotion]);

	return (
		<TooltipProvider>
			<div className={className} style={{ display: "flex", alignItems: "center", gap: 8 }}>
				{CURSOR_AGENTS.map((agent, index) => {
					const trace = agent.traces[traceTick % agent.traces.length];
					return (
						<Tooltip key={agent.name}>
							<TooltipTrigger
								render={
									<span
										tabIndex={0}
										aria-label={agent.name}
										style={{
											display: "inline-flex",
											pointerEvents: "auto",
											outline: "none",
										}}
									/>
								}
							>
								<motion.span
									className="inline-flex"
									animate={reducedMotion ? { y: 0 } : { y: [0, -3, 0] }}
									transition={
										reducedMotion
											? { duration: 0 }
											: { ...BOUNCE_TRANSITION, delay: index * 0.18 }
									}
									style={{ willChange: "transform" }}
								>
									<RovoCursor
										state="painting"
										size={CURSOR_SIZE}
										color={agent.color}
										animated={false}
									/>
								</motion.span>
							</TooltipTrigger>
							<TooltipContent>{trace}</TooltipContent>
						</Tooltip>
					);
				})}
			</div>
		</TooltipProvider>
	);
}
