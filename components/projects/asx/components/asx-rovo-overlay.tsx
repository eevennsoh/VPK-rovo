"use client";

import { AnimatePresence } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { useRovoChat } from "@/app/contexts";
import RovoFloatingChat from "@/components/projects/rovo-floating-chat/components/rovo-floating-chat";
import FloatingRovoButton from "@/components/projects/shared/components/floating-rovo-button";
import type { ChatContextBarDescriptor } from "@/components/projects/shared/lib/chat-context-bar";

interface AsxRovoOverlayProps {
	chatContextBar?: ChatContextBarDescriptor | null;
	externalThinkingMessageId?: string | null;
	onQuestionAnswer?: () => void;
}

/** Keeps ASX Rovo surfaces in the viewport stacking context above the Gallery dock. */
export function AsxRovoOverlay({
	chatContextBar,
	externalThinkingMessageId,
	onQuestionAnswer,
}: Readonly<AsxRovoOverlayProps>): React.ReactNode {
	const { chatSurface } = useRovoChat();
	const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);

	useEffect(() => {
		setPortalRoot(document.body);
	}, []);

	const handleQuestionAnswer = useCallback(() => ({
		handled: Boolean(onQuestionAnswer),
		assistantReply: onQuestionAnswer ? "Thanks — I’ll continue with that direction." : undefined,
		delayMs: 0,
		onApply: onQuestionAnswer,
	}), [onQuestionAnswer]);

	if (!portalRoot) return null;

	return createPortal(
		<>
			{chatSurface === null ? (
				<FloatingRovoButton ariaLabel="Open Rovo chat" forceVisible product="home" />
			) : null}
			<AnimatePresence>
				{chatSurface === "floating" ? (
					<RovoFloatingChat
						key="floating-chat"
						chatContextBar={chatContextBar}
						externalThinkingMessageId={externalThinkingMessageId}
						hideComposerSourceAndModelControls
						interceptClarificationAnswers={Boolean(onQuestionAnswer)}
						onInterceptSubmit={onQuestionAnswer ? handleQuestionAnswer : undefined}
						showAgentBackButton={false}
						showAgentSelector={false}
						showChatHistory={false}
						showNewChatButton={false}
						suppressCustomAgentTabs
					/>
				) : null}
			</AnimatePresence>
		</>,
		portalRoot,
	);
}
