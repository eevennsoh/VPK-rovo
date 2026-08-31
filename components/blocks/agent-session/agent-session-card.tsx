"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

import EyeOpenIcon from "@atlaskit/icon/core/eye-open";
import EyeOpenStrikethroughIcon from "@atlaskit/icon/core/eye-open-strikethrough";

import {
	AgentListRow,
	type AgentListRowHoverActions,
} from "@/components/blocks/agent-list/agent-list-card";
import { toAgentListResumeCommand } from "@/components/blocks/agent-list/agent-list-session";
import type { JiraSidebarSessionItem } from "@/components/blocks/product-sidebar/variants/jira";
import {
	JiraSessionFlyoutTrigger,
	type JiraSessionFlyoutHandle,
} from "@/components/blocks/product-sidebar/variants/jira-session-flyout";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

import {
	AGENT_SESSION_ARRIVAL_OFFSET_PX,
	AGENT_SESSION_ARRIVAL_TRANSITION,
} from "./agent-session-arrival-motion";
import type { AgentSessionItem } from "./agent-session-types";

/** How long Resume reads "Copied" after it writes the command to the clipboard. */
const COPIED_RESET_MS = 2000;

async function copyResumeCommand(command: string): Promise<void> {
	if (typeof navigator === "undefined" || navigator.clipboard?.writeText === undefined) {
		return;
	}

	try {
		await navigator.clipboard.writeText(command);
	} catch {
		// Keep the click successful when clipboard permission is denied.
	}
}

export function AgentSessionCard({
	arrivalDelaySeconds,
	captured = false,
	flyoutHandle,
	flyoutSession,
	getResumeCommand,
	isArriving = false,
	isNew = false,
	isResumable,
	item,
	onCopyResume,
	onItemHover,
	onToggleVisibility,
	onView,
	visibilityLabel = "Hide",
}: Readonly<{
	arrivalDelaySeconds?: number;
	captured?: boolean;
	flyoutHandle: JiraSessionFlyoutHandle;
	flyoutSession: JiraSidebarSessionItem;
	getResumeCommand?: (item: AgentSessionItem) => string | undefined;
	/** Play the one-shot arrival beat. A remounted card must not re-arm it. */
	isArriving?: boolean;
	/** Carry the persistent unreviewed mark. Outlives the beat. */
	isNew?: boolean;
	isResumable?: (item: AgentSessionItem) => boolean;
	item: AgentSessionItem;
	onCopyResume?: (item: AgentSessionItem) => void;
	onItemHover?: (item: AgentSessionItem | null) => void;
	onToggleVisibility?: (item: AgentSessionItem) => void;
	onView?: (item: AgentSessionItem) => void;
	/** Tooltip and accessible name for the hover eye. Hide in the active list, Show in Hidden work. */
	visibilityLabel?: string;
}>) {
	const shouldReduceMotion = useReducedMotion();
	const [copiedResume, setCopiedResume] = useState(false);
	const copiedResetRef = useRef<number | undefined>(undefined);

	useEffect(() => () => {
		window.clearTimeout(copiedResetRef.current);
	}, []);

	const resumeCommand = getResumeCommand?.(item) ?? toAgentListResumeCommand(item);
	// Resume is an affordance, not just a callback: a row the host cannot resume
	// must not render an enabled control, because the button copies the command to
	// the clipboard before `onCopyResume` ever runs.
	const canResume = (isResumable?.(item) ?? true) && resumeCommand.length > 0;
	// The beat, not the mark: a card remounted while still unreviewed keeps the
	// discovery border and dot but must not replay its entrance.
	const shouldPlayArrival = isArriving && !shouldReduceMotion;

	// The same hover/focus-revealed pair Agent List rows use, with Hide / Show
	// in the slot Agent List gives to Archive. The eye always renders; the
	// column supplies `onToggleVisibility` so Hide actually removes the card.
	const hoverActions: AgentListRowHoverActions = {
		primary: canResume
			? {
				label: copiedResume ? "Copied" : "Resume",
				onClick: () => {
					void copyResumeCommand(resumeCommand).then(() => {
						onCopyResume?.(item);
						setCopiedResume(true);
						window.clearTimeout(copiedResetRef.current);
						copiedResetRef.current = window.setTimeout(() => {
							setCopiedResume(false);
						}, COPIED_RESET_MS);
					});
				},
			}
			: undefined,
		secondary: {
			// Hide (active list) is a strikethrough eye; Show (hidden view) is open.
			icon: (
				<Icon
					render={visibilityLabel === "Show"
						? <EyeOpenIcon label="" size="small" />
						: <EyeOpenStrikethroughIcon label="" size="small" />}
				/>
			),
			label: visibilityLabel,
			onClick: () => {
				onToggleVisibility?.(item);
			},
		},
	};

	// Arrival layout lives on the list item, not the flyout trigger. Base UI
	// closes a preview card when its active trigger unmounts, and Motion's layout
	// projection can replace that host — which made each row open its own flyout
	// instead of sliding the list's shared popup. The catalog demo uses a stable
	// `div` as the trigger host so hovering down the list crossfades in place.
	return (
		<motion.li
			animate={shouldPlayArrival ? { opacity: 1, y: 0 } : undefined}
			data-testid={"agent-session-row-" + item.id}
			onPointerEnter={() => onItemHover?.(item)}
			onPointerLeave={() => onItemHover?.(null)}
			// `false` for a settled card, so nothing replays when the list re-renders
			// or the watermark clears the mark. Only an arrival animates.
			initial={shouldPlayArrival ? { opacity: 0, y: AGENT_SESSION_ARRIVAL_OFFSET_PX } : false}
			// Siblings slide down to make room instead of jumping. `"position"` so a
			// displaced card is never scaled, only moved.
			layout={shouldReduceMotion ? false : "position"}
			style={{ willChange: shouldPlayArrival ? "opacity, transform" : undefined }}
			transition={{ ...AGENT_SESSION_ARRIVAL_TRANSITION, delay: arrivalDelaySeconds ?? 0 }}
		>
			<JiraSessionFlyoutTrigger
				closeDelay={160}
				handle={flyoutHandle}
				render={<div className="w-full" />}
				session={flyoutSession}
			>
				<article
					className={cn(
						"group/agent-row relative flex w-full cursor-pointer rounded-none bg-transparent p-3 text-left text-text",
						// Stacked list is one solid well: first card owns the top radius,
						// last owns the bottom, shared edges collapse to a single stroke.
						"border border-solid [li:not(:last-child)_&]:border-b-0",
						"[li:first-child_&]:rounded-t-lg",
						"[li:last-child_&]:rounded-b-lg",
						"hover:bg-surface-hovered",
						"transition-[border-color,background-color] duration-xxshort ease-out-practical",
						"motion-reduce:transition-none",
						// Arrival recolours the same solid frame rather than replacing it.
						// Resting untracked chrome is `border-border-disabled`; a newly
						// synced card uses discovery until it is reviewed.
						!captured && isNew ? "border-border-discovery" : "border-border-disabled",
					)}
					data-captured={captured || undefined}
					data-new={isNew || undefined}
					data-variant="uncaptured-work"
				>
					{isNew ? (
						<>
							{/* Colour never carries it alone. */}
							<span className="sr-only">Newly synced, not yet reviewed</span>
							{/* Parked in the body's 12px padding, so it clears the
							    avatar on the left and the hover actions on the right. */}
							<span
								aria-hidden="true"
								className="absolute left-1.5 top-1.5 size-1.5 rounded-full bg-icon-discovery"
							/>
						</>
					) : null}
					<AgentListRow
						hoverActions={hoverActions}
						isCompact={false}
						isSelected={false}
						item={item}
						onView={onView}
					/>
				</article>
			</JiraSessionFlyoutTrigger>
		</motion.li>
	);
}
