"use client";

import { AnimatePresence } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { useRovoChat } from "@/app/contexts";
import RovoFloatingChat from "@/components/projects/rovo-floating-chat/components/rovo-floating-chat";
import type { ChatSubmitInterceptOutcome } from "@/components/projects/sidebar-chat/page";
import FloatingRovoButton from "@/components/projects/shared/components/floating-rovo-button";
import type { ChatContextBarDescriptor } from "@/components/projects/shared/lib/chat-context-bar";

interface AsxRovoOverlayProps {
	chatContextBar?: ChatContextBarDescriptor | null;
	externalThinkingMessageId?: string | null;
	onInterceptSubmit?: (text: string) => ChatSubmitInterceptOutcome;
	onLauncherClick?: () => void;
	onQuestionAnswer?: () => void;
	placement?: "embedded" | "floating";
}

/** Keeps ASX Rovo surfaces in their requested viewport or embedded stacking context. */
export function AsxRovoOverlay({
	chatContextBar,
	externalThinkingMessageId,
	onInterceptSubmit,
	onLauncherClick,
	onQuestionAnswer,
	placement = "floating",
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

	const content = (
		<>
			{chatSurface === null && placement === "floating" ? (
				<FloatingRovoButton
					ariaLabel="Open Rovo chat"
					forceVisible
					onButtonClick={onLauncherClick}
					product="home"
				/>
			) : null}
			<AnimatePresence>
				{chatSurface === "floating" ? (
					<RovoFloatingChat
						key="floating-chat"
						chatContextBar={chatContextBar}
						externalThinkingMessageId={externalThinkingMessageId}
						hideComposerSourceAndModelControls
						interceptClarificationAnswers={Boolean(onInterceptSubmit || onQuestionAnswer)}
						onInterceptSubmit={onInterceptSubmit ?? (onQuestionAnswer ? handleQuestionAnswer : undefined)}
						showAgentBackButton={false}
						showAgentSelector={false}
						showChatHistory={false}
						showNewChatButton={false}
						suppressCustomAgentTabs
						placement={placement}
					/>
				) : null}
			</AnimatePresence>
		</>
	);

	if (placement === "embedded") {
		return (
			<>
				{portalRoot && chatSurface === null ? createPortal(
					<FloatingRovoButton
						ariaLabel="Open Rovo chat"
						forceVisible
						onButtonClick={onLauncherClick}
						product="home"
					/>,
					portalRoot,
				) : null}
				{content}
			</>
		);
	}

	return portalRoot ? createPortal(content, portalRoot) : null;
}
