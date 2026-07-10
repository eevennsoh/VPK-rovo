"use client";

import { useReducedMotion } from "motion/react";
import { useEffect, useMemo, useState } from "react";

import { CURSOR_AGENTS } from "./cursor-agents";
import { anchorAngles, ORBIT_DEFAULT_A, ORBIT_DEFAULT_B, ORBIT_DEFAULT_TILT_FACTOR } from "./cursor-orbit-math";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * How often each proxy's tooltip trace cycles, in milliseconds. Exported so
 * `index.tsx` can cycle its own hovered-agent caption text on the same
 * cadence (that caption is a separate concern from these tooltips).
 */
export const TRACE_CYCLE_MS = 2000;
/** Focusable hit-target size (px) — matches the DOM proxies' invisible footprint. */
const PROXY_SIZE = 16;

interface CursorOrbitSatellitesDomProps {
	/** Only rendered while the team is "working". */
	working: boolean;
	/** Measured voice-button center (viewport px), or null before first measure. */
	center: { x: number; y: number } | null;
	/** Fires on hover/focus enter with the agent index, and on leave/blur with null. */
	onHoverAgent: (index: number | null) => void;
}

/**
 * Accessibility proxies for the orbiting satellites: 4 invisible-but-
 * focusable buttons positioned at the static `anchorAngles` around the
 * measured voice button, each wrapped in a `Tooltip` cycling that agent's
 * thinking traces every ~2s — the trace-cycling pattern ported from the
 * (now-deleted) `cursor-working-team.tsx` before it was removed. Hovering or
 * focusing an agent pauses the 3D orbit and surfaces its trace as the
 * caption (see `index.tsx`'s `onHoverAgent`).
 */
export function CursorOrbitSatellitesDom({ working, center, onHoverAgent }: Readonly<CursorOrbitSatellitesDomProps>) {
	const reducedMotion = useReducedMotion();
	const [traceTick, setTraceTick] = useState(0);
	const angles = useMemo(() => anchorAngles(CURSOR_AGENTS.length), []);

	useEffect(() => {
		if (!working || reducedMotion) {
			return;
		}
		const id = window.setInterval(() => setTraceTick((prev) => prev + 1), TRACE_CYCLE_MS);
		return () => window.clearInterval(id);
	}, [working, reducedMotion]);

	if (!working || !center) {
		return null;
	}

	return (
		<div className="pointer-events-none fixed inset-0 z-[9998]">
			{CURSOR_AGENTS.map((agent, index) => {
				const angle = angles[index];
				const traceIndex = reducedMotion ? 0 : traceTick % agent.traces.length;
				const trace = agent.traces[traceIndex];
				const x = center.x + Math.cos(angle) * ORBIT_DEFAULT_A;
				const y = center.y - Math.sin(angle) * ORBIT_DEFAULT_B * ORBIT_DEFAULT_TILT_FACTOR;

				return (
					<Tooltip key={agent.name}>
						<TooltipTrigger
							render={
								<button
									type="button"
									aria-label={`${agent.name}: ${trace}`}
									onMouseEnter={() => onHoverAgent(index)}
									onMouseLeave={() => onHoverAgent(null)}
									onFocus={() => onHoverAgent(index)}
									onBlur={() => onHoverAgent(null)}
									className="pointer-events-auto absolute rounded-full opacity-0 outline-none"
									style={{
										left: x - PROXY_SIZE / 2,
										top: y - PROXY_SIZE / 2,
										width: PROXY_SIZE,
										height: PROXY_SIZE,
									}}
								/>
							}
						/>
						<TooltipContent>{`${agent.name}: ${trace}`}</TooltipContent>
					</Tooltip>
				);
			})}
		</div>
	);
}
