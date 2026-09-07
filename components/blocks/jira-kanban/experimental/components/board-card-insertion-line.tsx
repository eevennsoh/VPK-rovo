"use client";

import AddIcon from "@atlaskit/icon/core/add";

import { Icon } from "@/components/ui/icon";
import { token } from "@/lib/tokens";
import { cn } from "@/lib/utils";

import type { BoardCardInsertion } from "../lib/board-agent-session-drag";

/**
 * The board analogue of the list view's `getInsertionLineClassName`
 * (`components/blocks/jira-list/jira-list-dnd.ts`): the 2px accent rule that
 * shows where an untracked agent session will land when it is dropped in the
 * gap between two kanban cards.
 *
 * Two exports rather than one, because the anchor and the paint live on
 * different owners:
 *
 * - `getBoardCardInsertionAnchorClassName` returns `relative` for the card
 *   wrapper. The wrapper is a flex item in the column stack and is NOT
 *   positioned at rest, so an absolutely positioned child would otherwise
 *   escape to some far ancestor. Shipping `relative` only while the line shows
 *   keeps every other card's paint order untouched.
 * - `BoardCardInsertionLine` is the line itself. It is absolutely positioned,
 *   so it adds no flex child, consumes no `gap` track, and changes no card's
 *   size — the gesture must show where the card *will* go without moving
 *   anything that is already on the board.
 *
 * Both are driven by the same `position`, so the wiring agent computes it once
 * per card and passes it to both.
 */
export function getBoardCardInsertionAnchorClassName(
	position: BoardCardInsertion["position"] | undefined,
): string | undefined {
	return position ? "relative" : undefined;
}

/**
 * The single insertion seam of a column that holds no cards.
 *
 * Card seams normally ride the per-card wrappers, so a column emptied by the
 * assignee filter — or one that simply has nothing in it — would emit no gap at
 * all and swallow the drop. This stand-in fills the card list, publishes the
 * one gap the column has, and draws the line for it.
 */
export function BoardEmptyColumnInsertionSlot({
	armed,
	columnTitle,
}: Readonly<{ armed: boolean; columnTitle: string }>) {
	return (
		<div
			className="relative min-h-8 flex-1"
			data-board-agent-session-drop-zone="card-gap"
			data-board-column-title={columnTitle}
		>
			{armed ? <BoardCardInsertionLine position="before" seam="edge" /> : null}
		</div>
	);
}

/**
 * Where the rule sits relative to the card it rides.
 *
 * - `gap` — an interior seam, with a real `gap` track between two cards. The
 *   rule centres itself in that track so it reads as belonging to the space
 *   between the cards rather than to either one of them.
 * - `edge` — the leading seam of the first card or the trailing seam of the
 *   last. There is no gap track there, only the card list's own boundary, and
 *   the list stays a real scrollport for the whole gesture (dropping
 *   `overflow-y-auto` would make the browser discard its scroll offset and
 *   jump every scrolled column to its first card). So these sit flush inside
 *   the card, where nothing can clip them at any scroll position.
 */
export type BoardCardInsertionSeam = "edge" | "gap";

const EDGE_POSITION_CLASS_NAME: Record<BoardCardInsertion["position"], string> = {
	after: "bottom-0",
	before: "top-0",
};

/**
 * Half the gap, minus half the rule's own 2px height, so the rule's centre
 * line lands on the gap's centre line.
 *
 * `--board-card-gap` is published by the card list because the value is
 * chrome-dependent — 4px on the default well, 8px on simple — so there is no
 * single offset to hard-code here. The fallback matches the base `gap` the
 * card list declares before chrome overrides it.
 */
const GAP_CENTRED_OFFSET = "calc(var(--board-card-gap, 8px) / -2 - 1px)";

export function BoardCardInsertionLine({
	position,
	seam,
}: Readonly<{ position: BoardCardInsertion["position"]; seam: BoardCardInsertionSeam }>) {
	return (
		<div
			aria-hidden
			className={cn(
				"pointer-events-none absolute inset-x-0 z-30 h-0.5 bg-border-selected",
				// `animate-in` drives the mount fade (a bare transition cannot animate a
				// freshly mounted node); the `transition-opacity` pair keeps any parent-driven
				// opacity change eased. Both need their own reduced-motion escape.
				"animate-in fade-in-0 duration-fast ease-out-practical motion-reduce:animate-none",
				"transition-opacity duration-fast ease-out-practical motion-reduce:transition-none",
				seam === "edge" ? EDGE_POSITION_CLASS_NAME[position] : undefined,
			)}
			data-insertion-line={position}
			data-insertion-seam={seam}
			style={seam === "gap" ? { [position === "before" ? "top" : "bottom"]: GAP_CENTRED_OFFSET } : undefined}
		>
			{/*
			 * The "+" anchoring the rule's left end, matching the list view's
			 * `RowBoundaryCreateControls` treatment: a 24px outline square on the
			 * overlay surface with a subtle icon — not an accent-coloured circle.
			 *
			 * Inert on purpose: the affordance here is the drag itself, so there is
			 * nothing to click and nothing to focus. That is also why it is a `span`
			 * and not `components/ui/button` — `Button` renders a real focusable Base
			 * UI `<button>`, and a focusable node inside `aria-hidden` is an
			 * accessibility violation. The list's tooltip goes with the button.
			 *
			 * `left-0` keeps it inside the card horizontally. The list can hang its
			 * control fully outside because it lives in an anchor-positioned overlay;
			 * here the card list clips the inline axis too (`overflow-y-auto` computes
			 * `overflow-x` to `auto`), so a half-outside marker would be cut.
			 */}
			<span
				className="absolute left-0 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-md border border-border bg-surface-overlay"
				data-board-insertion-marker={position}
				style={{ boxShadow: token("elevation.shadow.overlay") }}
			>
				{/*
				 * ADS icons ship unlayered Compiled CSS, so a Tailwind text colour
				 * utility on the wrapper loses the cascade — the colour has to be the
				 * icon's own prop.
				 */}
				<Icon render={<AddIcon color={token("color.icon.subtle")} label="" size="small" />} />
			</span>
		</div>
	);
}
