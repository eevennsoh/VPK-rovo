"use client";

import ArrowLeftIcon from "@atlaskit/icon/core/arrow-left";
import PanelRightIcon from "@atlaskit/icon/core/panel-right";
import type { FileUIPart } from "ai";
import { useCallback, useRef } from "react";

import { AgentAvatarVisual } from "@/components/ui-custom/agent-avatar-visual";
import type { ConversationContextValue } from "@/components/ui-custom/conversation";
import { Footer } from "@/components/ui-custom/footer";
import { ChatMessages } from "@/components/projects/shared/components/chat-messages";
import { RovoAppComposer } from "@/components/projects/rovo/components/rovo-app-composer";
import {
	type DelegationRequest,
	useRealtimeVoice,
} from "@/components/projects/rovo/hooks/use-realtime-voice";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

import type { JiraForYouItem } from "./jira-for-you-types";
import type { JiraForYouWorkspaceAgentSession } from "./jira-for-you-workspace-types";

interface JiraForYouConversationProps {
	detailPanelInsetPx: number;
	isDetailPanelOpen: boolean;
	item: JiraForYouItem;
	onBack: () => void;
	onDetailPanelToggle: () => void;
	onSubmit: (payload: { files: FileUIPart[]; text: string }) => Promise<void>;
	selectedAgentSession: JiraForYouWorkspaceAgentSession;
	uiMessages: JiraForYouWorkspaceAgentSession["messages"];
}

export function JiraForYouConversation({
	detailPanelInsetPx,
	isDetailPanelOpen,
	item,
	onBack,
	onDetailPanelToggle,
	onSubmit,
	selectedAgentSession,
	uiMessages,
}: Readonly<JiraForYouConversationProps>) {
	const conversationContextRef = useRef<ConversationContextValue | null>(null);
	const scrollSpacerRef = useRef<HTMLDivElement | null>(null);
	const renderableMessages = [...uiMessages];
	const realtime = useRealtimeVoice({
		chatMessages: renderableMessages,
		isGenerating: false,
		onDelegateToRovo: useCallback((request: DelegationRequest) => {
			const text = request.prompt.trim();
			if (!text) {
				return;
			}
			void onSubmit({ files: [], text });
		}, [onSubmit]),
	});
	const handleToggleRealtimeVoice = useCallback(() => {
		if (realtime.voiceState === "idle") {
			realtime.connect();
			return;
		}

		realtime.disconnect();
	}, [realtime]);
	const conversationColumnStyle =
		detailPanelInsetPx > 0
			? { maxWidth: `calc(100% - ${detailPanelInsetPx}px)` }
			: undefined;

	return (
		<section
			aria-label={`Conversation: ${item.title}`}
			className="flex min-h-0 min-w-0 flex-1 flex-col bg-background"
		>
			<div
				className="flex min-h-0 min-w-0 flex-1 flex-col"
				data-testid="jira-for-you-conversation-pane"
				style={conversationColumnStyle}
			>
				<header className="flex min-w-0 shrink-0 items-center gap-2 border-b border-border px-3 py-3">
					<Button
						aria-label="Back to For you feed"
						onClick={onBack}
						size="icon"
						type="button"
						variant="ghost"
					>
						<Icon aria-hidden render={<ArrowLeftIcon label="" />} />
					</Button>
					<div className="flex min-w-0 flex-1 items-center gap-2">
						<AgentAvatarVisual
							avatarSrc={selectedAgentSession.profile.avatarSrc}
							brandName={selectedAgentSession.profile.brandName}
							className="size-6 object-contain"
							fallbackText={selectedAgentSession.profile.name.slice(0, 2)}
							label={selectedAgentSession.profile.name}
							logoName={selectedAgentSession.profile.logoName}
							sizePx={24}
						/>
						<div className="min-w-0 max-w-full">
							<p className="truncate text-sm font-semibold text-text">
								{selectedAgentSession.profile.name}
							</p>
							<p className="sr-only">
								{item.issueKey}: {item.title}
							</p>
						</div>
					</div>
					{isDetailPanelOpen ? null : (
						<Button
							aria-controls="jira-for-you-detail-panel"
							aria-expanded={false}
							aria-label="Open detail panel"
							onClick={onDetailPanelToggle}
							size="icon"
							type="button"
							variant="ghost"
						>
							<Icon aria-hidden render={<PanelRightIcon label="" />} />
						</Button>
					)}
				</header>

				<ChatMessages
					contentBottomPadding="24px"
					contentClassName="mx-auto flex min-w-0 w-full max-w-[800px] px-3 md:px-6"
					contentTopPadding="24px"
					conversationContextRef={conversationContextRef}
					hideScrollbar={false}
					messageMode="ask"
					scrollSpacerRef={scrollSpacerRef}
					showFeedbackActions={false}
					showFollowUpSuggestions={false}
					uiMessages={renderableMessages}
				/>

				<div
					className="sticky bottom-0 z-10 shrink-0 bg-background/90 backdrop-blur"
					data-testid="jira-for-you-composer-region"
				>
					<div className="mx-auto flex min-w-0 w-full max-w-[800px] flex-col px-3 py-3 md:px-6">
						<div className="min-w-0 max-w-full" data-testid="jira-for-you-composer">
							<RovoAppComposer
								composerStatus="ready"
								experimentalDarkCta
								hideReasoningSelector
								micStream={realtime.micStream}
								onStop={async () => realtime.disconnect()}
								onSubmit={onSubmit}
								onToggleRealtimeVoice={handleToggleRealtimeVoice}
								placeholder={selectedAgentSession.composerPlaceholder}
								realtimeVoiceActive={realtime.voiceState !== "idle"}
								realtimeVoiceState={realtime.voiceState}
							/>
						</div>
						<div data-testid="jira-for-you-footer">
							<Footer />
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
