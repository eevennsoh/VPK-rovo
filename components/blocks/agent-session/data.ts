import type { AgentListAgent } from "@/components/blocks/agent-list";

import type { AgentSessionItem } from "./agent-session-types";

const CLAUDE_AGENT = {
	brandName: "claude",
	id: "claude",
	kind: "agent",
	name: "Claude",
} as const satisfies AgentListAgent;

/**
 * Local Claude sessions for the catalog demo. Pulse maps the same shape from
 * its loose-work fixtures; this list is the block's own sample data.
 */
export const AGENT_SESSION_ITEMS: readonly AgentSessionItem[] = [
	{
		id: "lw-scope-thread",
		title: "The adapter keep-or-delete argument still lives in a local Claude session",
		state: "complete",
		agent: CLAUDE_AGENT,
		host: "local",
		machineName: "Venn’s MacBook",
		timeLabel: "3 mins ago",
		sessionDetails: {
			host: "local",
			issueKey: "PAY-101",
			issueSummary: "The adapter keep-or-delete argument still lives in a local Claude session",
			worktreePath: ".worktrees/pay-101-adapter",
		},
	},
	{
		id: "lw-kickoff-killswitch-session",
		title: "Kill switch as a prerequisite still lives in a local Claude session",
		state: "complete",
		agent: CLAUDE_AGENT,
		host: "local",
		machineName: "Venn’s MacBook",
		timeLabel: "3 mins ago",
		sessionDetails: {
			host: "local",
			issueKey: "PAY-121",
			issueSummary: "Kill switch as a prerequisite still lives in a local Claude session",
			worktreePath: ".worktrees/pay-121-kill-switch",
		},
	},
];
