"use client";

import { RovoChatProvider } from "@/app/contexts/context-rovo-chat";
import { getRovoAgentProfile } from "@/app/data/directory/agents";
import ChatPanel from "@/components/projects/sidebar-chat/page";

import type { CodeReviewWorkItem } from "../data/types";

const CODE_REVIEWER_AGENT_ID = "code-reviewer";
const CODE_REVIEWER_AGENT = getRovoAgentProfile(CODE_REVIEWER_AGENT_ID);

interface CodeReviewCanvasRightRailProps {
	workItem: CodeReviewWorkItem;
	onClose: () => void;
}

export function CodeReviewCanvasRightRail({
	workItem,
	onClose,
}: Readonly<CodeReviewCanvasRightRailProps>): React.ReactElement {
	return (
		<RovoChatProvider
			agentProfiles={[CODE_REVIEWER_AGENT]}
			autoSelectAgentId={CODE_REVIEWER_AGENT_ID}
		>
			<ChatPanel
				onClose={onClose}
				headerVariant="minimal"
				enableSmartWidgets
				abortOnUnmount={false}
				hideAiDisclaimer
				greeting={{
					heading: "Review this change",
					suggestions: CODE_REVIEWER_AGENT.starters,
				}}
				chatContextBar={{
					iconName: "artifact",
					label: `${workItem.key} ${workItem.title}`,
					signature: `code-review:${workItem.key}:${workItem.branchName}`,
					variant: "edit",
				}}
				sendPromptOptions={{
					smartGeneration: {
						enabled: true,
						surface: "sidebar",
					},
				}}
			/>
		</RovoChatProvider>
	);
}
