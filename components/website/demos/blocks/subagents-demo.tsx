"use client";

import Subagents from "@/components/blocks/subagents/page";
import { DEFAULT_SUBAGENTS_BASE_AGENT } from "@/components/blocks/subagents/data/demo-agents";

export default function SubagentsDemo() {
	return <Subagents />;
}

export function SubagentsDemoEmpty() {
	return (
		<Subagents
			initialBaseAgent={DEFAULT_SUBAGENTS_BASE_AGENT}
			initialSubagents={[]}
		/>
	);
}
