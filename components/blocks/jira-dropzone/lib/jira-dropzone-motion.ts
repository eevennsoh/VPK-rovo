import type { FlightProfile, ViewportPoint } from "./jira-dropzone-types";

export const JIRA_DROPZONE_HOVER_AREA_PX = 120;

/** Compact well pop-in while a session drag is active. */
export const JIRA_DROPZONE_WELL_ENTER = {
	duration: 0.15,
	ease: [0.4, 1, 0.6, 1],
} as const; // duration-normal + ease-out-practical
export const JIRA_DROPZONE_WELL_ENTER_REDUCED = { duration: 0 } as const;
export const JIRA_DROPZONE_WELL_ENTER_SCALE = 0.95;

/**
 * Shared flight recipe for create-well and card-link drops.
 *
 * `durationMs` is duration-slower so the arc can be tracked. `staggerMs` is
 * duration-normal so each chip is visibly queued before the next leaves —
 * 70ms read as one pile on short board drops (pointer already on the well or
 * chin). `launchSpreadPx` is space.600 so ~80px mention chips fan into a pack
 * instead of overlapping at 14px.
 */
export const JIRA_DROPZONE_FULL_MOTION_PROFILE: FlightProfile = {
	arcPeak: 0.5,
	arcStrength: 0.42,
	durationMs: 400,
	ease: [0.4, 1, 0.6, 1],
	impact: {
		damping: 12,
		impulseXPx: 6,
		impulseYPx: 10,
		stiffness: 500,
	},
	launchSpreadPx: 48,
	settleHoldMs: 250,
	staggerMs: 150,
	travel: "arc",
};

export const JIRA_DROPZONE_REDUCED_MOTION_PROFILE: FlightProfile = {
	arcPeak: 0.5,
	arcStrength: 0,
	durationMs: 0,
	ease: [0, 0, 1, 1],
	impact: null,
	launchSpreadPx: 0,
	settleHoldMs: 100,
	staggerMs: 0,
	travel: "none",
};

export function resolveFlightProfile(shouldReduceMotion: boolean | null): FlightProfile {
	return shouldReduceMotion ? JIRA_DROPZONE_REDUCED_MOTION_PROFILE : JIRA_DROPZONE_FULL_MOTION_PROFILE;
}

export function resolveJiraDropzoneLandingPoint(
	rect: Pick<DOMRectReadOnly, "height" | "left" | "top" | "width">,
): ViewportPoint {
	return {
		x: rect.left + rect.width / 2,
		y: rect.top + rect.height / 2,
	};
}
