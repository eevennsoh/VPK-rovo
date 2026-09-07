"use client";

import { useEffect, useRef, useState } from "react";

import {
	AGENT_SESSION_USER_NOTCH_ARRIVAL_COMPLETE_MS,
	AGENT_SESSION_USER_NOTCH_ARRIVAL_HIDE_MS,
} from "@/components/blocks/agent-session/agent-session-arrival-motion";

/**
 * Drives the collapsed circle-rail's arrival beat: briefly reveal the session's
 * face, then fade back to the rest dot. A missing face still grows in with the
 * shared scale beat. Reduced motion skips both and leaves the rest dot.
 */
export function useAgentSessionUserNotchArrival({
	hasAvatar,
	isArriving,
	onArrivalComplete,
	shouldReduceMotion,
}: Readonly<{
	hasAvatar: boolean;
	isArriving: boolean;
	onArrivalComplete?: () => void;
	shouldReduceMotion: boolean | null;
}>): {
	arrivalExiting: boolean;
	arrivalReveal: boolean;
	shouldPlayScaleArrival: boolean;
} {
	const shouldPlayArrival = isArriving && !shouldReduceMotion;
	const shouldRevealAvatar = shouldPlayArrival && hasAvatar;
	const [arrivalExiting, setArrivalExiting] = useState(false);
	const [arrivalReveal, setArrivalReveal] = useState(false);
	const onArrivalCompleteRef = useRef(onArrivalComplete);

	useEffect(() => {
		onArrivalCompleteRef.current = onArrivalComplete;
	}, [onArrivalComplete]);

	useEffect(() => {
		if (!shouldRevealAvatar) {
			setArrivalExiting(false);
			setArrivalReveal(false);
			return;
		}

		let hideTimer = 0;
		let doneTimer = 0;
		const showFrame = window.requestAnimationFrame(() => {
			setArrivalExiting(false);
			setArrivalReveal(true);
			hideTimer = window.setTimeout(() => {
				setArrivalReveal(false);
				setArrivalExiting(true);
			}, AGENT_SESSION_USER_NOTCH_ARRIVAL_HIDE_MS);
			doneTimer = window.setTimeout(() => {
				setArrivalExiting(false);
				onArrivalCompleteRef.current?.();
			}, AGENT_SESSION_USER_NOTCH_ARRIVAL_COMPLETE_MS);
		});

		return () => {
			window.cancelAnimationFrame(showFrame);
			window.clearTimeout(hideTimer);
			window.clearTimeout(doneTimer);
		};
	}, [shouldRevealAvatar]);

	return {
		arrivalExiting,
		arrivalReveal,
		shouldPlayScaleArrival: shouldPlayArrival && !hasAvatar,
	};
}
