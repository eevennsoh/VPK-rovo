/**
 * Pure state machine for the Omnibar. No React, no DOM — imported directly by the
 * `node:test` contract suite as well as by `use-omnibar-state`.
 */

export type OmnibarState = "collapsed" | "expanded" | "docked";

export interface OmnibarMachineState {
	/** Which of the three geometries is rendered. */
	readonly state: OmnibarState;
	/**
	 * Set once the pointer goes down inside the expanded bar. A pinned bar ignores
	 * `pointer-leave`, so a draft in progress cannot be collapsed out from under the user.
	 */
	readonly pinned: boolean;
}

export type OmnibarEvent =
	| { type: "pointer-enter" }
	| { type: "pointer-leave" }
	| { type: "pin" }
	| { type: "outside-click" }
	| { type: "open-panel" }
	| { type: "close-panel" };

export const OMNIBAR_INITIAL_STATE: OmnibarMachineState = {
	state: "collapsed",
	pinned: false,
};

/** Grace period before a `pointer-leave` collapses, so grazing the edge does not flicker. */
export const OMNIBAR_COLLAPSE_DELAY_MS = 150;

/**
 * Transition table. Returns the identical object when nothing changes so React can bail out
 * of the re-render.
 */
export function omnibarReducer(
	current: OmnibarMachineState,
	event: OmnibarEvent,
): OmnibarMachineState {
	switch (event.type) {
		case "pointer-enter":
			// The docked panel owns its own dismissal; hovering must not yank it back.
			if (current.state === "docked" || current.state === "expanded") {
				return current;
			}
			return { state: "expanded", pinned: current.pinned };

		case "pointer-leave":
			if (current.state !== "expanded" || current.pinned) {
				return current;
			}
			return { state: "collapsed", pinned: false };

		case "pin":
			if (current.state === "docked") {
				return current;
			}
			if (current.state === "expanded" && current.pinned) {
				return current;
			}
			return { state: "expanded", pinned: true };

		case "outside-click":
			if (current.state !== "expanded") {
				return current;
			}
			return { state: "collapsed", pinned: false };

		case "open-panel":
			if (current.state === "docked") {
				return current;
			}
			return { state: "docked", pinned: false };

		case "close-panel":
			if (current.state !== "docked") {
				return current;
			}
			return { state: "collapsed", pinned: false };

		default:
			return current;
	}
}
