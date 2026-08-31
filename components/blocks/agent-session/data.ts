import { getRovoAgentProfile } from "@/app/data/directory/agents";
import type { AgentListAgent } from "@/components/blocks/agent-list";

import type { AgentSessionItem } from "./agent-session-types";

const CLAUDE_AGENT = {
	brandName: "claude",
	id: "claude",
	kind: "agent",
	name: "Claude",
} as const satisfies AgentListAgent;

const CURSOR_AGENT = {
	brandName: "cursor",
	id: "cursor",
	kind: "agent",
	name: "Cursor",
} as const satisfies AgentListAgent;

function createRovoAgent(): AgentListAgent {
	const profile = getRovoAgentProfile("rovo-dev");
	return {
		id: profile.id,
		kind: "agent",
		name: "Rovo",
		vpkLogo: "rovo",
	};
}

/**
 * Local coding sessions for the catalog demo. Pulse maps the same shape from
 * its loose-work fixtures; this list is the block's own sample data.
 */
export const AGENT_SESSION_ITEMS: readonly AgentSessionItem[] = [
	{
		id: "lw-scope-thread",
		title: "The adapter keep-or-delete argument still lives in a local Claude session",
		state: "complete",
		agent: CLAUDE_AGENT,
		host: "local",
		invokedBy: {
			avatarSrc: "/avatar-user/andrew-park/color/asow-dev-lime.png",
			name: "person A",
		},
		machineName: "Priya’s MacBook",
		timeLabel: "Last week",
		sessionDetails: {
			host: "local",
			issueKey: "PAY-101",
			issueStatus: "Done",
			issueSummary: "The adapter keep-or-delete argument still lives in a local Claude session",
			worktreePath: ".worktrees/pay-101-adapter",
		},
	},
	{
		id: "lw-kickoff-killswitch-session",
		title: "Kill switch as a prerequisite still lives in a local Cursor session",
		state: "complete",
		agent: CURSOR_AGENT,
		host: "local",
		invokedBy: {
			avatarSrc: "/avatar-user/andrew-park/color/asow-dev-lime.png",
			name: "person A",
		},
		machineName: "Work Laptop",
		timeLabel: "18 mins ago",
		sessionDetails: {
			host: "local",
			issueKey: "PAY-121",
			issueStatus: "In review",
			issueSummary: "Kill switch as a prerequisite still lives in a local Cursor session",
			worktreePath: ".worktrees/pay-121-kill-switch",
		},
	},
	{
		id: "lw-night-suite-session",
		title: "Overnight contract-suite session never captured on PAY-113",
		state: "complete",
		agent: createRovoAgent(),
		host: "local",
		invokedBy: {
			avatarSrc: "/avatar-user/andrew-park/color/asow-dev-lime.png",
			name: "person A",
		},
		machineName: "MBP-M4-MAX",
		timeLabel: "Yesterday",
		sessionDetails: {
			host: "local",
			issueKey: "PAY-113",
			issueStatus: "Done",
			issueSummary: "Overnight contract-suite session never captured on PAY-113",
			worktreePath: ".worktrees/pay-113-contract-suite",
		},
	},
];

/**
 * Candidate work items per session, keyed by session id.
 *
 * A session rarely maps to exactly one work item — the same local thread often
 * touches the ticket it started from plus the neighbours it turned out to
 * affect. The untracked-work flyout offers the first key.
 */
export const AGENT_SESSION_MULTI_LINK_KEYS: Readonly<Record<string, readonly string[]>> = {
	"lw-scope-thread": ["PAY-101", "PAY-121", "PAY-104"],
	"lw-kickoff-killswitch-session": ["PAY-121", "PAY-101"],
	"lw-night-suite-session": ["PAY-113", "PAY-105"],
};
