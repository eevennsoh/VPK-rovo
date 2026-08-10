"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useRovoChat } from "@/app/contexts";
import { useJiraWorkItem } from "@/components/blocks/jira-work-item/experimental-v2/context-jira-work-item";
import type { AgentSession } from "@/components/blocks/jira-work-item/data/session-state";
import { SESSION_SCRIPTS } from "@/components/blocks/jira-work-item/data/session-scripts";
import { AsxRovoOverlay } from "@/components/projects/asx/components/asx-rovo-overlay";
import { useAsxAgentChatDemo } from "@/components/projects/asx/hooks/use-asx-agent-chat-demo";
import type { ChatSubmitInterceptOutcome } from "@/components/projects/sidebar-chat/page";

export type SessionReplyInterceptor = (
	session: AgentSession,
	text: string,
) => ChatSubmitInterceptOutcome;

function getSessionQuestion(session: AgentSession) {
	if (session.status !== "waiting") return undefined;
	return SESSION_SCRIPTS[session.scriptId]?.waitingQuestion;
}

function getSessionQuestionIntro(session: AgentSession): string | undefined {
	const script = SESSION_SCRIPTS[session.scriptId];
	if (!script?.waitingQuestion) return undefined;
	const progressMessages = session.messages
		.filter((message) => message.role === "agent" && message.content !== script.waitingPrompt)
		.map((message) => message.content);
	return progressMessages.length > 0 ? progressMessages.join("\n\n") : script.runningPreview;
}

function getSessionResult(session: AgentSession): string {
	const agentMessages = session.messages
		.filter((message) => message.role === "agent")
		.map((message) => message.content);
	return agentMessages.length > 0 ? agentMessages.join("\n\n") : session.previewText;
}

/**
 * Right/bottom inset that parks the Rovo launcher on the dialog's bottom-right
 * corner using the same gutter as the activity composer — the wide composer
 * dock is `px-6 pb-6` and the metadata rail is `pr-6`, so 24px on both axes
 * lines the button up with the prompt input's edges.
 */
const LAUNCHER_PLACEMENT = { right: "24px", bottom: "24px" } as const;

/**
 * Bridges the block-local session model into the shared Jira Issue Rovo chat.
 * Jira Work Item owns the deterministic session lifecycle; the
 * existing Rovo surface owns all visible chat chrome, transcript, and composer.
 */
export function FloatingSessionSurface({
	onSessionReply,
}: Readonly<{
	onSessionReply?: SessionReplyInterceptor;
}>) {
	const { actions, meta } = useJiraWorkItem();
	const { chatSurface } = useRovoChat();
	const { chatContextBar, externalThinkingMessageId, openAgentChat } = useAsxAgentChatDemo();
	const openedSessionStateRef = useRef<string | null>(null);
	const previousChatSurfaceRef = useRef(chatSurface);
	const rootRef = useRef<HTMLDivElement | null>(null);
	// The launcher renders while the chat panel is closed, and this surface sits
	// in the dialog's `inert` side-panel slot — so host the button on the dialog
	// body instead. That element is `relative`, so it also becomes the button's
	// `offsetParent` for container positioning.
	const [launcherContainer, setLauncherContainer] = useState<HTMLElement | null>(null);
	const activeSession = meta.activeSession;

	useEffect(() => {
		setLauncherContainer(
			rootRef.current?.closest<HTMLElement>("[data-jira-work-item-dialog-body]") ?? null,
		);
	}, []);

	useEffect(() => {
		if (!activeSession) return;
		const sessionStateKey = `${activeSession.id}:${activeSession.status}`;
		if (openedSessionStateRef.current === sessionStateKey) return;
		openedSessionStateRef.current = sessionStateKey;
		openAgentChat({
			agentId: activeSession.agentId,
			agentName: activeSession.agentName,
			issueKey: meta.workItem.code,
			issueSummary: meta.workItem.title,
			intro: getSessionQuestionIntro(activeSession),
			playbackVariant: activeSession.scriptId === "shop-4821-improve-description"
				? activeSession.status === "completed"
					? "static-result"
					: "jira-description-improvement"
				: undefined,
			question: getSessionQuestion(activeSession),
			request: activeSession.command,
			result: getSessionResult(activeSession),
		});
	}, [activeSession, meta.workItem.code, meta.workItem.title, openAgentChat]);

	useEffect(() => {
		const previousChatSurface = previousChatSurfaceRef.current;
		previousChatSurfaceRef.current = chatSurface;
		if (previousChatSurface === "floating" && chatSurface === null) {
			openedSessionStateRef.current = null;
			actions.openSession(null);
		}
	}, [actions, chatSurface]);

	const handleInterceptSubmit = useCallback((text: string) => {
		if (!activeSession) return { handled: false };
		const intercepted = onSessionReply?.(activeSession, text);
		if (intercepted?.handled) {
			const interceptedOnApply = intercepted.onApply;
			const interceptedOnApplyAfterResponse = intercepted.onApplyAfterResponse;
			const preserveCompletedSessionTranscript = () => {
				if (activeSession.scriptId === "shop-4821-improve-description") {
					openedSessionStateRef.current = `${activeSession.id}:completed`;
				}
			};
			return {
				...intercepted,
				onApply: interceptedOnApply
					? async () => {
						preserveCompletedSessionTranscript();
						await interceptedOnApply();
					}
					: undefined,
				onApplyAfterResponse: interceptedOnApplyAfterResponse
					? async () => {
						preserveCompletedSessionTranscript();
						await interceptedOnApplyAfterResponse();
					}
					: undefined,
			};
		}
		const script = SESSION_SCRIPTS[activeSession.scriptId] ?? SESSION_SCRIPTS["general-assist"];
		return {
			handled: true,
			assistantReply: activeSession.status === "waiting"
				? script.resumeMessage
				: "Thanks — I’ll continue with that direction.",
			delayMs: 0,
			onApply: () => actions.replySession(activeSession.id, text),
		};
	}, [actions, activeSession, onSessionReply]);

	return (
		<div
			className="relative h-full min-h-0 [&_[data-rovo-chat-placement=embedded]]:border-l-0"
			ref={rootRef}
		>
			<AsxRovoOverlay
				chatContextBar={chatContextBar}
				externalThinkingMessageId={externalThinkingMessageId}
				launcherContainer={launcherContainer}
				launcherPlacement={LAUNCHER_PLACEMENT}
				onInterceptSubmit={handleInterceptSubmit}
				onLauncherClick={actions.openLatestOrCreateGeneralSession}
				placement="embedded"
			/>
		</div>
	);
}
