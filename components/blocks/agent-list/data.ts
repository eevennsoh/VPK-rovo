import { getRovoAgentProfile } from "@/app/data/directory/agents";

import type {
	AgentListAgent,
	AgentListItem,
} from "./agent-list-types";

function createSessionAgent(agentId: string): AgentListAgent {
	const profile = getRovoAgentProfile(agentId);
	return {
		avatarSrc: profile.avatarSrc,
		brandName: profile.brandName,
		id: profile.id,
		name: profile.name,
	};
}

const DEMO_INVOKER = {
	name: "Jordan Lee",
	avatarSrc: "/avatar-user/andrew-park/color/asow-dev-lime.png",
} as const;

const DEMO_REPOSITORY = "acme-corp/vitafleet-platform";

export const AGENT_LIST_ITEMS: readonly AgentListItem[] = [
	{
		id: "performance-benchmarking",
		title: "Conduct performance benchmarking",
		state: "running",
		agent: createSessionAgent("progress-tracker"),
		branch: "rovo/perf-27-benchmarks",
		invokedBy: DEMO_INVOKER,
		elapsedSeconds: 360,
		prStatus: "created",
		sessionDetails: {
			additions: 412,
			assignee: {
				name: "Priya Hansra",
				src: "/avatar-user/priya-hansra/color/asow-service-yellow.png",
			},
			checks: "9 checks passing",
			deletions: 63,
			host: "cloud",
			priority: "high",
			pullRequestNumber: 284,
			pullRequestTitle: "PERF-27 Add fleet telemetry benchmark harness",
			repository: DEMO_REPOSITORY,
		},
	},
	{
		id: "vitafleet-presentation",
		title: "Create presentation on Vitafleet vision",
		state: "needs-input",
		agent: createSessionAgent("readiness-checker"),
		branch: "rovo/vita-142-vision-deck",
		host: "local",
		machineName: "Geoff’s MacBook",
		timeLabel: "3 mins ago",
		invokedBy: DEMO_INVOKER,
		elapsedSeconds: 482,
		sessionDetails: {
			assignee: {
				name: "Darius Pavri",
				src: "/avatar-user/darius-pavri/color/asow-strategy-orange.png",
			},
			host: "local",
			priority: "medium",
			repository: DEMO_REPOSITORY,
			worktreePath: "~/src/vitafleet-platform/.worktrees/vita-142",
		},
	},
	{
		id: "refactor-readability",
		title: "Refactor code for better readability",
		state: "complete",
		agent: createSessionAgent("code-planner"),
		branch: "rovo/web-461-readability",
		summary:
			"Extracted shared helpers from the checkout path, renamed locals to match the steps they describe, and removed nested conditionals that made the happy path hard to scan.",
		invokedBy: DEMO_INVOKER,
		elapsedSeconds: 754,
		completedSecondsAgo: 68 * 60,
		prStatus: "merged",
		sessionDetails: {
			additions: 186,
			assignee: {
				name: "Olivia Yang",
				src: "/avatar-user/olivia-yang/color/asow-service-yellow.png",
			},
			checks: "6 checks passing",
			deletions: 241,
			host: "cloud",
			priority: "low",
			pullRequestNumber: 271,
			pullRequestTitle: "WEB-461 Extract shared readability helpers",
			repository: DEMO_REPOSITORY,
		},
	},
];

const CLAUDE_AGENT = {
	brandName: "claude",
	id: "claude",
	kind: "agent",
	name: "Claude",
} as const satisfies AgentListAgent;

/**
 * Local Claude sessions for the uncaptured catalog. Pulse maps the same
 * shape from loose-work fixtures; this list is the block's own demo data.
 */
export const AGENT_LIST_UNCAPTURED_ITEMS: readonly AgentListItem[] = [
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
