"use client";

import Page from "@/components/blocks/agent-list/page";

export default function AgentListDemo() {
	return <Page />;
}

export function AgentListDemoCompact() {
	return <Page variant="compact" />;
}

export function AgentListDemoComposer() {
	return <Page flyout="composer" />;
}
