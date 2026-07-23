"use client";

import { AnimatePresence } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { useRovoChat } from "@/app/contexts";
import RovoFloatingChat from "@/components/projects/rovo-floating-chat/components/rovo-floating-chat";
import type { ChatSubmitInterceptOutcome } from "@/components/projects/sidebar-chat/page";
import FloatingRovoButton from "@/components/projects/shared/components/floating-rovo-button";
import type { ChatContextBarDescriptor } from "@/components/projects/shared/lib/chat-context-bar";

interface JgpRovoOverlayProps {
	chatContextBar?: ChatContextBarDescriptor | null;
	externalThinkingMessageId?: string | null;
	onInterceptSubmit?: (text: string) => ChatSubmitInterceptOutcome;
	onLauncherClick?: () => void;
	onQuestionAnswer?: () => void;
}

/** Keeps JGP Rovo surfaces in the viewport stacking context above the Gallery dock. */
export function JgpRovoOverlay({
	chatContextBar,
	externalThinkingMessageId,
	onInterceptSubmit,
	onLauncherClick,
	onQuestionAnswer,
}: Readonly<JgpRovoOverlayProps>): React.ReactNode {
	const { chatSurface } = useRovoChat();
	const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);
	const [isRovoCanvasOpen, setIsRovoCanvasOpen] = useState(false);

	useEffect(() => {
		setPortalRoot(document.body);

		const updateRovoCanvasOpen = () => {
			setIsRovoCanvasOpen(document.documentElement.dataset.rovoCanvasOpen === "true");
		};
		updateRovoCanvasOpen();

		const observer = new MutationObserver(updateRovoCanvasOpen);
		observer.observe(document.documentElement, {
			attributeFilter: ["data-rovo-canvas-open"],
			attributes: true,
		});

		return () => observer.disconnect();
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
			{chatSurface === null && !isRovoCanvasOpen ? (
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
					/>
				) : null}
			</AnimatePresence>
		</>,
		portalRoot,
	);
}
