"use client";

import { useRef, type ReactElement } from "react";

import ShrinkHorizontalIcon from "@atlaskit/icon/core/shrink-horizontal";
import { motion, useReducedMotion, type Variants } from "motion/react";

import { AGENT_SESSION_ITEMS } from "@/components/blocks/agent-session";
import {
	AGENT_SESSION_COLUMN_COLLAPSED_WIDTH_PX,
	AgentSessionColumn,
	type AgentSessionColumnProps,
} from "@/components/blocks/agent-session-column";
import { AgentSessionColumnOverflowMenu } from "@/components/blocks/agent-session-column/agent-session-column-overflow-menu";
import {
	PanelAction,
	PanelActionGroup,
	PanelContainer,
	PanelContent,
	PanelHeader,
	PanelTitle,
} from "@/components/ui/panel";
import { cn } from "@/lib/utils";

/**
 * Default column title, mirrored from `AgentSessionColumn`'s own default so the
 * panel header and the column's `aria-label` cannot disagree when the host does
 * not supply one.
 */
const AGENT_SESSION_PANEL_TITLE = "Untracked work";

/**
 * Entrance slide distance in px.
 *
 * The panel is pinned to the right edge of the content region, so it enters
 * from that edge — spatial anchoring. It is deliberately a short offset rather
 * than a full `100%` off-canvas slide: the content region is not a clipping
 * container, so a full slide would paint the panel over whatever sits to the
 * right of the board for the length of the animation. 16px reads as "arrived
 * from the right" without leaving the region.
 */
const AGENT_SESSION_PANEL_SLIDE_PX = 16;

/**
 * The rail's entrance, played once on mount (design variant switched on, or a
 * fresh load with it already on): `duration-slow` + the bold `ease-out` curve,
 * for a medium, infrequent surface appearing. Two properties only — fade +
 * slide. There is no exit half: the rail is persistent, so `hidden` is purely
 * the `initial` state, never a destination.
 *
 * Motion cannot read `var()`, so the token curve is its resolved array.
 */
const AGENT_SESSION_PANEL_VARIANTS: Variants = {
	hidden: {
		opacity: 0,
		transform: `translateX(${AGENT_SESSION_PANEL_SLIDE_PX}px)`,
	},
	visible: {
		opacity: 1,
		transform: "translateX(0px)",
		transition: { duration: 0.25, ease: [0, 0.4, 0, 1] }, // duration-slow + ease-out
	},
};

/**
 * VPK's duration/easing tokens resolve to literal values and do not honour
 * `prefers-reduced-motion`, so the guard has to be explicit: same states, no
 * offset, no fade, zero duration.
 */
const AGENT_SESSION_PANEL_REDUCED_MOTION_VARIANTS: Variants = {
	hidden: { opacity: 1, transform: "translateX(0px)", transition: { duration: 0 } },
	visible: { opacity: 1, transform: "translateX(0px)", transition: { duration: 0 } },
};

/**
 * Minimising is an in-place resize, not an entrance, so it stays a CSS width
 * transition on the bold in-place profile — byte-for-byte the one
 * `AgentSessionColumn` runs on itself, so the two width owners move as one.
 */
const AGENT_SESSION_PANEL_WIDTH_TRANSITION = "width var(--duration-medium) var(--ease-in-out)";

/**
 * Expanded docked-rail width in px. The in-flow board column stays 280; this
 * surface is the one the user sized. Exported so the board can reserve the
 * same trailing scroll inset the rail occupies.
 */
export const AGENT_SESSION_PANEL_WIDTH_PX = 360;

/**
 * Width of the docked rail's leading hairline.
 *
 * The host is `border-box` at `AGENT_SESSION_PANEL_WIDTH_PX`, so this pixel is
 * subtracted from the inner column rather than added to the host — otherwise
 * the well overflows the rail by 1px. Collapsed drops the border entirely.
 */
const AGENT_SESSION_PANEL_BORDER_PX = 1;

export interface AgentSessionPanelProps {
	agentSessionColumn: AgentSessionColumnProps;
	collapsed: boolean;
	onCollapsedChange: (collapsed: boolean) => void;
	/**
	 * True while a board session drag is in flight. The rail stops receiving
	 * hits so the captured pointer can drop on issue cards underneath it.
	 */
	sessionDragging?: boolean;
	/**
	 * True while an attached chin session is hovering the rail as a drop
	 * target. Coordinate hit-testing still uses the rail's box; this only
	 * paints the armed state.
	 */
	untrackedDropArmed?: boolean;
	/**
	 * Distance in px from the top of the positioning ancestor at which the rail
	 * starts — normally the bottom edge of the board's tab strip.
	 *
	 * This is a real `top` offset, not top padding: the element itself must stop
	 * at the tab strip rather than spanning the whole board root and relying on
	 * an opaque band to paint over its head. Padding would leave an invisible
	 * slab covering the tabs, swallowing pointer events and reading as a
	 * full-height overlay to anything that measures the DOM.
	 */
	topInset?: number;
}

/**
 * The untracked-work column as a persistent docked rail.
 *
 * Same `AgentSessionColumn` the board renders in flow — only the host changes.
 * It is `absolute`, so it leaves the flow entirely and the board or list
 * scrolls underneath it, and it sizes itself from the column's own exported
 * widths so the panel edge and the column edge can never disagree.
 *
 * Two states, and only two: expanded (360px panel) and collapsed (32px notch
 * rail). There is no closed state — the rail is always on the board's trailing
 * edge, which is exactly what lets it be its own entry point. Collapsing drops
 * the panel header rather than hiding it: the column's collapsed rail carries
 * its own compact header with the expand control, so at 32px a second header
 * would be chrome on chrome.
 *
 * It is a persistent side surface, not a modal: no focus lock
 * (`isFocusLockEnabled` stays off) and no backdrop, so the board behind it
 * stays fully operable.
 */
export function AgentSessionPanel({
	agentSessionColumn,
	collapsed,
	onCollapsedChange,
	sessionDragging = false,
	topInset = 0,
	untrackedDropArmed = false,
}: Readonly<AgentSessionPanelProps>): ReactElement {
	const shouldReduceMotion = useReducedMotion();
	const containerRef = useRef<HTMLElement>(null);
	const title = agentSessionColumn.title ?? AGENT_SESSION_PANEL_TITLE;

	// Collapsing unmounts the header the user just clicked, which would drop
	// focus to <body>. Parking focus on the panel itself first keeps the
	// keyboard where the user left it — the next Tab lands on the rail.
	const handleCollapse = () => {
		containerRef.current?.focus();
		onCollapsedChange(true);
	};

	return (
		<motion.div
			animate="visible"
			// z-40 clears the board's dragged card (z-30) while staying under
			// the portalled session flyout and drag chip, so both keep working
			// over the panel.
			//
			// `border-l` rather than an elevation shadow: this is a docked rail
			// flush to the board's trailing edge, not a floating card, so a
			// single hairline is the separation. (`shadow-overlay` would also
			// have been a no-op — there is no `--shadow-overlay` in the theme,
			// only `--shadow-xl`/`--shadow-2xl` aliasing `--ds-shadow-overlay`.)
			className={cn(
				"absolute bottom-0 right-0 z-40 rounded-none",
				collapsed ? null : "border-l border-border",
				sessionDragging ? "pointer-events-none" : null,
				untrackedDropArmed ? "bg-bg-accent-blue-subtlest" : null,
			)}
			data-board-agent-session-drop-zone="untracked"
			data-board-agent-session-target={untrackedDropArmed ? "untracked" : undefined}
			// No `AnimatePresence`/`exit`: the rail is persistent, so the only
			// unmount is the design variant being switched off — a mode change,
			// not a dismissal, and nothing for an exit animation to narrate.
			initial="hidden"
			style={{
				// A real `top`, not top padding: the rail must END at the tab
				// strip, not merely look like it does. `bottom: 0` with no radius
				// so it is flush to the page — no floating inset under the rail.
				top: topInset,
				transition: shouldReduceMotion ? undefined : AGENT_SESSION_PANEL_WIDTH_TRANSITION,
				width: collapsed
					? AGENT_SESSION_COLUMN_COLLAPSED_WIDTH_PX
					: AGENT_SESSION_PANEL_WIDTH_PX,
				willChange: shouldReduceMotion ? undefined : "opacity, transform",
			}}
			variants={
				shouldReduceMotion
					? AGENT_SESSION_PANEL_REDUCED_MOTION_VARIANTS
					: AGENT_SESSION_PANEL_VARIANTS
			}
		>
			<PanelContainer
				ref={containerRef}
				// Named for the surface, not the list: the column's own
				// `<section>` already announces "{title}, N sessions", and two
				// nested regions must not share one name.
				aria-label={`${title} panel`}
				className="h-full bg-surface"
				tabIndex={-1}
			>
				{collapsed ? null : (
					<PanelHeader>
						<PanelTitle>{title}</PanelTitle>
						<PanelActionGroup>
							{/*
							 * `chrome="none"` takes the column's overflow menu with the
							 * header, so the panel re-hosts it — otherwise Link all
							 * suggestions / Auto sync / Suggest link are unreachable in
							 * this presentation.
							 */}
							<AgentSessionColumnOverflowMenu
								capturedItemIds={agentSessionColumn.capturedItemIds}
								getSuggestedWorkItemKey={agentSessionColumn.getSuggestedWorkItemKey}
								getSuggestedWorkItemKeys={agentSessionColumn.getSuggestedWorkItemKeys}
								items={agentSessionColumn.items ?? AGENT_SESSION_ITEMS}
								onLinkWorkItem={agentSessionColumn.onLinkWorkItem}
								title={title}
							/>
							{/*
							 * Collapse is the only way out of the expanded panel — there is
							 * no close, because nothing outside the rail could bring it
							 * back. Same glyph the column's own collapse control uses, so
							 * the affordance reads identically in both presentations.
							 */}
							<PanelAction
								icon={ShrinkHorizontalIcon}
								label="Collapse panel"
								onClick={handleCollapse}
							/>
						</PanelActionGroup>
					</PanelHeader>
				)}

				<PanelContent className={collapsed ? "pt-1" : "pt-0"}>
					{/*
					 * `flex-1` because the column sizes itself to its content — it is
					 * built to stand on a board, not to fill a docked surface — and
					 * the list has to reach the bottom of the panel. Row gap and
					 * side inset share `space.050` (`gap-1 p-1`, 4px). The in-flow
					 * column keeps `gap-0` and is not passed this class.
					 */}
					<AgentSessionColumn
						{...agentSessionColumn}
						chrome="none"
						className="flex-1"
						collapsed={collapsed}
						expandedWidthPx={AGENT_SESSION_PANEL_WIDTH_PX - AGENT_SESSION_PANEL_BORDER_PX}
						listClassName={cn("gap-1 p-1", agentSessionColumn.listClassName)}
						onCollapsedChange={onCollapsedChange}
					/>
				</PanelContent>
			</PanelContainer>
		</motion.div>
	);
}
