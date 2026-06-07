"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const SCRATCH_SCRIBBLE_DELAY_MS = 480;

// Grace period before the hover reveal hides, so the pointer can travel from
// the input down to the "Or start from scratch" link without it vanishing.
const REVEAL_HIDE_DELAY_MS = 400;

export interface UseRovoAppComposerRevealResult {
	/** Whether the "Browse templates / start from scratch" reveal should render. */
	isRevealVisible: boolean;
	/** Whether the template-sweep trace should render. */
	showTemplateSweep: boolean;
	/** Whether the scratch-scribble trace should render. */
	showScratchScribble: boolean;
	/** Replay key for the template-sweep trace. */
	templateSweepReplayKey: number;
	/** Replay key for the scratch-scribble trace. */
	scratchScribbleReplayKey: number;
	/** Restart both decorative traces (call on hover/focus). */
	replayRevealTraces: () => void;
	/** Show the reveal immediately (call on pointer enter). */
	showReveal: () => void;
	/** Schedule hiding the reveal after the grace period (call on pointer leave). */
	scheduleHideReveal: () => void;
	/** Mark the textarea focused (keeps the reveal open). */
	setInputFocused: (focused: boolean) => void;
}

/**
 * Owns the Studio "floating" composer's hover/focus reveal of the
 * "Browse templates / start from scratch" link and its decorative SVG traces.
 *
 * Extracted verbatim from the original Studio composer so behavior is unchanged.
 */
export function useRovoAppComposerReveal(): UseRovoAppComposerRevealResult {
	const [isInputFocused, setIsInputFocused] = useState(false);
	const [isComposerHoverActive, setIsComposerHoverActive] = useState(false);
	const [scratchScribbleReplayKey, setScratchScribbleReplayKey] = useState(0);
	const [templateSweepReplayKey, setTemplateSweepReplayKey] = useState(0);
	const [isScratchScribblePlaying, setIsScratchScribblePlaying] = useState(false);
	const revealHideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const scratchScribbleDelayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const replayRevealTraces = useCallback(() => {
		if (scratchScribbleDelayTimeoutRef.current) {
			clearTimeout(scratchScribbleDelayTimeoutRef.current);
		}
		setIsScratchScribblePlaying(false);
		setTemplateSweepReplayKey((currentKey) => currentKey + 1);
		scratchScribbleDelayTimeoutRef.current = setTimeout(() => {
			setIsScratchScribblePlaying(true);
			setScratchScribbleReplayKey((currentKey) => currentKey + 1);
			scratchScribbleDelayTimeoutRef.current = null;
		}, SCRATCH_SCRIBBLE_DELAY_MS);
	}, []);

	const showReveal = useCallback(() => {
		if (revealHideTimeoutRef.current) {
			clearTimeout(revealHideTimeoutRef.current);
			revealHideTimeoutRef.current = null;
		}
		setIsComposerHoverActive(true);
		replayRevealTraces();
	}, [replayRevealTraces]);

	const scheduleHideReveal = useCallback(() => {
		if (revealHideTimeoutRef.current) {
			clearTimeout(revealHideTimeoutRef.current);
		}
		if (scratchScribbleDelayTimeoutRef.current) {
			clearTimeout(scratchScribbleDelayTimeoutRef.current);
			scratchScribbleDelayTimeoutRef.current = null;
		}
		revealHideTimeoutRef.current = setTimeout(() => {
			setIsComposerHoverActive(false);
			setIsScratchScribblePlaying(false);
			revealHideTimeoutRef.current = null;
		}, REVEAL_HIDE_DELAY_MS);
	}, []);

	useEffect(() => {
		return () => {
			if (revealHideTimeoutRef.current) {
				clearTimeout(revealHideTimeoutRef.current);
			}
			if (scratchScribbleDelayTimeoutRef.current) {
				clearTimeout(scratchScribbleDelayTimeoutRef.current);
			}
		};
	}, []);

	// Reveal shows while the composer is hovered (with a close grace period so
	// the pointer can reach the link below) or while the textarea is focused.
	const isRevealVisible = isInputFocused || isComposerHoverActive;
	const showTemplateSweep = isRevealVisible;
	const showScratchScribble = isRevealVisible && isScratchScribblePlaying;

	return {
		isRevealVisible,
		showTemplateSweep,
		showScratchScribble,
		templateSweepReplayKey,
		scratchScribbleReplayKey,
		replayRevealTraces,
		showReveal,
		scheduleHideReveal,
		setInputFocused: setIsInputFocused,
	};
}
