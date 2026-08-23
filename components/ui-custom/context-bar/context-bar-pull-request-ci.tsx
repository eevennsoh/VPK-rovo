"use client";

import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";

import {
	ChecksSectionTitle,
	PullRequestChecksList,
	pullRequestChecksTitleState,
} from "@/components/blocks/jira-work-item/experimental-v3/components/pull-request-detail/pull-request-checks-list";
import type { PullRequestCheck } from "@/components/blocks/jira-work-item/experimental-v3/lib/pull-request-detail-data";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export type ContextBarPullRequestCiStatus = "pending" | "running" | "failed" | "passed";
export type ContextBarPullRequestMergeState = "disabled" | "blocked" | "queued" | "merged";
export type ContextBarPullRequestCiCheck = PullRequestCheck;

export interface ContextBarPullRequestCi {
	status: ContextBarPullRequestCiStatus;
	checks: readonly ContextBarPullRequestCiCheck[];
	summary: string;
	autoFixEnabled: boolean;
	autoMergeEnabled: boolean;
	onAutoFixChange: (enabled: boolean) => void;
	onAutoMergeChange: (enabled: boolean) => void;
	onFixCheck?: (checks: readonly ContextBarPullRequestCiCheck[]) => void;
}

const CI_STATUS_PRESENTATION = {
	pending: { dotClassName: "bg-border-bold", label: "CI pending" },
	running: { dotClassName: "bg-bg-warning", label: "CI running" },
	failed: { dotClassName: "bg-bg-danger", label: "CI failed" },
	passed: { dotClassName: "bg-bg-success", label: "CI passed" },
} satisfies Record<ContextBarPullRequestCiStatus, { dotClassName: string; label: string }>;

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
} satisfies Record<ContextBarPullRequestMergeState, { className: string; label: string }>;

export function contextBarPullRequestCiPresentation(status: ContextBarPullRequestCiStatus) {
	return CI_STATUS_PRESENTATION[status];
}

export function contextBarPullRequestMergePresentation(state: ContextBarPullRequestMergeState) {
	return MERGE_STATE_PRESENTATION[state];
}

function suppressMenuDismissal(event: { preventDefault: () => void }) {
	event.preventDefault();
}

function CiAutomationToggleRow({
	checked,
	label,
	onCheckedChange,
	setting,
}: Readonly<{
	checked: boolean;
	label: string;
	onCheckedChange: (enabled: boolean) => void;
	setting: "auto-fix" | "auto-merge";
}>) {
	return (
		<DropdownMenuItem
			closeOnClick={false}
			className="text-text [&>span:last-child]:h-auto [&_[data-slot=switch]]:pointer-events-auto [&_[data-slot=switch]_svg]:size-full"
			data-auto-fix-setting={setting === "auto-fix" ? true : undefined}
			data-auto-merge-setting={setting === "auto-merge" ? true : undefined}
			elemAfter={(
				<Switch
					aria-label={`${checked ? "Disable" : "Enable"} ${label}`}
					checked={checked}
					onCheckedChange={onCheckedChange}
					onMouseDown={suppressMenuDismissal}
					onPointerDown={suppressMenuDismissal}
					size="sm"
				/>
			)}
		>
			{label}
		</DropdownMenuItem>
	);
}

/** CI checks dropdown: status trigger, shared check rows, auto-fix / auto-merge. */
export function ContextBarPullRequestCiMenu({
	ci,
}: Readonly<{
	ci: ContextBarPullRequestCi;
}>) {
	const presentation = CI_STATUS_PRESENTATION[ci.status];
	const isRunning = ci.status === "running";
	const checksTitle = pullRequestChecksTitleState(ci.checks);

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				aria-label={`${presentation.label}. ${ci.summary}. Configure CI automation`}
				className={cn(
					"flex shrink-0 items-center gap-1 rounded-lg px-2 text-sm text-text-subtle outline-none transition-colors duration-normal ease-out-practical hover:bg-bg-neutral-hovered hover:text-text active:bg-bg-neutral-pressed focus-visible:ring-3 focus-visible:ring-ring/50 motion-reduce:transition-none",
					isRunning ? "h-6" : "h-8",
				)}
				data-ci-automation-trigger
			>
				{isRunning ? (
					<Spinner className="text-icon-subtle" label="CI running" size="xs" />
				) : (
					<span aria-hidden className={cn("size-2 shrink-0 rounded-full", presentation.dotClassName)} />
				)}
				<span>CI</span>
				<ChevronDownIcon color="currentColor" label="" size="small" />
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-80" positionerClassName="z-[600]">
				<DropdownMenuGroup>
					<DropdownMenuLabel>
						<ChecksSectionTitle passed={checksTitle.passed} total={checksTitle.total} />
					</DropdownMenuLabel>
					<div aria-label={ci.summary} className="pb-1" role="status">
						<PullRequestChecksList
							checks={ci.checks}
							density="menu"
							onFixCheck={ci.onFixCheck}
						/>
					</div>
				</DropdownMenuGroup>
				<DropdownMenuSeparator />
				<DropdownMenuGroup>
					<CiAutomationToggleRow
						checked={ci.autoFixEnabled}
						label="Auto-fix CI & address comments"
						onCheckedChange={ci.onAutoFixChange}
						setting="auto-fix"
					/>
					<CiAutomationToggleRow
						checked={ci.autoMergeEnabled}
						label="Auto-merge when ready"
						onCheckedChange={ci.onAutoMergeChange}
						setting="auto-merge"
					/>
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

/** Right-side PR chrome: optional approvals, the CI menu, and merge-state. */
export function ContextBarPullRequestAutomation({
	approvalsCurrent,
	approvalsRequired,
	ci,
	compact,
	mergeState,
}: Readonly<{
	approvalsCurrent?: number;
	approvalsRequired?: number;
	ci: ContextBarPullRequestCi;
	compact: boolean;
	mergeState?: ContextBarPullRequestMergeState;
}>) {
	const mergePresentation = mergeState === undefined
		? null
		: MERGE_STATE_PRESENTATION[mergeState];
	const showApprovals = !compact && approvalsCurrent !== undefined && approvalsRequired !== undefined;

	return (
		<>
			{showApprovals ? (
				<span
					className="hidden shrink-0 whitespace-nowrap text-xs text-text-subtle min-[480px]:inline"
					data-approvals-summary
				>
					{approvalsCurrent}/{approvalsRequired} approved
				</span>
			) : null}
			<ContextBarPullRequestCiMenu ci={ci} />
			{compact || mergePresentation === null ? null : (
				<span
					aria-hidden
					className={cn("hidden shrink-0 whitespace-nowrap rounded-lg px-2 py-1 text-xs font-medium min-[560px]:inline-flex", mergePresentation.className)}
					data-merge-state-label
				>
					{mergePresentation.label}
				</span>
			)}
			{mergePresentation === null ? null : (
				<span aria-live="polite" className="sr-only">
					{mergePresentation.label}
				</span>
			)}
		</>
	);
}
