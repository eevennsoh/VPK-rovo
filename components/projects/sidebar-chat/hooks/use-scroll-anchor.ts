"use client";

import { useRef, useEffect, useLayoutEffect, useMemo, useReducer } from "react";
import type {
	ConversationContextValue,
	ConversationFollowMode,
	GetTargetScrollTop,
	ScrollToBottomOptions,
} from "@/components/ui-custom/conversation";
import {
	getLatestUserMessageId,
} from "@/lib/rovo-ui-messages";
import type { RovoUIMessage } from "@/lib/rovo-ui-messages";
import { resolveRovoAppScrollAnchorLayout } from "@/components/projects/rovo-core/lib/rovo-app-scroll-anchor";

const LATEST_TURN_SELECTOR = "[data-chat-latest-turn='true']";
const FAST_TURN_SCROLL_ANIMATION = {
	damping: 0.72,
	stiffness: 0.1,
	mass: 0.9,
} as const;

interface UseScrollAnchorOptions {
	enableTargetFollow?: boolean;
	uiMessages: ReadonlyArray<RovoUIMessage>;
	isGenerationActive: boolean;
}

interface UseScrollAnchorReturn {
	conversationContextRef: React.RefObject<ConversationContextValue | null>;
	scrollSpacerRef: React.RefObject<HTMLDivElement | null>;
	getLatestTurnTargetTop: GetTargetScrollTop;
	scrollFollowMode: ConversationFollowMode;
}

interface ScrollAnchorState {
	messageId: string | null;
	mode: ConversationFollowMode;
}

type ScrollAnchorAction =
	| { type: "follow-bottom" }
	| { type: "follow-target"; messageId: string };

function reduceScrollAnchor(
	_state: ScrollAnchorState,
	action: ScrollAnchorAction,
): ScrollAnchorState {
	switch (action.type) {
		case "follow-bottom":
			return { messageId: null, mode: "bottom" };
		case "follow-target":
			return { messageId: action.messageId, mode: "target" };
		default:
			return _state;
	}
}

// useLayoutEffect cannot run during SSR; fall back to useEffect on the server.
const useIsomorphicLayoutEffect =
	typeof window === "undefined" ? useEffect : useLayoutEffect;

export function useScrollAnchor({
	enableTargetFollow = true,
	isGenerationActive,
	uiMessages,
}: Readonly<UseScrollAnchorOptions>): UseScrollAnchorReturn {
	const conversationContextRef = useRef<ConversationContextValue | null>(null);
	const scrollSpacerRef = useRef<HTMLDivElement>(null);
	const hasInitializedScrollRef = useRef(false);
	const didInitialScrollRef = useRef(false);
	const previousLatestUserMessageIdRef = useRef<string | null>(null);
	const pendingAnchorScrollAnimationRef = useRef<ScrollToBottomOptions["animation"]>("instant");
	const [{ messageId: scrollAnchorMessageId, mode: scrollFollowMode }, dispatchScrollAnchor] = useReducer(
		reduceScrollAnchor,
		{ messageId: null, mode: "bottom" },
	);

	const latestUserMessageId = useMemo(
		() => getLatestUserMessageId(uiMessages),
		[uiMessages]
	);

	// First-mount scroll-to-bottom runs synchronously before paint so long
	// threads don't briefly show their top before jumping. Subsequent scrolls
	// stay in useEffect below to avoid blocking paint while streaming.
	useIsomorphicLayoutEffect(() => {
		if (didInitialScrollRef.current) return;
		const scrollElement = conversationContextRef.current?.scrollRef.current;
		if (!scrollElement) return;

		didInitialScrollRef.current = true;
		void conversationContextRef.current?.scrollToBottom({
			animation: "instant",
			ignoreEscapes: true,
		});
	}, []);

	useEffect(() => {
		const scrollElement = conversationContextRef.current?.scrollRef.current;
		if (!scrollElement) {
			return;
		}

		const hasLatestUserMessage = latestUserMessageId !== null;
		const hasNewUserTurn =
			hasInitializedScrollRef.current &&
			hasLatestUserMessage &&
			latestUserMessageId !== previousLatestUserMessageIdRef.current;
		const shouldActivateTargetFollow =
			enableTargetFollow &&
			isGenerationActive &&
			hasLatestUserMessage &&
			(
				!hasInitializedScrollRef.current ||
				hasNewUserTurn ||
				scrollAnchorMessageId !== latestUserMessageId ||
				scrollFollowMode !== "target"
			);

		if (shouldActivateTargetFollow) {
			pendingAnchorScrollAnimationRef.current = hasInitializedScrollRef.current
				? FAST_TURN_SCROLL_ANIMATION
				: "instant";
			dispatchScrollAnchor({ type: "follow-target", messageId: latestUserMessageId });
		} else if (!isGenerationActive && scrollFollowMode !== "bottom") {
			dispatchScrollAnchor({ type: "follow-bottom" });
		}

		// First-mount scroll already ran in useLayoutEffect above; only run
		// fallback scrolls for subsequent renders where target-follow is not
		// activating.
		if (
			didInitialScrollRef.current &&
			!hasInitializedScrollRef.current &&
			!shouldActivateTargetFollow
		) {
			void conversationContextRef.current?.scrollToBottom({
				animation: "instant",
				ignoreEscapes: true,
			});
		}

		previousLatestUserMessageIdRef.current = latestUserMessageId;
		hasInitializedScrollRef.current = true;
	}, [
		enableTargetFollow,
		isGenerationActive,
		latestUserMessageId,
		scrollAnchorMessageId,
		scrollFollowMode,
		uiMessages.length,
	]);

	useEffect(() => {
		if (scrollFollowMode !== "target" || !scrollAnchorMessageId) {
			return;
		}

		const frameId = window.requestAnimationFrame(() => {
			void conversationContextRef.current?.scrollToBottom({
				animation: pendingAnchorScrollAnimationRef.current,
				ignoreEscapes: true,
			});
		});

		return () => window.cancelAnimationFrame(frameId);
	}, [scrollAnchorMessageId, scrollFollowMode]);

	useEffect(() => {
		if (scrollFollowMode !== "bottom" || !scrollSpacerRef.current) {
			return;
		}

		scrollSpacerRef.current.style.height = "0px";
	}, [scrollFollowMode]);

	const getLatestTurnTargetTop = useMemo<GetTargetScrollTop>(
		() => (defaultTargetTop, { scrollElement }) => {
			const latestTurnElement = scrollElement.querySelector<HTMLElement>(
				LATEST_TURN_SELECTOR
			);
			if (!latestTurnElement) {
				if (scrollSpacerRef.current) {
					scrollSpacerRef.current.style.height = "0px";
				}
				return defaultTargetTop;
			}

			const scrollRect = scrollElement.getBoundingClientRect();
			const latestTurnRect = latestTurnElement.getBoundingClientRect();
			const { spacerHeight, targetScrollTop } = resolveRovoAppScrollAnchorLayout({
				anchorOffsetTop: latestTurnRect.top - scrollRect.top,
				clientHeight: scrollElement.clientHeight,
				currentSpacerHeight: scrollSpacerRef.current?.offsetHeight ?? 0,
				defaultTargetTop,
				scrollHeight: scrollElement.scrollHeight,
				scrollTop: scrollElement.scrollTop,
			});

			if (scrollSpacerRef.current) {
				scrollSpacerRef.current.style.height = `${spacerHeight}px`;
			}

			return targetScrollTop;
		},
		[]
	);

	return {
		conversationContextRef,
		scrollSpacerRef,
		getLatestTurnTargetTop,
		scrollFollowMode,
	};
}
