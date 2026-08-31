"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react";
import { animate, motion, useMotionValue, useReducedMotion } from "motion/react";

import GrowHorizontalIcon from "@atlaskit/icon/core/grow-horizontal";

import { toAgentSessionFlyoutItem, type AgentListState } from "@/components/blocks/agent-list";
import type { AgentSessionItem } from "@/components/blocks/agent-session";
import { AGENT_SESSION_ARRIVAL_TRANSITION } from "@/components/blocks/agent-session/agent-session-arrival-motion";
import { AgentSessionNotchMark } from "@/components/blocks/agent-session/agent-session-notch";
import {
	AGENT_SESSION_NOTCH_MAGNIFY_IN,
	AGENT_SESSION_NOTCH_MAGNIFY_OUT,
	AGENT_SESSION_NOTCH_NO_NEAREST,
	AGENT_SESSION_NOTCH_POINTER_AWAY,
	toNearestAgentSessionNotchIndex,
	type AgentSessionNotchProximity,
} from "@/components/blocks/agent-session/agent-session-notch-magnify";
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
 * The notch is the same idea as a Pulse ruler mark: a 1px rule that swells under
 * the pointer and names the thing behind it. It swells as part of a dock, not on
 * its own — the notch nearest the cursor grows longest and its neighbours taper
 * off with distance, so the rail reads as one surface being pushed rather than a
 * row lighting up under the hand. Here the name is the full session flyout — the
 * same payload-driven surface Agent List rows open — so the collapsed column
 * loses the cards but keeps every session one hover away.
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
 * The rail's dock: one pointer position and one swell amount, shared by every
 * notch on it.
 *
 * Two cadences, for the reason Pulse's ruler has two. `pointerY` updates every
 * frame and reaches the notches through motion values, which write straight to
 * the DOM — a rail of marks re-rendering through React on every mouse pixel
 * would stall the column. `magnify` is animated separately so the whole slope
 * fades out on leave instead of collapsing, and it is a plain 0–1 scalar with a
 * finite parked pointer behind it.
 *
 * `nearestIndex` is resolved here rather than in each mark for the same reason a
 * mark cannot know it is the tallest: selection is a property of the rail, not
 * of one notch. Computing it once per pointer move also keeps the marks' own
 * transforms free of any cross-notch comparison.
 *
 * Centres are measured, not derived. The Pulse ruler is a fixed-height track
 * whose marks know their own fractional offset; this is a scrolling flex list,
 * so the only honest source of a notch's position is the DOM. They are stored in
 * the list's *content* space, which makes them survive scrolling: a wheel event
 * moves the pointer through them rather than invalidating them. A re-measure on
 * entry, and whenever the list length changes, covers everything else.
 */
function useNotchDock(itemCount: number, enabled: boolean) {
	const listRef = useRef<HTMLUListElement | null>(null);
	const centersRef = useRef<number[]>([]);
	const clientYRef = useRef<number | null>(null);
	const pointerY = useMotionValue(AGENT_SESSION_NOTCH_POINTER_AWAY);
	const magnify = useMotionValue(0);
	const nearestIndex = useMotionValue(AGENT_SESSION_NOTCH_NO_NEAREST);

	const measure = useCallback(() => {
		const list = listRef.current;
		if (list === null) {
			return;
		}
		const listRect = list.getBoundingClientRect();
		centersRef.current = Array.from(list.children, (child: Element) => {
			const rect = child.getBoundingClientRect();
			return rect.top - listRect.top + list.scrollTop + rect.height / 2;
		});
	}, []);

	const trackPointer = useCallback((clientY: number) => {
		const list = listRef.current;
		if (list === null) {
			return;
		}
		clientYRef.current = clientY;
		const offset = clientY - list.getBoundingClientRect().top + list.scrollTop;
		pointerY.set(offset);
		nearestIndex.set(toNearestAgentSessionNotchIndex(centersRef.current, offset));
	}, [nearestIndex, pointerY]);

	// An arrival slides the notches below it into place over a quarter second. If
	// the pointer is already on the rail the slope would keep pointing at where
	// they were, so the new geometry is picked up as soon as the list changes.
	useEffect(() => {
		if (!enabled) {
			return;
		}
		measure();
	}, [enabled, itemCount, measure]);

	function handlePointerEnter(event: PointerEvent<HTMLUListElement>) {
		// Touch has no hover: a finger sliding here is a scroll, and docking under
		// it would fight the gesture. Tap still opens the flyout.
		if (event.pointerType === "touch") {
			return;
		}
		measure();
	}

	function handlePointerMove(event: PointerEvent<HTMLUListElement>) {
		if (event.pointerType === "touch") {
			return;
		}
		trackPointer(event.clientY);
		if (magnify.get() !== 1) {
			animate(magnify, 1, AGENT_SESSION_NOTCH_MAGNIFY_IN);
		}
	}

	function handlePointerLeave() {
		clientYRef.current = null;
		// Selection stays put through the retreat so the colour drains on the same
		// beat as the swell; parking it early would blink the mark to subtlest a
		// frame after the pointer left, ahead of everything else.
		animate(magnify, 0, AGENT_SESSION_NOTCH_MAGNIFY_OUT).then(() => {
			pointerY.set(AGENT_SESSION_NOTCH_POINTER_AWAY);
			nearestIndex.set(AGENT_SESSION_NOTCH_NO_NEAREST);
		});
	}

	function handleScroll() {
		const clientY = clientYRef.current;
		if (clientY === null) {
			return;
		}
		// Centres are in content space, so a scroll only moves the pointer through
		// them — without this the slope would freeze mid-wheel.
		trackPointer(clientY);
	}

	return { centersRef, handlePointerEnter, handlePointerLeave, handlePointerMove, handleScroll, listRef, magnify, nearestIndex, pointerY };
}

/**
 * One session, as a mini rule. The whole 20px row is the hover target so the
 * flyout opens from anywhere across the 32px rail, but only the rule is painted.
 * Length comes from the rail's dock, so a notch answers the pointer's distance
 * rather than only its own row's hover, and the selected one alone takes the
 * darker mark.
 *
 * The row carries `layout` so that when a notch arrives above it, it slides down
 * to its new position instead of jumping there.
 */
function AgentSessionNotch({
	flyoutHandle,
	isArriving,
	isNew,
	item,
	onView,
	proximity,
}: Readonly<{
	flyoutHandle: JiraSessionFlyoutHandle;
	isArriving: boolean;
	isNew: boolean;
	item: AgentSessionItem;
	onView?: (item: AgentSessionItem) => void;
	proximity?: AgentSessionNotchProximity;
}>) {
	const shouldReduceMotion = useReducedMotion();
	// The beat, not the mark: expanding and re-collapsing the column remounts the
	// rail, and a notch that is still unreviewed stays lit without regrowing.
	return (
		<JiraSessionFlyoutTrigger
			handle={flyoutHandle}
			render={
				<motion.li
					className="group/notch flex h-5 w-full shrink-0 items-center"
					layout={shouldReduceMotion ? false : true}
					transition={AGENT_SESSION_ARRIVAL_TRANSITION}
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
				<AgentSessionNotchMark isArriving={isArriving} isNew={isNew} proximity={proximity} />
			</button>
		</JiraSessionFlyoutTrigger>
	);
}

export function AgentSessionColumnRail({
	arrivingItemIds,
	items,
	newItemIds,
	onExpand,
	onView,
	sessionCount,
	title,
}: Readonly<{
	/** Subset of `newItemIds` whose arrival beat has not played yet. */
	arrivingItemIds?: ReadonlySet<string>;
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
	const shouldReduceMotion = useReducedMotion();
	// Under reduced motion the rail keeps its dock switched off entirely and the
	// marks fall back to their own row's hover treatment, which resolves
	// instantly. A slope that follows the cursor is exactly the kind of ambient
	// motion the setting asks us to drop.
	const isDocked = shouldReduceMotion !== true;
	const dock = useNotchDock(items.length, isDocked);
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
							<TooltipContent>Expand</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				</div>

				{/* `-mx-1 px-1` reserves the 4px focus-ring gutter the scrollport would
				    otherwise clip, the same trade the expanded list makes. The list
				    takes no name of its own: the column region already carries one,
				    and a second copy of it only adds noise to the reading order.

				    It is also the dock's pointer surface — one listener for the whole
				    rail, rather than a hover handler per notch, because the swell is a
				    property of the distance between them. */}
				<motion.ul
					className="-mx-1 flex min-h-0 w-full flex-1 flex-col items-center gap-1 overflow-y-auto px-1"
					layoutScroll
					onPointerEnter={isDocked ? dock.handlePointerEnter : undefined}
					onPointerLeave={isDocked ? dock.handlePointerLeave : undefined}
					onPointerMove={isDocked ? dock.handlePointerMove : undefined}
					onScroll={isDocked ? dock.handleScroll : undefined}
					ref={dock.listRef}
				>
					{items.map((item: AgentSessionItem, index: number) => (
						<AgentSessionNotch
							flyoutHandle={flyoutHandle}
							isArriving={(arrivingItemIds ?? newItemIds)?.has(item.id) ?? false}
							isNew={newItemIds?.has(item.id) ?? false}
							item={item}
							key={item.id}
							onView={onView}
							proximity={isDocked ? {
								centersRef: dock.centersRef,
								index,
								magnify: dock.magnify,
								nearestIndex: dock.nearestIndex,
								pointerY: dock.pointerY,
							} : undefined}
						/>
					))}
				</motion.ul>
			</div>
			<JiraSessionFlyoutSurface handle={flyoutHandle} />
		</>
	);
}
