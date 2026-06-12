"use client";

import { TWGAgentCard } from "@/components/blocks/twg-agent-card";

export default function TWGAgentCardPage(): React.ReactElement {
	return (
		<div className="flex min-h-screen w-full items-center justify-center bg-background p-6">
			<TWGAgentCard onSelect={() => {}} />
		</div>
	);
}
