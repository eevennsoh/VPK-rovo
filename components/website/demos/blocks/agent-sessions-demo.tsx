"use client";

import AgentSessions from "@/components/blocks/agent-sessions";
import AgentSessionsPage from "@/components/blocks/agent-sessions/page";

export default function AgentSessionsDemo() {
	return <AgentSessionsPage />;
}

export function AgentSessionsDemoStandard() {
	return <AgentSessions variant="default" />;
}

export function AgentSessionsDemoExperimental() {
	return <AgentSessions variant="experimental" />;
}
