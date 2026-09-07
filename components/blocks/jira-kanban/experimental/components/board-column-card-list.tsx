"use client";

import { useMemo, type CSSProperties, type ReactNode } from "react";

import { useHasVerticalOverflow } from "@/components/hooks/use-has-vertical-overflow";
import { buildScrollMaskStyle } from "@/components/visual/scroll-mask/lib";
import { token } from "@/lib/tokens";
import { cn } from "@/lib/utils";

import type { KanbanColumnChromeStyles } from "../../column-chrome";
import {
	useCreatedCardArrivalScroll,
	type JiraKanbanCreatedCardArrival,
} from "../hooks/use-created-card-arrival";
import { BoardEmptyColumnInsertionSlot } from "./board-card-insertion-line";

/**
 * The scrolling card stack of a board column.
 *
 * Split out of `experimental-jira-kanban.tsx` because it owns concerns the
 * column shell does not: its own overflow measurement, the scroll mask derived
 * from it, the arrival scroll after cards are created, and the geometry an
 * insertion seam needs. The shell just says what to render and whether a seam
 * is armed.
 */
export function BoardColumnCardList({
	children,
	chrome,
	columnTitle,
	count,
	createdCardArrival,
	insertionArmed,
	isEmpty,
}: Readonly<{
	children: ReactNode;
	chrome: KanbanColumnChromeStyles;
	columnTitle: string;
	count: number;
	createdCardArrival?: JiraKanbanCreatedCardArrival;
	insertionArmed: boolean;
	isEmpty: boolean;
}>) {
	const { ref, showBottomScrollMask, showTopScrollMask } = useHasVerticalOverflow<HTMLDivElement>();
	const setCardListRef = useCreatedCardArrivalScroll({
		arrival: createdCardArrival,
		cardCount: count,
		onCardListRef: ref,
		title: columnTitle,
	});
	const scrollMaskStyle = useMemo(
		() => buildScrollMaskStyle({
			fadeBottom: showBottomScrollMask,
			fadeSize: "3rem",
			fadeTop: showTopScrollMask,
			scrollbarWidth: 0,
		}),
		[showBottomScrollMask, showTopScrollMask],
	);

	return (
		<div
			ref={setCardListRef}
			data-created-card-arrival-id={createdCardArrival?.id}
			data-jira-kanban-card-list=""
			className={cn(
				"min-w-0 overflow-y-auto has-[[data-session-dragging]]:overflow-visible",
				// The mask fades the top and bottom 3rem, which would wash out a line
				// drawn near a scrolled edge. Stand down the mask only — dropping
				// `overflow-y-auto` would make the browser discard the scroll offset.
				insertionArmed && "[mask-image:none]! [-webkit-mask-image:none]!",
			)}
			style={{
				// An empty column puts its create action first, so the always-visible
				// well reads as the column's content rather than sitting under a void.
				order: isEmpty ? 1 : 0,
				flexGrow: 1,
				display: "flex",
				flexDirection: "column",
				gap: token("space.100"),
				...scrollMaskStyle,
				...chrome.cardList,
				// A child cannot read its parent's `gap`, and the value is chrome
				// dependent, so an insertion line is handed the track it centres in.
				"--board-card-gap": chrome.cardList.gap ?? token("space.100"),
			} as CSSProperties}
		>
			{isEmpty ? (
				<BoardEmptyColumnInsertionSlot armed={insertionArmed} columnTitle={columnTitle} />
			) : null}
			{children}
		</div>
	);
}
