"use client";

import { useState } from "react";

import AiAgentIcon from "@atlaskit/icon/core/ai-agent";
import StatusErrorIcon from "@atlaskit/icon/core/status-error";
import StrokeWeightExtraLargeIcon from "@atlaskit/icon/core/stroke-weight-extra-large";

import {
	AgentList,
	type AgentListItem,
	toAgentSessionFlyoutItem,
} from "@/components/blocks/agent-list";
import type { JiraIssueAgentActivityLayout } from "@/components/blocks/jira-issue/agent-activity-model";
import {
	createJiraSessionFlyoutHandle,
	JiraSessionFlyoutSurface,
	JiraSessionFlyoutTrigger,
} from "@/components/blocks/product-sidebar/variants/jira-session-flyout";
import { AgentAvatarVisual } from "@/components/ui-custom/agent-avatar-visual";
import type { ArtifactListItem } from "@/components/ui-custom/artifact-list";
import type { ThirdPartyLogoName } from "@/components/ui/data/logo-third-party-data";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { IconTile } from "@/components/ui/icon-tile";
import { cn } from "@/lib/utils";

export type JiraIssueCompletedAgentRunState = "done" | "failed" | "review";

export interface JiraIssueCompletedAgentRun {
	id: string;
	summary: string;
	description?: string;
	agentName: string;
	agentAvatarSrc?: string;
	agentBrandName?: ThirdPartyLogoName;
	issueKey: string;
	issueSummary: string;
	/** Legacy preformatted fallback when no completion timestamp is available. */
	relativeTime?: string;
	completedAtMs?: number;
	/** Demo-friendly age that continues advancing after mount. */
	completedSecondsAgo?: number;
	elapsedSeconds?: number;
	pullRequestNumber?: number;
	outputs?: readonly ArtifactListItem[];
	actionLabel?: "Open" | "View";
	state: JiraIssueCompletedAgentRunState;
}

function toCompletedAgentListItem(run: JiraIssueCompletedAgentRun): AgentListItem {
	return {
		agent: {
			avatarSrc: run.agentAvatarSrc,
			brandName: run.agentBrandName,
			id: run.id,
			name: run.agentName,
		},
		completedAtMs: run.completedAtMs,
		completedSecondsAgo: run.completedSecondsAgo,
		elapsedSeconds: run.elapsedSeconds,
		id: run.id,
		state: "complete",
		sessionDetails: {
			branch: `rovo/${run.issueKey.toLowerCase()}-completed-run`,
			checks: { failed: run.state === "failed" ? 1 : 0, passed: 12 },
			commit: "8c2f4e1",
			host: "cloud",
			issueKey: run.issueKey,
			issueSummary: run.issueSummary,
			pullRequestNumber: run.pullRequestNumber,
			repository: "payments-platform/payments",
		},
		title: run.summary,
	};
}

function getCompletedRunInitial(name: string): string {
	return name.trim()[0]?.toUpperCase() ?? "A";
}

/**
 * One finished run as its own chin row, mirroring the split working rows: the
 * run's own agent avatar, its summary, and a per-run outcome icon. Hovering a
 * row opens that run's detail card instead of the shared aggregate list.
 */
function JiraIssueCompletedRunRow({
	onView,
	run,
	usesStrokeChrome,
}: Readonly<{
	onView?: (run: JiraIssueCompletedAgentRun) => void;
	run: JiraIssueCompletedAgentRun;
	usesStrokeChrome: boolean;
}>) {
	const [flyoutHandle] = useState(createJiraSessionFlyoutHandle);
	const hasFailed = run.state === "failed";
	const outcomeLabel = hasFailed ? "failed" : "finished";
	const session = toAgentSessionFlyoutItem(toCompletedAgentListItem(run));

	return (
		<>
			<JiraSessionFlyoutTrigger
				closeDelay={80}
				delay={120}
				handle={flyoutHandle}
				onClick={() => onView?.(run)}
				render={(
					<button
						aria-label={`${run.agentName} ${outcomeLabel}: ${run.summary}`}
						className="flex h-6 w-full min-w-0 items-center justify-between gap-2 rounded-md px-2 py-1 text-left outline-none transition-colors duration-fast ease-out hover:bg-bg-neutral-subtle-hovered focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
						data-slot="jira-issue-agent-row"
						type="button"
					>
						<span className={cn("flex min-w-0 flex-1 items-center", usesStrokeChrome ? "gap-1.5" : "gap-2")}>
							<AgentAvatarVisual
								avatarClassName={cn("shrink-0", usesStrokeChrome && "ml-px")}
								avatarSrc={run.agentAvatarSrc}
								brandName={run.agentBrandName}
								fallbackText={getCompletedRunInitial(run.agentName)}
								label={run.agentName}
								sizePx={16}
							/>
							<span
								className={cn(
									"block min-w-0 flex-1 truncate text-text-subtlest",
									usesStrokeChrome ? "text-xs leading-4" : "text-sm leading-5",
								)}
							>
								{run.summary}
							</span>
						</span>
						<span
							className={cn(
								"grid shrink-0 place-items-center",
								hasFailed ? "text-icon-danger" : "text-icon-information",
								usesStrokeChrome ? "size-4" : "-my-1 size-6",
							)}
							aria-hidden="true"
						>
							{hasFailed ? (
								<StatusErrorIcon color="currentColor" label="" size="small" />
							) : (
								<StrokeWeightExtraLargeIcon color="currentColor" label="" size="small" />
							)}
						</span>
					</button>
				)}
				session={{ ...session, status: run.state === "failed" ? "stopped" : session.status }}
			/>
			<JiraSessionFlyoutSurface handle={flyoutHandle} />
		</>
	);
}

export function JiraIssueAgentDone({
	layout = "merged",
	...props
}: Readonly<{
	layout?: JiraIssueAgentActivityLayout;
	onOpenChange?: (open: boolean) => void;
	onReview?: (run: JiraIssueCompletedAgentRun) => void;
	onSubmit?: (run: JiraIssueCompletedAgentRun, prompt: string) => void;
	onView?: (run: JiraIssueCompletedAgentRun) => void;
	runs: readonly JiraIssueCompletedAgentRun[];
	usesStrokeChrome: boolean;
}>) {
	if (layout === "split") {
		return (
			<section aria-label="Agent review" className="flex w-full min-w-0 flex-col overflow-hidden px-1 py-1">
				{props.runs.map((run) => (
					<JiraIssueCompletedRunRow
						key={run.id}
						onView={props.onView}
						run={run}
						usesStrokeChrome={props.usesStrokeChrome}
					/>
				))}
			</section>
		);
	}

	return <JiraIssueAgentDoneMerged {...props} />;
}

function JiraIssueAgentDoneMerged({
	onOpenChange,
	onView,
	runs,
	usesStrokeChrome,
}: Readonly<{
	onOpenChange?: (open: boolean) => void;
	onReview?: (run: JiraIssueCompletedAgentRun) => void;
	onSubmit?: (run: JiraIssueCompletedAgentRun, prompt: string) => void;
	onView?: (run: JiraIssueCompletedAgentRun) => void;
	runs: readonly JiraIssueCompletedAgentRun[];
	usesStrokeChrome: boolean;
}>) {
	const [aggregateOpen, setAggregateOpen] = useState(false);
	const finishedLabel = `${runs.length} Finished`;
	const hasFailedRun = runs.some((run) => run.state === "failed");
	const completedItems = runs.map(toCompletedAgentListItem);

	function handleAggregateOpenChange(open: boolean) {
		setAggregateOpen(open);
		onOpenChange?.(open);
	}

	function findRun(item: AgentListItem): JiraIssueCompletedAgentRun | undefined {
		return runs.find((run) => run.id === item.id);
	}

	function handleCompletedRunView(item: AgentListItem) {
		const run = findRun(item);
		if (!run) {
			return;
		}
		handleAggregateOpenChange(false);
		onView?.(run);
	}

	return (
		<section aria-label="Agent review" className="flex w-full min-w-0 flex-col overflow-hidden px-1 py-1">
			<HoverCard open={aggregateOpen} onOpenChange={handleAggregateOpenChange}>
				<HoverCardTrigger
					closeDelay={80}
					delay={120}
					render={(
						<button
							aria-expanded={aggregateOpen}
							aria-label={hasFailedRun ? `${finishedLabel}, includes errors` : finishedLabel}
							className="flex h-6 w-full min-w-0 items-center justify-between gap-2 rounded-b-[6px] rounded-t-sm px-2 py-1 text-left outline-none transition-colors duration-fast ease-out hover:bg-bg-neutral-subtle-hovered focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
							data-slot="jira-issue-agent-row"
							type="button"
						>
							<span className={cn("flex min-w-0 flex-1 items-center", usesStrokeChrome ? "gap-1.5" : "gap-2")}>
								{usesStrokeChrome ? (
									<IconTile
										aria-hidden
										as="span"
										className="ml-px text-icon-subtle"
										icon={<AiAgentIcon label="" size="small" />}
										iconSize="small"
										label=""
										size="xxsmall"
										variant="transparent"
									/>
								) : (
									<span className="ml-px grid size-4 shrink-0 place-items-center text-text-subtlest" aria-hidden="true">
										<AiAgentIcon label="" />
									</span>
								)}
								<span
									className={cn(
										"truncate text-text-subtlest",
										usesStrokeChrome ? "text-xs leading-4" : "text-sm leading-5",
									)}
								>
									{finishedLabel}
								</span>
							</span>
							{hasFailedRun ? (
								<span
									className={cn(
										"grid shrink-0 place-items-center text-icon-danger",
										usesStrokeChrome ? "size-4" : "-my-1 size-6",
									)}
									aria-hidden="true"
								>
									<StatusErrorIcon color="currentColor" label="" size="small" />
								</span>
							) : null}
						</button>
					)}
				/>
				<HoverCardContent
					align="start"
					alignOffset={0}
					className="w-[320px] max-w-[calc(100vw-48px)] bg-transparent p-0 shadow-none data-ending-style:transition-none"
					positionerClassName="z-[575] after:pointer-events-auto after:absolute after:-inset-2 after:-z-10 after:content-['']"
					side="right"
					sideOffset={8}
				>
					<AgentList
						className="w-full border-0 bg-surface-overlay shadow-2xl"
					flyout="session"
					items={completedItems}
					onView={handleCompletedRunView}
						variant="compact"
					/>
				</HoverCardContent>
			</HoverCard>
		</section>
	);
}
