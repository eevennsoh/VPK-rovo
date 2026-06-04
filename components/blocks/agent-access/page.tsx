"use client";

import { useState } from "react";

import { AgentAccess, type AgentAccessMode } from "@/components/blocks/agent-access";

export default function AgentAccessPage() {
	const [mode, setMode] = useState<AgentAccessMode>("requesting-user");

	return (
		<div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-6 py-10">
			<AgentAccess
				value={mode}
				onValueChange={setMode}
				onGoToAgentDetails={() => undefined}
			/>
		</div>
	);
}
