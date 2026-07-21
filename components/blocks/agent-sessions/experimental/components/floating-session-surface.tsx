"use client";

import { useCallback, useEffect, useRef } from "react";

import { useRovoChat } from "@/app/contexts";
import { useAgentSessions } from "@/components/blocks/agent-sessions/experimental/context-agent-sessions";
import type { AgentSession } from "@/components/blocks/agent-sessions/data/session-state";
import { SESSION_SCRIPTS } from "@/components/blocks/agent-sessions/data/session-scripts";
import { AsxRovoOverlay } from "@/components/projects/asx/components/asx-rovo-overlay";
import { useAsxAgentChatDemo } from "@/components/projects/asx/hooks/use-asx-agent-chat-demo";

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
 * Bridges the block-local session model into the shared Jira Issue floating
 * Rovo chat. Agent Sessions owns the deterministic session lifecycle; the
 * existing Rovo surface owns all visible chat chrome, transcript, and composer.
 */
export function FloatingSessionSurface() {
	const { actions, meta } = useAgentSessions();
	const { chatSurface } = useRovoChat();
	const { chatContextBar, externalThinkingMessageId, openAgentChat } = useAsxAgentChatDemo();
	const openedSessionIdRef = useRef<string | null>(null);
	const previousChatSurfaceRef = useRef(chatSurface);
	const activeSession = meta.activeSession;

	useEffect(() => {
		if (!activeSession || openedSessionIdRef.current === activeSession.id) return;
		openedSessionIdRef.current = activeSession.id;
		openAgentChat({
			agentId: activeSession.agentId,
			agentName: activeSession.agentName,
			issueKey: meta.workItem.code,
			issueSummary: meta.workItem.title,
			intro: getSessionQuestionIntro(activeSession),
			question: getSessionQuestion(activeSession),
			request: activeSession.command,
			result: getSessionResult(activeSession),
		});
	}, [activeSession, meta.workItem.code, meta.workItem.title, openAgentChat]);

	useEffect(() => {
		const previousChatSurface = previousChatSurfaceRef.current;
		previousChatSurfaceRef.current = chatSurface;
		if (previousChatSurface === "floating" && chatSurface === null) {
			openedSessionIdRef.current = null;
			actions.openSession(null);
		}
	}, [actions, chatSurface]);

	const handleInterceptSubmit = useCallback((text: string) => {
		if (!activeSession) return { handled: false };
		const script = SESSION_SCRIPTS[activeSession.scriptId] ?? SESSION_SCRIPTS["general-assist"];
		return {
			handled: true,
			assistantReply: activeSession.status === "waiting"
				? script.resumeMessage
				: "Thanks — I’ll continue with that direction.",
			delayMs: 0,
			onApply: () => actions.replySession(activeSession.id, text),
		};
	}, [actions, activeSession]);

	return (
		<AsxRovoOverlay
			chatContextBar={chatContextBar}
			externalThinkingMessageId={externalThinkingMessageId}
			onInterceptSubmit={handleInterceptSubmit}
			onLauncherClick={actions.openLatestOrCreateGeneralSession}
		/>
	);
}
