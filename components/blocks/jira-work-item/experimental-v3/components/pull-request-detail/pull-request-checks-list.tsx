"use client";

import { useState, type KeyboardEvent, type MouseEvent, type ReactNode } from "react";

import CheckCircleIcon from "@atlaskit/icon/core/check-circle";
import LinkExternalIcon from "@atlaskit/icon/core/link-external";
import StatusErrorIcon from "@atlaskit/icon/core/status-error";
import TaskToDoIcon from "@atlaskit/icon/core/task-to-do";

import { parseRunningCheckElapsedSeconds } from "@/components/blocks/jira-work-item/experimental-v3/lib/pull-request-check-elapsed";
import {
	arePullRequestChecksInProgress,
	type PullRequestCheck,
} from "@/components/blocks/jira-work-item/experimental-v3/lib/pull-request-detail-data";
import { Button } from "@/components/ui/button";
import { ElapsedTime } from "@/components/ui/elapsed-time";
import { IconTile } from "@/components/ui/icon-tile";
import { Spinner } from "@/components/ui/spinner";
import "@/components/ui-custom/rich-text-editor/rich-text-editor.css";
import { cn } from "@/lib/utils";

function openScmUrl(url: string) {
	window.open(url, "_blank", "noopener,noreferrer");
}

function handleScmLinkKeyDown(event: KeyboardEvent<HTMLElement>, url: string) {
	if (event.key === "Enter" || event.key === " ") {
		event.preventDefault();
		openScmUrl(url);
	}
}

/** A running check spins in place of a settled status icon. */
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

export function ChecksSectionTitle({
	passed = 0,
	total = 0,
}: Readonly<{
	passed?: number;
	total?: number;
}>) {
	return (
		<span className="flex min-h-6 items-center gap-1.5">
			CI checks
			{total > 0 ? (
				<span className="shrink-0 text-xs font-normal text-text-subtlest">
					{passed}/{total}
				</span>
			) : null}
		</span>
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

/**
 * Failed-check trailing actions: Fix is the only interactive control. A decorative
 * external-link icon expands on the far right via row hover (`group/check-row`).
 * The row itself opens `check.url` — the icon is not a separate hit target.
 */
function FailedCheckActions({
	check,
	onFix,
}: Readonly<{
	check: PullRequestCheck;
	onFix?: (check: PullRequestCheck) => void;
}>) {
	return (
		<div
			className="flex shrink-0 items-center"
			data-jira-work-item-failed-check-actions
		>
			<Button
				aria-label={`Fix ${check.name}`}
				onClick={(event: MouseEvent<HTMLButtonElement>) => {
					event.preventDefault();
					event.stopPropagation();
					onFix?.(check);
				}}
				size="compact"
				type="button"
				variant="outline"
			>
				Fix
			</Button>
			{/* Margin on the inner icon so a collapsed 0fr slot leaves no gap after Fix. */}
			<div
				aria-hidden
				className={cn(
					"grid shrink-0 grid-cols-[0fr] transition-[grid-template-columns] duration-normal ease-out-practical motion-reduce:transition-none",
					"group-hover/check-row:grid-cols-[1fr]",
					"group-focus-within/check-row:grid-cols-[1fr]",
				)}
			>
				<div className="min-w-0 overflow-hidden">
					<IconTile
						aria-hidden
						as="span"
						className="ml-1 shrink-0 text-icon-subtle"
						icon={<LinkExternalIcon color="currentColor" label="" size="small" />}
						iconSize="small"
						label=""
						size="small"
						variant="transparent"
					/>
				</div>
			</div>
		</div>
	);
}

function CheckStatusIcon({ check }: Readonly<{ check: PullRequestCheck }>) {
	const status = CHECK_STATUS[check.status];
	return (
		<IconTile
			aria-hidden
			as="span"
			className={status.iconClassName}
			icon={status.renderIcon()}
			label=""
			size="small"
			variant="transparent"
		/>
	);
}

function CheckRowTrailing({
	check,
	onFixCheck,
}: Readonly<{
	check: PullRequestCheck;
	onFixCheck?: (checks: readonly PullRequestCheck[]) => void;
}>) {
	if (check.status === "failed") {
		return (
			<FailedCheckActions
				check={check}
				onFix={(failedCheck) => onFixCheck?.([failedCheck])}
			/>
		);
	}

	return (
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
	);
}

function checkRowLinkProps(checkUrl: string | undefined) {
	return {
		role: checkUrl ? ("link" as const) : undefined,
		tabIndex: checkUrl ? 0 : undefined,
		onClick: checkUrl
			? () => {
					openScmUrl(checkUrl);
				}
			: undefined,
		onKeyDown: checkUrl
			? (event: KeyboardEvent<HTMLElement>) => {
					handleScmLinkKeyDown(event, checkUrl);
				}
			: undefined,
	};
}

/**
 * Shared CI row chrome: same as `RichTextSuggestionMenuOption`
 * (`.rich-text-command-menu-item` + title/byline). Description stays visible
 * like `persistentDescription` so duration/status is always readable. Hover
 * fill is explicit because this list is not inside `.rich-text-command-menu`.
 * Rail density keeps pane full-bleed; width `!` beats the unlayered menu
 * `width: 100%` so `-mx-2` still reaches the ArtifactPane edges.
 */
function CheckRow({
	bleed = false,
	check,
	onFixCheck,
}: Readonly<{
	bleed?: boolean;
	check: PullRequestCheck;
	onFixCheck?: (checks: readonly PullRequestCheck[]) => void;
}>) {
	const isFailed = check.status === "failed";
	return (
		<li
			className={cn(
				"group/check-row rich-text-command-menu-item hover:bg-bg-neutral-subtle-hovered! focus-visible:bg-bg-neutral-subtle-hovered! focus-visible:outline-none",
				isFailed ? "grid-cols-[24px_minmax(0,1fr)_auto]!" : undefined,
				bleed ? "-mx-2 w-[calc(100%+1rem)]!" : undefined,
			)}
			data-has-trailing={isFailed ? "true" : undefined}
			{...checkRowLinkProps(check.url)}
		>
			<span className="rich-text-command-menu-avatar inline-flex shrink-0 items-center justify-center">
				<CheckStatusIcon check={check} />
			</span>
			<span className="rich-text-command-menu-copy">
				<span className="menu-row-title">{check.name}</span>
				<span className="menu-row-byline">
					<CheckDetails check={check} />
				</span>
			</span>
			{isFailed ? (
				<CheckRowTrailing check={check} onFixCheck={onFixCheck} />
			) : (
				<span className="rich-text-command-menu-shortcut">
					<CheckRowTrailing check={check} onFixCheck={onFixCheck} />
				</span>
			)}
		</li>
	);
}

function CheckMenuRow({
	check,
	onFixCheck,
}: Readonly<{
	check: PullRequestCheck;
	onFixCheck?: (checks: readonly PullRequestCheck[]) => void;
}>) {
	return <CheckRow check={check} onFixCheck={onFixCheck} />;
}

function CheckRailRow({
	check,
	onFixCheck,
}: Readonly<{
	check: PullRequestCheck;
	onFixCheck?: (checks: readonly PullRequestCheck[]) => void;
}>) {
	return <CheckRow bleed check={check} onFixCheck={onFixCheck} />;
}

export function PullRequestChecksList({
	checks,
	density = "rail",
	onFixCheck,
}: Readonly<{
	checks: readonly PullRequestCheck[];
	/** `menu` uses editor-palette option chrome; `rail` full-bleeds in ArtifactPane. */
	density?: "rail" | "menu";
	onFixCheck?: (checks: readonly PullRequestCheck[]) => void;
}>) {
	if (checks.length === 0) {
		return <p className="text-xs text-text-subtle">No CI checks reported</p>;
	}

	return (
		<ul className="flex flex-col" data-jira-work-item-pull-request-checks>
			{checks.map((check) =>
				density === "menu" ? (
					<CheckMenuRow check={check} key={check.id} onFixCheck={onFixCheck} />
				) : (
					<CheckRailRow check={check} key={check.id} onFixCheck={onFixCheck} />
				),
			)}
		</ul>
	);
}

export function pullRequestChecksTitleState(checks: readonly PullRequestCheck[]) {
	const passed = checks.filter((check) => check.status === "passed").length;
	return {
		inProgress: arePullRequestChecksInProgress(checks),
		passed,
		total: checks.length,
	};
}
