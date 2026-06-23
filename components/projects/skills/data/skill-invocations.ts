/**
 * Demo dataset for the Skills project.
 *
 * Each entry scripts one deterministic skill invocation shown in the Skills chat
 * (a fork-free reuse of the Sidebar Chat surface). Entries reference a real skill
 * from the shared catalog by `skillId` (see `DEFAULT_SKILLS` in
 * `@/app/data/directory/skills`) — the inline card resolves the skill's name,
 * glyph, and collection colour from that catalog at render time, so this file
 * stays free of React/JSX and the matcher in `../lib/skill-intercept` can be unit
 * tested through the esbuild harness without bundling the icon tree.
 *
 * Two trigger styles are demonstrated:
 * - **manual** — clicking a greeting conversation starter (exact `starterPrompt`).
 * - **auto** — typing a message that contains one of `triggerKeywords`.
 */

export interface SkillInvocationEntry {
	/** Real catalog skill id (matches an entry in `DEFAULT_SKILLS`). */
	skillId: string;
	/** Greeting conversation-starter label. */
	starterLabel: string;
	/** Greeting conversation-starter byline. */
	starterDescription: string;
	/** Prompt submitted by the starter; also the exact-match manual trigger. */
	starterPrompt: string;
	/** Whole-word keywords that auto-trigger this skill when typed. Lowercase. */
	triggerKeywords: readonly string[];
	/** One-line summary of the input the skill consumed. */
	inputSummary: string;
	/** One-line summary of the result the skill produced. */
	outputSummary: string;
	/** Assistant reply rendered beneath the invocation card. */
	replyText: string;
}

/**
 * Curated demo skills, ordered most-specific-first so keyword auto-triggering
 * resolves predictably (the first entry with a matching keyword wins).
 */
export const SKILL_INVOCATIONS: readonly SkillInvocationEntry[] = [
	{
		skillId: "review-pull-request",
		starterLabel: "Review a pull request",
		starterDescription: "Summarize a diff and leave review comments",
		starterPrompt: "Review a pull request",
		triggerKeywords: ["pull request", "pr review", "review pr", "diff"],
		inputSummary: "PR #312 (+248 / −76 across 9 files)",
		outputSummary: "5 comments left, 1 blocking",
		replyText:
			"I reviewed PR #312 and left 5 comments — one is blocking on missing test coverage for the new error path.",
	},
	{
		skillId: "create-work-items",
		starterLabel: "Create a Jira work item",
		starterDescription: "File a tracked work item from a report",
		starterPrompt: "Create a Jira work item",
		triggerKeywords: ["bug", "create ticket", "work item", "file a"],
		inputSummary: "Reported checkout defect details",
		outputSummary: "JIRA-482 created in Backlog",
		replyText:
			"I filed JIRA-482 in the Backlog and tagged it as a bug. Want me to assign it to the checkout squad?",
	},
	{
		skillId: "summarize-thread",
		starterLabel: "Summarize this thread",
		starterDescription: "Condense a long conversation into the key points",
		starterPrompt: "Summarize this thread",
		triggerKeywords: ["summarize", "summary", "recap", "tl;dr"],
		inputSummary: "Active Slack thread (18 messages)",
		outputSummary: "3-bullet summary with owners",
		replyText:
			"Here's a 3-bullet recap of the thread, with the two open decisions and who owns each.",
	},
	{
		skillId: "build-report",
		starterLabel: "Build a report",
		starterDescription: "Assemble metrics into a shareable report",
		starterPrompt: "Build a report",
		triggerKeywords: ["report", "dashboard", "metrics", "analytics"],
		inputSummary: "Sprint 24 delivery data",
		outputSummary: "Velocity + scope-change report",
		replyText:
			"I built a Sprint 24 report covering velocity, scope changes, and carryover. Open it on the canvas?",
	},
	{
		skillId: "schedule-meeting",
		starterLabel: "Schedule a meeting",
		starterDescription: "Find a slot and draft a calendar invite",
		starterPrompt: "Schedule a meeting",
		triggerKeywords: ["schedule", "meeting", "calendar", "book time"],
		inputSummary: "3 attendees, 30 min, this week",
		outputSummary: "Invite drafted for Thu 2:00pm",
		replyText:
			"I found a slot Thursday at 2:00pm and drafted the invite for all three attendees.",
	},
	{
		skillId: "confluence-page-drafter",
		starterLabel: "Draft a Confluence page",
		starterDescription: "Turn notes into a structured Confluence page",
		starterPrompt: "Draft a Confluence page",
		triggerKeywords: ["confluence page", "draft a page", "wiki page", "doc page"],
		inputSummary: "Project kickoff notes",
		outputSummary: "Draft page with headings + action items",
		replyText:
			"I drafted a Confluence page from your kickoff notes, with an overview, goals, and an action-items table. Want me to publish it to the Team space?",
	},
];
