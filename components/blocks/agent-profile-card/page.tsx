"use client";

import { AgentProfileCard } from "@/components/blocks/agent-profile-card/components/agent-profile-card";

export default function AgentProfileCardPage(): React.ReactElement {
	return (
		<div className="flex h-full min-h-[400px] w-full items-center justify-center p-6">
			<AgentProfileCard className="self-center" />
		</div>
	);
}

export { AgentProfileCard } from "@/components/blocks/agent-profile-card/components/agent-profile-card";
export type { AgentProfileCardProps } from "@/components/blocks/agent-profile-card/components/agent-profile-card";
