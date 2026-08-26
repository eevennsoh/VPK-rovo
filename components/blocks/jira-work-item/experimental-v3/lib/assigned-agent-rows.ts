/**
 * Pure row model for the Details rail "assigned agents" menu.
 *
 * Turns the crew roster plus live session state into one row per assigned
 * agent. Status resolution is delegated to `agent-row-status` so the menu row,
 * the trigger avatar tooltip, and the byline can never disagree.
 */

import type { CrewMember } from "@/components/blocks/jira-work-item/data/metadata-crew";
import type { AgentSession, StaticTimelineEvent } from "@/components/blocks/jira-work-item/data/session-state";
import type { ThirdPartyLogoName } from "@/components/ui/data/logo-third-party-data";
import { agentRowStatusTooltip, type AgentRowStatusTooltip } from "./agent-row-status";

export interface AssignedAgentRow {
	agentId: string;
	name: string;
	avatarSrc?: string;
	brandName?: ThirdPartyLogoName;
	/** Last session in `sessions` matching the agent; absent when the agent never ran. */
	session?: AgentSession;
	statusLabel: AgentRowStatusTooltip;
}

/** Later sessions win, matching `resolveAgentRowSessionStatus`. */
function resolveLatestSession(
	sessions: readonly AgentSession[],
	agentId: string,
): AgentSession | undefined {
	let latest: AgentSession | undefined;
	for (const session of sessions) {
		if (session.agentId === agentId) {
			latest = session;
		}
	}
	return latest;
}

export function resolveAssignedAgentRows(
	members: readonly CrewMember[],
	sessions: readonly AgentSession[],
	staticEvents: readonly StaticTimelineEvent[] = [],
): AssignedAgentRow[] {
	const rows: AssignedAgentRow[] = [];
	for (const member of members) {
		if (member.kind !== "agent") {
			continue;
		}
		const session = resolveLatestSession(sessions, member.id);
		rows.push({
			agentId: member.id,
			name: member.name,
			...(member.avatarUrl ? { avatarSrc: member.avatarUrl } : {}),
			...(member.brandName ? { brandName: member.brandName } : {}),
			...(session ? { session } : {}),
			statusLabel: agentRowStatusTooltip(sessions, member.id, staticEvents),
		});
	}
	return rows;
}
