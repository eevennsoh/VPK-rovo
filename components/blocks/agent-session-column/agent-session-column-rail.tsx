"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";

import GrowHorizontalIcon from "@atlaskit/icon/core/grow-horizontal";

import { toAgentSessionFlyoutItem, type AgentListState } from "@/components/blocks/agent-list";
import type { AgentSessionItem } from "@/components/blocks/agent-session";
import {
	createJiraSessionFlyoutHandle,
	JiraSessionFlyoutSurface,
	JiraSessionFlyoutTrigger,
	type JiraSessionFlyoutHandle,
} from "@/components/blocks/product-sidebar/variants/jira-session-flyout";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import TextMorphing from "@/components/visual/text-morphing";
import type { TextMorphConfig } from "@/components/visual/text-morphing/data";
import { cn } from "@/lib/utils";

/**
 * The collapsed form of the Agent Session column.
 *
 * The board's status columns collapse into a vertical pill that reads its title
 * top-to-bottom, because a status is a label and nothing else — there is nothing
 * in "In review" worth previewing at 32px. This column is different: its
 * contents are sessions, each of which is a live thing worth reaching, so it
 * collapses into a rail of notches instead of a label — one notch per session,
 * in list order.
 *
 * The notch is the same idea as a Pulse ruler mark: a mini rule that swells
 * under the pointer and names the thing behind it. Here the name is the full
 * session flyout — the same payload-driven surface Agent List rows open — so the
 * collapsed column loses the cards but keeps every session one hover away.
 *
 * A notch paints one distinction only: reviewed or not. Reviewed notches rest
 * quiet and light up on hover; a newly synced one is simply already lit, as
 * though the rail were holding the hover open for you. Session lifecycle is
 * spoken rather than painted — at 12×2px a fourth hue was a legend to memorise,
 * and the flyout carries the state the moment you reach for it.
 *
 * The rail is full height and, because the board pins this column outside its
 * horizontal scrollport, it stays put while the reader scrolls to the last
 * status column.
 */

/** Spoken state, so the rail still names a lifecycle it no longer paints. */
const NOTCH_STATE_LABEL: Record<AgentListState, string> = {
	attention: "needs attention",
	complete: "complete",
	"needs-input": "needs input",
	running: "running",
};

/**
 * The magnitude a notch swells to under the pointer.
 *
 * A newly synced notch simply rests here instead: "new" is the rail already
 * holding the gesture open for you, rather than a separate mark you have to
 * learn. One vocabulary, two triggers.
 */
const NOTCH_EMPHASIS = "scale-x-[1.6] bg-icon";

/**
 * Rest appearance of a reviewed notch: quiet until pointed at.
 *
 * Only two properties ever move — colour and scale — so the reveal reads as one
 * gesture at the list-item interaction profile.
 */
const NOTCH_AT_REST = cn(
	"bg-icon-subtlest",
	// `group-has-[:focus-visible]`, not `group-focus-visible`: the group is the
	// row, and the button inside it is what takes focus.
	"group-hover/notch:scale-x-[1.6] group-hover/notch:bg-icon",
	"group-has-[:focus-visible]/notch:scale-x-[1.6] group-has-[:focus-visible]/notch:bg-icon",
);

/**
 * The arrival: the notch grows from its centre to full size, and the notches
 * below it slide down to make room.
 *
 * Scale alone, with no overshoot and no fade — at `scaleX: 0` a 2px rule is
 * already invisible, so a second property would only add noise to a 250ms beat.
 * `duration-slow` + bold `ease-out` is the flag recipe: an arrival is work
 * announcing itself.
 *
 * Motion writes `transform` while Tailwind's `scale-x-*` compiles to the
 * standalone `scale` property, so the beat multiplies cleanly with the resting
 * emphasis instead of fighting it — 0 → 1 here renders as 0 → 1.6 on a new notch.
 */
const NOTCH_ARRIVAL = {
	duration: 0.25,
	ease: [0, 0.4, 0, 1] as [number, number, number, number],
};

/**
 * Hover/focus swap on the rail's 24px head slot: the count at rest, the expand
 * control once the pointer or keyboard arrives. Both sit in the same slot so
 * the notches below never shift, and the faded one is click-through.
 */
const HEAD_AT_REST = cn(
	"pointer-events-none transition-opacity duration-normal ease-out-practical",
	"group-hover/session-rail:opacity-0 group-has-[:focus-visible]/session-rail:opacity-0",
	"motion-reduce:transition-none",
);

const HEAD_ON_REVEAL = cn(
	"opacity-0 transition-opacity duration-normal ease-out-practical",
	"group-hover/session-rail:opacity-100 group-has-[:focus-visible]/session-rail:opacity-100",
	"motion-reduce:transition-none",
);

/**
 * Count morphing for the rail's head slot.
 *
 * `slots` spins each digit behind a fade mask, which suits a value that changes
 * because work arrived rather than because the viewer acted — the roll reads as
 * a tally ticking over on its own. It also survives the `+N` ↔ total swap
 * gracefully: the `+` is a non-digit prefix that slides via layout while the
 * digits behind it spin, so `4` → `+2` is one motion rather than a hard cut.
 *
 * `snappy` is the variant's own default (see `defaultAnimationForVariant`), and
 * `autoSize` eases the slot's width across that swap so the notches below never
 * jump. `initial: false` keeps a rail that mounts already collapsed — or one the
 * viewer just collapsed — from spinning its count in on first paint.
 *
 * `TextMorphing` degrades to static text under `prefers-reduced-motion`, so this
 * needs no separate reduced-motion guard.
 */
const HEAD_COUNT_MORPH: TextMorphConfig = {
	variant: "slots",
	animation: "snappy",
	driftX: 0,
	driftY: 0,
	trend: 0,
	stagger: 0.02,
	initial: false,
	autoSize: true,
};

/**
 * One session, as a mini rule. The whole 20px row is the hover target so the
 * flyout opens from anywhere across the 32px rail, but only the rule is painted.
 * Hover scales the rule instead of resizing it — no layout work, at the
 * list-item interaction profile.
 *
 * The row carries `layout` so that when a notch arrives above it, it slides down
 * to its new position instead of jumping there.
 */
function AgentSessionNotch({
	flyoutHandle,
	isNew,
	item,
	onView,
}: Readonly<{
	flyoutHandle: JiraSessionFlyoutHandle;
	isNew: boolean;
	item: AgentSessionItem;
	onView?: (item: AgentSessionItem) => void;
}>) {
	const shouldReduceMotion = useReducedMotion();
	const shouldPlayArrival = isNew && !shouldReduceMotion;

	return (
		<JiraSessionFlyoutTrigger
			handle={flyoutHandle}
			render={
				<motion.li
					className="group/notch flex h-5 w-full shrink-0 items-center"
					layout={shouldReduceMotion ? false : true}
					transition={NOTCH_ARRIVAL}
				/>
			}
			session={toAgentSessionFlyoutItem(item)}
		>
			<button
				className="focus-visible:ring-ring flex h-5 w-full items-center justify-center rounded-xs outline-none focus-visible:ring-2"
				data-new={isNew || undefined}
				data-testid={"agent-session-notch-" + item.id}
				onClick={onView === undefined ? undefined : () => onView(item)}
				type="button"
			>
				<span className="sr-only">
					{`${item.title} — ${NOTCH_STATE_LABEL[item.state]}${isNew ? ", newly synced" : ""}`}
				</span>
				<motion.span
					animate={shouldPlayArrival ? { scaleX: 1 } : undefined}
					aria-hidden="true"
					className={cn(
						// `scale` and `background-color` are separate properties in
						// Tailwind v4, so both have to be named for the hover to ease.
						"h-0.5 w-3 rounded-full transition-[background-color,scale] duration-xxshort ease-out-practical",
						"motion-reduce:transition-none",
						isNew ? NOTCH_EMPHASIS : NOTCH_AT_REST,
					)}
					initial={shouldPlayArrival ? { scaleX: 0 } : false}
					style={{ willChange: shouldPlayArrival ? "transform" : undefined }}
					transition={NOTCH_ARRIVAL}
				/>
			</button>
		</JiraSessionFlyoutTrigger>
	);
}

export function AgentSessionColumnRail({
	items,
	newItemIds,
	onExpand,
	onView,
	sessionCount,
	title,
}: Readonly<{
	items: readonly AgentSessionItem[];
	newItemIds?: ReadonlySet<string>;
	onExpand: () => void;
	onView?: (item: AgentSessionItem) => void;
	sessionCount: number;
	title: string;
}>) {
	// One payload-aware flyout for the whole rail, exactly as Agent List does:
	// the popup stays mounted and follows the hovered notch, so sliding down the
	// rail crossfades instead of remounting a card per notch.
	const [flyoutHandle] = useState(createJiraSessionFlyoutHandle);
	const newCount = newItemIds === undefined
		? 0
		: items.reduce((total: number, item: AgentSessionItem) => (
			newItemIds.has(item.id) ? total + 1 : total
		), 0);

	return (
		<>
			<div className="group/session-rail flex h-full w-full min-w-0 flex-col items-center gap-1">
				<div className="relative flex h-6 w-full shrink-0 items-center justify-center">
					{/*
					 * The rail scrolls, so an arriving notch can be below the fold. This
					 * 24px slot is the only place on a 32px rail with room for a number,
					 * so while anything is unreviewed it answers "how many did I miss"
					 * rather than "how many are there" — the notches already show the
					 * total, one mark each.
					 *
					 * The wrapper keeps the positioning, colour, size and hover fade;
					 * the morph owns only the glyphs, and inherits `currentColor` from
					 * here. `aria-hidden` also suppresses the renderer's own `aria-label`,
					 * so the sibling `sr-only` stays the single spoken source.
					 */}
					<span
						aria-hidden="true"
						className={cn(
							"absolute text-xs",
							newCount > 0
								? "font-medium text-text-discovery"
								: "font-normal text-text-subtlest",
							HEAD_AT_REST,
						)}
					>
						<TextMorphing
							config={HEAD_COUNT_MORPH}
							text={newCount > 0 ? `+${newCount}` : String(sessionCount)}
						/>
					</span>
					<span className="sr-only">
						{newCount > 0
							? `${sessionCount} sessions, ${newCount} newly synced`
							: `${sessionCount} sessions`}
					</span>
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger
								render={
									<Button
										aria-expanded={false}
										aria-label={`Expand ${title} column`}
										className={cn("absolute shrink-0", HEAD_ON_REVEAL)}
										onClick={onExpand}
										size="icon-compact"
										type="button"
										variant="ghost"
									/>
								}
							>
								<Icon className="text-icon-subtle" render={<GrowHorizontalIcon label="" />} />
							</TooltipTrigger>
							<TooltipContent>Expand column</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				</div>

				{/* `-mx-1 px-1` reserves the 4px focus-ring gutter the scrollport would
				    otherwise clip, the same trade the expanded list makes. The list
				    takes no name of its own: the column region already carries one,
				    and a second copy of it only adds noise to the reading order. */}
				<motion.ul
					className="-mx-1 flex min-h-0 w-full flex-1 flex-col items-center gap-1 overflow-y-auto px-1"
					layoutScroll
				>
					{items.map((item: AgentSessionItem) => (
						<AgentSessionNotch
							flyoutHandle={flyoutHandle}
							isNew={newItemIds?.has(item.id) ?? false}
							item={item}
							key={item.id}
							onView={onView}
						/>
					))}
				</motion.ul>
			</div>
			<JiraSessionFlyoutSurface handle={flyoutHandle} />
		</>
	);
}
