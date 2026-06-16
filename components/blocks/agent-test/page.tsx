"use client";

import { AgentTestPanel } from "@/components/blocks/agent-test";
import { AGENT_TEST_DEMO_ENTRY } from "@/components/blocks/agent-test/data/demo-entry";

export default function AgentTestPage() {
	return (
		<div className="flex h-screen w-full flex-col bg-surface">
			<AgentTestPanel entry={AGENT_TEST_DEMO_ENTRY} />
		</div>
	);
}
