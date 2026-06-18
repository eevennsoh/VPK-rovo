"use client";

import { useCallback, useEffect, useState, type RefObject } from "react";

import {
	AGENT_ONBOARDING_TOUR_STEPS,
	type AgentOnboardingAnchorKey,
	type AgentOnboardingTourStep,
} from "../data/agent-onboarding-tour";

// ~3s at 60fps. Anchors mount after the create turn completes, the right panel
// opens, and the test view hydrates; dev/HMR can easily take more than 0.5s.
const MAX_RESOLVE_FRAMES = 180;

type AnchorContainer = "right" | "center";

// Each step resolves its live anchor from a stable selector scoped to one of the
// two panel containers — ChatPanel/AgentResultCard are shared, so an unscoped
// document query could match the wrong surface.
const ANCHOR_SELECTORS: Record<AgentOnboardingAnchorKey, { container: AnchorContainer; selector: string }> = {
	"agent-result-card": { container: "right", selector: '[data-testid="rovo-agent-result-card"]' },
	"ask-rovo-composer": { container: "right", selector: ".chat-composer-surface" },
	"chat-starters": { container: "center", selector: '[data-spotlight-anchor="chat-starters"]' },
	"activate-button": { container: "center", selector: '[data-testid="agent-config-publish"]' },
};

export interface UseAgentOnboardingTourOptions<
	R extends HTMLElement = HTMLElement,
	C extends HTMLElement = HTMLElement,
> {
	/** Container around the right-side "Ask Rovo" ChatPanel. */
	rightPanelRef: RefObject<R | null>;
	/** Container around the center agent config/test panel. */
	centerRef: RefObject<C | null>;
}

export interface AgentOnboardingTourController {
	isActive: boolean;
	stepIndex: number;
	step: AgentOnboardingTourStep | null;
	total: number;
	isFirst: boolean;
	isLast: boolean;
	anchorElement: HTMLElement | null;
	start: () => void;
	next: () => void;
	back: () => void;
	dismiss: () => void;
}

export function useAgentOnboardingTour<R extends HTMLElement, C extends HTMLElement>({
	rightPanelRef,
	centerRef,
}: Readonly<UseAgentOnboardingTourOptions<R, C>>): AgentOnboardingTourController {
	const total = AGENT_ONBOARDING_TOUR_STEPS.length;
	const [isActive, setIsActive] = useState(false);
	const [stepIndex, setStepIndex] = useState(0);
	const [anchorElement, setAnchorElement] = useState<HTMLElement | null>(null);

	const start = useCallback(() => {
		setStepIndex(0);
		setIsActive(true);
	}, []);
	const dismiss = useCallback(() => {
		setIsActive(false);
	}, []);
	const next = useCallback(() => {
		setStepIndex((prev) => Math.min(total - 1, prev + 1));
	}, [total]);
	const back = useCallback(() => {
		setStepIndex((prev) => Math.max(0, prev - 1));
	}, []);

	// Resolve the active step's anchor element, retrying across frames while it
	// mounts. If it never appears, skip to the next step or end the tour.
	useEffect(() => {
		if (!isActive) {
			setAnchorElement(null);
			return;
		}

		const step = AGENT_ONBOARDING_TOUR_STEPS[stepIndex];
		if (!step) {
			return;
		}

		setAnchorElement(null);

		const { container, selector } = ANCHOR_SELECTORS[step.anchorKey];
		let frame = 0;
		let rafId = 0;
		let cancelled = false;

		const resolve = () => {
			if (cancelled) {
				return;
			}

			const root = container === "right" ? rightPanelRef.current : centerRef.current;
			const element = root?.querySelector<HTMLElement>(selector) ?? null;
			if (element) {
				element.scrollIntoView({ block: "center", inline: "nearest" });
				setAnchorElement(element);
				return;
			}

			frame += 1;
			if (frame >= MAX_RESOLVE_FRAMES) {
				setAnchorElement(null);
				setStepIndex((prev) => {
					if (prev >= total - 1) {
						setIsActive(false);
						return prev;
					}
					return prev + 1;
				});
				return;
			}

			rafId = requestAnimationFrame(resolve);
		};

		rafId = requestAnimationFrame(resolve);
		return () => {
			cancelled = true;
			cancelAnimationFrame(rafId);
		};
	}, [isActive, stepIndex, total, rightPanelRef, centerRef]);

	const step = isActive ? AGENT_ONBOARDING_TOUR_STEPS[stepIndex] ?? null : null;

	return {
		isActive,
		stepIndex,
		step,
		total,
		isFirst: stepIndex === 0,
		isLast: stepIndex === total - 1,
		anchorElement,
		start,
		next,
		back,
		dismiss,
	};
}
