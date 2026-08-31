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
	const lastReportedStateRef = useRef<OmnibarState>(defaultState);

	const clearCollapseTimer = useCallback(() => {
		if (collapseTimerRef.current !== null) {
			clearTimeout(collapseTimerRef.current);
			collapseTimerRef.current = null;
		}
	}, []);

	const dispatch = useCallback((event: OmnibarEvent) => {
		setMachine((current) => omnibarReducer(current, event));
	}, []);

	// Reporting lives in an effect rather than the updater so the updater stays pure.
	useEffect(() => {
		if (lastReportedStateRef.current === machine.state) {
			return;
		}
		lastReportedStateRef.current = machine.state;
		onStateChange?.(machine.state);
	}, [machine.state, onStateChange]);

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
