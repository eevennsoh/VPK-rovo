"use client";

import { useCallback } from "react";

import type { JiraForYouItem } from "@/components/blocks/jira-for-you";
import { buildJgpForYouAgentChatScenario } from "@/components/projects/jira-golden-paths/data/agent-chat-data";
import { useJgpAgentChatDemo } from "@/components/projects/jira-golden-paths/hooks/use-jira-golden-paths-agent-chat-demo";
import { ForYouStageLayout } from "@/components/projects/shared/components/for-you-stage-layout";
import { JgpRovoOverlay } from "./jira-golden-paths-rovo-overlay";

export function ForYouStage({ dockOpen }: Readonly<{ dockOpen: boolean }>): React.ReactElement {
	const { chatContextBar, externalThinkingMessageId, openAgentChat } = useJgpAgentChatDemo();
	const handleItemClick = useCallback((item: JiraForYouItem) => {
		openAgentChat(buildJgpForYouAgentChatScenario(item));
	}, [openAgentChat]);

	return (
		<>
			<ForYouStageLayout dockOpen={dockOpen} onItemClick={handleItemClick} />
			<JgpRovoOverlay
				chatContextBar={chatContextBar}
				externalThinkingMessageId={externalThinkingMessageId}
			/>
		</>
	);
}
