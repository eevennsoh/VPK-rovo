"use client";

import { RovoChatProvider } from "@/app/contexts/context-rovo-chat";
import { ROVO_AGENT_PROFILES } from "@/app/data/directory/agents";
import { QueueStage } from "./components/queue-stage";

// Jira Queue — the standalone agent-session queue harvested from the ASX
// gallery. QueueStage owns its own session state, but it renders the shared
// AppLayout shell, which reads `useRovoChat`, so the surface must sit inside a
// RovoChatProvider (the same requirement ASX satisfies at its gallery root).
export default function JiraQueuePage(): React.ReactElement {
	return (
		<RovoChatProvider agentProfiles={ROVO_AGENT_PROFILES}>
			<div className="h-dvh w-full overflow-hidden bg-surface">
				<QueueStage />
			</div>
		</RovoChatProvider>
	);
}
