"use client";

import {
	Conversation,
	ConversationContent,
	ConversationDownload,
	ConversationEmptyState,
	ConversationScrollButton,
} from "@/components/ui-audio/conversation";
import { Message, MessageContent } from "@/components/ui-audio/message";
import { Orb } from "@/components/ui-audio/orb";
import { CONVERSATION_DOWNLOAD_MESSAGES } from "./demo-data-values";

function ConversationPreview({
	empty = true,
}: Readonly<{ empty?: boolean }>) {
	return (
		<div className="mx-auto w-full max-w-2xl">
			<div className="relative h-[400px] overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
				<Conversation className="h-full">
					<ConversationContent className="min-h-full p-4">
						{empty ? (
							<ConversationEmptyState
								description="This is a simulated conversation"
								icon={(
									<div className="size-12">
										<Orb agentState="thinking" className="size-full" />
									</div>
								)}
								title="Start a conversation"
							/>
						) : (
							<div className="flex min-h-full flex-col gap-4">
								<Message from="assistant">
									<MessageContent>
										I can summarize call outcomes, generate transcripts, or prep a follow-up email.
									</MessageContent>
								</Message>
								<Message from="user">
									<MessageContent>
										Build the summary and include next steps for support and launch readiness.
									</MessageContent>
								</Message>
								<Message from="assistant">
									<MessageContent>
										Support team needs a reusable script, launch needs waveform and transcript docs, and both need mocked examples.
									</MessageContent>
								</Message>
								<Message from="user">
									<MessageContent>
										Download the markdown log once you have the structure right.
									</MessageContent>
								</Message>
							</div>
						)}
					</ConversationContent>
					{empty ? null : (
						<>
							<ConversationDownload
								className="top-5 right-5"
								messages={CONVERSATION_DOWNLOAD_MESSAGES}
							/>
							<ConversationScrollButton />
						</>
					)}
				</Conversation>
			</div>
		</div>
	);
}

export default function ConversationDemo() {
	return <ConversationPreview />;
}

export function ConversationDemoEmpty() {
	return <ConversationPreview empty />;
}

export function ConversationDemoTranscript() {
	return <ConversationPreview empty={false} />;
}
