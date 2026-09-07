"use client";

import {
	useCallback,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
	type RefCallback,
} from "react";

import type { AgentSessionItem } from "@/components/blocks/agent-session";

export interface JiraKanbanCreatedCardArrival {
	readonly id: number;
	readonly columnTitle: string;
	readonly cardCodes: readonly string[];
}

const JIRA_KANBAN_CREATED_CARD_BACKDROP_HOLD_MS = 600; // duration-slowest

export function useBoardCreatedCardArrival({
	captureSession,
	onCreate,
}: Readonly<{
	captureSession: (session: AgentSessionItem) => void;
	onCreate?: (session: AgentSessionItem, columnTitle: string) => string | undefined;
}>) {
	const [createdCardArrival, setCreatedCardArrival] = useState<JiraKanbanCreatedCardArrival | null>(null);
	const createdCardArrivalIdRef = useRef(0);

	const handleCreate = useCallback((session: AgentSessionItem, columnTitle: string) => {
		if (onCreate === undefined) return;

		captureSession(session);
		const cardCode = onCreate(session, columnTitle);
		if (cardCode === undefined) return;

		createdCardArrivalIdRef.current += 1;
		const id = createdCardArrivalIdRef.current;
		setCreatedCardArrival((current) => (
			current?.columnTitle === columnTitle
				? { id, columnTitle, cardCodes: [...current.cardCodes, cardCode] }
				: { id, columnTitle, cardCodes: [cardCode] }
		));
	}, [captureSession, onCreate]);

	const handleComplete = useCallback((arrivalId: number) => {
		setCreatedCardArrival((current) => current?.id === arrivalId ? null : current);
	}, []);

	return { createdCardArrival, handleComplete, handleCreate };
}

export function useCreatedCardArrivalCompletion(
	onComplete: ((arrivalId: number) => void) | undefined,
): (arrivalId: number) => void {
	const completedIdsRef = useRef(new Set<number>());
	const holdTimeoutRef = useRef<number | null>(null);

	useEffect(() => () => {
		if (holdTimeoutRef.current !== null) {
			window.clearTimeout(holdTimeoutRef.current);
		}
	}, []);

	return useCallback((arrivalId: number) => {
		if (completedIdsRef.current.has(arrivalId)) return;
		completedIdsRef.current.add(arrivalId);
		if (holdTimeoutRef.current !== null) {
			window.clearTimeout(holdTimeoutRef.current);
		}
		holdTimeoutRef.current = window.setTimeout(() => {
			holdTimeoutRef.current = null;
			onComplete?.(arrivalId);
		}, JIRA_KANBAN_CREATED_CARD_BACKDROP_HOLD_MS);
	}, [onComplete]);
}

export function useCreatedCardArrivalScroll({
	arrival,
	cardCount,
	onCardListRef,
	title,
}: Readonly<{
	arrival?: JiraKanbanCreatedCardArrival;
	cardCount: number;
	onCardListRef: RefCallback<HTMLDivElement>;
	title: string;
}>): RefCallback<HTMLDivElement> {
	const cardListElementRef = useRef<HTMLDivElement | null>(null);
	const lastScrolledArrivalIdRef = useRef<number | null>(null);
	const setCardListRef = useCallback((node: HTMLDivElement | null) => {
		cardListElementRef.current = node;
		onCardListRef(node);
	}, [onCardListRef]);

	useLayoutEffect(() => {
		if (
			arrival === undefined
			|| arrival.columnTitle !== title
			|| arrival.cardCodes.length === 0
			|| lastScrolledArrivalIdRef.current === arrival.id
		) return;

		const cardList = cardListElementRef.current;
		if (cardList === null) return;
		const arrivedCardCount = cardList.querySelectorAll(
			`[data-created-card-arrival-id="${arrival.id}"]`,
		).length;
		if (arrivedCardCount < arrival.cardCodes.length) return;

		cardList.scrollTo({ behavior: "auto", top: cardList.scrollHeight });
		lastScrolledArrivalIdRef.current = arrival.id;
	}, [arrival, cardCount, title]);

	return setCardListRef;
}
