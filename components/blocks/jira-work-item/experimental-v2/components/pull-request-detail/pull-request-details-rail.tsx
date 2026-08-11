"use client";

import { useEffect, useState, type KeyboardEvent, type MouseEvent, type ReactNode } from "react";

import CalendarIcon from "@atlaskit/icon/core/calendar";
import CheckCircleIcon from "@atlaskit/icon/core/check-circle";
import CopyIcon from "@atlaskit/icon/core/copy";
import LinkExternalIcon from "@atlaskit/icon/core/link-external";
import PeopleGroupIcon from "@atlaskit/icon/core/people-group";
import StatusErrorIcon from "@atlaskit/icon/core/status-error";
import TagIcon from "@atlaskit/icon/core/tag";
import TaskToDoIcon from "@atlaskit/icon/core/task-to-do";

import { ArtifactPane, ArtifactPanePropertyRow } from "@/components/blocks/artifact-pane";
import { useMetadataRail } from "@/components/blocks/jira-work-item/experimental-v2/context-metadata-rail";
import { parseRunningCheckElapsedSeconds } from "@/components/blocks/jira-work-item/experimental-v2/lib/pull-request-check-elapsed";
import {
	arePullRequestChecksInProgress,
	type PullRequestCheck,
	type PullRequestCommit,
	type PullRequestDetailData,
	type PullRequestPerson,
	type PullRequestReviewer,
} from "@/components/blocks/jira-work-item/experimental-v2/lib/pull-request-detail-data";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
	AvatarStatusIndicator,
	type AvatarStatus,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ElapsedTime } from "@/components/ui/elapsed-time";
import { Icon } from "@/components/ui/icon";
import { IconTile } from "@/components/ui/icon-tile";
import { Spinner } from "@/components/ui/spinner";
import { Tag, TagGroup } from "@/components/ui/tag";
import { ProgressCircle } from "@/components/ui-custom/progress-circle";
import { cn } from "@/lib/utils";

function copyCommitSha(event: MouseEvent<HTMLButtonElement>, sha: string) {
	event.preventDefault();
	event.stopPropagation();
	void navigator.clipboard.writeText(sha);
}

function openScmUrl(url: string) {
	window.open(url, "_blank", "noopener,noreferrer");
}

function handleScmLinkKeyDown(event: KeyboardEvent<HTMLElement>, url: string) {
	if (event.key === "Enter" || event.key === " ") {
		event.preventDefault();
		openScmUrl(url);
	}
}

/** ArtifactPane section id for the CI checks disclosure. */
export const PULL_REQUEST_CHECKS_SECTION_ID = "pull-request-checks";

const REVIEWER_STATUS = {
	approved: { label: "Approved", tone: "success" },
	"changes-requested": { label: "Changes requested", tone: "danger" },
	commented: { label: "Commented", tone: "information" },
	pending: { label: "Pending", tone: "neutral" },
} as const;

/** A running check spins like the section title; settled ones use a status icon. */
const CHECK_STATUS: Record<
	PullRequestCheck["status"],
	{ label: string; iconClassName: string; renderIcon: () => ReactNode }
> = {
	passed: {
		label: "Passed",
		iconClassName: "text-icon-success",
		renderIcon: () => <CheckCircleIcon color="currentColor" label="" size="small" />,
	},
	failed: {
		label: "Failed",
		iconClassName: "text-icon-danger",
		renderIcon: () => <StatusErrorIcon color="currentColor" label="" size="small" />,
	},
	running: {
		label: "Running",
		iconClassName: "text-icon-subtle",
		renderIcon: () => <Spinner label="" size="sm" />,
	},
	queued: {
		label: "Queued",
		iconClassName: "text-icon-disabled",
		renderIcon: () => <TaskToDoIcon color="currentColor" label="" size="small" />,
	},
};

function reviewerAvatarStatus(status: PullRequestReviewer["status"]): AvatarStatus | null {
	switch (status) {
		case "approved":
			return "approved";
		case "changes-requested":
			return "declined";
		case "commented":
		case "pending":
			return null;
		default: {
			const _exhaustive: never = status;
			return _exhaustive;
		}
	}
}

function PersonAvatar({ person, size = "sm" }: Readonly<{ person: PullRequestPerson; size?: "xs" | "sm" }>) {
	const isAgent = person.kind === "agent";
	return (
		<Avatar label={person.name} shape={isAgent ? "hexagon" : "circle"} size={size}>
			{person.avatarSrc ? <AvatarImage alt="" src={person.avatarSrc} /> : null}
			<AvatarFallback>{person.name.slice(0, 1).toUpperCase()}</AvatarFallback>
		</Avatar>
	);
}

function ApproversValue({ reviewers }: Readonly<{ reviewers: readonly PullRequestReviewer[] }>) {
	if (reviewers.length === 0) {
		return <span className="text-text-subtle">No approvers requested</span>;
	}

	return (
		<div
			aria-label={`Approvers: ${reviewers
				.map((reviewer) => `${reviewer.name} (${REVIEWER_STATUS[reviewer.status].label})`)
				.join(", ")}`}
			className="flex items-center gap-1"
			data-jira-work-item-pull-request-reviewers
			role="group"
		>
			{reviewers.map((reviewer) => {
				const status = REVIEWER_STATUS[reviewer.status];
				const avatarStatus = reviewerAvatarStatus(reviewer.status);
				const isAgent = reviewer.kind === "agent";
				return (
					<Avatar
						key={reviewer.id}
						label={`${reviewer.name}, ${status.label}`}
						shape={isAgent ? "hexagon" : "circle"}
						size="default"
						title={`${reviewer.name}: ${status.label}`}
					>
						{reviewer.avatarSrc ? <AvatarImage alt="" src={reviewer.avatarSrc} /> : null}
						<AvatarFallback>{reviewer.name.slice(0, 1).toUpperCase()}</AvatarFallback>
						{avatarStatus ? <AvatarStatusIndicator status={avatarStatus} /> : null}
					</Avatar>
				);
			})}
		</div>
	);
}

function CommitsValue({ commits }: Readonly<{ commits: readonly PullRequestCommit[] }>) {
	if (commits.length === 0) {
		return <p className="text-xs text-text-subtle">No commits available</p>;
	}

	return (
		<ul className="flex flex-col" data-jira-work-item-pull-request-commits>
			{commits.map((commit) => {
				const commitUrl = commit.url;
				return (
					<li className="min-w-0" key={commit.id}>
						<div
							className={cn(
								"group -mx-2 flex w-[calc(100%+1rem)] min-w-0 flex-col rounded-md px-2 py-2 transition-colors duration-xxshort ease-out-practical hover:bg-bg-neutral-subtle-hovered motion-reduce:transition-none",
								commitUrl ? "cursor-pointer" : null,
							)}
							role={commitUrl ? "link" : undefined}
							tabIndex={commitUrl ? 0 : undefined}
							onClick={
								commitUrl
									? () => {
											openScmUrl(commitUrl);
										}
									: undefined
							}
							onKeyDown={
								commitUrl
									? (event) => {
											handleScmLinkKeyDown(event, commitUrl);
										}
									: undefined
							}
						>
							<div className="flex min-w-0 items-center gap-2">
								<span className="min-w-0 flex-1 text-sm text-text">{commit.title}</span>
								<span className="inline-flex shrink-0 items-center gap-1 text-xs tabular-nums">
									<span className="text-text-success">+{commit.additions}</span>
									<span className="text-text-danger">-{commit.deletions}</span>
								</span>
							</div>
							<div className="mt-1 flex min-w-0 items-center gap-1.5 text-xs text-text-subtlest">
								<span className="flex min-w-0 items-center gap-1">
									<PersonAvatar person={commit.author} size="xs" />
									<span className="min-w-0 truncate">{commit.author.name}</span>
								</span>
								<span aria-hidden>·</span>
								<span className="shrink-0">{commit.timestamp}</span>
								<span aria-hidden>·</span>
								<span className="inline-flex shrink-0 items-center gap-0.5">
									<code className="font-mono text-text-subtlest">{commit.shortSha}</code>
									<Button
										aria-label={`Copy commit ${commit.shortSha}`}
										className={cn(
											"size-3! min-h-0 min-w-0 p-0 text-icon-subtle hover:bg-transparent hover:text-icon",
											"pointer-events-none opacity-0 transition-opacity duration-normal ease-out-practical",
											"group-hover:pointer-events-auto group-hover:opacity-100",
											"group-focus-within:pointer-events-auto group-focus-within:opacity-100",
											"focus-visible:pointer-events-auto focus-visible:opacity-100",
											"motion-reduce:transition-none",
										)}
										size="icon-compact"
										type="button"
										variant="ghost"
										onClick={(event) => {
											copyCommitSha(event, commit.shortSha);
										}}
									>
										<Icon aria-hidden className="size-3" render={<CopyIcon label="" size="small" />} />
									</Button>
								</span>
							</div>
						</div>
					</li>
				);
			})}
		</ul>
	);
}

function ChecksSectionTitle({
	inProgress,
	passed,
	total,
}: Readonly<{ inProgress: boolean; passed: number; total: number }>) {
	return (
		<>
			CI checks
			{inProgress ? (
				<span aria-hidden>
					<Spinner size="xs" />
				</span>
			) : (
				<ProgressCircle
					aria-hidden
					animated={false}
					size="xs"
					value={total > 0 ? Math.round((passed / total) * 100) : 0}
					variant="outline"
				/>
			)}
		</>
	);
}

/** Live "Running for Ns" subtitle; starts from a parsed fixture offset, then ticks while mounted. */
function RunningCheckDetails({ initialSeconds }: Readonly<{ initialSeconds: number }>) {
	const [startedAtMs] = useState(() => Date.now() - initialSeconds * 1000);
	return <ElapsedTime prefix="Running for " startedAtMs={startedAtMs} />;
}

function CheckDetails({ check }: Readonly<{ check: PullRequestCheck }>) {
	if (check.status !== "running") {
		return check.details;
	}
	const initialSeconds = parseRunningCheckElapsedSeconds(check.details);
	if (initialSeconds === null) {
		return check.details;
	}
	return <RunningCheckDetails initialSeconds={initialSeconds} />;
}

function ChecksValue({ checks }: Readonly<{ checks: readonly PullRequestCheck[] }>) {
	if (checks.length === 0) {
		return <p className="text-xs text-text-subtle">No CI checks reported</p>;
	}

	return (
		<ul className="flex flex-col" data-jira-work-item-pull-request-checks>
			{checks.map((check) => {
				const status = CHECK_STATUS[check.status];
				return (
					<li
						className="group/check-row -mx-2 flex w-[calc(100%+1rem)] min-w-0 items-center gap-3 rounded-md px-2 py-2 transition-colors duration-xxshort ease-out-practical hover:bg-bg-neutral-subtle-hovered motion-reduce:transition-none"
						key={check.id}
					>
						<IconTile
							aria-hidden
							as="span"
							className={status.iconClassName}
							icon={status.renderIcon()}
							label=""
							size="small"
							variant="transparent"
						/>
						<div className="min-w-0 flex-1">
							<p className="truncate text-sm text-text">{check.name}</p>
							<p className="truncate text-xs text-text-subtlest">
								<CheckDetails check={check} />
							</p>
						</div>
						<IconTile
							aria-hidden
							as="span"
							className={cn(
								"shrink-0 text-icon-subtle",
								"opacity-0 transition-opacity duration-normal ease-out-practical",
								"group-hover/check-row:opacity-100",
								"motion-reduce:transition-none",
							)}
							icon={<LinkExternalIcon color="currentColor" label="" size="small" />}
							iconSize="small"
							label=""
							size="small"
							variant="transparent"
						/>
					</li>
				);
			})}
		</ul>
	);
}

/** Provider-neutral pull-request metadata rendered in the shared artifact rail. */
export function PullRequestDetailsRail({ data }: Readonly<{ data: PullRequestDetailData }>) {
	const {
		consumePullRequestSectionExpandRequest,
		pullRequestSectionExpandRequest,
	} = useMetadataRail();
	const [openSectionIds, setOpenSectionIds] = useState<ReadonlySet<string>>(() => new Set());
	const passedChecks = data.checks.filter((check) => check.status === "passed").length;
	const checksInProgress = arePullRequestChecksInProgress(data.checks);
	const author: PullRequestPerson = {
		id: "pull-request-author",
		name: data.authorName,
		avatarSrc: data.authorAvatarSrc,
		kind: data.authorKind,
	};

	useEffect(() => {
		if (
			!pullRequestSectionExpandRequest ||
			pullRequestSectionExpandRequest.pullRequestIdentity !== data.identity
		) {
			return;
		}
		const { nonce, sectionId } = pullRequestSectionExpandRequest;
		setOpenSectionIds((current) => {
			if (current.has(sectionId)) {
				return current;
			}
			const next = new Set(current);
			next.add(sectionId);
			return next;
		});
		consumePullRequestSectionExpandRequest(nonce);
	}, [consumePullRequestSectionExpandRequest, data.identity, pullRequestSectionExpandRequest]);

	return (
		<ArtifactPane
			aria-label={`Pull request #${data.number} details`}
			borderless
			className="[&>div:first-child]:pt-0"
			onOpenSectionIdsChange={setOpenSectionIds}
			openSectionIds={openSectionIds}
			showSeparators={false}
			sections={[
				{
					collapsible: false,
					defaultOpen: true,
					id: "pull-request-details",
					title: "Details",
					content: (
						<div className="flex flex-col gap-2" data-jira-work-item-pull-request-details>
							<ArtifactPanePropertyRow editable={false} icon={<PeopleGroupIcon label="" size="small" />} label="Approvers">
								<ApproversValue reviewers={data.reviewers} />
							</ArtifactPanePropertyRow>
							<ArtifactPanePropertyRow editable={false} icon={<CalendarIcon label="" size="small" />} label="Created">
								<span className="flex min-w-0 items-center gap-2">
									<PersonAvatar person={author} size="xs" />
									<span>{data.createdTime}</span>
								</span>
							</ArtifactPanePropertyRow>
							<ArtifactPanePropertyRow editable={false} icon={<CalendarIcon label="" size="small" />} label="Updated">
								<span>{data.updatedTime}</span>
							</ArtifactPanePropertyRow>
							<ArtifactPanePropertyRow editable={false} icon={<TagIcon label="" size="small" />} label="Labels">
								{data.labels.length > 0 ? (
									<TagGroup className="gap-1">
										{data.labels.map((label) => <Tag color={label.color} key={label.id}>{label.name}</Tag>)}
									</TagGroup>
								) : <span className="text-text-subtle">No labels</span>}
							</ArtifactPanePropertyRow>
						</div>
					),
				},
				{
					id: PULL_REQUEST_CHECKS_SECTION_ID,
					title: (
						<ChecksSectionTitle
							inProgress={checksInProgress}
							passed={passedChecks}
							total={data.checks.length}
						/>
					),
					count: `${passedChecks}/${data.checks.length} passed`,
					content: <ChecksValue checks={data.checks} />,
				},
				{
					id: "pull-request-commits",
					title: "Commits",
					count: data.commits.length,
					content: <CommitsValue commits={data.commits} />,
				},
			]}
		/>
	);
}
