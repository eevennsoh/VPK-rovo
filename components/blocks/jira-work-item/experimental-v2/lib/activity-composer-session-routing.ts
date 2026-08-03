import type { AgentSession } from "@/components/blocks/jira-work-item/data/session-state";

function includesComposerToken(text: string, token: string): boolean {
	let index = text.indexOf(token);
	while (index >= 0) {
		const previousCharacter = text[index - 1];
		const nextCharacter = text[index + token.length];
		const hasLeadingBoundary = previousCharacter === undefined || /[\s([{'"“‘]/u.test(previousCharacter);
		const hasTrailingBoundary = nextCharacter === undefined || /[\s,.!?;:)\]}"”’]/u.test(nextCharacter);
		if (hasLeadingBoundary && hasTrailingBoundary) {
			return true;
		}
		index = text.indexOf(token, index + token.length);
	}
	return false;
}

export function includesComposerAgentMention(text: string, agentName: string): boolean {
	return includesComposerToken(text, `@${agentName}`);
}

function isWorkingSession(session: Readonly<AgentSession>): boolean {
	return session.status === "running" || session.status === "waiting";
}

/** Latest active agent session explicitly referenced by an @mention in the draft. */
export function findMentionedWorkingAgentSession(
	sessions: readonly AgentSession[],
	draft: string,
): AgentSession | null {
	for (let index = sessions.length - 1; index >= 0; index -= 1) {
		const session = sessions[index];
		if (
			isWorkingSession(session)
			&& !session.agentId.startsWith("skill:")
			&& includesComposerAgentMention(draft, session.agentName)
		) {
			return session;
		}
	}
	return null;
}

/** Latest active agent or skill session that the submitted draft should steer. */
export function findSteeredWorkingSession(
	sessions: readonly AgentSession[],
	draft: string,
): AgentSession | null {
	for (let index = sessions.length - 1; index >= 0; index -= 1) {
		const session = sessions[index];
		if (!isWorkingSession(session)) {
			continue;
		}
		const token = session.agentId.startsWith("skill:")
			? `/${session.title ?? session.agentName}`
			: `@${session.agentName}`;
		if (includesComposerToken(draft, token)) {
			return session;
		}
	}
	return null;
}
