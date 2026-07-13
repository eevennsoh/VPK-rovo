"use client";

import {
	Conversation,
	ConversationContent,
	ConversationScrollButton,
} from "@/components/ui-custom/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ui-custom/message";

import { FloatingSessionProgress } from "@/components/blocks/agent-sessions/experimental/components/floating-session-progress";
import type {
	AgentSession,
	AgentSessionMessage,
} from "@/components/blocks/agent-sessions/data/session-state";

function TranscriptMessage({ message }: Readonly<{ message: AgentSessionMessage }>) {
	if (message.role === "human") {
		// Lightweight local human bubble (mirrors UserMessageBubble's plain turn
		// without pulling its attachment / answer-card dependency graph).
		return (
			<Message from="user">
				<MessageContent>{message.content}</MessageContent>
			</Message>
		);
	}

	// `contain={false}` because the trailing progress block grows as the agent
	// advances; containment would clip it mid-render.
	return (
		<Message from="assistant" contain={false}>
			<MessageContent>
				<MessageResponse>{message.content}</MessageResponse>
			</MessageContent>
		</Message>
	);
}

/**
 * Auto-anchoring transcript scroller for a single session. Renders the
 * human/agent turns, then the high-level progress block inline at the latest
 * agent activity (bottom of the thread).
 */
export function FloatingSessionTranscript({ session }: Readonly<{ session: AgentSession }>) {
	return (
		<Conversation className="flex-1">
			<ConversationContent>
				{session.messages.map((message) => (
					<TranscriptMessage key={message.id} message={message} />
				))}
				{session.steps.length > 0 ? <FloatingSessionProgress session={session} /> : null}
			</ConversationContent>
			<ConversationScrollButton />
		</Conversation>
	);
}
