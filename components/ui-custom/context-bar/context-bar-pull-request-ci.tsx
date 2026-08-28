"use client";

import CheckCircleIcon from "@atlaskit/icon/core/check-circle";
import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";
import StatusErrorIcon from "@atlaskit/icon/core/status-error";
import TaskToDoIcon from "@atlaskit/icon/core/task-to-do";

import {
	ChecksSectionTitle,
	PullRequestChecksList,
} from "@/components/blocks/pull-request/components/pull-request-checks-list";
import { pullRequestChecksTitleState } from "@/components/blocks/pull-request/lib/pull-request-checks-title";
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
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

import {
	contextBarPullRequestCiPresentation,
	contextBarPullRequestMergePresentation,
	type ContextBarPullRequestCi,
	type ContextBarPullRequestMergeState,
} from "./context-bar-pull-request-ci-model";

export type {
	ContextBarPullRequestCi,
	ContextBarPullRequestCiCheck,
	ContextBarPullRequestCiStatus,
	ContextBarPullRequestMergeState,
} from "./context-bar-pull-request-ci-model";

function CiStatusIcon({
	className,
	status,
}: Readonly<{
	className: string;
	status: Exclude<ContextBarPullRequestCi["status"], "running">;
}>) {
	const icon = status === "failed"
		? <StatusErrorIcon color="currentColor" label="" size="small" />
		: status === "passed"
			? <CheckCircleIcon color="currentColor" label="" size="small" />
			: <TaskToDoIcon color="currentColor" label="" size="small" />;

	return <Icon aria-hidden className={className} render={icon} />;
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
			onSelect={() => {
				onCheckedChange(!checked);
			}}
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
	const presentation = contextBarPullRequestCiPresentation(ci.status);
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
				{ci.status === "running" ? (
					<Spinner className="text-icon-subtle" label="CI running" size="xs" />
				) : (
					<CiStatusIcon className={presentation.iconClassName} status={ci.status} />
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
		: contextBarPullRequestMergePresentation(mergeState);
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
