"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Lozenge, type LozengeProps } from "@/components/ui/lozenge";
import {
	formatSessionTimestamp,
	type AgentActivityEvent,
	type AgentSessionStatus,
} from "@/components/blocks/agent-sessions/data/session-state";

interface ActivityAgentEventProps {
	event: AgentActivityEvent;
	onOpenSession: (sessionId: string) => void;
}

const STATUS_LOZENGE: Record<AgentSessionStatus, { variant: LozengeProps["variant"]; label: string }> = {
	running: { variant: "information", label: "Working" },
	waiting: { variant: "warning", label: "Waiting for you" },
	completed: { variant: "success", label: "Done" },
};

function initialsOf(name: string): string {
	const initials = name
		.split(" ")
		.map((part) => part[0])
		.join("")
		.slice(0, 2)
		.toUpperCase();
	return initials || "?";
}

/**
 * Compact, Cursor-chat-body-like inline block for an agent event: hexagon avatar,
 * agent name, a status Lozenge, and a clamped command/response preview. The whole
 * block is a button that opens the full session. It deliberately never renders
 * steps or chain-of-thought — reasoning is only visible inside the opened session.
 */
export function ActivityAgentEvent({ event, onOpenSession }: Readonly<ActivityAgentEventProps>) {
	const status = STATUS_LOZENGE[event.status];

	return (
		<button
			type="button"
			onClick={() => onOpenSession(event.sessionId)}
			className="group/agent-event flex w-full gap-2 rounded-md border border-border bg-surface-raised p-2 text-left outline-none transition-colors duration-normal ease-out-practical hover:bg-surface-raised-hovered motion-reduce:transition-none focus-visible:ring-2 focus-visible:ring-ring/60"
		>
			<Avatar size="sm" shape="hexagon" className="shrink-0">
				{event.agentAvatarSrc ? <AvatarImage src={event.agentAvatarSrc} alt="" /> : null}
				<AvatarFallback>{initialsOf(event.agentName)}</AvatarFallback>
			</Avatar>
			<div className="flex min-w-0 flex-1 flex-col gap-1">
				<div className="flex items-center gap-2">
					<span className="min-w-0 truncate text-sm font-semibold text-text">{event.agentName}</span>
					<Lozenge variant={status.variant} className="shrink-0">
						{status.label}
					</Lozenge>
					<span className="ml-auto shrink-0 text-xs text-text-subtlest">
						{formatSessionTimestamp(event.createdAtMs)}
					</span>
				</div>
				<p className="line-clamp-1 text-xs text-text-subtlest">{event.commandPreview}</p>
				{event.responsePreview ? (
					<p className="line-clamp-2 text-sm text-text-subtle">{event.responsePreview}</p>
				) : null}
			</div>
		</button>
	);
}
