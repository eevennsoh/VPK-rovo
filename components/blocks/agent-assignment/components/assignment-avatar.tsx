"use client";

import type { AgentAssignmentAgent } from "@/components/blocks/agent-assignment/components/agent-assignment";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AgentAvatarVisual } from "@/components/ui-custom/agent-avatar-visual";

export function AssignmentAvatar({
	agent,
	onOpen,
	positionerClassName,
}: Readonly<{
	agent: AgentAssignmentAgent;
	onOpen: () => void;
	positionerClassName?: string;
}>) {
	return (
		<Tooltip>
			<TooltipTrigger
				render={
					<span
						className="pointer-events-auto relative z-10 inline-flex shrink-0"
						onClick={onOpen}
						tabIndex={-1}
					/>
				}
			>
				<AgentAvatarVisual
					avatarClassName="shrink-0"
					avatarSrc={agent.avatarSrc}
					brandName={agent.brandName}
					fallbackText={agent.name.slice(0, 2).toUpperCase()}
					label={`${agent.name}. ${agent.statusLabel}`}
					logoName={agent.logoName}
					sizePx={24}
				/>
			</TooltipTrigger>
			<TooltipContent positionerClassName={positionerClassName}>{agent.statusLabel}</TooltipContent>
		</Tooltip>
	);
}
