"use client";

import { AgentSurfaces } from "@/components/blocks/agent-surfaces";

export default function AgentSurfacesPage() {
	return (
		<div className="flex min-h-screen w-full justify-center bg-surface-sunken p-6">
			<div className="flex w-full max-w-4xl">
				<AgentSurfaces />
			</div>
		</div>
	);
}
