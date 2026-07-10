/**
 * Pure orbit geometry for the "team at work" state: the 4 companion cursors
 * slowly orbit the liquid-metal voice button in a shallow 3D ellipse. Kept
 * dependency-free (no `three`, React, or `@/` alias) so it stays runnable
 * directly under `node --test` type-stripping — see `cursor-agents.test.js`
 * for the established pattern.
 */

export interface OrbitConfig {
	/** Semi-major axis (x radius), in local units/px. @default 42 */
	A?: number;
	/** Semi-minor axis (y radius) before tilt. @default 12 */
	B?: number;
	/** Depth axis magnitude (z, toward/away from camera). @default 60 */
	Z?: number;
	/** Angular speed, radians/sec. @default 0.5 */
	speed?: number;
	/** Extra vertical flatten factor for the shallow-ellipse look. @default 1 */
	tiltFactor?: number;
}

export interface OrbitPoint {
	dx: number;
	dy: number;
	dz: number;
}

export const ORBIT_DEFAULT_A = 42;
export const ORBIT_DEFAULT_B = 12;
export const ORBIT_DEFAULT_Z = 60;
export const ORBIT_DEFAULT_SPEED = 0.5;
export const ORBIT_DEFAULT_TILT_FACTOR = 1;

/** Opacity floor/ceiling for {@link depthOpacity}. */
const DEPTH_OPACITY_MIN = 0.15;
const DEPTH_OPACITY_MAX = 1;

function clamp01(value: number): number {
	return Math.min(1, Math.max(0, value));
}

/**
 * Position of orbiting agent `index` (of `count`) at time `tSec`, along a
 * shallow ellipse centered on the voice button:
 * `θ = tSec·speed + index·2π/count`, `dx = A·cosθ`, `dy = B·sinθ·tiltFactor`,
 * `dz = Z·sinθ`. Front apex (closest to camera, biggest/brightest) is at
 * `θ = π/2` (`dz = +Z`); back apex is at `θ = -π/2` (`dz = -Z`).
 */
export function orbitPoint(tSec: number, index: number, count: number, cfg: OrbitConfig = {}): OrbitPoint {
	const a = cfg.A ?? ORBIT_DEFAULT_A;
	const b = cfg.B ?? ORBIT_DEFAULT_B;
	const z = cfg.Z ?? ORBIT_DEFAULT_Z;
	const speed = cfg.speed ?? ORBIT_DEFAULT_SPEED;
	const tiltFactor = cfg.tiltFactor ?? ORBIT_DEFAULT_TILT_FACTOR;
	const theta = tSec * speed + (index * 2 * Math.PI) / count;

	return {
		dx: a * Math.cos(theta),
		dy: b * Math.sin(theta) * tiltFactor,
		dz: z * Math.sin(theta),
	};
}

/**
 * Maps back-half depth to a clamped opacity in [0.15, 1] — 1 at the front
 * apex (`dz = +maxZ`), 0.15 at the back apex (`dz = -maxZ`) — so the back
 * half of the orbit visibly dims/recedes behind the button (single canvas,
 * no two-canvas split).
 */
export function depthOpacity(dz: number, maxZ: number = ORBIT_DEFAULT_Z): number {
	if (maxZ <= 0) {
		return DEPTH_OPACITY_MAX;
	}
	const t = clamp01((dz / maxZ + 1) / 2);
	return DEPTH_OPACITY_MIN + (DEPTH_OPACITY_MAX - DEPTH_OPACITY_MIN) * t;
}

/**
 * Deterministic static angles (radians) for the `count` DOM focus proxies —
 * matches each agent's phase in {@link orbitPoint} at `t = 0`.
 */
export function anchorAngles(count: number): number[] {
	const angles: number[] = [];
	for (let index = 0; index < count; index += 1) {
		angles.push((index * 2 * Math.PI) / count);
	}
	return angles;
}

/**
 * Frame-rate-independent exponential damping (replaces `maath`'s `damp`,
 * which isn't installed). Monotonically approaches `target` and is stable at
 * arbitrarily large `dt` (the decay factor underflows to 0, snapping exactly
 * to `target` rather than overshooting).
 */
export function dampTo(current: number, target: number, lambda: number, dt: number): number {
	return target + (current - target) * Math.exp(-lambda * dt);
}
