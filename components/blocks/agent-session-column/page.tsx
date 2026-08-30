"use client";

import { useCallback, useState } from "react";

import { type AgentSessionItem } from "@/components/blocks/agent-session";

import { AgentSessionColumn } from "./index";

export default function AgentSessionColumnPage() {
	const [capturedIds, setCapturedIds] = useState<ReadonlySet<string>>(() => new Set());

	const handleCapture = useCallback((item: AgentSessionItem) => {
		setCapturedIds((current) => new Set(current).add(item.id));
	}, []);

	return (
		<div className="flex h-full min-h-[560px] w-full justify-center bg-surface p-6">
			<AgentSessionColumn
				capturedItemIds={capturedIds}
				onCreateWorkItem={handleCapture}
				onLinkWorkItem={handleCapture}
			/>
		</div>
	);
}
