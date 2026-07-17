"use client";

import type { ReactNode } from "react";

import AiAgentIcon from "@atlaskit/icon/core/ai-agent";
import CloudArrowUpIcon from "@atlaskit/icon/core/cloud-arrow-up";
import CommitIcon from "@atlaskit/icon/core/commit";
import FolderClosedIcon from "@atlaskit/icon/core/folder-closed";
import PullRequestIcon from "@atlaskit/icon/core/pull-request";
import StatusInformationIcon from "@atlaskit/icon/core/status-information";
import TaskIcon from "@atlaskit/icon/core/task";

import { SmartLink, type SmartLinkItem } from "@/components/blocks/smart-link";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Icon } from "@/components/ui/icon";
import {
	JiraSessionHoverDetails,
	JiraSessionLabel,
	JiraSessionLifecycle,
	type JiraSidebarSessionItem,
	type JiraSidebarSessionStatus,
} from "@/components/blocks/product-sidebar/variants/jira";
import {
	ASX_QUEUE_SESSION_SEEDS,
	createAsxQueueSidebarSessionItem,
} from "@/components/projects/jira-queue/data/queue-sessions";
import {
	HoverCard,
	HoverCardContent,
	HoverCardTrigger,
} from "@/components/ui/hover-card";
import { GithubLogo } from "@/components/ui/logo-third-party";
import { Lozenge, type LozengeProps } from "@/components/ui/lozenge";
import { Tag } from "@/components/ui/tag";
import { TileAvatar } from "@/components/ui/tile";
import { cn } from "@/lib/utils";

/**
 * The `/asx` queue session flyout, redesigned as a richer card. Each session
 * lifecycle state gets its own section whose trigger opens the real anchored
 * `HoverCard` popover. The flyout body reuses the shared SmartLink (work item),
 * agent Tag pill, Lozenge (status + PR state), and third-party GitHub logo, and
 * splits SCM ("Development") fields into their own separated, mono-font block.
 */

/** Section heading + trigger copy for each session lifecycle state. */
const STATUS_META: Record<JiraSidebarSessionStatus, { label: string; blurb: string }> = {
	"awaiting-input": {
		label: "Awaiting user response",
		blurb: "The agent is paused for input and surfaces its status in the flyout.",
	},
	running: {
		label: "In progress",
		blurb: "The agent is actively working; the flyout shows session, agent, and work item.",
	},
	"pr-open": {
		label: "PR open",
		blurb: "A pull request is open; the Development block adds the PR and repository.",
	},
	merged: {
		label: "PR merged",
		blurb: "The pull request has merged; the Development block keeps the delivery trail.",
	},
	stopped: {
		label: "Stopped",
		blurb: "The session was stopped before completing.",
	},
};

/** Stable relative "updated" label per session state (demo data only). */
const STATUS_UPDATED_LABEL: Record<JiraSidebarSessionStatus, string> = {
	"awaiting-input": "2d ago",
	running: "3m ago",
	"pr-open": "1h ago",
	merged: "5h ago",
	stopped: "1d ago",
};

/** Work-item status lozenge derived from the session lifecycle. */
const STATUS_WORK_ITEM: Record<
	JiraSidebarSessionStatus,
	{ label: string; variant: LozengeProps["variant"] }
> = {
	"awaiting-input": { label: "To Do", variant: "neutral" },
	running: { label: "In progress", variant: "information" },
	"pr-open": { label: "In review", variant: "information" },
	merged: { label: "Done", variant: "success" },
	stopped: { label: "Stopped", variant: "neutral" },
};

/** Pull-request state lozenge derived from the session lifecycle. */
function prStateLozenge(status: JiraSidebarSessionStatus): { label: string; variant: LozengeProps["variant"] } {
	return status === "merged"
		? { label: "Merged", variant: "discovery" }
		: { label: "Open", variant: "success" };
}

/** The four demo sessions from the `/asx` queue, mapped to sidebar items. */
export const AGENT_SESSION_FLYOUT_SESSIONS: readonly JiraSidebarSessionItem[] =
	ASX_QUEUE_SESSION_SEEDS.map(createAsxQueueSidebarSessionItem);

export interface AgentSessionFlyoutProps {
	/** Sessions to render, one section per item. Defaults to the `/asx` queue seeds. */
	sessions?: readonly JiraSidebarSessionItem[];
	/** Additional classes applied to the outer sections container. */
	className?: string;
}

/** Builds the SmartLink work-item link (issue key + summary + status lozenge). */
function toWorkItem(session: JiraSidebarSessionItem): SmartLinkItem {
	const workItemStatus = STATUS_WORK_ITEM[session.status];

	return {
		id: `${session.id}-work-item`,
		href: "#work-item",
		title: `${session.issueKey}: ${session.issueSummary}`,
		variant: "jira",
		provider: { name: "Jira", logo: { kind: "atlassian", name: "jira" } },
		icon: { kind: "atlassian", name: "jira" },
		status: { label: workItemStatus.label, variant: workItemStatus.variant },
	};
}

/** A labeled row inside the flyout: fixed label column + value column. */
function FlyoutRow({
	icon,
	label,
	children,
}: Readonly<{ icon: ReactNode; label: string; children: ReactNode }>) {
	return (
		<div className="grid min-w-0 grid-cols-[16px_84px_minmax(0,1fr)] items-center gap-2 text-xs leading-5">
			<span className="grid size-4 place-items-center text-icon-subtle" aria-hidden="true">
				{icon}
			</span>
			<span className="text-text-subtlest">{label}</span>
			<span className="flex min-w-0 items-center text-text">{children}</span>
		</div>
	);
}

/** The redesigned flyout body matching the reference mock. */
function AgentSessionFlyoutBody({ session }: Readonly<{ session: JiraSidebarSessionItem }>) {
	const hasDevelopment = Boolean(session.repository ?? session.pullRequestNumber ?? session.commit);
	const prState = prStateLozenge(session.status);

	return (
		<div className="flex flex-col gap-3">
			<div className="flex items-start justify-between gap-3">
				<p className="min-w-0 truncate text-sm font-semibold leading-5 text-text" title={session.title}>
					{session.title}
				</p>
				<span className="shrink-0 text-[12px] leading-4 text-text-subtlest">
					{STATUS_UPDATED_LABEL[session.status]}
				</span>
			</div>

			{session.status === "awaiting-input" ? (
				<Alert size="small" variant="info">
					<Icon render={<StatusInformationIcon label="" />} label="Information" />
					<AlertTitle>Awaiting user response</AlertTitle>
				</Alert>
			) : null}

			<div className="flex flex-col gap-2">
				<FlyoutRow
					icon={session.host === "cloud" ? <CloudArrowUpIcon label="" size="small" /> : <FolderClosedIcon label="" size="small" />}
					label="Session"
				>
					{session.host === "cloud" ? "Cloud" : "Local"}
				</FlyoutRow>
				<FlyoutRow icon={<AiAgentIcon label="" size="small" />} label="Agent">
					<Tag
						elemBefore={session.agentAvatarSrc ? (
							<TileAvatar alt="" aria-hidden shape="hexagon" src={session.agentAvatarSrc} />
						) : undefined}
						type="agent"
					>
						{session.agentName}
					</Tag>
				</FlyoutRow>
				<FlyoutRow icon={<TaskIcon label="" size="small" />} label="Work item">
					<SmartLink item={toWorkItem(session)} />
				</FlyoutRow>
			</div>

			{hasDevelopment ? (
				<div className="flex flex-col gap-2">
					<div className="flex items-center gap-3 pt-1">
						<span className="text-xs font-semibold text-text-subtlest">Development</span>
						<span className="h-px flex-1 bg-border" aria-hidden="true" />
					</div>
					{session.pullRequestNumber ? (
						<FlyoutRow icon={<PullRequestIcon label="" size="small" />} label="Pull request">
							<span className="flex items-center gap-2">
								<span className="font-mono text-text">#{session.pullRequestNumber}</span>
								<Lozenge variant={prState.variant}>{prState.label}</Lozenge>
							</span>
						</FlyoutRow>
					) : null}
					{session.commit ? (
						<FlyoutRow icon={<CommitIcon label="" size="small" />} label="Commit">
							<span className="font-mono text-text">{session.commit}</span>
						</FlyoutRow>
					) : null}
					{session.repository ? (
						<FlyoutRow icon={<FolderClosedIcon label="" size="small" />} label="Repository">
							<span className="flex min-w-0 items-center gap-1.5">
								<GithubLogo aria-hidden borderless label="" size="xxsmall" />
								<span className="truncate font-mono text-text">{session.repository}</span>
							</span>
						</FlyoutRow>
					) : null}
				</div>
			) : null}
		</div>
	);
}

/** A session-row trigger styled like the live Jira sidebar row. */
function AgentSessionFlyoutTrigger({ session }: Readonly<{ session: JiraSidebarSessionItem }>) {
	return (
		<button
			className="group/session flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors duration-fast ease-out hover:bg-surface-hovered focus-visible:bg-surface-hovered focus-visible:outline-none"
			type="button"
		>
			<span className="flex min-w-0 flex-1 flex-col gap-0.5">
				<span className="min-w-0 text-sm font-medium text-text">
					<JiraSessionLabel session={session} />
				</span>
				<span className="min-w-0 text-xs text-text-subtlest">
					{session.issueKey}: {session.issueSummary}
				</span>
			</span>
			<span className="grid size-6 shrink-0 place-items-center">
				<JiraSessionLifecycle status={session.status} />
			</span>
		</button>
	);
}

/** A single lifecycle section: heading, blurb, and the anchored flyout. */
function AgentSessionFlyoutSection({ session }: Readonly<{ session: JiraSidebarSessionItem }>) {
	const meta = STATUS_META[session.status];

	return (
		<section className="flex flex-col gap-3">
			<div className="flex flex-col gap-1">
				<h3 className="text-sm font-semibold text-text">{meta.label}</h3>
				<p className="text-xs text-text-subtlest">{meta.blurb}</p>
			</div>
			<div className="max-w-sm rounded-lg border border-border bg-surface p-1">
				<HoverCard closeDelay={80} openDelay={160}>
					<HoverCardTrigger render={<div className="w-full" />}>
						<AgentSessionFlyoutTrigger session={session} />
					</HoverCardTrigger>
					<HoverCardContent
						align="start"
						alignOffset={0}
						className="w-[400px] border-0 bg-surface-overlay p-4 text-text shadow-overlay"
						side="right"
						sideOffset={8}
					>
						<AgentSessionFlyoutBody session={session} />
					</HoverCardContent>
				</HoverCard>
			</div>
		</section>
	);
}

/**
 * Renders the queue session flyout as one section per session state. By default
 * it shows the four `/asx` sessions (awaiting input, in progress, PR open, and
 * PR merged); hover a row to open its redesigned flyout card.
 */
export function AgentSessionFlyout({
	sessions = AGENT_SESSION_FLYOUT_SESSIONS,
	className,
}: Readonly<AgentSessionFlyoutProps>) {
	return (
		<div className={cn("flex flex-col gap-8", className)}>
			{sessions.map((session) => (
				<AgentSessionFlyoutSection key={session.id} session={session} />
			))}
		</div>
	);
}

export default AgentSessionFlyout;

// Re-export the shared flyout body so consumers can still reach the original
// compact popover if they need it.
export { JiraSessionHoverDetails };
