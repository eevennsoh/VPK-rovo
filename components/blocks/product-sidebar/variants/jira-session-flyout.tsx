"use client";

import {
	cloneElement,
	isValidElement,
	useId,
	type ComponentProps,
	type FocusEventHandler,
	type ReactNode,
} from "react";
import { preload } from "react-dom";

import AiAgentIcon from "@atlaskit/icon/core/ai-agent";
import BranchIcon from "@atlaskit/icon/core/branch";
import CheckCircleIcon from "@atlaskit/icon/core/check-circle";
import DevicesIcon from "@atlaskit/icon/core/devices";
import FolderClosedIcon from "@atlaskit/icon/core/folder-closed";
import MergeFailureIcon from "@atlaskit/icon/core/merge-failure";
import MergeSuccessIcon from "@atlaskit/icon/core/merge-success";
import PullRequestIcon from "@atlaskit/icon/core/pull-request";
import StatusInformationIcon from "@atlaskit/icon/core/status-information";
import TaskIcon from "@atlaskit/icon/core/task";
import CloudIcon from "@atlaskit/icon-lab/core/cloud";
import IfElseIcon from "@atlaskit/icon-lab/core/if-else";

import { AgentProfileCard } from "@/components/blocks/agent-profile-card";
import { SmartLink, SMART_LINK_MODAL_ACTIONS, type SmartLinkItem } from "@/components/blocks/smart-link";
import { Alert, AlertTitle } from "@/components/ui/alert";
import {
	HoverCard,
	HoverCardContent,
	HoverCardTrigger,
	HoverCardViewport,
	type HoverCardHandle,
	type HoverCardTriggerProps,
} from "@/components/ui/hover-card";
import { Icon } from "@/components/ui/icon";
import { GithubLogo } from "@/components/ui/logo-third-party";
import { Lozenge, type LozengeProps } from "@/components/ui/lozenge";
import { Tag } from "@/components/ui/tag";
import { TileAvatar } from "@/components/ui/tile";
import { getAgentProfileBannerSrc } from "@/lib/agent-avatars";
import { MetadataPathLink, MetadataPathValue } from "@/components/ui/metadata-path-link";

import type {
	JiraSidebarSessionHost,
	JiraSidebarSessionItem,
	JiraSidebarSessionStatus,
} from "./jira";
import { prStateLozenge } from "./jira-session-flyout-data";

export { createJiraSessionFlyoutHandle, prStateLozenge } from "./jira-session-flyout-data";

export type JiraSessionFlyoutHandle = HoverCardHandle<JiraSidebarSessionItem>;

export type JiraSessionFlyoutTriggerProps = Omit<
	HoverCardTriggerProps<JiraSidebarSessionItem>,
	"handle" | "payload"
> & {
	handle: JiraSessionFlyoutHandle;
	session: JiraSidebarSessionItem;
};

export interface JiraSessionFlyoutSurfaceProps {
	handle: JiraSessionFlyoutHandle;
}

interface FocusCaptureChildProps {
	onFocusCapture?: FocusEventHandler<HTMLElement>;
}

/** Connects a session row to the list's shared flyout and carries its payload. */
export function JiraSessionFlyoutTrigger({
	closeDelay = 80,
	children,
	delay = 0,
	handle,
	id: idProp,
	session,
	...props
}: Readonly<JiraSessionFlyoutTriggerProps>) {
	const generatedId = useId();
	const triggerId = idProp ?? generatedId;
	const childElement = isValidElement<FocusCaptureChildProps>(children)
		? children
		: null;
	const triggerChild = childElement
		? cloneElement(childElement, {
			onFocusCapture: (event) => {
				childElement.props.onFocusCapture?.(event);
				if (
					!event.defaultPrevented &&
					event.target.matches(":focus-visible") &&
					!event.currentTarget.contains(event.relatedTarget as Node | null)
				) {
					handle.open(triggerId);
				}
			},
		})
		: children;

	return (
		<HoverCardTrigger<JiraSidebarSessionItem>
			closeDelay={closeDelay}
			delay={delay}
			handle={handle}
			id={triggerId}
			payload={session}
			{...props}
		>
			{triggerChild}
		</HoverCardTrigger>
	);
}

/**
 * The rich Jira agent-session flyout body — the canonical "latest" flyout for a
 * queue session. It is rendered both by the live product sidebar
 * (`JiraSessionRow` in `./jira`) and by the `agent-session-flyout` block
 * showcase, so it lives here as a shared owner rather than inside the block.
 *
 * The body reuses the shared design-system components: the work item is a
 * SmartLink, the agent is an agent-type Tag pill, PR state is a Lozenge, and the
 * SCM ("Development") fields sit in their own separated block behind the
 * third-party GitHub logo, rendered in the normal 12px body font.
 *
 * It depends on `./jira` for TYPES ONLY (erased at build time) so that `./jira`
 * can import this body back without creating a runtime import cycle.
 */

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

/**
 * Pull-request row icon, contextual to the merge outcome:
 * - `merged` → merge success
 * - `stopped` → merge failure (the PR ended without landing)
 * - everything else (open PR, running, …) → the generic pull-request glyph
 */
function prStateIcon(status: JiraSidebarSessionStatus): ReactNode {
	if (status === "merged") return <MergeSuccessIcon label="" size="small" />;
	if (status === "stopped") return <MergeFailureIcon label="" size="small" />;
	return <PullRequestIcon label="" size="small" />;
}

/**
 * Session host glyph: a cloud for a hosted session, devices for one running on
 * the viewer's own machine. Both read as "where this session runs" — unlike the
 * previous cloud-arrow-up (an upload action) and folder-closed (a directory),
 * which named the wrong concept for this row.
 *
 * `cloud` comes from icon-lab because `@atlaskit/icon/core` only ships
 * `cloud-arrow-up`; `devices` is core.
 */
function hostIcon(host: JiraSidebarSessionHost): ReactNode {
	return host === "cloud" ? (
		<CloudIcon label="" size="small" />
	) : (
		<DevicesIcon label="" size="small" />
	);
}

/** The Jira status workflow offered by the work-item status dropdown. */
const WORK_ITEM_STATUS_OPTIONS: ReadonlyArray<{ label: string; variant: LozengeProps["variant"] }> = [
	{ label: "To Do", variant: "neutral" },
	{ label: "In progress", variant: "information" },
	{ label: "In review", variant: "information" },
	{ label: "Done", variant: "success" },
];

/** Builds the SmartLink work-item link (issue key + summary + assignee, priority,
 * and an interactive status dropdown). */
function toWorkItem(session: JiraSidebarSessionItem): SmartLinkItem {
	const workItemStatus = STATUS_WORK_ITEM[session.status];

	return {
		id: `${session.id}-work-item`,
		href: "#work-item",
		title: `${session.issueKey}: ${session.issueSummary}`,
		variant: "jira",
		provider: { name: "Jira", logo: { kind: "atlassian", name: "jira" } },
		icon: { kind: "atlassian", name: "jira" },
		description: `Primary work item for ${session.title}.`,
		assignee: session.assignee,
		priority: session.priority,
		status: {
			label: workItemStatus.label,
			variant: workItemStatus.variant,
			options: WORK_ITEM_STATUS_OPTIONS,
		},
		actions: SMART_LINK_MODAL_ACTIONS,
	};
}

/** A labeled row inside the flyout: fixed label column + value column. */
export function FlyoutRow({
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

/** A section divider heading ("Label ────") used inside the flyout body. It is
 * exported so the detail panel's Sources/Output sections reuse the exact same
 * heading composition, keeping every section header identical across surfaces. */
export function JiraSessionSectionHeading({
	id,
	children,
}: Readonly<{ id?: string; children: ReactNode }>) {
	return (
		<div className="mb-1 flex items-center gap-3">
			<span className="shrink-0 text-xs font-semibold text-text-subtlest" id={id}>{children}</span>
			<span className="h-px flex-1 bg-border" aria-hidden="true" />
		</div>
	);
}

type JiraSessionPreviewPosition = Pick<
	ComponentProps<typeof HoverCardContent>,
	"align" | "alignOffset" | "side"
>;

/** The redesigned flyout body matching the reference mock. */
export function JiraSessionFlyoutBody({
	session,
	hideAgentRow = false,
	hideHeader = false,
	previewPosition,
}: Readonly<{
	session: JiraSidebarSessionItem;
	/** Hide the Agent metadata row when the surrounding surface owns agent selection. */
	hideAgentRow?: boolean;
	/**
	 * Hide the in-body title + relative-time header. Used by the queue detail
	 * panel, which already surfaces the session title in its own PanelHeader, so
	 * repeating it inside the body is redundant. The sidebar hover flyout leaves
	 * this `false` because it has no separate header.
	 */
	hideHeader?: boolean;
	/** Override nested Agent and Work item preview placement for constrained surfaces. */
	previewPosition?: JiraSessionPreviewPosition;
}>) {
	const agentBannerSrc = getAgentProfileBannerSrc(session.agentAvatarSrc);
	preload(agentBannerSrc, { as: "image" });

	const hasDevelopment = Boolean(
		session.repository ??
			session.pullRequestNumber ??
			session.branch ??
			session.worktreePath ??
			session.checks,
	);
	const prState = prStateLozenge(session.status);
	const hasCodeChanges = session.additions !== undefined && session.deletions !== undefined;

	return (
		<div className="flex flex-col gap-4">
			{hideHeader ? null : (
				<div className="flex items-center justify-between gap-3">
					<p className="min-w-0 truncate text-sm font-semibold leading-5 text-text" title={session.title}>
						{session.title}
					</p>
					<span className="shrink-0 text-[12px] leading-4 text-text-subtlest">
						{STATUS_UPDATED_LABEL[session.status]}
					</span>
				</div>
			)}

			{session.status === "awaiting-input" ? (
				<Alert size="small" variant="info">
					<Icon render={<StatusInformationIcon label="" />} label="Information" />
					<AlertTitle>Needs input</AlertTitle>
				</Alert>
			) : null}

			<div className="flex flex-col gap-2">
				<FlyoutRow icon={hostIcon(session.host)} label="Session">
					{session.host === "cloud" ? "Cloud" : "Local"}
				</FlyoutRow>
				{hideAgentRow ? null : (
					<FlyoutRow icon={<AiAgentIcon label="" size="small" />} label="Agent">
						<HoverCard closeDelay={120} openDelay={0}>
						{/* Base UI reads delays on the Trigger, not the Root. Set them here
						    too so this nested agent card opens instantly and tolerates the
						    pointer travel from the surrounding session flyout (which itself
						    closes with 0ms delay) without dismissing before it appears. */}
						<HoverCardTrigger
							closeDelay={120}
							delay={0}
							render={
								<Tag
									elemBefore={session.agentAvatarSrc ? (
										<TileAvatar alt="" aria-hidden shape="hexagon" src={session.agentAvatarSrc} />
									) : undefined}
									type="agent"
								>
									{session.agentName}
								</Tag>
							}
						/>
						<HoverCardContent
							align={previewPosition?.align ?? "center"}
							alignOffset={previewPosition?.alignOffset ?? 0}
							className="w-[360px] max-w-[calc(100vw-48px)] rounded-xl border-0 bg-transparent p-0 shadow-none"
							side={previewPosition?.side ?? "right"}
							sideOffset={8}
						>
							<AgentProfileCard
								avatarSrc={session.agentAvatarSrc}
								name={session.agentName}
								surface="overlay"
							/>
						</HoverCardContent>
						</HoverCard>
					</FlyoutRow>
				)}
				<FlyoutRow icon={<TaskIcon label="" size="small" />} label="Work item">
					<SmartLink
						align={previewPosition?.align ?? "center"}
						alignOffset={previewPosition?.alignOffset ?? 0}
						item={toWorkItem(session)}
						showStatus
						side={previewPosition?.side ?? "right"}
					/>
				</FlyoutRow>
			</div>

			{hasDevelopment ? (
				<div className="flex flex-col gap-2">
					<JiraSessionSectionHeading>Development</JiraSessionSectionHeading>
					{session.pullRequestNumber ? (
						<FlyoutRow icon={prStateIcon(session.status)} label="Pull request">
							<span className="flex min-w-0 flex-1 items-center gap-1">
								<Lozenge variant={prState.variant}>{prState.label}</Lozenge>
								<MetadataPathLink
									className="text-text"
									title={
										session.pullRequestTitle
											? `#${session.pullRequestNumber}: ${session.pullRequestTitle}`
											: `#${session.pullRequestNumber}`
									}
								>
									{session.pullRequestTitle
										? `#${session.pullRequestNumber}: ${session.pullRequestTitle}`
										: `#${session.pullRequestNumber}`}
								</MetadataPathLink>
								{hasCodeChanges ? (
									<span className="ml-auto flex shrink-0 items-center gap-1">
										<span className="text-text-success">+{session.additions}</span>
										<span className="text-text-danger">-{session.deletions}</span>
									</span>
								) : null}
							</span>
						</FlyoutRow>
					) : null}
					{session.checks ? (
						<FlyoutRow icon={<CheckCircleIcon label="" size="small" />} label="Checks">
							<span className="min-w-0 truncate text-text" title={session.checks}>{session.checks}</span>
						</FlyoutRow>
					) : null}
					{session.repository ? (
						<FlyoutRow icon={<FolderClosedIcon label="" size="small" />} label="Repository">
							<span className="flex min-w-0 items-center gap-1">
								<GithubLogo aria-hidden borderless label="" size="xxsmall" />
								<MetadataPathLink segmented title={session.repository}>
									<MetadataPathValue path={session.repository} />
								</MetadataPathLink>
							</span>
						</FlyoutRow>
					) : null}
					{session.branch ? (
						<FlyoutRow icon={<BranchIcon label="" size="small" />} label="Branch">
							<MetadataPathLink segmented title={session.branch}>
								<MetadataPathValue path={session.branch} />
							</MetadataPathLink>
						</FlyoutRow>
					) : null}
					{session.worktreePath ? (
						<FlyoutRow icon={<IfElseIcon label="" size="small" />} label="Worktree">
							<MetadataPathLink className="text-text" title={session.worktreePath}>{session.worktreePath}</MetadataPathLink>
						</FlyoutRow>
					) : null}
				</div>
			) : null}
		</div>
	);
}

/**
 * One payload-aware flyout shared by every session row in a list. Base UI's
 * viewport keeps the popup mounted while the anchor changes. The shell follows
 * the new row, immediately adopts its measured size, and crossfades the old and
 * new content without letting rapid hovers restart a stale size transition.
 */
export function JiraSessionFlyoutSurface({
	handle,
}: Readonly<JiraSessionFlyoutSurfaceProps>) {
	return (
		<HoverCard<JiraSidebarSessionItem> handle={handle}>
			{({ payload }) => (
				<HoverCardContent
					align="start"
					alignOffset={0}
					className="h-(--popup-height) w-(--popup-width) border-0 bg-surface-overlay p-0 text-text shadow-overlay transition-[opacity,scale,translate] duration-medium ease-in-out motion-reduce:transition-none data-ending-style:duration-normal data-ending-style:ease-in data-[side=right]:data-starting-style:translate-x-0 data-[side=right]:data-ending-style:translate-x-0"
					positionerClassName="h-(--positioner-height) w-(--positioner-width) max-w-(--available-width) transition-[top,left,right,bottom] duration-medium ease-in-out motion-reduce:transition-none data-instant:transition-none"
					side="right"
					sideOffset={8}
				>
					<HoverCardViewport className="relative size-full overflow-clip rounded-[inherit] [&_[data-current]]:w-(--popup-width) [&_[data-current]]:opacity-100 [&_[data-current]]:transition-opacity [&_[data-current]]:duration-medium [&_[data-current]]:ease-in-out [&_[data-current]]:[will-change:opacity] [&_[data-current][data-starting-style]]:opacity-0 [&_[data-previous]]:w-(--popup-width) [&_[data-previous]]:opacity-100 [&_[data-previous]]:transition-opacity [&_[data-previous]]:duration-medium [&_[data-previous]]:ease-in-out [&_[data-previous]]:[will-change:opacity] [&_[data-previous][data-ending-style]]:opacity-0 motion-reduce:[&_[data-current]]:transition-none motion-reduce:[&_[data-current]]:[will-change:auto] motion-reduce:[&_[data-previous]]:transition-none motion-reduce:[&_[data-previous]]:[will-change:auto] data-instant:[&_[data-current]]:transition-none data-instant:[&_[data-previous]]:transition-none">
						{payload ? (
							<div className="w-[400px] bg-surface-overlay p-4 text-text">
								<JiraSessionFlyoutBody session={payload} />
							</div>
						) : null}
					</HoverCardViewport>
				</HoverCardContent>
			)}
		</HoverCard>
	);
}

export default JiraSessionFlyoutBody;
