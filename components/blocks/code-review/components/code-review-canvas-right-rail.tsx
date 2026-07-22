"use client";

import { RovoChatProvider } from "@/app/contexts/context-rovo-chat";
import { getRovoAgentProfile } from "@/app/data/directory/agents";
import ChatPanel from "@/components/projects/sidebar-chat/page";

import type { CodeReviewWorkItem } from "../data/types";
import type { InlineReviewComment } from "../lib/inline-comments";
import { serializeInlineCommentsContext } from "../lib/inline-comments";
import { InlineCommentsComposerChip } from "./inline-comments-composer-chip";

const CODE_REVIEWER_AGENT_ID = "code-reviewer";
const CODE_REVIEWER_AGENT = getRovoAgentProfile(CODE_REVIEWER_AGENT_ID);

interface CodeReviewCanvasRightRailProps {
	workItem: CodeReviewWorkItem;
	comments: readonly InlineReviewComment[];
	onClose: () => void;
	onRemoveAllComments: () => void;
}

export function CodeReviewCanvasRightRail({
	workItem,
	comments,
	onClose,
	onRemoveAllComments,
}: Readonly<CodeReviewCanvasRightRailProps>): React.ReactElement {
	const hasInlineComments = comments.length > 0;
	const inlineCommentsContext = serializeInlineCommentsContext(workItem, comments);

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
				composerInputContext={hasInlineComments ? {
					content: (
						<InlineCommentsComposerChip
							comments={comments}
							onRemoveAll={onRemoveAllComments}
						/>
					),
					onSubmitted: onRemoveAllComments,
					submitText: "Address these inline review comments.",
				} : undefined}
				sendPromptOptions={{
					contextDescription: inlineCommentsContext || undefined,
					smartGeneration: {
						enabled: true,
						surface: "sidebar",
					},
				}}
			/>
		</RovoChatProvider>
	);
}
