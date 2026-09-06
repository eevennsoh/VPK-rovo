import type { PulseLooseWork } from "@/components/blocks/jira-kanban/experimental/pulse/types";

type JiraGoldenJourneysV4SyncSession = Extract<PulseLooseWork, { kind: "agent-session" }>;

const SYNC_DELAY_MIN_MS = 4_000;
const SYNC_DELAY_MAX_MS = 8_000;

export const JIRA_GOLDEN_JOURNEYS_V4_SYNC_SESSIONS = [
	{
		agentId: "cursor",
		detail: "host local · worktree .worktrees/pay-107-webhook-gap · findings have not been linked yet",
		host: "local",
		id: "lw-sync-webhook-gap",
		kind: "agent-session",
		machineName: "MacBook-Pro.local",
		memberIds: ["maya", "venn"],
		shortTitle: "Challenge webhook gap",
		sourceTitle: "PAY-107",
		timeLabel: "just now",
		title: "Challenge webhook gap notes just landed from a local Cursor session",
	},
	{
		agentId: "codex",
		detail: "host local · worktree .worktrees/pay-112-sandbox-401 · the root cause is still untracked",
		host: "local",
		id: "lw-sync-sandbox-root-cause",
		kind: "agent-session",
		machineName: "H13XSGKLS1",
		memberIds: ["jordan", "venn"],
		shortTitle: "Sandbox 401 root cause",
		sourceTitle: "PAY-112",
		timeLabel: "just now",
		title: "Sandbox 401 root cause just arrived from a local Codex session",
	},
	{
		agentId: "rovo",
		detail: "host local · worktree .worktrees/pay-118-replay-risk · the blast radius is not on the item",
		host: "local",
		id: "lw-sync-replay-blast-radius",
		kind: "agent-session",
		machineName: "DESKTOP-7K2M9Q1",
		memberIds: ["priya", "jordan"],
		shortTitle: "Replay-risk blast radius",
		sourceTitle: "PAY-118",
		timeLabel: "just now",
		title: "Replay-risk blast radius just synced from a local Rovo session",
	},
	{
		agentId: "claude",
		detail: "host local · worktree .worktrees/pay-121-kill-switch · rollout notes still need a work item link",
		host: "local",
		id: "lw-sync-kill-switch-rollout",
		kind: "agent-session",
		machineName: "Venn’s MacBook",
		memberIds: ["venn", "jordan"],
		shortTitle: "Kill switch rollout notes",
		sourceTitle: "PAY-121",
		timeLabel: "just now",
		title: "Kill switch rollout notes just appeared from a local Claude session",
	},
	{
		agentId: "codex",
		detail: "host local · worktree .worktrees/pay-115-retry-telemetry · the verification summary is still local",
		host: "local",
		id: "lw-sync-retry-telemetry",
		kind: "agent-session",
		machineName: "Maya’s Studio",
		memberIds: ["maya", "priya"],
		shortTitle: "Retry telemetry review",
		sourceTitle: "PAY-115",
		timeLabel: "just now",
		title: "Retry telemetry review just synced from a local Codex session",
	},
	{
		agentId: "cursor",
		detail: "host local · worktree .worktrees/pay-119-contract-tests · uncovered cases have not been captured",
		host: "local",
		id: "lw-sync-contract-test-gaps",
		kind: "agent-session",
		machineName: "MacBook-Pro.local",
		memberIds: ["jordan", "maya"],
		shortTitle: "Contract test gaps",
		sourceTitle: "PAY-119",
		timeLabel: "just now",
		title: "Contract test gaps just landed from a local Cursor session",
	},
	{
		agentId: "rovo",
		detail: "host local · worktree .worktrees/pay-104-deprecation-copy · the migration copy is still untracked",
		host: "local",
		id: "lw-sync-deprecation-copy",
		kind: "agent-session",
		machineName: "DESKTOP-7K2M9Q1",
		memberIds: ["priya", "venn"],
		shortTitle: "Deprecation copy pass",
		sourceTitle: "PAY-104",
		timeLabel: "just now",
		title: "Deprecation copy pass just arrived from a local Rovo session",
	},
	{
		agentId: "claude",
		detail: "host local · worktree .worktrees/pay-132-release-gate · the final gate decision is not linked",
		host: "local",
		id: "lw-sync-release-gate",
		kind: "agent-session",
		machineName: "Venn’s MacBook",
		memberIds: ["venn", "priya"],
		shortTitle: "Release gate decision",
		sourceTitle: "PAY-132",
		timeLabel: "just now",
		title: "Release gate decision just synced from a local Claude session",
	},
] as const satisfies readonly JiraGoldenJourneysV4SyncSession[];

export function getJiraGoldenJourneysV4SyncDelayMs(
	random: () => number = Math.random,
): number {
	return SYNC_DELAY_MIN_MS + Math.round(random() * (SYNC_DELAY_MAX_MS - SYNC_DELAY_MIN_MS));
}

export function takeJiraGoldenJourneysV4SyncBatch(
	nextIndex: number,
	random: () => number = Math.random,
): Readonly<{
	nextIndex: number;
	sessions: readonly JiraGoldenJourneysV4SyncSession[];
}> {
	const batchSize = random() < 0.5 ? 1 : 2;
	const sessions = JIRA_GOLDEN_JOURNEYS_V4_SYNC_SESSIONS.slice(
		nextIndex,
		nextIndex + batchSize,
	);

	return {
		nextIndex: nextIndex + sessions.length,
		sessions,
	};
}
