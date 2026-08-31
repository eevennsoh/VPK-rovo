"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
	OMNIBAR_COLLAPSE_DELAY_MS,
	omnibarReducer,
	type OmnibarEvent,
	type OmnibarMachineState,
	type OmnibarState,
} from "../omnibar-machine";

export type {
	OmnibarEvent,
	OmnibarMachineState,
	OmnibarState,
} from "../omnibar-machine";
export {
	OMNIBAR_COLLAPSE_DELAY_MS,
	OMNIBAR_INITIAL_STATE,
	omnibarReducer,
} from "../omnibar-machine";

/**
 * Satellite surfaces that belong to the Omnibar but are not inside the morphing bar —
 * currently the edge-docked timeline rail, which has to be a sibling to escape the
 * bottom rail's clipping and pointer-events wrapper.
 *
 * Without this, scrubbing the rail would read as an outside click and collapse the very
 * bar that opened it.
 */
const OMNIBAR_SURFACE_SELECTOR = "[data-omnibar-surface]";

export interface UseOmnibarStateOptions {
	defaultState?: OmnibarState;
	onStateChange?: (state: OmnibarState) => void;
}

export interface UseOmnibarStateResult extends OmnibarMachineState {
	/** Attach to the morphing surface so outside clicks can be told apart from inside ones. */
	surfaceRef: React.RefObject<HTMLDivElement | null>;
	handlePointerEnter: () => void;
	handlePointerLeave: () => void;
	/**
	 * Pins the bar open. Bind to both pointer-down and focus: a pointer press is the common
	 * path, but focus is what actually means "the user is engaging with this composer", and it
	 * also covers clicks that never emit pointer events.
	 */
	handlePin: () => void;
	openPanel: () => void;
	closePanel: () => void;
}

/**
 * Owns the Omnibar's state transitions plus the two pieces of timing the reducer cannot
 * express: the collapse grace period and the document-level outside click.
 */
export function useOmnibarState({
	defaultState = "collapsed",
	onStateChange,
}: Readonly<UseOmnibarStateOptions> = {}): UseOmnibarStateResult {
	const [machine, setMachine] = useState<OmnibarMachineState>({
		state: defaultState,
		pinned: false,
	});
	const surfaceRef = useRef<HTMLDivElement | null>(null);
	const collapseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	// Mirrors `machine` so `dispatch` can compute the next state without an updater.
	const machineRef = useRef<OmnibarMachineState>({ state: defaultState, pinned: false });
	// Kept current in an effect rather than during render, which must stay pure.
	const onStateChangeRef = useRef(onStateChange);

	useEffect(() => {
		onStateChangeRef.current = onStateChange;
	}, [onStateChange]);

	const clearCollapseTimer = useCallback(() => {
		if (collapseTimerRef.current !== null) {
			clearTimeout(collapseTimerRef.current);
			collapseTimerRef.current = null;
		}
	}, []);

	const dispatch = useCallback((event: OmnibarEvent) => {
		// The next state is computed here, in the handler, rather than inside the
		// updater: `onStateChange` has to fire somewhere, and notifying a parent from
		// an effect costs every consumer an extra render. Reading and writing
		// `machineRef` is safe because this only ever runs from an event handler or a
		// timer — never during render, and never inside the updater itself.
		const next = omnibarReducer(machineRef.current, event);
		if (next === machineRef.current) {
			return;
		}
		const previousState = machineRef.current.state;
		machineRef.current = next;
		setMachine(next);
		if (next.state !== previousState) {
			onStateChangeRef.current?.(next.state);
		}
	}, []);

	useEffect(() => clearCollapseTimer, [clearCollapseTimer]);

	const handlePointerEnter = useCallback(() => {
		clearCollapseTimer();
		dispatch({ type: "pointer-enter" });
	}, [clearCollapseTimer, dispatch]);

	const handlePointerLeave = useCallback(() => {
		clearCollapseTimer();
		collapseTimerRef.current = setTimeout(() => {
			collapseTimerRef.current = null;
			dispatch({ type: "pointer-leave" });
		}, OMNIBAR_COLLAPSE_DELAY_MS);
	}, [clearCollapseTimer, dispatch]);

	const handlePin = useCallback(() => {
		clearCollapseTimer();
		dispatch({ type: "pin" });
	}, [clearCollapseTimer, dispatch]);

	const openPanel = useCallback(() => {
		clearCollapseTimer();
		dispatch({ type: "open-panel" });
	}, [clearCollapseTimer, dispatch]);

	const closePanel = useCallback(() => {
		clearCollapseTimer();
		dispatch({ type: "close-panel" });
	}, [clearCollapseTimer, dispatch]);

	// A pinned bar can only be dismissed by clicking away from it.
	useEffect(() => {
		if (machine.state !== "expanded") {
			return () => undefined;
		}

		const handleDocumentPointerDown = (event: PointerEvent) => {
			const surface = surfaceRef.current;
			if (surface && event.target instanceof Node && surface.contains(event.target)) {
				return;
			}
			if (event.target instanceof Element && event.target.closest(OMNIBAR_SURFACE_SELECTOR)) {
				return;
			}
			clearCollapseTimer();
			dispatch({ type: "outside-click" });
		};

		document.addEventListener("pointerdown", handleDocumentPointerDown, true);
		return () => {
			document.removeEventListener("pointerdown", handleDocumentPointerDown, true);
		};
	}, [clearCollapseTimer, dispatch, machine.state]);

	return {
		...machine,
		surfaceRef,
		handlePointerEnter,
		handlePointerLeave,
		handlePin,
		openPanel,
		closePanel,
	};
}
