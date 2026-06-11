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
	/** Show the reveal for deliberate input focus. */
	setInputFocused: (focused: boolean) => void;
	/** Show the reveal immediately (call on pointer enter). */
	showReveal: () => void;
	/** Schedule hiding the reveal after the grace period (call on pointer leave). */
	scheduleHideReveal: () => void;
}

/**
 * Owns the Studio "floating" composer's hover/value reveal of the
 * "Browse templates / start from scratch" link and its decorative SVG traces.
 */
export function useRovoAppComposerReveal({ hasPromptValue }: Readonly<{ hasPromptValue: boolean }>): UseRovoAppComposerRevealResult {
	const [isComposerHoverActive, setIsComposerHoverActive] = useState(false);
	const [isInputFocused, setIsInputFocused] = useState(false);
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
	// the pointer can reach the link below), when the user deliberately focuses
	// the input for keyboard access, or once the prompt has content.
	const isRevealVisible = hasPromptValue || isComposerHoverActive || isInputFocused;
	const showTemplateSweep = isRevealVisible;
	const showScratchScribble = isRevealVisible && isScratchScribblePlaying;

	return {
		isRevealVisible,
		showTemplateSweep,
		showScratchScribble,
		templateSweepReplayKey,
		scratchScribbleReplayKey,
		replayRevealTraces,
		setInputFocused: setIsInputFocused,
		showReveal,
		scheduleHideReveal,
	};
}
