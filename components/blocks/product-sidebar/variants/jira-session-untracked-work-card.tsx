"use client";

import { useId } from "react";

import ShowMoreHorizontalIcon from "@atlaskit/icon/core/show-more-horizontal";

import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Lozenge } from "@/components/ui/lozenge";
import { AgentAvatarVisual } from "@/components/ui-custom/agent-avatar-visual";
import { cn } from "@/lib/utils";

import type { JiraSidebarSessionItem } from "./jira";
import { JiraSessionFlyoutCard } from "./jira-session-flyout-card";
import { JIRA_SESSION_UPDATED_LABEL } from "./jira-session-flyout-data";

function JiraSessionUntrackedWorkActions({
	issueKey,
	onAddAsSubtask,
	onCreateWorkItem,
	onLinkWorkItem,
}: Readonly<{
	issueKey: string;
	onAddAsSubtask?: (workItemKey: string) => void;
	onCreateWorkItem?: () => void;
	onLinkWorkItem?: (workItemKey: string) => void;
}>) {
	const addAsSubtaskUnavailable = onAddAsSubtask === undefined;
	const createUnavailable = onCreateWorkItem === undefined;
	const linkUnavailable = onLinkWorkItem === undefined;
	const hasIssueKey = issueKey.length > 0;
	const linkLabel = hasIssueKey ? `Link to ${issueKey}` : "Link work item";

	return (
		<ButtonGroup aria-label={hasIssueKey ? `Link ${issueKey}` : "Link work item"} className="w-full gap-2" variant="separated">
			<Button
				aria-disabled={linkUnavailable}
				aria-label={linkUnavailable ? `${linkLabel} unavailable` : undefined}
				className={cn(
					"w-full flex-1 justify-center text-center",
					linkUnavailable ? "cursor-not-allowed opacity-(--opacity-disabled)" : undefined,
				)}
				onClick={() => onLinkWorkItem?.(issueKey)}
				size="compact"
				type="button"
				variant="outline"
			>
				{linkLabel}
			</Button>
			<DropdownMenu>
				<DropdownMenuTrigger
					render={(
						<Button
							aria-label={hasIssueKey ? `More actions for ${issueKey}` : "More work item actions"}
							size="icon-compact"
							type="button"
							variant="outline"
						>
							<ShowMoreHorizontalIcon label="" size="small" />
						</Button>
					)}
				/>
				<DropdownMenuContent align="end">
					<DropdownMenuGroup>
						<DropdownMenuItem
							disabled={addAsSubtaskUnavailable || !hasIssueKey}
							onSelect={() => onAddAsSubtask?.(issueKey)}
						>
							{hasIssueKey ? `Add new subtask to ${issueKey}` : "Add new subtask"}
						</DropdownMenuItem>
						<DropdownMenuItem
							disabled={createUnavailable}
							onSelect={() => onCreateWorkItem?.()}
						>
							Create new work item
						</DropdownMenuItem>
					</DropdownMenuGroup>
				</DropdownMenuContent>
			</DropdownMenu>
		</ButtonGroup>
	);
}

/**
 * Hover-card suggestion for linking an untracked agent session to a Jira work
 * item. Header is the session title, a High-confidence lozenge, and a compact
 * agent + relative-time row; the footer is the link rationale and actions.
 */
export function JiraSessionUntrackedWorkCard({
	onAddAsSubtask,
	onCreateWorkItem,
	onLinkWorkItem,
	session,
}: Readonly<{
	onAddAsSubtask?: (workItemKey: string) => void;
	onCreateWorkItem?: () => void;
	onLinkWorkItem?: (workItemKey: string) => void;
	session: JiraSidebarSessionItem;
}>) {
	const titleId = useId();
	const rationaleId = useId();
	const hasIssueKey = session.issueKey.length > 0;

	return (
		<JiraSessionFlyoutCard
			aria-labelledby={`${titleId} ${rationaleId}`}
			meta={
				<div className="flex h-4 min-w-0 items-center gap-1">
					<span aria-hidden="true" className="flex size-4 shrink-0 items-center justify-center">
						<AgentAvatarVisual
							avatarClassName="after:border-0"
							avatarSrc={session.agentAvatarSrc}
							brandName={session.brandName}
							fallbackText={session.agentName}
							label=""
							sizePx={16}
							vpkLogo={session.vpkLogo}
						/>
					</span>
					<p className="min-w-0 truncate text-xs leading-4 text-text-subtlest">{session.agentName}</p>
					<span aria-hidden="true" className="shrink-0 text-xs leading-4 text-text-subtlest">·</span>
					<p className="shrink-0 text-xs leading-4 text-text-subtlest">
						{JIRA_SESSION_UPDATED_LABEL[session.status]}
					</p>
				</div>
			}
			title={session.title}
			titleId={titleId}
			trailing={<Lozenge className="shrink-0" variant="success">High</Lozenge>}
		>
			<div className="flex flex-col gap-2">
				<h3 className="text-xs leading-4 font-medium text-text" id={rationaleId}>
					High confidence to link
				</h3>
				<p className="text-xs leading-4 text-text-subtlest">
					{hasIssueKey
						? `This session appears related to ${session.issueKey} because the work item matches its activity and context.`
						: "This session appears related to a work item because it matches its activity and context."}
				</p>
			</div>
			<JiraSessionUntrackedWorkActions
				issueKey={session.issueKey}
				onAddAsSubtask={onAddAsSubtask}
				onCreateWorkItem={onCreateWorkItem}
				onLinkWorkItem={onLinkWorkItem}
			/>
		</JiraSessionFlyoutCard>
	);
}
