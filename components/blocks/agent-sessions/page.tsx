"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import AgentSessions, { type AgentSessionsVariant } from "./index";

export {
	AgentSessions,
	type AgentSessionsProps,
	type AgentSessionsVariant,
	type AgentSessionsExperimentalPreset,
} from "./index";

export default function AgentSessionsPage() {
	const [activeVariant, setActiveVariant] = useState<AgentSessionsVariant | null>(null);

	if (activeVariant) {
		return (
			<AgentSessions
				key={activeVariant}
				initialIssueOpen
				variant={activeVariant}
				initialExperimentalPreset="filled"
				onIssueClose={() => setActiveVariant(null)}
			/>
		);
	}

	return (
		<div className="flex h-full min-h-screen items-center justify-center gap-3 p-4">
			<Button type="button" variant="outline" onClick={() => setActiveVariant("default")}>
				Open standard session
			</Button>
			<Button type="button" onClick={() => setActiveVariant("experimental")}>
				Open experimental session
			</Button>
		</div>
	);
}

export function AgentSessionsExperimentalPage() {
	return <AgentSessions variant="experimental" initialExperimentalPreset="filled" />;
}
