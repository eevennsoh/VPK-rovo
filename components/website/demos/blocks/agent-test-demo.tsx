"use client";

import { AgentTestPanel } from "@/components/blocks/agent-test";
import {
	AGENT_TEST_DEMO_ENTRY,
	buildAgentTestDemoEntry,
} from "@/components/blocks/agent-test/data/demo-entry";

export default function AgentTestDemo() {
	return (
		<div className="flex h-[720px] w-full flex-col overflow-hidden bg-surface">
			<AgentTestPanel entry={AGENT_TEST_DEMO_ENTRY} />
		</div>
	);
}

// A draft with no configured automations — the chat greeting shows just the
// conversation starters.
const NO_AUTOMATION_ENTRY = buildAgentTestDemoEntry({
	...AGENT_TEST_DEMO_ENTRY.draftResult,
	automationRules: [],
});

export function AgentTestDemoChatOnly() {
	return (
		<div className="flex h-[720px] w-full flex-col overflow-hidden bg-surface">
			<AgentTestPanel entry={NO_AUTOMATION_ENTRY} />
		</div>
	);
}
