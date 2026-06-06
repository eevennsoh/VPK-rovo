"use client";

import {
	AgentCompactOperationsBento,
	HomeStarterBento,
} from "@/components/blocks/agent-bento";

export default function AgentBentoPage() {
	return (
		<div className="mx-auto flex min-h-screen w-full max-w-[1280px] flex-col gap-16 px-4 py-12">
			<section className="flex flex-col gap-4">
				<HomeStarterBento />
			</section>

			<section className="flex flex-col gap-4">
				<AgentCompactOperationsBento />
			</section>
		</div>
	);
}
