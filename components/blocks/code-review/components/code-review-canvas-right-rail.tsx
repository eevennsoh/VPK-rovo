"use client";

import DevicesIcon from "@atlaskit/icon/core/devices";
import LinkExternalIcon from "@atlaskit/icon/core/link-external";

import { RovoChatProvider } from "@/app/contexts/context-rovo-chat";
import { getRovoAgentProfile, type RovoAgentProfile } from "@/app/data/directory/agents";
import ChatPanel from "@/components/projects/sidebar-chat/page";
import { Button } from "@/components/ui/button";
import { IconTile } from "@/components/ui/icon-tile";

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
	agentProfile?: RovoAgentProfile;
	hideComposerSourceAndModelControls?: boolean;
	onReviewSubmit?: (submission: Readonly<{
		comments: readonly InlineReviewComment[];
		prompt: string;
	}>) => void;
}

const INLINE_REVIEW_PROMPT = "Address these inline review comments.";

export function CodeReviewCanvasRightRail({
	workItem,
	comments,
	onClose,
	onRemoveAllComments,
	agentProfile = CODE_REVIEWER_AGENT,
	hideComposerSourceAndModelControls = false,
	onReviewSubmit,
}: Readonly<CodeReviewCanvasRightRailProps>): React.ReactElement {
	const hasInlineComments = comments.length > 0;
	const inlineCommentsContext = serializeInlineCommentsContext(workItem, comments);
	const handleSubmitted = () => {
		onReviewSubmit?.({ comments, prompt: INLINE_REVIEW_PROMPT });
		onRemoveAllComments();
	};

	return (
		<RovoChatProvider
			agentProfiles={[agentProfile]}
			autoSelectAgentId={agentProfile.id}
		>
			<ChatPanel
				onClose={onClose}
				headerVariant="minimal"
				headerEndAction={(
					<Button
						aria-label={`Open ${agentProfile.name}`}
						className="shrink-0 gap-1"
						size="compact"
						type="button"
						variant="outline"
					>
						Open
						<LinkExternalIcon label="" size="small" />
					</Button>
				)}
				centerEmptyGreeting
				enableSmartWidgets
				abortOnUnmount={false}
				hideComposerSourceAndModelControls={hideComposerSourceAndModelControls}
				showAgentBackButton={false}
				showAgentSelector={false}
				greeting={{
					heading: "Review this change",
					suggestions: agentProfile.starters,
				}}
				chatContextBar={{
					iconName: "branch",
					label: workItem.localBranchName,
					showDismissPlaceholder: false,
					signature: `code-review-branch:${workItem.localBranchName}`,
					variant: "edit",
				}}
				composerSurfaceHeader={(
					<>
						<IconTile
							aria-hidden
							as="span"
							className="text-icon-subtle"
							icon={<DevicesIcon label="" size="small" />}
							iconSize="small"
							label=""
							size="xxsmall"
							variant="transparent"
						/>
						<span>Local · Carl’s MacBook Pro</span>
					</>
				)}
				composerSurfaceHeaderTooltip="Sends your prompt to Claude Code running locally."
				composerInputContext={hasInlineComments ? {
					content: (
						<InlineCommentsComposerChip
							comments={comments}
							onRemoveAll={onRemoveAllComments}
						/>
					),
					onSubmitStart: handleSubmitted,
					submitText: INLINE_REVIEW_PROMPT,
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
