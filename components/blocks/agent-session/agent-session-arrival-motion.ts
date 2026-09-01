/** Shared arrival timing for every Agent Session footprint. */
export const AGENT_SESSION_ARRIVAL_TRANSITION = {
	duration: 0.25,
	ease: [0, 0.4, 0, 1] as [number, number, number, number],
};

/** Vertical travel for Large and Medium arrivals; sessions enter from sync above. */
export const AGENT_SESSION_ARRIVAL_OFFSET_PX = -8;
