import CalendarIcon from "@atlaskit/icon/core/calendar";
import CheckCircleIcon from "@atlaskit/icon/core/check-circle";
import CheckCircleUncheckedIcon from "@atlaskit/icon/core/check-circle-unchecked";
import MergeSuccessIcon from "@atlaskit/icon/core/merge-success";
import StatusErrorIcon from "@atlaskit/icon/core/status-error";
import StatusWarningIcon from "@atlaskit/icon/core/status-warning";
import TagIcon from "@atlaskit/icon/core/tag";

import { ArtifactPane, ArtifactPanePropertyRow } from "@/components/blocks/artifact-pane";
import type {
	PullRequestCheck,
	PullRequestCommit,
	PullRequestDetailData,
	PullRequestMergeState,
	PullRequestPerson,
	PullRequestReviewer,
} from "@/components/blocks/jira-work-item/experimental-v2/lib/pull-request-detail-data";
import {
	Avatar,
	AvatarFallback,
	AvatarGroup,
	AvatarImage,
	AvatarStatusIndicator,
	type AvatarStatus,
} from "@/components/ui/avatar";
import { Lozenge } from "@/components/ui/lozenge";
import { Tag, TagGroup } from "@/components/ui/tag";
import { ProgressCircle } from "@/components/ui-custom/progress-circle";

const REVIEWER_STATUS = {
	approved: { label: "Approved", tone: "success" },
	"changes-requested": { label: "Changes requested", tone: "danger" },
	commented: { label: "Commented", tone: "information" },
	pending: { label: "Pending", tone: "neutral" },
} as const;

const MERGE_STATE: Record<
	PullRequestMergeState,
	Readonly<{ label: string; tone: "danger" | "discovery" | "success" | "warning" }>
> = {
	ready: { label: "Ready to merge", tone: "success" },
	blocked: { label: "Blocked by checks", tone: "warning" },
	conflicts: { label: "Resolve conflicts", tone: "danger" },
	merged: { label: "Merged", tone: "discovery" },
};

const CHECK_STATUS = {
	passed: { label: "Passed", tone: "success", icon: CheckCircleIcon, iconClassName: "text-icon-success" },
	failed: { label: "Failed", tone: "danger", icon: StatusErrorIcon, iconClassName: "text-icon-danger" },
	running: { label: "Running", tone: "information", icon: StatusWarningIcon, iconClassName: "text-icon-information" },
	queued: { label: "Queued", tone: "neutral", icon: CheckCircleUncheckedIcon, iconClassName: "text-icon-subtle" },
} as const;

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
	return (
		<Avatar label={person.name} size={size}>
			{person.avatarSrc ? <AvatarImage alt="" src={person.avatarSrc} /> : null}
			<AvatarFallback>{person.name.slice(0, 1).toUpperCase()}</AvatarFallback>
		</Avatar>
	);
}

function ReviewersValue({ reviewers }: Readonly<{ reviewers: readonly PullRequestReviewer[] }>) {
	if (reviewers.length === 0) {
		return <p className="text-xs text-text-subtle">No reviewers requested</p>;
	}

	return (
		<AvatarGroup
			data-jira-work-item-pull-request-reviewers
			label={`Reviewers: ${reviewers
				.map((reviewer) => `${reviewer.name} (${REVIEWER_STATUS[reviewer.status].label})`)
				.join(", ")}`}
		>
			{reviewers.map((reviewer) => {
				const status = REVIEWER_STATUS[reviewer.status];
				const avatarStatus = reviewerAvatarStatus(reviewer.status);
				return (
					<Avatar
						key={reviewer.id}
						label={`${reviewer.name}, ${status.label}`}
						size="sm"
						title={`${reviewer.name}: ${status.label}`}
					>
						{reviewer.avatarSrc ? <AvatarImage alt="" src={reviewer.avatarSrc} /> : null}
						<AvatarFallback>{reviewer.name.slice(0, 1).toUpperCase()}</AvatarFallback>
						{avatarStatus ? <AvatarStatusIndicator status={avatarStatus} /> : null}
					</Avatar>
				);
			})}
		</AvatarGroup>
	);
}

function CommitsValue({ commits }: Readonly<{ commits: readonly PullRequestCommit[] }>) {
	if (commits.length === 0) {
		return <p className="text-xs text-text-subtle">No commits available</p>;
	}

	return (
		<ul className="flex flex-col" data-jira-work-item-pull-request-commits>
			{commits.map((commit) => (
				<li className="min-w-0" key={commit.id}>
					<button
						aria-label={`${commit.title} (${commit.shortSha})`}
						className="-mx-2 flex w-[calc(100%+1rem)] min-w-0 flex-col rounded-md px-2 py-2 text-left outline-none transition-colors duration-xxshort ease-out-practical hover:bg-bg-neutral-subtle-hovered focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none"
						type="button"
					>
						<div className="flex min-w-0 items-center gap-2">
							<span className="min-w-0 flex-1 text-sm text-text">{commit.title}</span>
							<span className="inline-flex shrink-0 items-center gap-1 text-xs tabular-nums">
								<span className="text-text-success">+{commit.additions}</span>
								<span className="text-text-danger">-{commit.deletions}</span>
							</span>
						</div>
						<div className="mt-1 flex min-w-0 items-center gap-1.5 text-xs text-text-subtlest">
							<PersonAvatar person={commit.author} size="xs" />
							<span className="min-w-0 truncate">{commit.author.name}</span>
							<span aria-hidden>·</span>
							<span className="shrink-0">{commit.timestamp}</span>
							<code className="shrink-0 font-mono">{commit.shortSha}</code>
						</div>
					</button>
				</li>
			))}
		</ul>
	);
}

function ChecksSectionTitle({ passed, total }: Readonly<{ passed: number; total: number }>) {
	return (
		<>
			CI checks
			<ProgressCircle
				aria-hidden
				animated={false}
				size="xs"
				value={total > 0 ? Math.round((passed / total) * 100) : 0}
				variant="outline"
			/>
		</>
	);
}

function ChecksValue({ checks }: Readonly<{ checks: readonly PullRequestCheck[] }>) {
	if (checks.length === 0) {
		return <p className="text-xs text-text-subtle">No CI checks reported</p>;
	}

	return (
		<ul className="flex flex-col gap-2" data-jira-work-item-pull-request-checks>
			{checks.map((check) => {
				const status = CHECK_STATUS[check.status];
				const StatusIcon = status.icon;
				return (
					<li className="flex min-w-0 items-center gap-2 text-xs" key={check.id}>
						<span aria-hidden className={status.iconClassName}>
							<StatusIcon label="" size="small" />
						</span>
						<div className="min-w-0 flex-1">
							<p className="truncate text-text">{check.name}</p>
							<p className="truncate text-text-subtlest">{check.details}</p>
						</div>
						<Lozenge variant={status.tone}>{status.label}</Lozenge>
					</li>
				);
			})}
		</ul>
	);
}

/** Provider-neutral pull-request metadata rendered in the shared artifact rail. */
export function PullRequestDetailsRail({ data }: Readonly<{ data: PullRequestDetailData }>) {
	const mergeState = MERGE_STATE[data.mergeState];
	const approvedReviewers = data.reviewers.filter((reviewer) => reviewer.status === "approved").length;
	const passedChecks = data.checks.filter((check) => check.status === "passed").length;

	return (
		<ArtifactPane
			aria-label={`Pull request #${data.number} details`}
			borderless
			className="[&>div:first-child]:pt-0"
			showSeparators={false}
			sections={[
				{
					id: "pull-request-reviewers",
					title: "Reviewers",
					count: data.reviewers.length > 0 ? `${approvedReviewers}/${data.reviewers.length} approved` : 0,
					content: <ReviewersValue reviewers={data.reviewers} />,
				},
				{
					collapsible: false,
					defaultOpen: true,
					id: "pull-request-details",
					title: "Details",
					content: (
						<div className="flex flex-col gap-2" data-jira-work-item-pull-request-details>
							<ArtifactPanePropertyRow editable={false} icon={<MergeSuccessIcon label="" size="small" />} label="Merge status">
								<Lozenge variant={mergeState.tone}>{mergeState.label}</Lozenge>
							</ArtifactPanePropertyRow>
							<ArtifactPanePropertyRow editable={false} icon={<TagIcon label="" size="small" />} label="Labels">
								{data.labels.length > 0 ? (
									<TagGroup className="gap-1">
										{data.labels.map((label) => <Tag color={label.color} key={label.id}>{label.name}</Tag>)}
									</TagGroup>
								) : <span className="text-text-subtle">No labels</span>}
							</ArtifactPanePropertyRow>
							<ArtifactPanePropertyRow editable={false} icon={<CalendarIcon label="" size="small" />} label="Created">
								<span>{data.createdTime}</span>
							</ArtifactPanePropertyRow>
							<ArtifactPanePropertyRow editable={false} icon={<CalendarIcon label="" size="small" />} label="Updated">
								<span>{data.updatedTime}</span>
							</ArtifactPanePropertyRow>
						</div>
					),
				},
				{
					id: "pull-request-commits",
					title: "Commits",
					count: data.commits.length,
					content: <CommitsValue commits={data.commits} />,
				},
				{
					id: "pull-request-checks",
					title: <ChecksSectionTitle passed={passedChecks} total={data.checks.length} />,
					count: `${passedChecks}/${data.checks.length} passed`,
					content: <ChecksValue checks={data.checks} />,
				},
			]}
		/>
	);
}
