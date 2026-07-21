import type { ChatScript } from "./types";

export const CHAT_SCRIPT: ChatScript = {
	agentName: "Jira Coding Agent",
	intro: "Let me take a look at your work item and figure out what changes I need to make",
	thinkingLabel: "Thinking",
	thinkingCount: 4,
	thinkingSteps: [
		"Reviewing the work item and acceptance criteria",
		"Inspecting the profile and upload components",
		"Updating validation and data-fetching behavior",
		"Running the relevant checks",
	],
	summaryMarkdown:
		"I changed 3 files based on the information in your work item to create a dialog that lets users edit their profile name and upload a new profile picture. Refactored data-fetching logic, deferring non-critical API calls, and enabling async rendering. Reduced render-blocking scripts to improve load time and hydration performance.\n\nThis passes all [acceptance criteria](https://vitafleet.atlassian.net/browse/TWC-109) from your work item and all tests are passing",
	ctaLabel: "Create pull request",
	composerPlaceholder: "Ask, @mention, or / for actions",
	footerNote: "Uses AI. Verify results.",
};
