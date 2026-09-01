"use client";

import { useCallback, useRef, useState } from "react";

export type ScrubberComposerMode = "idle" | "timeline";

export interface ScrubberComposerOptions {
	/** Committed entry index. Pass it to drive the rail from outside; omit to let the composer own it. */
	activeIndex?: number;
	defaultMode?: ScrubberComposerMode;
	onActiveIndexChange?: (index: number) => void;
}

export interface ScrubberComposer {
	activeIndex: number;
	draft: string;
	isTimeline: boolean;
	mode: ScrubberComposerMode;
	/** True once, on the render that follows leaving Timeline. */
	consumeFocusRestore: () => boolean;
	selectIndex: (index: number) => void;
	setDraft: (value: string) => void;
	setMode: (mode: ScrubberComposerMode) => void;
	/** Flips between the two modes. Use this for the toggle rather than `setMode`. */
	toggleMode: () => void;
}

/**
 * State for the two composer modes, kept out of the view so the swap stays readable.
 *
 * Two things here are load-bearing rather than incidental:
 *
 * 1. **The draft lives above the view switch.** Timeline mode unmounts the tiptap
 *    editor, which destroys it; only a plain string held by a surviving owner comes
 *    back. `.agents/rules/gotchas-ui.md` calls this classifying state by lifetime —
 *    typed text is user-authored and must outlive a mode toggle. Rich content
 *    (mention nodes, attachments, caret) is not recoverable this way, so the promise
 *    this keeps is narrow and deliberate: *typed text is never discarded*.
 * 2. **Focus restore is armed, not automatic.** Re-focusing the editor whenever it
 *    mounts would steal focus on first paint. The ref is set only by a mode change
 *    back to idle, and the reader clears it, so exactly one remount consumes it.
 *
 * `activeIndex` supports both shapes: controlled when the prop is supplied,
 * self-owned otherwise. `onActiveIndexChange` fires either way, so a host can
 * observe scrubbing without taking ownership of it.
 */
export function useScrubberComposer({
	activeIndex,
	defaultMode = "idle",
	onActiveIndexChange,
}: Readonly<ScrubberComposerOptions>): ScrubberComposer {
	const [mode, setModeState] = useState<ScrubberComposerMode>(defaultMode);
	const [draft, setDraft] = useState("");
	const [uncontrolledIndex, setUncontrolledIndex] = useState(0);
	const restoreFocusRef = useRef(false);

	const isControlled = activeIndex !== undefined;

	const selectIndex = useCallback(
		(index: number) => {
			if (!isControlled) {
				setUncontrolledIndex(index);
			}
			onActiveIndexChange?.(index);
		},
		[isControlled, onActiveIndexChange],
	);

	const setMode = useCallback((next: ScrubberComposerMode) => {
		restoreFocusRef.current = next === "idle";
		setModeState(next);
	}, []);

	/**
	 * The toggle flips from the committed value rather than from a render-closure
	 * boolean, per `.agents/rules/gotchas-react.md`.
	 *
	 * Arming focus restore unconditionally is equivalent to arming it only on the
	 * way back to idle, and is what lets the flip stay a pure updater: the editor
	 * exists only in idle, so idle is the only mode that can ever consume the
	 * flag. Writing the ref from inside the updater would break the "updaters
	 * compute and return, nothing else" rule the same file sets.
	 */
	const toggleMode = useCallback(() => {
		restoreFocusRef.current = true;
		setModeState((previous) => (previous === "timeline" ? "idle" : "timeline"));
	}, []);

	const consumeFocusRestore = useCallback(() => {
		const shouldRestore = restoreFocusRef.current;
		restoreFocusRef.current = false;
		return shouldRestore;
	}, []);

	return {
		activeIndex: isControlled ? activeIndex : uncontrolledIndex,
		consumeFocusRestore,
		draft,
		isTimeline: mode === "timeline",
		mode,
		selectIndex,
		setDraft,
		setMode,
		toggleMode,
	};
}
