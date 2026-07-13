"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Lozenge, type LozengeProps } from "@/components/ui/lozenge";
import type {
	AgentSession,
	AgentSessionStatus,
} from "@/components/blocks/agent-sessions/data/session-state";

interface SessionStatusMeta {
	label: string;
	variant: NonNullable<LozengeProps["variant"]>;
}

const SESSION_STATUS_META: Record<AgentSessionStatus, SessionStatusMeta> = {
	running: { label: "Running", variant: "information" },
	waiting: { label: "Waiting for input", variant: "warning" },
	completed: { label: "Completed", variant: "success" },
};

interface SessionRowProps {
	session: AgentSession;
	onOpen: (sessionId: string) => void;
}

/**
 * One session in the sessions rail: identity (hexagon avatar + agent name), a
 * one-line command / preview, and a status lozenge. The whole row is a button
 * that reopens the session's chat.
 */
export function SessionRow({ session, onOpen }: Readonly<SessionRowProps>) {
	const status = SESSION_STATUS_META[session.status];
	const fallback = session.agentName.slice(0, 2).toUpperCase();

	return (
		<button
			aria-label={`Open ${session.agentName} session — ${status.label}`}
			className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors duration-xxshort ease-out-practical hover:bg-bg-neutral-subtle-hovered active:bg-bg-neutral-subtle-pressed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 motion-reduce:transition-none"
			onClick={() => onOpen(session.id)}
			type="button"
		>
			<Avatar className="shrink-0" shape="hexagon" size="sm">
				{session.agentAvatarSrc ? (
					<AvatarImage alt="" className="object-contain" src={session.agentAvatarSrc} />
				) : null}
				<AvatarFallback>{fallback}</AvatarFallback>
			</Avatar>
			<span className="flex min-w-0 flex-1 flex-col">
				<span className="min-w-0 truncate text-sm font-medium text-text">{session.agentName}</span>
				<span className="min-w-0 truncate text-xs text-text-subtle">{session.previewText}</span>
			</span>
			<Lozenge className="shrink-0" variant={status.variant}>
				{status.label}
			</Lozenge>
		</button>
	);
}
