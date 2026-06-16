// Sample content for the Spotlight block demos.

export interface SpotlightTourStep {
	headline: string;
	body: string;
}

export const SPOTLIGHT_TOUR_STEPS: ReadonlyArray<SpotlightTourStep> = [
	{
		headline: "Meet your Rovo agents",
		body: "Agents help you draft, summarize, and automate work across Atlassian. Let's take a quick tour.",
	},
	{
		headline: "Start from a template",
		body: "Pick a prebuilt template to skip setup, or build an agent from scratch with your own instructions.",
	},
	{
		headline: "Give it knowledge",
		body: "Connect spaces, projects, and docs so your agent answers with your team's context.",
	},
	{
		headline: "Share with your team",
		body: "Publish the agent so teammates can run it from chat, the sidebar, or automation triggers.",
	},
];

/** Light/dark illustration pair used by the "with media" example. */
export const SPOTLIGHT_MEDIA_SRC = "/illustration-ai/chat/light.svg";
