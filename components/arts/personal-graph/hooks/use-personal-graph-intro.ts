"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";

import {
	getPersonalGraphIntroPhaseAt,
	PERSONAL_GRAPH_INTRO_TIMELINE,
	type PersonalGraphIntroPhase,
} from "./intro-phase";

interface UsePersonalGraphIntroResult {
	phase: PersonalGraphIntroPhase;
	isReducedMotion: boolean;
}

function scheduleIntroTimeline(onPhase: (phase: PersonalGraphIntroPhase) => void): () => void {
	const timeouts = PERSONAL_GRAPH_INTRO_TIMELINE.flatMap((step) => {
		if (step.at === 0) {
			onPhase(step.phase);
			return [];
		}
		return [setTimeout(() => onPhase(step.phase), step.at)];
	});

	return () => {
		for (const timeout of timeouts) {
			clearTimeout(timeout);
		}
	};
}

export function usePersonalGraphIntro(replayKey = 0): UsePersonalGraphIntroResult {
	const prefersReducedMotion = useReducedMotion() ?? false;
	const [phase, setPhase] = useState<PersonalGraphIntroPhase>("title");

	useEffect(() => {
		if (prefersReducedMotion) {
			setPhase(getPersonalGraphIntroPhaseAt(0, prefersReducedMotion));
			return;
		}

		return scheduleIntroTimeline(setPhase);
	}, [prefersReducedMotion, replayKey]);

	return { phase, isReducedMotion: prefersReducedMotion };
}
