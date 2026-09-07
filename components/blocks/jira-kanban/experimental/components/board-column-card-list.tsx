"use client";

import { useMemo, type CSSProperties, type ReactNode } from "react";

import { buildScrollMaskStyle } from "@/components/visual/scroll-mask/lib";
import { useHasVerticalOverflow } from "@/components/hooks/use-has-vertical-overflow";
import { token } from "@/lib/tokens";
import { cn } from "@/lib/utils";

import type { KanbanColumnChromeStyles } from "../../column-chrome";
import { BoardEmptyColumnInsertionSlot } from "./board-card-insertion-line";

/**
 * The scrolling card stack of a board column.
 *
 * Split out of `experimental-jira-kanban.tsx` because it owns three concerns
 * that have nothing to do with the column's header or footer: its own overflow
 * measurement, the scroll mask derived from it, and the geometry an insertion
 * seam needs. The column shell just says which cards to render and whether a
 * seam is armed.
 */
export function BoardColumnCardList({
	children,
	chrome,
	columnTitle,
	insertionArmed,
	isEmpty,
}: Readonly<{
	children: ReactNode;
	chrome: KanbanColumnChromeStyles;
	columnTitle: string;
	insertionArmed: boolean;
	isEmpty: boolean;
}>) {
	const { ref, showBottomScrollMask, showTopScrollMask } = useHasVerticalOverflow<HTMLDivElement>();
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
			ref={ref}
			data-jira-kanban-card-list=""
			className={cn(
				"min-w-0 overflow-y-auto has-[[data-session-dragging]]:overflow-visible",
				// The scroll mask fades the top and bottom 3rem, which would wash out an
				// insertion line drawn near a scrolled edge. Stand the mask down while
				// this column is showing one — and ONLY the mask. Dropping
				// `overflow-y-auto` would stop this being a scroll container, and the
				// browser discards the scroll offset of an element that stops scrolling,
				// so every scrolled column would jump to its first card mid-gesture.
				insertionArmed && "[mask-image:none]! [-webkit-mask-image:none]!",
			)}
			style={{
				flexGrow: 1,
				display: "flex",
				flexDirection: "column",
				gap: token("space.100"),
				...scrollMaskStyle,
				...chrome.cardList,
				// Publish the gap an insertion line has to centre itself in. It is
				// chrome-dependent — the default well overrides the base gap, simple
				// keeps it — and a child cannot read its parent's `gap` in CSS, so the
				// resolved value has to be handed down explicitly.
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
