import type { AgentSessionItem } from "./agent-session-types";

/**
 * Default chin suggestion: the key the session already names in its details.
 *
 * Lives beside the card rather than inside it so the card file exports only a
 * component and Fast Refresh can preserve its state.
 */
export function suggestedAgentSessionWorkItemKey(item: AgentSessionItem): string | undefined {
	return item.sessionDetails?.issueKey;
}
