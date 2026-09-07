/** Shared arrival timing for every Agent Session footprint. */
export const AGENT_SESSION_ARRIVAL_TRANSITION = {
	duration: 0.25,
	ease: [0, 0.4, 0, 1] as [number, number, number, number],
};

/** Vertical travel for Large and Medium arrivals; sessions enter from sync above. */
export const AGENT_SESSION_ARRIVAL_OFFSET_PX = -8;

/**
 * Circle-rail arrival: the face pops in on the avatar recipe, holds, then
 * crossfades back to the 4px rest dot. Enter matches the hover CSS
 * (`duration-normal` + `ease-out-practical`); exit is the avatar recipe's
 * `duration-fast` + `ease-in`. The hold is `duration-slower` so a 12px face
 * can register.
 */
export const AGENT_SESSION_USER_NOTCH_ARRIVAL = {
	enterMs: 150, // duration-normal
	exitMs: 100, // duration-fast
	lingerMs: 400, // duration-slower
} as const;

export const AGENT_SESSION_USER_NOTCH_ARRIVAL_HIDE_MS =
	AGENT_SESSION_USER_NOTCH_ARRIVAL.enterMs + AGENT_SESSION_USER_NOTCH_ARRIVAL.lingerMs;

export const AGENT_SESSION_USER_NOTCH_ARRIVAL_COMPLETE_MS =
	AGENT_SESSION_USER_NOTCH_ARRIVAL_HIDE_MS + AGENT_SESSION_USER_NOTCH_ARRIVAL.exitMs;
