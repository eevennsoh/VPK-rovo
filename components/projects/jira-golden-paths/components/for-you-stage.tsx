"use client";

import { useCallback } from "react";

import type { JiraForYouItem, JiraForYouSection, JiraForYouTab } from "@/components/blocks/jira-for-you";
import { buildJgpForYouAgentChatScenario } from "@/components/projects/jira-golden-paths/data/agent-chat-data";
import { useJgpAgentChatDemo } from "@/components/projects/jira-golden-paths/hooks/use-jira-golden-paths-agent-chat-demo";
import { ForYouStageLayout } from "@/components/projects/shared/components/for-you-stage-layout";
import { getDeterministicAgentAvatarSrc } from "@/lib/agent-avatars";
import { JgpRovoOverlay } from "./jira-golden-paths-rovo-overlay";

const CURSOR_AGENT = { name: "Cursor", avatarSrc: getDeterministicAgentAvatarSrc("cursor") } as const;

export const JGP_FOR_YOU_SECTIONS: readonly JiraForYouSection[] = [{
	id: "human-review",
	label: "Ready for your review",
	items: [
		["jgp-251", "JGP-251", "Remember assignee focus per board"],
		["jgp-252", "JGP-252", "Add a Clear focus action"],
		["jgp-253", "JGP-253", "Preserve keyboard focus in the assignee facepile"],
		["jgp-254", "JGP-254", "Announce filtered result counts to screen readers"],
		["jgp-255", "JGP-255", "Add an empty state when an assignee has no visible work"],
	].map(([id, issueKey, title]) => ({
		id,
		issueKey,
		title,
		issueType: "task" as const,
		spaceName: "Jira board focus workflows",
		jiraStatus: "Review" as const,
		agents: [CURSOR_AGENT],
		tabs: ["human-review"],
	})),
}];

export const JGP_FOR_YOU_TABS: readonly JiraForYouTab[] = [
	{ id: "all", label: "All", count: 5 },
	{ id: "human-review", label: "Review", count: 5 },
];

export function ForYouStage({ dockOpen }: Readonly<{ dockOpen: boolean; scenario?: "human-review" }>): React.ReactElement {
	const { chatContextBar, externalThinkingMessageId, openAgentChat } = useJgpAgentChatDemo();
	const handleView = useCallback((item: JiraForYouItem) => {
		openAgentChat(buildJgpForYouAgentChatScenario(item));
	}, [openAgentChat]);

	return (
		<>
			<ForYouStageLayout
				dockOpen={dockOpen}
				onView={handleView}
				sections={JGP_FOR_YOU_SECTIONS}
				tabs={JGP_FOR_YOU_TABS}
			/>
			<JgpRovoOverlay
				chatContextBar={chatContextBar}
				externalThinkingMessageId={externalThinkingMessageId}
			/>
		</>
	);
}
