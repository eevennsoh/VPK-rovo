"use client";

import { useCallback, useState } from "react";

import {
	AGENT_SESSION_ITEMS,
	AgentSession,
	type AgentSessionItem,
	type AgentSessionVariant,
} from "./index";

// One card is the whole story here — a second only repeats the same states.
const AGENT_SESSION_DEMO_ITEMS = AGENT_SESSION_ITEMS.slice(0, 1);

export default function AgentSessionPage({
	variant = "large",
}: Readonly<{ variant?: AgentSessionVariant }>) {
	const [capturedIds, setCapturedIds] = useState<ReadonlySet<string>>(() => new Set());

	const handleCapture = useCallback((item: AgentSessionItem) => {
		setCapturedIds((current) => new Set(current).add(item.id));
	}, []);
	const handleLink = useCallback((item: AgentSessionItem) => {
		setCapturedIds((current) => new Set(current).add(item.id));
	}, []);

	return (
		<div className="flex h-full min-h-[360px] w-full flex-col items-center justify-center gap-2 bg-surface p-6">
			<AgentSession
				capturedItemIds={capturedIds}
				className={variant === "large" ? "w-[320px]" : "w-fit"}
				items={AGENT_SESSION_DEMO_ITEMS}
				onCreateWorkItem={handleCapture}
				onLinkWorkItem={handleLink}
				onSubtasks={handleCapture}
				variant={variant}
			/>
		</div>
	);
}
