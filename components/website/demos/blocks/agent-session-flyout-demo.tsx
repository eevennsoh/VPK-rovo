"use client";

import Page from "@/components/blocks/agent-session-flyout/page";

export default function AgentSessionFlyoutDemo() {
	return <Page />;
}

export function AgentSessionFlyoutDemoComposer() {
	return <Page content="composer" />;
}

export function AgentSessionFlyoutDemoUntrackedWork() {
	return <Page content="untracked-work" />;
}
