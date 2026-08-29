"use client";

import { useCallback, useState } from "react";

import {
	AGENT_SESSION_ITEMS,
	AGENT_SESSION_MULTI_LINK_KEYS,
	AgentSession,
	type AgentSessionItem,
} from "./index";

// One card is the whole story here — a second only repeats the same states.
const AGENT_SESSION_DEMO_ITEMS = AGENT_SESSION_ITEMS.slice(0, 1);

export default function AgentSessionPage({
	variant = "default",
}: Readonly<{ variant?: "default" | "multi-link" }>) {
	const [capturedIds, setCapturedIds] = useState<ReadonlySet<string>>(() => new Set());

	const handleCapture = useCallback((item: AgentSessionItem) => {
		setCapturedIds((current) => new Set(current).add(item.id));
	}, []);
	// Every offered key captures the session — the demo only needs to prove the
	// row that was clicked is the one reported back.
	const handleLink = useCallback((item: AgentSessionItem) => {
		setCapturedIds((current) => new Set(current).add(item.id));
	}, []);

	return (
		<div className="flex h-full min-h-[360px] w-full flex-col items-center justify-center gap-2 bg-surface p-6">
			<AgentSession
				capturedItemIds={capturedIds}
				className="w-[320px]"
				getSuggestedWorkItemKeys={
					variant === "multi-link"
						? (item) => AGENT_SESSION_MULTI_LINK_KEYS[item.id]
						: undefined
				}
				items={AGENT_SESSION_DEMO_ITEMS}
				onCreateWorkItem={handleCapture}
				onLinkWorkItem={handleLink}
			/>
		</div>
	);
}
