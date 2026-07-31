// Lifts the flat Rovo mark back into the 3D form it depicts.
//
// The mark is drawn as an isometric cube: the orange facet is the top face, the
// blue and purple facets are two adjoining side faces, and the green facet is
// the underside. So "make the logo 3D" is really "undo the isometric
// projection" — assign each facet the cube face it stands for and cast each
// sampled point back onto that face's plane.
//
// The un-projection uses the exact inverse of the render rotation at the home
// orientation, so at home the 3D cube re-projects pixel-for-pixel onto the
// original mark. Rotating away from home is what reveals the solid.

/** Camera yaw at rest, in radians. */
export const HOME_YAW = -Math.PI / 4;

/** Camera pitch at rest: `atan(1/sqrt(2))`, the true isometric angle. */
export const HOME_PITCH = Math.atan(1 / Math.SQRT2);

export interface Vec3 {
	x: number;
	y: number;
	z: number;
}

/** Yaw about Y, then pitch about X. Screen space is y-down. */
export function rotateToCamera(x: number, y: number, z: number, yaw: number, pitch: number): Vec3 {
	const cosYaw = Math.cos(yaw);
	const sinYaw = Math.sin(yaw);
	const cosPitch = Math.cos(pitch);
	const sinPitch = Math.sin(pitch);

	const x1 = x * cosYaw + z * sinYaw;
	const z1 = -x * sinYaw + z * cosYaw;

	return {
		x: x1,
		y: y * cosPitch - z1 * sinPitch,
		z: y * sinPitch + z1 * cosPitch,
	};
}

function rotateFromCamera(x: number, y: number, z: number, yaw: number, pitch: number): Vec3 {
	const cosPitch = Math.cos(pitch);
	const sinPitch = Math.sin(pitch);
	const y1 = y * cosPitch + z * sinPitch;
	const z1 = -y * sinPitch + z * cosPitch;

	const cosYaw = Math.cos(yaw);
	const sinYaw = Math.sin(yaw);

	return {
		x: x * cosYaw - z1 * sinYaw,
		y: y1,
		z: x * sinYaw + z1 * cosYaw,
	};
}

// Camera-space basis vectors expressed in world space at the home orientation.
// A screen point (sx, sy) sits at `SCREEN_X*sx + SCREEN_Y*sy` on the projection
// plane; the camera sits `focal` behind it, along `-RAY`.
const SCREEN_X = rotateFromCamera(1, 0, 0, HOME_YAW, HOME_PITCH);
const SCREEN_Y = rotateFromCamera(0, 1, 0, HOME_YAW, HOME_PITCH);
const RAY = rotateFromCamera(0, 0, -1, HOME_YAW, HOME_PITCH);

/** Which axis-aligned cube face each facet is un-projected onto. */
const FACET_PLANES: readonly { readonly axis: "x" | "y" | "z"; readonly sign: number }[] = [
	{ axis: "y", sign: -1 }, // orange — top (screen space is y-down)
	{ axis: "x", sign: -1 }, // blue — left side
	{ axis: "z", sign: -1 }, // purple — adjoining side
	{ axis: "y", sign: 1 }, // green — underside
];

/** Half-thickness of the depth slab, as a multiple of the cube half-size. */
const DEPTH_SLAB = 1.4;

/**
 * How far a fully raised facet slides along its view ray, in normalised mark
 * units. Tuned for about 15% on-screen growth at the mark's own perspective,
 * which is enough to read without the stage having to open the perspective up
 * and close it again — that rescaled the whole mark and showed up as a wobble
 * as the facets settled.
 */
const LIFT_REACH = 0.45;

/**
 * Casts a sampled mark point back onto its facet's cube face.
 *
 * The ray runs from the camera through the screen point, matching the
 * perspective projection the renderer uses. Every point on such a ray lands on
 * the same pixel, so the ray parameter is free: it is clamped to a slab around
 * the origin (the mark is stylised, not a strict cube, so a plain plane
 * intersection would send outliers streaming off into space) and jittered to
 * give each face real thickness. Neither is visible at the home orientation —
 * the solid still re-projects exactly onto the original mark.
 *
 * @param screenX - Normalised -0.5..0.5 mark coordinate.
 * @param screenY - Normalised -0.5..0.5 mark coordinate, y-down.
 * @param facet - Index into `FACET_PLANES`.
 * @param extrude - Cube half-size in the same normalised units.
 * @param lift - How far this facet is raised toward the viewer, 0..1. Applied
 *   along the view ray, so it is the same direction for every facet. Raising a
 *   facet by moving its own plane outward would not be: under this camera the
 *   underside sits on the near side, so it would advance while the top and
 *   sides receded, and the sequence would appear to reverse partway round.
 * @param thickness - Depth spread given to each face, in the same units.
 * @param focal - Camera distance, in the same normalised units.
 * @param seed - Particle index; drives the deterministic thickness jitter.
 */
export function unprojectFacetPoint(
	screenX: number,
	screenY: number,
	facet: number,
	extrude: number,
	lift: number,
	thickness: number,
	focal: number,
	seed: number,
	out: Vec3,
): Vec3 {
	const plane = FACET_PLANES[facet] ?? FACET_PLANES[0];
	const axis = plane.axis;

	// Camera sits at `focal` along the view axis; the ray runs from there
	// through the screen point.
	const originX = -focal * RAY.x;
	const originY = -focal * RAY.y;
	const originZ = -focal * RAY.z;

	let directionX = SCREEN_X.x * screenX + SCREEN_Y.x * screenY + focal * RAY.x;
	let directionY = SCREEN_X.y * screenX + SCREEN_Y.y * screenY + focal * RAY.y;
	let directionZ = SCREEN_X.z * screenX + SCREEN_Y.z * screenY + focal * RAY.z;

	const length = Math.hypot(directionX, directionY, directionZ) || 1;
	directionX /= length;
	directionY /= length;
	directionZ /= length;

	const originOnAxis = axis === "x" ? originX : axis === "y" ? originY : originZ;
	const directionOnAxis = axis === "x" ? directionX : axis === "y" ? directionY : directionZ;

	// No cube face is edge-on to the fixed home orientation, so this cannot
	// approach zero.
	const distance = (plane.sign * extrude - originOnAxis) / directionOnAxis;

	// Clamp around the ray's closest approach to the origin, keeping the solid
	// inside a slab rather than letting it stream off along the view axis.
	const nearest = -(originX * directionX + originY * directionY + originZ * directionZ);
	const limit = extrude * DEPTH_SLAB;
	let along = nearest + Math.min(limit, Math.max(-limit, distance - nearest));

	// Integer hash rather than trig: stable per particle, and cheap enough to
	// run 10k times a frame.
	const hash = Math.imul(seed + 1, 2654435761) >>> 0;
	along += ((hash & 0xffff) / 0xffff - 0.5) * thickness;

	// Raising a facet slides it along its own view ray. That leaves the pixel
	// untouched under the ray's own focal length, but the renderer projects
	// with a longer one, and the mismatch is what turns the slide into visible
	// growth. Same direction for every facet, so the sequence reads the same
	// way round the mark.
	along += lift * LIFT_REACH;

	out.x = originX + directionX * along;
	out.y = originY + directionY * along;
	out.z = originZ + directionZ * along;
	return out;
}
