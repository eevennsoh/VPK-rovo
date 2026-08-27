"use client";

import { PULSE_EMBEDDED_CHAT_HEADER_CLASS } from "@/components/blocks/jira-kanban/experimental/pulse/lib/pulse-layout";
import type { ChatContextBarDescriptor } from "@/components/projects/shared/lib/chat-context-bar";
import RovoFloatingChat from "@/components/projects/rovo-floating-chat/components/rovo-floating-chat";

/**
 * The work-item side panel, in the Pulse work rail.
 *
 * Same surface as `FloatingSessionSurface`: the shared floating chat with
 * `placement="embedded"`, no viewport launcher, and the same chrome the
 * work-item session already uses. Pulse owns when it mounts — the cards
 * unmount for it — rather than inventing a second transcript.
 */
export function PulseEmbeddedChat({
	chatContextBar,
}: Readonly<{
	chatContextBar: ChatContextBarDescriptor;
}>) {
	return (
		<div className="relative h-full min-h-0 overflow-visible [&_[data-rovo-chat-placement=embedded]]:border-l-0">
			<RovoFloatingChat
				chatContextBar={chatContextBar}
				compactHeader
				headerClassName={PULSE_EMBEDDED_CHAT_HEADER_CLASS}
				hideComposerSourceAndModelControls
				placement="embedded"
				showAgentBackButton={false}
				showAgentSelector={false}
				showChatHistory={false}
				showNewChatButton={false}
				suppressCustomAgentTabs
			/>
		</div>
	);
}
