"use client";

import { useReducedMotion } from "motion/react";
import { useEffect, useLayoutEffect, useRef } from "react";
import { useConversationContext } from "@/components/ui-custom/conversation";
type RovoAppScrollAnchorTarget = "bottom" | "follow";

export function RovoAppScrollAnchorSync({
	scrollAnchorMessageId,
	target = "follow",
}: Readonly<{
	scrollAnchorMessageId: string | null;
	target?: RovoAppScrollAnchorTarget;
}>) {
	const { scrollToBottom } = useConversationContext();
	const shouldReduceMotion = useReducedMotion();
	const didInitialScrollRef = useRef(false);
	const latestArgsRef = useRef({ scrollAnchorMessageId, target, scrollToBottom });

	useEffect(() => {
		latestArgsRef.current = { scrollAnchorMessageId, target, scrollToBottom };
	});

	// First-mount scroll happens synchronously before paint so long threads
	// don't briefly show their top before jumping to the anchor.
	useLayoutEffect(() => {
		if (didInitialScrollRef.current) return;
		const { scrollAnchorMessageId: id, target: anchorTarget, scrollToBottom: scroll } = latestArgsRef.current;
		if (!id) return;

		didInitialScrollRef.current = true;
		void scroll({
			animation: "instant",
			ignoreEscapes: true,
			target: anchorTarget,
		});
	}, []);

	useEffect(() => {
		if (!scrollAnchorMessageId) {
			return;
		}

		if (!didInitialScrollRef.current) {
			didInitialScrollRef.current = true;
			return;
		}

		void scrollToBottom({
			animation: target === "bottom" || shouldReduceMotion ? "instant" : "smooth",
			ignoreEscapes: true,
			target,
		});
	}, [scrollAnchorMessageId, scrollToBottom, shouldReduceMotion, target]);

	return null;
}

export function RovoAppScrollActiveTracker({
	onActiveChange,
}: Readonly<{
	onActiveChange: (messageId: string | null) => void;
}>) {
	const { scrollRef } = useConversationContext();
	const onActiveChangeRef = useRef(onActiveChange);

	useEffect(() => {
		onActiveChangeRef.current = onActiveChange;
	});

	useEffect(() => {
		const scrollElement = scrollRef.current;
		if (!scrollElement) return;

		function handleScroll() {
			const container = scrollRef.current;
			if (!container) return;

			const containerRect = container.getBoundingClientRect();
			const threshold = containerRect.top + containerRect.height * 0.3;
			const userMessageNodes = container.querySelectorAll<HTMLElement>("[data-message-id][data-role='user']");

			let activeId: string | null = null;
			for (const node of userMessageNodes) {
				const nodeRect = node.getBoundingClientRect();
				if (nodeRect.top <= threshold) {
					activeId = node.getAttribute("data-message-id");
				}
			}

			// When scrolled to top, prefer the first user message so it can still
			// become active when several messages sit above the threshold.
			if (userMessageNodes.length > 0 && container.scrollTop <= 10) {
				activeId = userMessageNodes[0].getAttribute("data-message-id");
			}

			onActiveChangeRef.current(activeId);
		}

		handleScroll();
		scrollElement.addEventListener("scroll", handleScroll, { passive: true });
		return () => scrollElement.removeEventListener("scroll", handleScroll);
	}, [scrollRef]);

	return null;
}
