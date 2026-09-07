"use client";

import { useId } from "react";

import ArchiveBoxIcon from "@atlaskit/icon/core/archive-box";
import ShowMoreHorizontalIcon from "@atlaskit/icon/core/show-more-horizontal";

import { SMART_LINK_MODAL_ACTIONS, SmartLink, type SmartLinkItem } from "@/components/blocks/smart-link";
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
import { JiraSessionDetailsBody } from "./jira-session-details-card";
import { JIRA_SESSION_UPDATED_LABEL } from "./jira-session-flyout-data";

function sessionArtifactItems(session: JiraSidebarSessionItem): SmartLinkItem[] {
	if (session.pullRequestNumber === undefined || session.pullRequestUrl === undefined) {
		return [];
	}

	return [{
		id: `${session.id}-pull-request`,
		href: session.pullRequestUrl,
		title: `#${session.pullRequestNumber}: ${session.pullRequestTitle ?? `${session.issueKey}: ${session.issueSummary}`}`,
		variant: "pull-request",
		provider: { name: "GitHub", logo: { kind: "third-party", name: "github" } },
		icon: { kind: "third-party", name: "github" },
		actions: SMART_LINK_MODAL_ACTIONS,
	}];
}

function JiraSessionUntrackedWorkActions({
	issueKey,
	onArchiveSession,
	onCreateWorkItem,
	onLinkWorkItem,
}: Readonly<{
	issueKey: string;
	onAddAsSubtask?: (workItemKey: string) => void;
	onArchiveSession?: () => void;
	onCreateWorkItem?: () => void;
	onLinkWorkItem?: (workItemKey: string) => void;
}>) {
	const archiveUnavailable = onArchiveSession === undefined;
	const createUnavailable = onCreateWorkItem === undefined;
	const linkUnavailable = onLinkWorkItem === undefined;
	const hasIssueKey = issueKey.length > 0;
	const linkLabel = hasIssueKey ? `Link to ${issueKey}` : "Link work item";
	const createButton = (
		<Button
			disabled={createUnavailable}
			className="w-full flex-1 justify-center text-center"
			onClick={() => onCreateWorkItem?.()}
			size="compact"
			type="button"
			variant="outline"
		>
			Create new work item
		</Button>
	);
	const archiveButton = (
		<Button
			aria-label={archiveUnavailable ? "Archive unavailable" : "Archive"}
			disabled={archiveUnavailable}
			onClick={() => onArchiveSession?.()}
			size="icon-compact"
			type="button"
			variant="outline"
		>
			<ArchiveBoxIcon label="" size="small" />
		</Button>
	);

	return (
		<ButtonGroup
			aria-label={hasIssueKey ? `Link ${issueKey}` : "Create work item actions"}
			className="w-full gap-2"
			variant="separated"
		>
			{hasIssueKey ? (
				<>
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
									aria-label={`More actions for ${issueKey}`}
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
									disabled={createUnavailable}
									onSelect={() => onCreateWorkItem?.()}
								>
									Create new work item
								</DropdownMenuItem>
								<DropdownMenuItem
									disabled={archiveUnavailable}
									onSelect={() => onArchiveSession?.()}
								>
									Archive
								</DropdownMenuItem>
							</DropdownMenuGroup>
						</DropdownMenuContent>
					</DropdownMenu>
				</>
			) : (
				<>
					{createButton}
					{archiveButton}
				</>
			)}
		</ButtonGroup>
	);
}

/**
 * Hover-card suggestion for linking an untracked agent session to a Jira work
 * item. The body is the shared session-details middle layer; the footer
 * contains the link rationale and actions.
 */
export function JiraSessionUntrackedWorkCard({
	onAddAsSubtask,
	onArchiveSession,
	onCreateWorkItem,
	onLinkWorkItem,
	session,
}: Readonly<{
	onAddAsSubtask?: (workItemKey: string) => void;
	onArchiveSession?: () => void;
	onCreateWorkItem?: () => void;
	onLinkWorkItem?: (workItemKey: string) => void;
	session: JiraSidebarSessionItem;
}>) {
	const titleId = useId();
	const artifactsId = useId();
	const rationaleId = useId();
	const hasIssueKey = session.issueKey.length > 0;
	const artifacts = sessionArtifactItems(session);
	const rationaleTitle = hasIssueKey ? "High confidence to link" : "Nothing available to link to";
	const confidenceRationale = hasIssueKey
		? `This session appears related to ${session.issueKey} because the work item matches its activity and context.`
		: "Create a work item to track it.";
	const ariaLabelledBy = artifacts.length > 0
		? `${titleId} ${artifactsId} ${rationaleId}`
		: `${titleId} ${rationaleId}`;

	return (
		<JiraSessionFlyoutCard
			aria-labelledby={ariaLabelledBy}
			body={
				<>
					<JiraSessionDetailsBody hideAgentRow hideSessionRow session={session} />
					{artifacts.length > 0 ? (
						<div className="flex flex-col gap-2">
							<h3 className="text-xs leading-4 font-medium text-text" id={artifactsId}>
								Artifacts
							</h3>
							<ul className="flex flex-col gap-1">
								{artifacts.map((item) => (
									<li className="flex min-w-0" key={item.id}>
										<SmartLink className="max-w-full" item={item} side="right" />
									</li>
								))}
							</ul>
						</div>
					) : null}
				</>
			}
			bodyClassName="gap-1"
			footer={
				<>
					<div className="flex flex-col gap-2">
						<h3 className="text-xs leading-4 font-medium text-text" id={rationaleId}>
							{rationaleTitle}
						</h3>
						<p className="text-xs leading-4 text-text-subtlest">
							{confidenceRationale}
						</p>
					</div>
					<JiraSessionUntrackedWorkActions
						issueKey={session.issueKey}
						onAddAsSubtask={onAddAsSubtask}
						onArchiveSession={onArchiveSession}
						onCreateWorkItem={onCreateWorkItem}
						onLinkWorkItem={onLinkWorkItem}
					/>
				</>
			}
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
			trailing={hasIssueKey ? <Lozenge className="shrink-0" variant="success">High</Lozenge> : null}
		/>
	);
}
