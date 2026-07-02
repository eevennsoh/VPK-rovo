"use client";

import { AnimatePresence, arc, motion, type Transition, useReducedMotion } from "motion/react";
import { useMemo } from "react";
import { CURSOR_AGENTS, CURSOR_AGENT_COUNT } from "@/components/arts/cursors/cursor-agents";
import { RovoCursor } from "@/components/ui-custom/rovo-cursor";

export interface CursorFanOutBurst {
	/** Monotonic id — a new id remounts the fan so it replays. */
	id: number;
	/** Viewport origin (the main cursor's position when triggered). */
	x: number;
	y: number;
	/** Funny one-liner Rovo "says" as the team appears. */
	line: string;
}

interface CursorFanOutProps {
	burst: CursorFanOutBurst | null;
	/** How many companion cursors to spawn. */
	count?: number;
	/** When true, the team pops tiny tooltips and launches off-screen one-by-one. */
	launching?: boolean;
}

// Fan geometry: a spread of cursors bowing upward/outward from the origin.
const FAN_RADIUS = 132;
const FAN_TOTAL_DEG = 150;
const FAN_CENTER_DEG = -90; // straight up from the origin
const CURSOR_SIZE = 18;
// 0 = every cursor faces up-left like the original; 1 = full outward fan.
// A gentle lean keeps the team reading as one flock.
const TILT_TOWARD_OUTWARD = 0.4;
// The Rovo arrow points up-left (~-135°) at rest.
const REST_FACING_DEG = -135;

// Launch send-off timing/geometry.
const LAUNCH_DISTANCE = 1200;
const LAUNCH_STAGGER = 0.22;
const BUBBLE_HOLD = 0.5;
// Slingshot: a short snap-back (wind-up) then the fire-off flight.
const SNAP_BACK_DISTANCE = 16;
const SNAP_BACK_DURATION = 0.18;
const LAUNCH_FLIGHT = 0.55;
const LAUNCH_TIMES = [0, SNAP_BACK_DURATION / (SNAP_BACK_DURATION + LAUNCH_FLIGHT), 1];
// Settle into the wind-up (easeOut), then accelerate away (easeIn).
const LAUNCH_EASE: ["easeOut", "easeIn"] = ["easeOut", "easeIn"];

interface FanAgent {
	index: number;
	dx: number;
	dy: number;
	rotation: number;
}

function buildFanAgents(count: number): FanAgent[] {
	const agents: FanAgent[] = [];
	const step = count > 1 ? FAN_TOTAL_DEG / (count - 1) : 0;
	const start = FAN_CENTER_DEG - FAN_TOTAL_DEG / 2;

	for (let index = 0; index < count; index += 1) {
		const angleDeg = count > 1 ? start + step * index : FAN_CENTER_DEG;
		const angleRad = (angleDeg * Math.PI) / 180;
		agents.push({
			index,
			dx: Math.cos(angleRad) * FAN_RADIUS,
			dy: Math.sin(angleRad) * FAN_RADIUS,
			// Lean toward the original up-left facing with a slight outward tilt.
			rotation: (angleDeg + 135) * TILT_TOWARD_OUTWARD,
		});
	}

	return agents;
}

/**
 * Spawns companion Rovo cursors that fan out from a single origin along curved
 * paths using Motion's `arc()` — the visual for "create me a team of agents".
 * The cursors lean toward the original cursor's facing. On `launching` (say
 * "let's go"), each cursor pops a tiny tooltip and streaks off-screen in the
 * direction it points, one-by-one, then the parent clears the burst. Honors
 * reduced-motion by skipping the long flights.
 */
export function CursorFanOut({ burst, count = CURSOR_AGENT_COUNT, launching = false }: Readonly<CursorFanOutProps>) {
	const shouldReduceMotion = useReducedMotion();
	const agents = useMemo(() => buildFanAgents(count), [count]);
	// A single memoized arc() instance (auto direction) curves every flight and
	// enables Motion's interruption handling, per the arc() docs.
	const path = useMemo(() => arc({ strength: 0.9 }), []);
	// A gentler arc for the launch fire-off so the streak curves as it leaves.
	const launchPath = useMemo(() => arc({ strength: 0.5 }), []);

	return (
		<AnimatePresence>
			{burst ? (
				<motion.div
					key={burst.id}
					className="pointer-events-none fixed inset-0"
					style={{ zIndex: 9997 }}
					initial={{ opacity: 1 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{ duration: 0.3 }}
				>
					{agents.map((agent) => {
						const targetX = burst.x + agent.dx;
						const targetY = burst.y + agent.dy;
						const entranceDelay = agent.index * 0.05;

						// Fly the way the cursor points: rest facing + its tilt.
						const facingRad = ((REST_FACING_DEG + agent.rotation) * Math.PI) / 180;
						const ux = Math.cos(facingRad);
						const uy = Math.sin(facingRad);
						const launchX = targetX + ux * LAUNCH_DISTANCE;
						const launchY = targetY + uy * LAUNCH_DISTANCE;
						// Wind-up point: a short pull-back opposite the launch heading.
						const snapBackX = targetX - ux * SNAP_BACK_DISTANCE;
						const snapBackY = targetY - uy * SNAP_BACK_DISTANCE;
						const launchDelay = BUBBLE_HOLD + agent.index * LAUNCH_STAGGER;

						const animateTarget = launching
							? {
									x: [targetX, snapBackX, launchX],
									y: [targetY, snapBackY, launchY],
									opacity: [1, 1, 0],
									scale: [1, 1.1, 0.78],
								}
							: { x: targetX, y: targetY, opacity: 1, scale: 1 };

						let transition: Transition;
						if (launching) {
							transition = shouldReduceMotion
								? { duration: 0.25, delay: agent.index * 0.08 }
								: {
										delay: launchDelay,
										duration: SNAP_BACK_DURATION + LAUNCH_FLIGHT,
										times: LAUNCH_TIMES,
										ease: LAUNCH_EASE,
										path: launchPath,
									};
						} else {
							transition = shouldReduceMotion
								? { duration: 0.2, delay: entranceDelay }
								: {
										default: { type: "spring", visualDuration: 0.55, bounce: 0.3, delay: entranceDelay },
										opacity: { duration: 0.25, delay: entranceDelay },
										path,
									};
						}

						const launchWord = CURSOR_AGENTS[agent.index]?.launchWord;

						return (
							<motion.div
								key={agent.index}
								className="absolute top-0 left-0"
								style={{ willChange: "transform, opacity" }}
								initial={{
									x: shouldReduceMotion ? targetX : burst.x,
									y: shouldReduceMotion ? targetY : burst.y,
									opacity: 0,
									scale: shouldReduceMotion ? 1 : 0.4,
								}}
								animate={animateTarget}
								exit={{ opacity: 0, scale: 0.6 }}
								transition={transition}
							>
								{/* Subtle, staggered up/down float so the team feels alive.
								    Paused while launching so it doesn't fight the streak. */}
								<motion.div
									animate={shouldReduceMotion || launching ? { y: 0 } : { y: [0, -3, 0] }}
									transition={
										shouldReduceMotion || launching
											? { duration: 0 }
											: { duration: 2.4, repeat: Infinity, ease: "easeInOut", delay: agent.index * 0.18 }
									}
									style={{ willChange: "transform" }}
								>
									{/* Point the cursor along its (tilted) facing direction. */}
									<div style={{ transform: `rotate(${agent.rotation}deg)` }}>
										<RovoCursor
											state="painting"
											size={CURSOR_SIZE}
											color={CURSOR_AGENTS[agent.index]?.color}
											animated={false}
										/>
									</div>
								</motion.div>

								{/* Tiny send-off tooltip, popped one-by-one before launch. */}
								{launching && launchWord ? (
									<motion.div
										className="pointer-events-none absolute left-5 -top-1 w-max rounded-md bg-bg-neutral-bold px-2 py-1 text-xs whitespace-nowrap text-text-inverse shadow-md"
										initial={{ opacity: 0, scale: 0.6 }}
										animate={{ opacity: 1, scale: 1 }}
										transition={
											shouldReduceMotion
												? { duration: 0.1, delay: agent.index * 0.08 }
												: { type: "spring", visualDuration: 0.3, bounce: 0.4, delay: agent.index * LAUNCH_STAGGER }
										}
									>
										{launchWord}
									</motion.div>
								) : null}
							</motion.div>
						);
					})}
				</motion.div>
			) : null}
		</AnimatePresence>
	);
}
