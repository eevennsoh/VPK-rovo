"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Hover-reveal row interaction.
 *
 * A list row whose trailing controls (a toggle, an edit/delete action) stay
 * hidden until the row is hovered or keyboard-focused, while the label
 * **dynamically truncates** to clear those controls — and re-expands when they
 * hide — instead of being overlapped by them.
 *
 * ## Usage contract
 *
 * 1. Put {@link hoverRevealRowClassName} on the row's **relative** container
 *    (a Base UI `Menu.Item`, a non-interactive `<div>`, …).
 * 2. Render {@link HoverRevealLabel} for the truncating label.
 * 3. Render {@link HoverRevealActions} for the trailing controls.
 *
 * Rows with revealed controls should keep activation on the controls
 * themselves. Do not make the label surface a catch-all row button when users
 * need to intentionally choose the switch or the action button.
 *
 * Both `HoverRevealLabel` and `HoverRevealActions` MUST be **descendants** of
 * the container, because the reveal + padding-reserve are keyed off the
 * `group/hover-reveal-row` group. A `group-hover/…` utility placed on the group
 * element *itself* never matches — it only matches descendants — which is the
 * exact trap this primitive exists to avoid.
 */

/** Container class: establishes the positioning context + the hover/focus group. */
export const hoverRevealRowClassName = "group/hover-reveal-row relative";

// Reserved right-padding so the label truncates clear of the trailing controls.
// One ~24px control slot at `right-1.5` (6px inset) → pr-8; two → pr-[66px]. The
// 6px inset matches the rows' 6px vertical padding so the trailing control looks
// evenly inset on all sides. The two-slot reserve clears a switch parked at
// `right-[34px]` plus the action slot with a few px of breathing room so the
// ellipsis sits visibly left of the toggle. Written as literal strings (not
// template literals) so Tailwind's static extraction can see them.
const RESERVE_AT_REST = {
	0: "",
	1: "pr-8",
	2: "pr-[66px]",
} as const;

const RESERVE_ON_REVEAL = {
	1: "group-hover/hover-reveal-row:pr-8 group-has-[:focus-visible]/hover-reveal-row:pr-8",
	2: "group-hover/hover-reveal-row:pr-[66px] group-has-[:focus-visible]/hover-reveal-row:pr-[66px]",
} as const;

export interface HoverRevealLabelProps {
	children: ReactNode;
	/** Control slots to clear once the controls reveal on hover/focus (1 or 2). */
	reserveOnReveal?: 1 | 2;
	/**
	 * Control slots already visible at rest (0–2). Use `1` when a control stays
	 * parked at rest — e.g. an "off" switch — so the label doesn't sit under it
	 * before the row is hovered. Defaults to `0` (full-width label at rest).
	 */
	reserveAtRest?: 0 | 1 | 2;
	className?: string;
}

/**
 * Truncating row label. Reserves right-padding so the text ellipsises clear of
 * the trailing controls: nothing at rest by default (full label), growing on
 * hover/keyboard-focus. The reveal reserve has higher specificity (`:hover` /
 * `:has`) so it wins over the rest reserve when both apply.
 */
export function HoverRevealLabel({
	children,
	reserveOnReveal = 1,
	reserveAtRest = 0,
	className,
}: Readonly<HoverRevealLabelProps>) {
	return (
		<span
			className={cn(
				"block w-full truncate transition-[padding] duration-normal ease-out",
				RESERVE_AT_REST[reserveAtRest],
				RESERVE_ON_REVEAL[reserveOnReveal],
				className,
			)}
		>
			{children}
		</span>
	);
}

export interface HoverRevealActionsProps {
	/**
	 * Primary toggle (e.g. a `Switch`). Reveals on hover/focus like `action`,
	 * unless `toggleParked` keeps it visible at rest.
	 */
	toggle?: ReactNode;
	/**
	 * Keep `toggle` visible at rest, parked at the far-right edge (so an off /
	 * disabled state stays discoverable without hovering).
	 */
	toggleParked?: boolean;
	/** Secondary action (e.g. an edit / delete button). Always reveal-only. */
	action?: ReactNode;
}

/**
 * Trailing controls overlay for a hover-reveal row. Absolutely positioned, so it
 * never participates in label layout. The toggle parks at the far right
 * (`right-1.5`, a 6px inset matching the rows' vertical padding) and slides left
 * to `right-[34px]` to clear the `action` slot as the action reveals, keeping
 * both choreographed in lockstep on hover-in and hover-out. The 24px action
 * button parks at `right-1.5` (6px from the row edge, even with top/bottom), and
 * the slid toggle sits 4px to its left.
 */
export function HoverRevealActions({
	toggle,
	toggleParked = false,
	action,
}: Readonly<HoverRevealActionsProps>) {
	return (
		<>
			{toggle ? (
				<div
					className={cn(
						"absolute top-1/2 flex -translate-y-1/2 items-center transition-[right,opacity] duration-normal ease-out group-hover/hover-reveal-row:opacity-100 group-has-[:focus-visible]/hover-reveal-row:opacity-100",
						action
							? "right-1.5 group-hover/hover-reveal-row:right-[34px] group-has-[:focus-visible]/hover-reveal-row:right-[34px]"
							: "right-1.5",
						toggleParked ? "opacity-100" : "opacity-0",
					)}
				>
					{toggle}
				</div>
			) : null}
			{action ? (
				<div className="absolute right-1.5 top-1/2 flex -translate-y-1/2 translate-x-2 items-center opacity-0 transition-[opacity,transform] duration-normal ease-out group-hover/hover-reveal-row:translate-x-0 group-hover/hover-reveal-row:opacity-100 group-has-[:focus-visible]/hover-reveal-row:translate-x-0 group-has-[:focus-visible]/hover-reveal-row:opacity-100">
					{action}
				</div>
			) : null}
		</>
	);
}
