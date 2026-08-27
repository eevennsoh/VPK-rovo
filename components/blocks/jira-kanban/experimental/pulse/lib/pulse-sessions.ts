import type { AgentListItem } from "@/components/blocks/agent-list";

import { isPulseAgentSession, type PulseLooseWork, type PulseMember } from "../types";

/**
 * Boundary between a Pulse local coding session and the shared agent-list row.
 *
 * Uncaptured GitHub work stays a dashed card with a Link to work item chin. A
 * Claude session uses the same card chrome through AgentList `variant="uncaptured"`:
 * the shared row (identity, static stamp, viewer machine) sits in the sunken
 * body, and the issue key becomes the chin's Link to work item suggestion. The
 * worktree stays on the flyout payload. Keeping the mapping pure and here means
 * the rail stays a renderer and the fixture never learns the row model.
 */

const WORKTREE_PATTERN = /worktree (\S+)/u;

/** Viewer machine for Pulse local sessions. Venn is the Insights persona. */
const PULSE_LOCAL_MACHINE_NAME = "Venn’s MacBook";

/**
 * Static stamp matching the Agent List local-session row. Local rows must not
 * tick, and they must not reuse the host word "Local" as a timestamp.
 */
const PULSE_LOCAL_TIME_LABEL = "3 mins ago";

/** Worktree path from a session detail line, when the fixture named one. */
export function toPulseSessionWorktree(detail: string): string | undefined {
	return WORKTREE_PATTERN.exec(detail)?.[1];
}

/**
 * Maps one window's loose work onto agent-list rows for the local sessions.
 *
 * GitHub artifacts are skipped. A session whose members are all unknown to the
 * roster still renders: the row leads with Claude, not a teammate, so a missing
 * invoker is omission rather than a faceless row.
 */
export function toPulseSessionItems(
	looseWork: readonly PulseLooseWork[],
	members: readonly PulseMember[],
): readonly AgentListItem[] {
	const byId = new Map(members.map((member) => [member.id, member]));

	return looseWork.flatMap((item) => {
		if (!isPulseAgentSession(item)) {
			return [];
		}

		const invoker = item.memberIds
			.map((id) => byId.get(id))
			.find((member) => member !== undefined && member.kind === "human");
		const worktree = toPulseSessionWorktree(item.detail);

		return [{
			agent: {
				brandName: "claude",
				id: "claude",
				kind: "agent",
				name: "Claude",
			},
			host: "local",
			id: item.id,
			invokedBy: invoker === undefined
				? undefined
				: {
					avatarSrc: invoker.avatarSrc,
					name: invoker.name,
				},
			machineName: PULSE_LOCAL_MACHINE_NAME,
			sessionDetails: {
				host: "local",
				issueKey: item.sourceTitle,
				issueSummary: item.title,
				worktreePath: worktree,
			},
			state: "complete",
			timeLabel: PULSE_LOCAL_TIME_LABEL,
			title: item.title,
		} satisfies AgentListItem];
	});
}
