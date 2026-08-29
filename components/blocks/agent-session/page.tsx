"use client";

import { useCallback, useState } from "react";

import {
	AGENT_SESSION_ITEMS,
	AgentSession,
	type AgentSessionItem,
} from "./index";

export default function AgentSessionPage() {
	const [items, setItems] = useState<readonly AgentSessionItem[]>(AGENT_SESSION_ITEMS);
	const [capturedIds, setCapturedIds] = useState<ReadonlySet<string>>(() => new Set());

	const handleCapture = useCallback((item: AgentSessionItem) => {
		setCapturedIds((current) => new Set(current).add(item.id));
	}, []);
	const handleDismiss = useCallback((item: AgentSessionItem) => {
		setItems((current) => current.filter((candidate) => candidate.id !== item.id));
	}, []);

	return (
		<div className="flex h-full min-h-[360px] w-full flex-col items-center justify-center gap-2 bg-surface p-6">
			<AgentSession
				capturedItemIds={capturedIds}
				className="w-[320px]"
				items={items}
				onCreateWorkItem={handleCapture}
				onDismiss={handleDismiss}
				onLinkWorkItem={handleCapture}
			/>
		</div>
	);
}
