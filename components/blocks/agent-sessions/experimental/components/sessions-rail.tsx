"use client";

import { AgentLaunchSelector } from "@/components/blocks/agent-sessions/experimental/components/agent-launch-selector";
import { SessionRow } from "@/components/blocks/agent-sessions/experimental/components/session-row";
import {
	useAgentSessionsActions,
	useAgentSessionsMeta,
} from "@/components/blocks/agent-sessions/experimental/context-agent-sessions";
import type { AgentSession } from "@/components/blocks/agent-sessions/data/session-state";
import { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarImage } from "@/components/ui/avatar";
import { Heading } from "@/components/ui/heading";

const RAIL_HEADING_ID = "agent-sessions-rail-title";
const MAX_STACK_AVATARS = 3;

function isWorking(session: AgentSession): boolean {
	return session.status === "running" || session.status === "waiting";
}

function WorkingAvatarStack({ sessions }: Readonly<{ sessions: readonly AgentSession[] }>) {
	const shown = sessions.slice(0, MAX_STACK_AVATARS);
	const overflow = sessions.length - shown.length;

	return (
		<AvatarGroup className="shrink-0" label={`${sessions.length} agents working`}>
			{shown.map((session) => (
				<Avatar key={session.id} shape="hexagon" size="sm">
					{session.agentAvatarSrc ? (
						<AvatarImage alt="" className="object-contain" src={session.agentAvatarSrc} />
					) : null}
					<AvatarFallback>{session.agentName.slice(0, 2).toUpperCase()}</AvatarFallback>
				</Avatar>
			))}
			{overflow > 0 ? <AvatarGroupCount>+{overflow}</AvatarGroupCount> : null}
		</AvatarGroup>
	);
}

/**
 * "N agents working" panel above the metadata rail. The count reflects
 * running + waiting sessions; the list shows every session (working first,
 * completed below) and each row reopens its chat. When there are no sessions
 * yet, an empty shell with a "Start work" launcher mirrors the standard
 * work-item agent panel.
 */
export function SessionsRail() {
	const { workingCount, orderedSessions } = useAgentSessionsMeta();
	const actions = useAgentSessionsActions();
	const workingSessions = orderedSessions.filter(isWorking);

	const title =
		workingCount === 0
			? "Agent sessions"
			: workingCount === 1
				? "1 agent working"
				: `${workingCount} agents working`;

	return (
		<section aria-labelledby={RAIL_HEADING_ID} className="flex flex-col gap-3">
			<div className="flex min-w-0 items-center justify-between gap-2">
				<div className="flex min-w-0 items-center gap-2">
					<Heading as="h3" className="min-w-0 truncate" id={RAIL_HEADING_ID} size="small">
						{title}
					</Heading>
					{workingSessions.length > 0 ? <WorkingAvatarStack sessions={workingSessions} /> : null}
				</div>
				{orderedSessions.length > 0 ? <AgentLaunchSelector /> : null}
			</div>

			{orderedSessions.length === 0 ? (
				<div className="flex min-h-14 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border px-4 py-5 text-center">
					<p className="text-sm text-text-subtle">No agents are working on this item yet.</p>
					<AgentLaunchSelector label="Start work" />
				</div>
			) : (
				<div className="flex flex-col gap-0.5">
					{orderedSessions.map((session) => (
						<SessionRow key={session.id} onOpen={actions.openSession} session={session} />
					))}
				</div>
			)}
		</section>
	);
}
