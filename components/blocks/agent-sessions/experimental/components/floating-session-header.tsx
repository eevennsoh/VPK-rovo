"use client";

import { useState } from "react";
import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";
import CrossIcon from "@atlaskit/icon/core/cross";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Lozenge } from "@/components/ui/lozenge";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

import { useAgentSessions } from "@/components/blocks/agent-sessions/experimental/context-agent-sessions";
import type {
	AgentSession,
	AgentSessionStatus,
} from "@/components/blocks/agent-sessions/data/session-state";

type StatusLozengeVariant = "information" | "warning" | "success";

function getStatusLozenge(status: AgentSessionStatus): {
	variant: StatusLozengeVariant;
	label: string;
} {
	switch (status) {
		case "running":
			return { variant: "information", label: "Working" };
		case "waiting":
			return { variant: "warning", label: "Needs input" };
		case "completed":
			return { variant: "success", label: "Done" };
	}
}

function SessionAvatar({ session, className }: Readonly<{ session: AgentSession; className?: string }>) {
	return (
		<Avatar size="xs" shape="hexagon" label={session.agentName} className={cn("shrink-0", className)}>
			{session.agentAvatarSrc ? <AvatarImage src={session.agentAvatarSrc} alt="" /> : null}
			<AvatarFallback>{session.agentName.charAt(0)}</AvatarFallback>
		</Avatar>
	);
}

/**
 * Lightweight local header for the floating session panel — a purpose-built
 * alternative to the global `FloatingChatHeader` (which is bound to `useRovoChat`).
 * Shows the agent identity, session status, an optional session switcher, and a
 * close control, all driven by the block-local controller.
 */
export function FloatingSessionHeader({ session }: Readonly<{ session: AgentSession }>) {
	const { actions, meta } = useAgentSessions();
	const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
	const status = getStatusLozenge(session.status);
	const canSwitch = meta.orderedSessions.length > 1;

	return (
		<div className="flex shrink-0 items-center justify-between gap-2 px-3 py-3">
			<div className="flex min-w-0 items-center gap-2">
				<SessionAvatar session={session} />
				<span className="min-w-0 truncate text-sm font-medium text-text">{session.agentName}</span>
				<Lozenge variant={status.variant} className="shrink-0">
					{status.label}
				</Lozenge>
				{canSwitch ? (
					<DropdownMenu open={isSwitcherOpen} onOpenChange={setIsSwitcherOpen}>
						<DropdownMenuTrigger
							render={
								<Button
									aria-label="Switch session"
									size="icon"
									variant={isSwitcherOpen ? "secondary" : "ghost"}
									className="shrink-0"
								/>
							}
						>
							<ChevronDownIcon label="" />
						</DropdownMenuTrigger>
						<DropdownMenuContent align="start" sideOffset={4} positionerClassName="z-[600]">
							{meta.orderedSessions.map((option) => (
								<DropdownMenuItem
									key={option.id}
									selected={option.id === session.id}
									elemBefore={<SessionAvatar session={option} />}
									onSelect={() => actions.openSession(option.id)}
								>
									{option.agentName}
								</DropdownMenuItem>
							))}
						</DropdownMenuContent>
					</DropdownMenu>
				) : null}
			</div>
			<Button
				aria-label="Close chat"
				size="icon"
				variant="ghost"
				className="shrink-0"
				onClick={() => actions.openSession(null)}
			>
				<CrossIcon label="" />
			</Button>
		</div>
	);
}
