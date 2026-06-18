// Step content for the studio "agent just created" onboarding tour. Each step
// anchors the Rovo Cursor overlay to an existing element on the testing screen
// (the tour does not render those elements; see use-agent-onboarding-tour).

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
}

export const AGENT_ONBOARDING_TOUR_STEPS: ReadonlyArray<AgentOnboardingTourStep> = [
	{
		key: "agent-result-card",
		anchorKey: "agent-result-card",
		headline: "Your new agent",
		body: "Your agent is ready. Open it here any time to chat, refine, or share.",
	},
	{
		key: "ask-rovo-composer",
		anchorKey: "ask-rovo-composer",
		headline: "Refine by just prompting",
		body: "Keep talking to me here. I can update instructions, tools, and triggers.",
	},
	{
		key: "chat-starters",
		anchorKey: "chat-starters",
		headline: "Test it right away",
		body: "Try a starter prompt to see how teammates will experience this agent.",
	},
	{
		key: "activate-button",
		anchorKey: "activate-button",
		headline: "Activate when you're happy",
		body: "Activate it when it is ready for chat, sidebar, and automations.",
	},
];
