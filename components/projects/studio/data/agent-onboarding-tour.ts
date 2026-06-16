// Step content for the studio "agent just created" onboarding tour. Each step
// anchors a Spotlight card to an existing element on the testing screen (the
// tour does not render those elements — see use-agent-onboarding-tour).

import type { SpotlightPlacement } from "@/components/blocks/spotlight";

/** Where a step resolves its live anchor element from, and in which panel. */
export type AgentOnboardingAnchorKey =
	| "agent-result-card"
	| "ask-rovo-composer"
	| "chat-starters"
	| "activate-button";

export interface AgentOnboardingTourStep {
	/** Stable id for the step. */
	key: AgentOnboardingAnchorKey;
	/** Which on-screen element this step points at. */
	anchorKey: AgentOnboardingAnchorKey;
	headline: string;
	body: string;
	/** ADS-style placement of the card relative to the anchor. */
	placement: SpotlightPlacement;
}

export const AGENT_ONBOARDING_TOUR_STEPS: ReadonlyArray<AgentOnboardingTourStep> = [
	{
		key: "agent-result-card",
		anchorKey: "agent-result-card",
		headline: "Your new agent",
		body: "This is the agent you just created. Open it any time to chat, tweak, or share it.",
		placement: "left-start",
	},
	{
		key: "ask-rovo-composer",
		anchorKey: "ask-rovo-composer",
		headline: "Refine by just prompting",
		body: "Keep chatting here to adjust instructions, tools, and triggers — no forms required.",
		placement: "top-end",
	},
	{
		key: "chat-starters",
		anchorKey: "chat-starters",
		headline: "Test it right away",
		body: "Try a starter prompt to see how your agent responds before you ship it.",
		placement: "right-start",
	},
	{
		key: "activate-button",
		anchorKey: "activate-button",
		headline: "Activate when you're happy",
		body: "Publish the agent so your team can run it from chat, the sidebar, or automations.",
		placement: "bottom-end",
	},
];
