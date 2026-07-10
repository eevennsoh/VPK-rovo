/**
 * Pure fan-out geometry + choreography constants for the Cursors art's "team
 * of agents" moment. Moved out of the (now-deleted) `cursor-fan-out.tsx` so
 * both the DOM launch tooltips and the R3F fan scene share one source of
 * truth, and so this module stays runnable directly under `node --test`
 * type-stripping: it must NOT import `three`, React, or anything via the
 * `@/` alias (see `cursor-agents.test.js` for the established pattern).
 */

// ---------------------------------------------------------------------------
// Fan geometry
// ---------------------------------------------------------------------------

/** Distance from the origin each companion cursor fans out to. */
export const FAN_RADIUS = 132;
/** Total angular spread of the fan, in degrees. */
export const FAN_TOTAL_DEG = 150;
/** Center angle of the fan — straight up from the origin. */
export const FAN_CENTER_DEG = -90;
/** 0 = every cursor faces up-left like the original; 1 = full outward fan. */
export const TILT_TOWARD_OUTWARD = 0.4;
/** The Rovo arrow points up-left (~-135°) at rest. */
export const REST_FACING_DEG = -135;

// ---------------------------------------------------------------------------
// Launch send-off timing/geometry
// ---------------------------------------------------------------------------

/** How far (px) each cursor streaks off-screen when launching. */
export const LAUNCH_DISTANCE = 1200;
/** Per-agent delay (s) between successive launch send-offs. */
export const LAUNCH_STAGGER = 0.22;
/** How long (s) the send-off tooltip is held before the launch begins. */
export const BUBBLE_HOLD = 0.5;
/** Slingshot wind-up: a short pull-back opposite the launch heading (px). */
export const SNAP_BACK_DISTANCE = 16;
/** Duration (s) of the snap-back wind-up. */
export const SNAP_BACK_DURATION = 0.18;
/** Duration (s) of the fire-off flight after the wind-up. */
export const LAUNCH_FLIGHT = 0.55;
/** Per-agent stagger (s) applied to the fan's entrance animation. */
export const ENTRANCE_STAGGER = 0.05;

export interface FanAgent {
	/** Agent index (matches `CURSOR_AGENTS` order). */
	index: number;
	/** Offset from the origin, in px. */
	dx: number;
	dy: number;
	/** Facing rotation (degrees) — lean toward the original up-left facing. */
	rotation: number;
}

/** A single fan-out event: origin, monotonic id (remounts to replay), and Rovo's line. */
export interface CursorFanOutBurst {
	/** Monotonic id — a new id remounts the fan so it replays. */
	id: number;
	/** Viewport origin (the main cursor's position when triggered). */
	x: number;
	y: number;
	/** Funny one-liner Rovo "says" as the team appears. */
	line: string;
}

/**
 * Builds the fan positions/rotations for `count` companion cursors, spread
 * symmetrically about {@link FAN_CENTER_DEG}. Each cursor leans toward the
 * original up-left facing with a slight outward tilt
 * ({@link TILT_TOWARD_OUTWARD}).
 */
export function buildFanAgents(count: number): FanAgent[] {
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
			rotation: (angleDeg + 135) * TILT_TOWARD_OUTWARD,
		});
	}

	return agents;
}

/** The direction (radians) a fan agent flies when launching: its rest facing plus its tilt. */
export function fanAgentFacingRad(agent: Pick<FanAgent, "rotation">): number {
	return ((REST_FACING_DEG + agent.rotation) * Math.PI) / 180;
}

/** Unit vector along the agent's launch heading (see {@link fanAgentFacingRad}). */
export function fanAgentLaunchDirection(agent: Pick<FanAgent, "rotation">): { ux: number; uy: number } {
	const facingRad = fanAgentFacingRad(agent);
	return { ux: Math.cos(facingRad), uy: Math.sin(facingRad) };
}
