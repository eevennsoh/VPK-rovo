"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

import EyeOpenIcon from "@atlaskit/icon/core/eye-open";

import {
	AgentListRow,
	type AgentListRowHoverActions,
} from "@/components/blocks/agent-list/agent-list-card";
import { toAgentListResumeCommand } from "@/components/blocks/agent-list/agent-list-session";
import { UncapturedWorkChin } from "@/components/blocks/jira-issue/uncaptured-work-chin";
import { cn } from "@/lib/utils";

import type { AgentSessionItem } from "./agent-session-types";

/** How long Resume reads "Copied" after it writes the command to the clipboard. */
const COPIED_RESET_MS = 2000;

/**
 * The arrival beat: `duration-slow` + bold `ease-out`, the flag recipe, because
 * a newly synced session *is* a notification of arriving work. It enters from
 * above because untracked work comes from outside the board and the header is
 * where sync lives — motion has to start where the thing came from.
 */
const ARRIVAL_ENTER = {
	duration: 0.25,
	ease: [0, 0.4, 0, 1] as [number, number, number, number],
};

/** Travel of the entrance, in px. Paired with a fade — two properties, no more. */
const ARRIVAL_OFFSET_PX = -8;

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
	getResumeCommand,
	isNew = false,
	isResumable,
	item,
	onCopyResume,
	onCreateWorkItem,
	onLinkWorkItem,
	onSubtasks,
	onToggleVisibility,
	onView,
	suggestedWorkItemKey,
	suggestedWorkItemKeys,
}: Readonly<{
	arrivalDelaySeconds?: number;
	captured?: boolean;
	getResumeCommand?: (item: AgentSessionItem) => string | undefined;
	isNew?: boolean;
	isResumable?: (item: AgentSessionItem) => boolean;
	item: AgentSessionItem;
	onCopyResume?: (item: AgentSessionItem) => void;
	onCreateWorkItem?: () => void;
	onLinkWorkItem?: (workItemKey?: string) => void;
	onSubtasks?: () => void;
	onToggleVisibility?: (item: AgentSessionItem) => void;
	onView?: (item: AgentSessionItem) => void;
	suggestedWorkItemKey?: string;
	suggestedWorkItemKeys?: readonly string[];
}>) {
	const shouldReduceMotion = useReducedMotion();
	const [copiedResume, setCopiedResume] = useState(false);
	const copiedResetRef = useRef<number | undefined>(undefined);

	useEffect(() => () => {
		window.clearTimeout(copiedResetRef.current);
	}, []);

	const hasWorkItemActions = onCreateWorkItem !== undefined || onLinkWorkItem !== undefined;
	const resumeCommand = getResumeCommand?.(item) ?? toAgentListResumeCommand(item);
	// Resume is an affordance, not just a callback: a row the host cannot resume
	// must not render an enabled control, because the button copies the command to
	// the clipboard before `onCopyResume` ever runs.
	const canResume = (isResumable?.(item) ?? true) && resumeCommand.length > 0;
	// Subtasks counts too: a consumer that wires only that handler still needs
	// the chin, or its control would be unreachable.
	const showChin = captured || hasWorkItemActions || onSubtasks !== undefined;
	const shouldPlayArrival = isNew && !shouldReduceMotion;

	// The same hover/focus-revealed pair Agent List rows use, with show/hide in
	// the slot Agent List gives to Archive. The eye is a placeholder today: the
	// deferral behaviour lands with `onToggleVisibility`.
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
			icon: <EyeOpenIcon label="" size="small" />,
			label: "Show/hide",
			onClick: () => {
				onToggleVisibility?.(item);
			},
		},
	};

	return (
		<motion.li
			animate={shouldPlayArrival ? { opacity: 1, y: 0 } : undefined}
			data-testid={"agent-session-row-" + item.id}
			// `false` for a settled card, so nothing replays when the list re-renders
			// or the watermark clears the mark. Only an arrival animates.
			initial={shouldPlayArrival ? { opacity: 0, y: ARRIVAL_OFFSET_PX } : false}
			// Siblings slide down to make room instead of jumping. `"position"` so a
			// displaced card is never scaled, only moved.
			layout={shouldReduceMotion ? false : "position"}
			style={{ willChange: shouldPlayArrival ? "opacity, transform" : undefined }}
			transition={{ ...ARRIVAL_ENTER, delay: arrivalDelaySeconds ?? 0 }}
		>
			<article
				className={cn(
					"group/uncaptured-work relative flex w-full flex-col overflow-hidden rounded-lg border border-dashed bg-surface text-left",
					// Recoloured, not replaced: the dash means "uncaptured" and stays
					// true while the card is also new, so the one property carries both
					// facts instead of the arrival mark evicting the card's own state.
					isNew ? "border-border-discovery" : "border-border-disabled",
				)}
				data-captured={captured || undefined}
				data-new={isNew || undefined}
				data-variant="uncaptured-work"
			>
				{isNew ? (
					<>
						{/* Colour never carries it alone. */}
						<span className="sr-only">Newly synced, not yet reviewed</span>
						{/* Parked in the sunken body's 12px padding, so it clears the
						    avatar on the left and the hover actions on the right. */}
						<span
							aria-hidden="true"
							className="absolute left-1.5 top-1.5 size-1.5 rounded-full bg-icon-discovery"
						/>
					</>
				) : null}
				{/*
				 * The card is two hit areas, not one. `group/agent-row` scopes the
				 * hover reveal to this sunken top region so pointing at the chin —
				 * which owns its own always-visible controls — does not pop Resume
				 * open above it.
				 */}
				<div className="group/agent-row bg-surface-sunken p-3">
					<AgentListRow
						hoverActions={hoverActions}
						isCompact={false}
						isSelected={false}
						item={item}
						onView={onView}
					/>
				</div>
				{showChin ? (
					<UncapturedWorkChin
						captured={captured}
						createUnavailable={onCreateWorkItem === undefined}
						linkUnavailable={onLinkWorkItem === undefined}
						onCreateWorkItem={onCreateWorkItem}
						onLinkWorkItem={onLinkWorkItem}
						onSubtasks={onSubtasks}
						suggestedWorkItemKey={suggestedWorkItemKey}
						suggestedWorkItemKeys={suggestedWorkItemKeys}
						summary={item.title}
					/>
				) : null}
			</article>
		</motion.li>
	);
}
