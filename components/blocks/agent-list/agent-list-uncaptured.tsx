"use client";

import { AgentListRow } from "@/components/blocks/agent-list/agent-list-card";
import { toAgentListResumeCommand } from "@/components/blocks/agent-list/agent-list-session";
import type { AgentListItem } from "@/components/blocks/agent-list/agent-list-types";
import { UncapturedWorkChin } from "@/components/blocks/jira-issue/uncaptured-work-chin";

export function suggestedUncapturedWorkItemKey(item: AgentListItem): string | undefined {
	return item.sessionDetails?.issueKey;
}

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

export function AgentListUncapturedCard({
	captured = false,
	getResumeCommand,
	item,
	onCopyResume,
	onCreateWorkItem,
	onDismiss,
	onLinkWorkItem,
	onView,
	suggestedWorkItemKey,
}: Readonly<{
	captured?: boolean;
	getResumeCommand?: (item: AgentListItem) => string | undefined;
	item: AgentListItem;
	onCopyResume?: (item: AgentListItem) => void;
	onCreateWorkItem?: () => void;
	onDismiss?: () => void;
	onLinkWorkItem?: () => void;
	onView?: (item: AgentListItem) => void;
	suggestedWorkItemKey?: string;
}>) {
	const hasWorkItemActions = onCreateWorkItem !== undefined || onLinkWorkItem !== undefined;
	const resumeCommand = getResumeCommand?.(item) ?? toAgentListResumeCommand(item);
	const showChin = captured || hasWorkItemActions || onDismiss !== undefined || resumeCommand.length > 0;

	return (
		<li data-testid={"agent-list-row-" + item.id}>
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
						onCopyResume={() => {
							void copyResumeCommand(resumeCommand).then(() => {
								onCopyResume?.(item);
							});
						}}
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
