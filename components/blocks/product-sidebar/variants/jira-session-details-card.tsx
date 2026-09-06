"use client";

import { useId, type ReactNode } from "react";
import { preload } from "react-dom";

import BranchIcon from "@atlaskit/icon/core/branch";
import MergeFailureIcon from "@atlaskit/icon/core/merge-failure";
import MergeSuccessIcon from "@atlaskit/icon/core/merge-success";
import PullRequestIcon from "@atlaskit/icon/core/pull-request";
import ScreenIcon from "@atlaskit/icon/core/screen";
import CloudIcon from "@atlaskit/icon-lab/core/cloud";

import { AgentProfileCard } from "@/components/blocks/agent-profile-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	HoverCard,
	HoverCardContent,
	HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Lozenge } from "@/components/ui/lozenge";
import { MetadataPathLink, MetadataPathValue } from "@/components/ui/metadata-path-link";
import { Tag } from "@/components/ui/tag";
import { AgentAvatarVisual } from "@/components/ui-custom/agent-avatar-visual";
import { ProgressCircle } from "@/components/ui-custom/progress-circle";
import { getAgentProfileBannerSrc } from "@/lib/agent-avatars";

import type {
	JiraSidebarSessionHost,
	JiraSidebarSessionItem,
	JiraSidebarSessionStatus,
} from "./jira";
import { JiraSessionFlyoutCard } from "./jira-session-flyout-card";
import {
	formatSessionChecks,
	JIRA_SESSION_UPDATED_LABEL,
} from "./jira-session-flyout-data";

function actorInitials(name: string): string {
	return name
		.split(/\s+/u)
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0]?.toUpperCase())
		.join("");
}

/** Hover-card host glyph: Screen for local (Figma), Cloud for hosted sessions. */
function detailsHostIcon(host: JiraSidebarSessionHost): ReactNode {
	return host === "cloud" ? (
		<CloudIcon label="" size="small" />
	) : (
		<ScreenIcon label="" size="small" />
	);
}

/**
 * PR glyph + color matching the session-list trailing icons: green open,
 * purple merged. Stopped sessions with a PR use the failed-merge glyph in
 * danger red — the list uses a stop icon for the session, not the PR row.
 */
function detailsPullRequestGlyph(status: JiraSidebarSessionStatus): ReactNode {
	switch (status) {
		case "merged":
			return (
				<span className="grid size-4 shrink-0 place-items-center text-icon-accent-purple" title="Pull request merged">
					<MergeSuccessIcon color="currentColor" label="Pull request merged" size="small" />
				</span>
			);
		case "stopped":
			return (
				<span className="grid size-4 shrink-0 place-items-center text-icon-danger" title="Pull request failed">
					<MergeFailureIcon color="currentColor" label="Pull request failed" size="small" />
				</span>
			);
		case "awaiting-input":
		case "running":
		case "pr-open":
			return (
				<span className="grid size-4 shrink-0 place-items-center text-icon-success" title="Pull request open">
					<PullRequestIcon color="currentColor" label="Pull request open" size="small" />
				</span>
			);
		default: {
			const _exhaustive: never = status;
			return _exhaustive;
		}
	}
}

function DetailsMetaRow({
	icon,
	label,
	children,
}: Readonly<{ icon: ReactNode; label: string; children: ReactNode }>) {
	return (
		<div className="flex min-w-0 items-center gap-1 text-xs leading-5">
			<span className="grid size-4 shrink-0 place-items-center text-icon-subtlest" aria-hidden="true">
				{icon}
			</span>
			<span className="sr-only">{label}</span>
			<span className="flex min-w-0 flex-1 items-center text-text">{children}</span>
		</div>
	);
}

function DetailsInvokerMeta({ session }: Readonly<{ session: JiraSidebarSessionItem }>) {
	return (
		<div className="flex h-4 min-w-0 items-center gap-1">
			{session.invokedBy ? (
				<>
					<Avatar
						className="shrink-0"
						label={session.invokedBy.name}
						shape="circle"
						size="xs"
					>
						{session.invokedBy.src ? (
							<AvatarImage alt="" src={session.invokedBy.src} />
						) : null}
						<AvatarFallback>{actorInitials(session.invokedBy.name)}</AvatarFallback>
					</Avatar>
					<p className="min-w-0 truncate text-xs leading-4 text-text-subtlest">
						{session.invokedBy.name}
					</p>
					<span aria-hidden="true" className="shrink-0 text-xs leading-4 text-text-subtlest">
						·
					</span>
				</>
			) : null}
			<p className="shrink-0 text-xs leading-4 text-text-subtlest">
				{JIRA_SESSION_UPDATED_LABEL[session.status]}
			</p>
		</div>
	);
}

function DetailsAgentTag({ session }: Readonly<{ session: JiraSidebarSessionItem }>) {
	return (
		<div className="flex min-w-0 items-center">
			<span className="sr-only">Agent</span>
			<HoverCard closeDelay={120} openDelay={0}>
				<HoverCardTrigger
					closeDelay={120}
					delay={0}
					render={
						<Tag
							color="gray"
							elemBefore={
								<span aria-hidden>
									<AgentAvatarVisual
										avatarClassName="after:border-0"
										avatarSrc={session.agentAvatarSrc}
										brandName={session.brandName}
										fallbackText={session.agentName}
										label={session.agentName}
										sizePx={16}
										vpkLogo={session.vpkLogo}
									/>
								</span>
							}
							type="agent"
							variant="editor"
						>
							{session.agentName}
						</Tag>
					}
				/>
				<HoverCardContent
					align="center"
					alignOffset={0}
					className="w-[360px] max-w-[calc(100vw-48px)] rounded-xl border-0 bg-transparent p-0 shadow-none"
					side="right"
					sideOffset={8}
				>
					<AgentProfileCard
						avatarSrc={session.agentAvatarSrc}
						name={session.agentName}
						surface="overlay"
					/>
				</HoverCardContent>
			</HoverCard>
		</div>
	);
}

function detailsPullRequestTitle(session: JiraSidebarSessionItem): string | null {
	if (session.pullRequestTitle) {
		return `#${session.pullRequestNumber}: ${session.pullRequestTitle}`;
	}
	return session.pullRequestNumber ? `#${session.pullRequestNumber}` : null;
}

function DetailsPullRequestRow({ session }: Readonly<{ session: JiraSidebarSessionItem }>) {
	const pullRequestTitle = detailsPullRequestTitle(session);
	if (!session.pullRequestNumber || !pullRequestTitle) {
		return null;
	}
	const hasCodeChanges = session.additions !== undefined && session.deletions !== undefined;
	return (
		<div className="flex min-w-0 items-center gap-1 text-xs leading-5">
			{detailsPullRequestGlyph(session.status)}
			<MetadataPathLink
				className="min-w-0 flex-1 truncate text-xs leading-5 text-text"
				title={pullRequestTitle}
			>
				{pullRequestTitle}
			</MetadataPathLink>
			{hasCodeChanges ? (
				<span className="flex shrink-0 items-center gap-1 text-xs leading-5">
					<span className="text-text-success">+{session.additions}</span>
					<span className="text-text-danger">-{session.deletions}</span>
				</span>
			) : null}
		</div>
	);
}

function DetailsBranchRow({ session }: Readonly<{ session: JiraSidebarSessionItem }>) {
	if (!session.branch || session.pullRequestNumber) {
		return null;
	}
	return (
		<DetailsMetaRow icon={<BranchIcon label="" size="small" />} label="Branch">
			<MetadataPathLink className="min-w-0 truncate text-xs leading-5" segmented title={session.branch}>
				<MetadataPathValue path={session.branch} />
			</MetadataPathLink>
		</DetailsMetaRow>
	);
}

function DetailsChecksRow({ session }: Readonly<{ session: JiraSidebarSessionItem }>) {
	const visibleChecks = session.status === "merged" && session.checks?.failed === 0
		? undefined
		: session.checks;
	if (!visibleChecks) {
		return null;
	}
	const checksTotal = visibleChecks.passed + visibleChecks.failed;
	return (
		<DetailsMetaRow
			icon={(
				<ProgressCircle
					aria-hidden
					animated={false}
					size="xs"
					value={checksTotal > 0 ? Math.round((visibleChecks.passed / checksTotal) * 100) : 0}
					variant="outline"
				/>
			)}
			label="Checks"
		>
			<span className="shrink-0 text-xs font-normal text-text">
				{formatSessionChecks(visibleChecks)}
			</span>
		</DetailsMetaRow>
	);
}

/**
 * Compact session hover card: title, invoker meta, Local/Cloud, agent Tag,
 * PR icon + title + diffs, and checks when present. Branch appears only when
 * there is no PR yet. Repo, worktree, and work item stay on
 * `JiraSessionFlyoutBody` for detail panels.
 */
export function JiraSessionDetailsCard({
	session,
}: Readonly<{ session: JiraSidebarSessionItem }>) {
	const titleId = useId();
	const agentBannerSrc = getAgentProfileBannerSrc(session.agentAvatarSrc);
	preload(agentBannerSrc, { as: "image" });

	return (
		<JiraSessionFlyoutCard
			footerClassName="gap-1"
			meta={<DetailsInvokerMeta session={session} />}
			title={session.title}
			titleId={titleId}
			trailing={
				session.status === "awaiting-input" ? (
					<Lozenge className="shrink-0" variant="information">Needs input</Lozenge>
				) : null
			}
		>
			<DetailsMetaRow icon={detailsHostIcon(session.host)} label="Session">
				{session.host === "cloud" ? "Cloud" : "Local"}
			</DetailsMetaRow>
			<DetailsAgentTag session={session} />
			<DetailsPullRequestRow session={session} />
			<DetailsBranchRow session={session} />
			<DetailsChecksRow session={session} />
		</JiraSessionFlyoutCard>
	);
}
