"use client";

import { useCallback } from "react";

import { useRovoChat } from "@/app/contexts";
import { JiraAgentSession } from "@/components/blocks/jira-agent-session";
import { AsxRovoOverlay } from "./asx-rovo-overlay";

/**
 * The "Agent session" design pattern for the Agent Sessions Experience gallery.
 *
 * Reuses the real `components/blocks/jira-agent-session` block verbatim (same
 * sample sessions as the block's own demo), shown in the gallery stage when the
 * Agent session card is selected. The list sits in a centered, constrained
 * column so the session rows read cleanly against the wide stage.
 *
 * "View" drops the user into the shared Rovo floating chat for that session,
 * matching the jira-issue "view chat" behavior. The floating chat + launcher
 * render through `AsxRovoOverlay`, which portals above the Gallery dock so the
 * pinned dock never covers them.
 */
export function AgentSessionStage(): React.ReactElement {
	const { openChat } = useRovoChat();

	const handleView = useCallback(() => {
		openChat("floating");
	}, [openChat]);

	return (
		<div className="relative flex h-full min-h-0 w-full flex-col justify-center px-8 pb-28">
			<div className="mx-auto w-full max-w-xl">
				<JiraAgentSession className="w-full" onView={handleView} />
			</div>
			<AsxRovoOverlay />
		</div>
	);
}
