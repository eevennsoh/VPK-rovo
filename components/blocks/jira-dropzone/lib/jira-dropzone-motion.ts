import type { FlightProfile } from "./jira-dropzone-types";

export const JIRA_DROPZONE_HOVER_AREA_PX = 120;

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
	launchSpreadPx: 14,
	settleHoldMs: 250,
	staggerMs: 70,
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
