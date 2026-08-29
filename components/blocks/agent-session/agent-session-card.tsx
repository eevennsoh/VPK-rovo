"use client";

import { AgentListRow } from "@/components/blocks/agent-list/agent-list-card";
import { toAgentListResumeCommand } from "@/components/blocks/agent-list/agent-list-session";
import { UncapturedWorkChin } from "@/components/blocks/jira-issue/uncaptured-work-chin";

import type { AgentSessionItem } from "./agent-session-types";

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
	onDismiss,
	onLinkWorkItem,
	onView,
	suggestedWorkItemKey,
}: Readonly<{
	captured?: boolean;
	getResumeCommand?: (item: AgentSessionItem) => string | undefined;
	isResumable?: (item: AgentSessionItem) => boolean;
	item: AgentSessionItem;
	onCopyResume?: (item: AgentSessionItem) => void;
	onCreateWorkItem?: () => void;
	onDismiss?: () => void;
	onLinkWorkItem?: () => void;
	onView?: (item: AgentSessionItem) => void;
	suggestedWorkItemKey?: string;
}>) {
	const hasWorkItemActions = onCreateWorkItem !== undefined || onLinkWorkItem !== undefined;
	const resumeCommand = getResumeCommand?.(item) ?? toAgentListResumeCommand(item);
	// Resume is an affordance, not just a callback: a row the host cannot resume
	// must not render an enabled control, because the chin copies the command to
	// the clipboard before `onCopyResume` ever runs.
	const canResume = (isResumable?.(item) ?? true) && resumeCommand.length > 0;
	const showChin = captured || hasWorkItemActions || onDismiss !== undefined || canResume;

	return (
		<li data-testid={"agent-session-row-" + item.id}>
			<article
				className="group/uncaptured-work flex w-full flex-col overflow-hidden rounded-lg border border-dashed border-border-disabled bg-surface text-left"
				data-captured={captured || undefined}
				data-variant="uncaptured-work"
			>
				<div className="bg-surface-sunken p-3">
					<AgentListRow
						hideHoverActions
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
						onCopyResume={canResume
							? () => {
								void copyResumeCommand(resumeCommand).then(() => {
									onCopyResume?.(item);
								});
							}
							: undefined}
						onCreateWorkItem={onCreateWorkItem}
						onDismiss={onDismiss}
						onLinkWorkItem={onLinkWorkItem}
						suggestedWorkItemKey={suggestedWorkItemKey}
						summary={item.title}
					/>
				) : null}
			</article>
		</li>
	);
}
