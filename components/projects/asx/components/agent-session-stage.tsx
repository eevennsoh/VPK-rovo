"use client";

import { useCallback } from "react";

import {
	AgentList,
	type AgentListItem,
} from "@/components/blocks/agent-list";
import { useAsxAgentChatDemo } from "@/components/projects/asx/hooks/use-asx-agent-chat-demo";
import { AsxRovoOverlay } from "./asx-rovo-overlay";

/**
 * Derives a Jira-style issue key from an agent-session branch so the chat's
 * work-item context bar reads meaningfully: `rovo/vita-142-vision-deck` →
 * `VITA-142`. Falls back to the raw branch when the pattern does not match.
 */
function deriveIssueKey(branch: string): string {
	const match = /^rovo\/([a-z]+)-(\d+)-/.exec(branch);
	return match ? `${match[1].toUpperCase()}-${match[2]}` : branch;
}

/** Maps an agent display name to its Rovo profile id (`Progress tracker` → `progress-tracker`). */
function toAgentId(agentName: string): string {
	return agentName.toLowerCase().replace(/\s+/g, "-");
}

/**
 * The "Agent session" design pattern for the Agent Sessions Experience gallery.
 *
 * Reuses the real `components/blocks/agent-list` block verbatim (same
 * sample sessions as the block's own demo), shown in the gallery stage when the
 * Agent session card is selected. The list sits in a centered, constrained
 * column so the session rows read cleanly against the wide stage.
 *
 * Activating a row (its body or the View action) drops the user into the shared
 * Rovo floating chat for that session's agent — same behavior as Card Kanban's
 * "View": {@link useAsxAgentChatDemo} selects the row's agent (already
 * registered via `ROVO_AGENT_PROFILES`), seeds a work-item context bar, and
 * plays back a short thinking → result transcript. The floating chat + launcher
 * render through `AsxRovoOverlay`, which portals above the Gallery dock so the
 * pinned dock never covers them.
 */
export function AgentSessionStage(): React.ReactElement {
	const { chatContextBar, externalThinkingMessageId, openAgentChat } =
		useAsxAgentChatDemo();

	const handleView = useCallback(
		(item: AgentListItem) => {
			const issueKey = deriveIssueKey(item.branch);
			openAgentChat({
				agentId: toAgentId(item.agent.name),
				agentName: item.agent.name,
				issueKey,
				issueSummary: item.title,
				request: `Show me your progress on ${issueKey}.`,
			});
		},
		[openAgentChat],
	);

	return (
		<div className="relative flex h-full min-h-0 w-full flex-col justify-center px-8 pb-28">
			<div className="mx-auto w-full max-w-xl">
				<AgentList className="w-full" composerChatSurface="floating" onView={handleView} />
			</div>
			<AsxRovoOverlay
				chatContextBar={chatContextBar}
				externalThinkingMessageId={externalThinkingMessageId}
			/>
		</div>
	);
}
