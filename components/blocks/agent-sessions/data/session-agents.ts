/**
 * Agent roster for the experimental Agent Sessions block.
 *
 * Derived from the shared Jira board agents so the launcher/selector and the
 * sessions rail draw from one source of truth. This module has runtime imports
 * (unlike the pure `session-state.ts`), so it is UI-only and never imported by
 * the node-tested model.
 */

import type { AgentSelectorAgent } from "@/components/blocks/agent-selector";
import { BOARD_AGENTS } from "@/components/projects/jira/data/board-agents";

/** The selectable agent roster (structurally an `AgentSelectorAgent[]`). */
export const AGENT_SESSIONS_ROSTER: readonly AgentSelectorAgent[] = BOARD_AGENTS;

export function getAgentSessionsRosterAgent(agentId: string): AgentSelectorAgent | undefined {
	return AGENT_SESSIONS_ROSTER.find((agent) => agent.id === agentId);
}
