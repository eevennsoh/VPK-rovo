"use client";

import { useRef } from "react";
import type { FileUIPart } from "ai";
import type { ConversationContextValue } from "@/components/ui-custom/conversation";
import { ChatMessages } from "@/components/projects/shared/components/chat-messages";
import { RovoAppComposer } from "@/components/projects/rovo/components/rovo-app-composer";
import type { RovoAgentProfile } from "@/app/data/directory/agents";
import type { AsxQueueSession } from "../data/queue-sessions";
import { QueueConversationHeader } from "./queue-conversation-header";

interface QueueConversationWorkspaceProps {
	agent: RovoAgentProfile;
	onSubmit: (payload: { files: FileUIPart[]; text: string }) => Promise<void>;
	session: AsxQueueSession;
	spaceName: string;
}

export function QueueConversationWorkspace({
	agent,
	onSubmit,
	session,
	spaceName,
}: Readonly<QueueConversationWorkspaceProps>) {
	const conversationContextRef = useRef<ConversationContextValue | null>(null);
	const scrollSpacerRef = useRef<HTMLDivElement | null>(null);

	return (
		<section
			aria-label={`Conversation: ${session.title}`}
			className="flex h-full min-h-0 min-w-0 flex-1 flex-col bg-background text-foreground"
			data-testid="asx-queue-conversation"
		>
			<QueueConversationHeader
				agent={agent}
				spaceName={spaceName}
				status={session.status}
				title={session.title}
			/>
			<div className="mx-auto flex min-h-0 w-full max-w-[800px] flex-1 flex-col px-3">
				<ChatMessages
					contentBottomPadding="32px"
					contentTopPadding="32px"
					conversationContextRef={conversationContextRef}
					hideScrollbar={false}
					messageMode="ask"
					scrollSpacerRef={scrollSpacerRef}
					showFeedbackActions={false}
					showFollowUpSuggestions={false}
					uiMessages={session.messages}
				/>
				<div className="sticky bottom-0 z-10 shrink-0 bg-background/90 pb-4 backdrop-blur">
					<RovoAppComposer
						composerStatus="ready"
						experimentalDarkCta
						onStop={async () => {}}
						onSubmit={onSubmit}
						placeholder={session.status === "needs-input" ? `Reply to ${agent.name}` : `Message ${agent.name}`}
						showSubmitWhenEmpty
					/>
				</div>
			</div>
		</section>
	);
}
