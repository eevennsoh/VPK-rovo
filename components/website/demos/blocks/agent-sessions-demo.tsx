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
	return <AgentSessions variant="experimental" initialExperimentalPreset="filled" />;
}

export function AgentSessionsDemoExperimentalEmpty() {
	return <AgentSessions variant="experimental" initialExperimentalPreset="empty" />;
}

export function AgentSessionsDemoExperimentalRunning() {
	return <AgentSessions variant="experimental" initialExperimentalPreset="running" />;
}
