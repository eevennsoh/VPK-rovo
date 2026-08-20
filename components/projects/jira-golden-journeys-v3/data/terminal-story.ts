import type { TerminalBeat } from "@/components/projects/jira-golden-journeys-v1/lib/terminal-demo-state";
import type { TerminalStoryDefinition } from "@/components/projects/jira-golden-journeys-v1/lib/terminal-story-definition";

const JIRA_GOLDEN_JOURNEYS_V3_BASE_URL = "https://jira-golden-journeys-v3.atlassian.net";

export function getJiraGoldenJourneysV3IssueUrl(issueKey: string): string {
	return `${JIRA_GOLDEN_JOURNEYS_V3_BASE_URL}/browse/${encodeURIComponent(issueKey)}`;
}

export const JIRA_GOLDEN_JOURNEYS_V3_TERMINAL_BEATS: readonly TerminalBeat[] = [
	{
		id: "implement",
		trigger: "click",
		hint: "→ next: run the local checks",
		steps: [
			{
				kind: "type",
				pane: "right",
				text: "Implement SHOP-4821 guest checkout. Preserve the existing checkout safeguards and add focused regression coverage.",
			},
			{ kind: "submit", pane: "right" },
			{ kind: "set-working", pane: "right", working: true },
			{
				kind: "output",
				pane: "right",
				lines: [
					[{ text: "⏺ Atlassian · ", tone: "brand" }, { text: "read SHOP-4821 acceptance criteria" }],
					[{ text: "⏺ Read · ", tone: "brand" }, { text: "checkout session, address, payment, and order submission owners" }],
					[{ text: "⏺ Search · ", tone: "brand" }, { text: "guest eligibility and duplicate-order safeguards" }],
					[{ text: "⏺ Git · ", tone: "brand" }, { text: "created feature/shop-4821-guest-checkout" }],
					[{ text: "⏺ Edit · ", tone: "brand" }, { text: "added the guest checkout path without changing signed-in checkout" }],
					[{ text: "⏺ Edit · ", tone: "brand" }, { text: "kept delivery and payment details after recoverable errors" }],
					[{ text: "⏺ Test · ", tone: "brand" }, { text: "covered desktop, mobile, retry, and duplicate-order behavior" }],
				],
			},
		],
	},
	{
		id: "local-checks",
		trigger: "key",
		hint: "→ next: create PR #1847 from this session",
		steps: [
			{ kind: "type", pane: "right", text: "Run the focused tests, lint, and typecheck." },
			{ kind: "submit", pane: "right" },
			{
				kind: "output",
				pane: "right",
				lines: [
					[{ text: "⏺ Bash · ", tone: "brand" }, { text: "pnpm test checkout · 48 passed" }],
					[{ text: "⏺ Bash · ", tone: "brand" }, { text: "pnpm run lint · passed" }],
					[{ text: "⏺ Bash · ", tone: "brand" }, { text: "pnpm run typecheck · passed" }],
					[{ text: "✓ ", tone: "success" }, { text: "Local checks are green · ready for a pull request" }],
				],
			},
		],
	},
	{
		id: "create-pull-request",
		trigger: "key",
		hint: "→ next: confirm CI has started",
		steps: [
			{
				kind: "type",
				pane: "right",
				text: "Create the pull request, request Priya Narayanan and Jordan Lee, then monitor CI.",
			},
			{ kind: "submit", pane: "right" },
			{
				kind: "output",
				pane: "right",
				lines: [
					[{ text: "⏺ Git · ", tone: "brand" }, { text: "committed feat(checkout): add guest checkout" }],
					[{ text: "⏺ Git · ", tone: "brand" }, { text: "pushed feature/shop-4821-guest-checkout" }],
					[{ text: "⏺ GitHub · ", tone: "brand" }, { text: "opened PR #1847 · Add guest checkout to the storefront" }],
					[{ text: "  ⎿ Reviewers · ", tone: "dim" }, { text: "Priya Narayanan and Jordan Lee requested" }],
				],
			},
		],
	},
	{
		id: "ci-started",
		trigger: "key",
		hint: "PR #1847 created · select Build above",
		steps: [
			{
				kind: "output",
				pane: "right",
				lines: [
					[{ text: "⏺ GitHub · ", tone: "brand" }, { text: "CI started for PR #1847" }],
					[{ text: "  ⎿ ", tone: "dim" }, { text: "Unit tests, browser tests, lint, and typecheck are running" }],
					[{ text: "✓ ", tone: "success" }, { text: "PR linked to SHOP-4821 in Jira" }],
				],
			},
			{ kind: "set-working", pane: "right", working: false },
		],
	},
];

export const JIRA_GOLDEN_JOURNEYS_V3_TERMINAL_STEP_COUNT =
	JIRA_GOLDEN_JOURNEYS_V3_TERMINAL_BEATS.length + 1;

export const JIRA_GOLDEN_JOURNEYS_V3_TERMINAL_STORY = {
	beats: JIRA_GOLDEN_JOURNEYS_V3_TERMINAL_BEATS,
	layout: "claude-only",
	initialHint: "click the terminal to start Claude on SHOP-4821",
	finishedHint: "PR #1847 created · select Build above",
	getIssueUrl: getJiraGoldenJourneysV3IssueUrl,
	frameAriaLabel: "Start Claude working on SHOP-4821",
	dashboard: {
		title: "Jira work item",
		workspace: "Jira Golden Journeys v3 · SHOP-4821",
		footerHints: "↑↓ to browse · enter to inspect in Jira",
		shellPrompt: "~/dev/storefront $",
	},
	claude: {
		cwd: "~/dev/storefront",
	},
	statusBar: {
		sessionName: "jira-golden-journeys-v3",
		singleWindowLabel: "0:claude*",
		splitWindowLabel: "0:jira 1:claude*",
		clock: "10:48",
	},
} as const satisfies TerminalStoryDefinition;
