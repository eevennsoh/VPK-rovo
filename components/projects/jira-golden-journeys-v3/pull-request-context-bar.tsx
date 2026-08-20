"use client";

import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";
import PullRequestIcon from "@atlaskit/icon/core/pull-request";

import {
	ContextBar,
} from "@/components/ui-custom/context-bar";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/ui/icon";
import { Lozenge } from "@/components/ui/lozenge";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

export type PullRequestContextBarCiStatus = "pending" | "running" | "failed" | "passed";
export type PullRequestContextBarMergeState = "disabled" | "blocked" | "queued" | "merged";

export interface PullRequestContextBarCiCounts {
	failed: number;
	inProgress: number;
	passed: number;
	skipped: number;
}

export interface PullRequestContextBarProps {
	additions: number;
	approvalsCurrent: number;
	approvalsRequired: number;
	autoFixEnabled: boolean;
	autoMergeEnabled: boolean;
	branch: string;
	ciCounts: PullRequestContextBarCiCounts;
	ciStatus: PullRequestContextBarCiStatus;
	ciSummary: string;
	deletions: number;
	mergeState: PullRequestContextBarMergeState;
	onAutoFixChange: (enabled: boolean) => void;
	onAutoMergeChange: (enabled: boolean) => void;
	onDismiss: () => void;
	repository: string;
}

const CI_STATUS_PRESENTATION = {
	pending: { dotClassName: "bg-border-bold", label: "CI pending" },
	running: { dotClassName: "bg-bg-warning", label: "CI running" },
	failed: { dotClassName: "bg-bg-danger", label: "CI failed" },
	passed: { dotClassName: "bg-bg-success", label: "CI passed" },
} satisfies Record<PullRequestContextBarCiStatus, { dotClassName: string; label: string }>;

const MERGE_STATE_PRESENTATION = {
	disabled: {
		className: "bg-bg-neutral text-text-subtle",
		label: "Auto-merge off",
	},
	blocked: {
		className: "bg-bg-danger-subtler text-text-danger-bolder",
		label: "Auto-merge blocked",
	},
	queued: {
		className: "bg-bg-warning-subtler text-text-warning-bolder",
		label: "Auto-merge queued",
	},
	merged: {
		className: "bg-bg-success-subtler text-text-success-bolder",
		label: "Merged",
	},
} satisfies Record<PullRequestContextBarMergeState, { className: string; label: string }>;

interface CiCountRowProps {
	count: number;
	dotClassName: string;
	label: string;
	status: "failed" | "in-progress" | "passed" | "skipped";
}

function CiCountRow({ count, dotClassName, label, status }: Readonly<CiCountRowProps>) {
	return (
		<div
			className="flex h-7 items-center gap-2 px-2 text-sm text-text"
			data-ci-count={status}
		>
			<span aria-hidden className={cn("size-2 shrink-0 rounded-full", dotClassName)} />
			<span className="min-w-0 flex-1 truncate">{label}</span>
			<span className="shrink-0 text-text-subtle">{count}</span>
		</div>
	);
}

/** Jira Golden Journeys v3 PR and automation strip rendered above the activity composer. */
export function PullRequestContextBar({
	additions,
	approvalsCurrent,
	approvalsRequired,
	autoFixEnabled,
	autoMergeEnabled,
	branch,
	ciCounts,
	ciStatus,
	ciSummary,
	deletions,
	mergeState,
	onAutoFixChange,
	onAutoMergeChange,
	onDismiss,
	repository,
}: Readonly<PullRequestContextBarProps>) {
	const ciPresentation = CI_STATUS_PRESENTATION[ciStatus];
	const mergePresentation = MERGE_STATE_PRESENTATION[mergeState];
	const isRunning = ciStatus === "running";
	const branchSeparatorIndex = branch.indexOf("/");
	const branchPrefix = branchSeparatorIndex >= 0
		? branch.slice(0, branchSeparatorIndex + 1)
		: "";
	const branchName = branchSeparatorIndex >= 0
		? branch.slice(branchSeparatorIndex + 1)
		: branch;

	return (
		<ContextBar
			aria-label={`Pull request #1847. ${ciPresentation.label}. ${approvalsCurrent} of ${approvalsRequired} approvals. ${mergePresentation.label}.`}
			className="mb-2 w-full max-w-[calc(100vw-7rem)] gap-2 overflow-hidden px-2 py-0 sm:max-w-full"
			data-approvals-current={approvalsCurrent}
			data-approvals-required={approvalsRequired}
			data-auto-fix-enabled={autoFixEnabled}
			data-auto-merge-enabled={autoMergeEnabled}
			data-ci-status={ciStatus}
			data-merge-state={mergeState}
			data-pr-context-bar
			data-pr-number="1847"
			dismissLabel="Dismiss pull request context"
			onDismiss={onDismiss}
			role="region"
		>
			{isRunning ? (
				<Lozenge
					className="[&_[data-slot=lozenge-leading-icon]]:size-3 [&_[data-slot=lozenge-leading-icon]_svg]:size-3"
					elemBefore={(
						<Icon
							aria-hidden
							render={<PullRequestIcon color="currentColor" label="" size="small" />}
						/>
					)}
					variant="success"
				>
					Open
				</Lozenge>
			) : (
				<span className="flex shrink-0 items-center gap-1 text-icon-subtle" aria-hidden>
					<PullRequestIcon color="currentColor" label="" size="small" />
				</span>
			)}
			<span className={cn("shrink-0 text-sm", isRunning ? "text-text-success" : "font-medium text-text-selected")}>
				#1847
			</span>
			{isRunning ? null : (
				<span className="hidden max-w-36 shrink-0 truncate text-sm text-text-subtle sm:inline" title={repository}>
					{repository}
				</span>
			)}
			<span className="min-w-0 flex-1 truncate text-sm text-text-subtle" title={branch}>
				{isRunning ? (
					<>
						<span className="text-text-subtle">{branchPrefix}</span>
						<span className="text-text">{branchName}</span>
					</>
				) : branch}
			</span>
			<span
				className="hidden shrink-0 items-center gap-1 rounded-lg bg-surface px-2 py-1 font-mono text-xs sm:inline-flex"
			>
				<span className="sr-only">{additions} additions and {deletions} deletions</span>
				<span aria-hidden className="text-text-success">+{additions}</span>
				<span aria-hidden className="text-text-danger">−{deletions}</span>
			</span>
			{isRunning ? null : (
				<span
					className="hidden shrink-0 whitespace-nowrap text-xs text-text-subtle min-[480px]:inline"
					data-approvals-summary
				>
					{approvalsCurrent}/{approvalsRequired} approved
				</span>
			)}
			<DropdownMenu>
				<DropdownMenuTrigger
					aria-label={`${ciPresentation.label}. ${ciSummary}. Configure CI automation`}
					className={cn(
						"flex shrink-0 items-center gap-1 rounded-lg px-2 text-sm text-text-subtle outline-none transition-colors duration-normal ease-out-practical hover:bg-bg-neutral-hovered hover:text-text active:bg-bg-neutral-pressed focus-visible:ring-3 focus-visible:ring-ring/50 motion-reduce:transition-none",
						isRunning ? "h-6" : "h-8",
					)}
					data-ci-automation-trigger
				>
					{isRunning ? (
						<Spinner className="text-icon-subtle" label="CI running" size="xs" />
					) : (
						<span aria-hidden className={cn("size-2 shrink-0 rounded-full", ciPresentation.dotClassName)} />
					)}
					<span>CI</span>
					<ChevronDownIcon color="currentColor" label="" size="small" />
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" className="w-72" positionerClassName="z-[600]">
					<DropdownMenuGroup>
						<DropdownMenuLabel>CI monitoring</DropdownMenuLabel>
						<div aria-label={ciSummary} className="px-1 pb-1" role="status">
							<CiCountRow count={ciCounts.inProgress} dotClassName="bg-bg-warning" label="In progress" status="in-progress" />
							<CiCountRow count={ciCounts.passed} dotClassName="bg-bg-success" label="Passed" status="passed" />
							<CiCountRow count={ciCounts.failed} dotClassName="bg-bg-danger" label="Failed" status="failed" />
							<CiCountRow count={ciCounts.skipped} dotClassName="bg-border-bold" label="Skipped" status="skipped" />
						</div>
					</DropdownMenuGroup>
					<DropdownMenuSeparator />
					<DropdownMenuGroup>
						<DropdownMenuCheckboxItem
							checked={autoFixEnabled}
							data-auto-fix-setting
							onCheckedChange={onAutoFixChange}
						>
							Auto-fix CI &amp; address comments
						</DropdownMenuCheckboxItem>
						<DropdownMenuCheckboxItem
							checked={autoMergeEnabled}
							data-auto-merge-setting
							onCheckedChange={onAutoMergeChange}
						>
							Auto-merge when ready
						</DropdownMenuCheckboxItem>
					</DropdownMenuGroup>
				</DropdownMenuContent>
			</DropdownMenu>
			{isRunning ? null : (
				<span
					aria-hidden
					className={cn("hidden shrink-0 whitespace-nowrap rounded-lg px-2 py-1 text-xs font-medium min-[560px]:inline-flex", mergePresentation.className)}
					data-merge-state-label
				>
					{mergePresentation.label}
				</span>
			)}
			<span aria-live="polite" className="sr-only">
				{mergePresentation.label}
			</span>
		</ContextBar>
	);
}
