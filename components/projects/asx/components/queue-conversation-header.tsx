import PanelRightIcon from "@atlaskit/icon/core/panel-right";

import type { RovoAgentProfile } from "@/app/data/directory/agents";
import { AgentAvatarVisual } from "@/components/ui-custom/agent-avatar-visual";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

function getAgentInitials(agentName: string): string {
	return agentName
		.split(/\s+/u)
		.map((part) => part[0])
		.join("")
		.slice(0, 2)
		.toUpperCase();
}

interface QueueConversationHeaderProps {
	agent: RovoAgentProfile;
	isEnvironmentPanelOpen: boolean;
	onEnvironmentPanelToggle: () => void;
}

export function QueueConversationHeader({
	agent,
	isEnvironmentPanelOpen,
	onEnvironmentPanelToggle,
}: Readonly<QueueConversationHeaderProps>) {
	return (
		<header className="flex shrink-0 items-center gap-3 px-3 py-3">
			<div className="flex h-8 min-w-0 shrink-0 items-center gap-1.5 px-2 text-sm font-medium text-text">
				<span aria-hidden className="flex size-4 items-center justify-center">
					<AgentAvatarVisual
						avatarSrc={agent.avatarSrc}
						brandName={agent.brandName}
						className="size-4 object-contain"
						fallbackText={getAgentInitials(agent.name)}
						label={agent.name}
						logoName={agent.logoName}
						sizePx={16}
					/>
				</span>
				<span className="truncate font-semibold">{agent.name}</span>
			</div>

			<div className="min-h-px min-w-px flex-1" />

			{isEnvironmentPanelOpen ? null : (
				<Button
					aria-controls="asx-queue-environment-panel"
					aria-expanded={false}
					aria-label="Open environment panel"
					onClick={onEnvironmentPanelToggle}
					size="icon"
					type="button"
					variant="ghost"
				>
					<Icon aria-hidden render={<PanelRightIcon label="" />} />
				</Button>
			)}
		</header>
	);
}
