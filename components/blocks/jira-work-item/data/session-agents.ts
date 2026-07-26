/**
 * Agent roster for the experimental Jira Work Item block.
 *
 * Derived from the shared Jira board agents so the launcher/selector and the
 * sessions rail draw from one source of truth. This module has runtime imports
 * (unlike the pure `session-state.ts`), so it is UI-only and never imported by
 * the node-tested model.
 */

import type { AgentSelectorAgent } from "@/components/blocks/agent-selector";
import { BOARD_AGENTS } from "@/components/projects/jira/data/board-agents";

/** The selectable agent roster (structurally an `AgentSelectorAgent[]`). */
export const JIRA_WORK_ITEM_ROSTER: readonly AgentSelectorAgent[] = BOARD_AGENTS;

export function getJiraWorkItemRosterAgent(agentId: string): AgentSelectorAgent | undefined {
	return JIRA_WORK_ITEM_ROSTER.find((agent) => agent.id === agentId);
}
