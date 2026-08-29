"use client";

import { useEffect, useRef, useState } from "react";

import EyeOpenIcon from "@atlaskit/icon/core/eye-open";

import {
	AgentListRow,
	type AgentListRowHoverActions,
} from "@/components/blocks/agent-list/agent-list-card";
import { toAgentListResumeCommand } from "@/components/blocks/agent-list/agent-list-session";
import { UncapturedWorkChin } from "@/components/blocks/jira-issue/uncaptured-work-chin";

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
	captured = false,
	getResumeCommand,
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
	captured?: boolean;
	getResumeCommand?: (item: AgentSessionItem) => string | undefined;
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
	const showChin = captured || hasWorkItemActions;

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
		<li data-testid={"agent-session-row-" + item.id}>
			<article
				className="group/uncaptured-work flex w-full flex-col overflow-hidden rounded-lg border border-dashed border-border-disabled bg-surface text-left"
				data-captured={captured || undefined}
				data-variant="uncaptured-work"
			>
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
		</li>
	);
}
