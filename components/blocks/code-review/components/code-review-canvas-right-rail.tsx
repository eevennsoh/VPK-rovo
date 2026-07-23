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

export type CodeReviewAgentVariant =
	| "third-party-cloud"
	| "third-party-local"
	| "custom"
	| "rovo";

interface CodeReviewCanvasRightRailProps {
	workItem: CodeReviewWorkItem;
	comments: readonly InlineReviewComment[];
	onClose: () => void;
	onRemoveAllComments: () => void;
	agentVariant?: CodeReviewAgentVariant;
	agentProfile?: RovoAgentProfile;
	hideComposerSourceAndModelControls?: boolean;
	onReviewSubmit?: (submission: Readonly<{
		comments: readonly InlineReviewComment[];
		prompt: string;
	}>) => void;
}

const INLINE_REVIEW_PROMPT = "Address these inline review comments.";

interface CodeReviewAgentVariantConfig {
	emptyGreetingPlacement: "centered" | "near-composer";
	supportsExternalOpen: boolean;
	supportsLocalSession: boolean;
	usesDefaultRovoGreeting: boolean;
}

function getCodeReviewAgentVariantConfig(
	agentVariant: CodeReviewAgentVariant,
): CodeReviewAgentVariantConfig {
	switch (agentVariant) {
		case "third-party-cloud":
			return {
				emptyGreetingPlacement: "centered",
				supportsExternalOpen: false,
				supportsLocalSession: false,
				usesDefaultRovoGreeting: false,
			};
		case "third-party-local":
			return {
				emptyGreetingPlacement: "centered",
				supportsExternalOpen: true,
				supportsLocalSession: true,
				usesDefaultRovoGreeting: false,
			};
		case "custom":
			return {
				emptyGreetingPlacement: "near-composer",
				supportsExternalOpen: false,
				supportsLocalSession: false,
				usesDefaultRovoGreeting: false,
			};
		case "rovo":
			return {
				emptyGreetingPlacement: "near-composer",
				supportsExternalOpen: false,
				supportsLocalSession: false,
				usesDefaultRovoGreeting: true,
			};
		default: {
			const exhaustiveVariant: never = agentVariant;
			return exhaustiveVariant;
		}
	}
}

export function CodeReviewCanvasRightRail({
	workItem,
	comments,
	onClose,
	onRemoveAllComments,
	agentVariant = "custom",
	agentProfile = CODE_REVIEWER_AGENT,
	hideComposerSourceAndModelControls = false,
	onReviewSubmit,
}: Readonly<CodeReviewCanvasRightRailProps>): React.ReactElement {
	const hasInlineComments = comments.length > 0;
	const inlineCommentsContext = serializeInlineCommentsContext(workItem, comments);
	const variantConfig = getCodeReviewAgentVariantConfig(agentVariant);
	const handleSubmitted = () => {
		onReviewSubmit?.({ comments, prompt: INLINE_REVIEW_PROMPT });
		onRemoveAllComments();
	};

	return (
		<RovoChatProvider
			key={`${agentVariant}:${agentProfile.id}`}
			agentProfiles={[agentProfile]}
			autoSelectAgentId={agentProfile.id}
		>
			<ChatPanel
				onClose={onClose}
				headerVariant="minimal"
				headerEndAction={variantConfig.supportsExternalOpen ? (
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
				) : undefined}
				emptyGreetingPlacement={variantConfig.emptyGreetingPlacement}
				enableSmartWidgets
				abortOnUnmount={false}
				hideComposerSourceAndModelControls={hideComposerSourceAndModelControls}
				showAgentBackButton={false}
				showAgentSelector={false}
				greeting={variantConfig.usesDefaultRovoGreeting ? undefined : {
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
				composerSurfaceHeader={variantConfig.supportsLocalSession ? (
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
				) : undefined}
				composerSurfaceHeaderTooltip={variantConfig.supportsLocalSession
					? "Sends your prompt to the selected agent running locally."
					: undefined}
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
