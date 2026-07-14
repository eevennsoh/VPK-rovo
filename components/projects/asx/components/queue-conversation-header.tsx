import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Heading from "@/components/ui/heading";
import { Lozenge } from "@/components/ui/lozenge";
import type { RovoAgentProfile } from "@/app/data/directory/agents";
import type { AsxQueueSessionStatus } from "../data/queue-sessions";

const STATUS_PRESENTATION: Record<
	AsxQueueSessionStatus,
	{ label: string; variant: "information" | "neutral" | "warning" }
> = {
	queued: { label: "Queued", variant: "neutral" },
	running: { label: "Running", variant: "information" },
	"needs-input": { label: "Needs input", variant: "warning" },
};

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
	spaceName: string;
	status: AsxQueueSessionStatus;
	title: string;
}

export function QueueConversationHeader({
	agent,
	spaceName,
	status,
	title,
}: Readonly<QueueConversationHeaderProps>) {
	const statusPresentation = STATUS_PRESENTATION[status];

	return (
		<header className="flex min-h-16 shrink-0 items-center gap-3 border-b border-border px-4 py-3">
		<Avatar label={agent.name} shape="hexagon" size="default">
			{agent.avatarSrc ? <AvatarImage alt="" src={agent.avatarSrc} /> : null}
			<AvatarFallback>{getAgentInitials(agent.name)}</AvatarFallback>
		</Avatar>
		<div className="min-w-0 flex-1">
			<Heading as="h2" size="small" className="truncate">
				{title}
			</Heading>
			<p className="truncate text-xs text-text-subtlest">
				{agent.name} · {spaceName}
			</p>
		</div>
		<Lozenge variant={statusPresentation.variant}>{statusPresentation.label}</Lozenge>
	</header>
	);
}
