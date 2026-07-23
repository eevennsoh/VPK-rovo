"use client";

import { useState } from "react";

import PullRequestIcon from "@atlaskit/icon/core/pull-request";
import StatusErrorIcon from "@atlaskit/icon/core/status-error";

import { JiraActivityChangedFiles } from "@/components/blocks/jira-activity/jira-activity-changed-files";
import type { JiraActivityChangedFilesEntry } from "@/components/blocks/jira-activity/jira-activity-types";
import { JiraIssueAgentPrompt } from "@/components/blocks/jira-issue/agent-activity";
import { AgentAvatarVisual } from "@/components/ui-custom/agent-avatar-visual";
import type { ArtifactListItem } from "@/components/ui-custom/artifact-list";
import type { ThirdPartyLogoName } from "@/components/ui/data/logo-third-party-data";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
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
	/** Allows dense consumers to keep review state without repeating a trailing PR glyph on the row. */
	showStateIcon?: boolean;
	state: JiraIssueCompletedAgentRunState;
}

const RUN_STATE_PRESENTATION = {
	done: {
		label: null,
		iconClassName: null,
		icon: null,
	},
	failed: {
		label: "Alert",
		iconClassName: "text-icon-danger",
		icon: <StatusErrorIcon color="currentColor" label="" size="small" />,
	},
	review: {
		label: "Ready for review",
		iconClassName: "text-icon-success",
		icon: <PullRequestIcon color="currentColor" label="" size="small" />,
	},
} as const;

function getCompletedRunEntry(run: JiraIssueCompletedAgentRun): JiraActivityChangedFilesEntry {
	return {
		id: run.id,
		kind: "changed-files",
		actor: {
			id: run.id,
			kind: "agent",
			name: run.agentName,
			avatarSrc: run.agentAvatarSrc,
			brandName: run.agentBrandName,
		},
		timestamp: run.relativeTime ?? "Just now",
		summary: run.summary,
		description: run.description ?? "",
		sessionItem: {
			id: run.id,
			title: run.summary,
			state: "complete",
			agent: {
				name: run.agentName,
				avatarSrc: run.agentAvatarSrc,
				brandName: run.agentBrandName,
			},
			branch: "",
			elapsedSeconds: run.elapsedSeconds,
			completedAtMs: run.completedAtMs,
			completedSecondsAgo: run.completedSecondsAgo,
		},
		outputs: run.outputs ?? [],
	};
}

export function JiraIssueAgentDone({
	onOpenChange,
	onReview,
	onSubmit,
	onView,
	runs,
}: Readonly<{
	onOpenChange?: (open: boolean) => void;
	onReview?: (run: JiraIssueCompletedAgentRun) => void;
	onSubmit?: (run: JiraIssueCompletedAgentRun, prompt: string) => void;
	onView?: (run: JiraIssueCompletedAgentRun) => void;
	runs: readonly JiraIssueCompletedAgentRun[];
}>) {
	const [openRunId, setOpenRunId] = useState<string | null>(null);

	return (
		<section aria-label="Agent review" className="flex w-full flex-col overflow-hidden px-1 py-1">
			{runs.map((run, index) => {
				const state = RUN_STATE_PRESENTATION[run.state];
				const rowRadiusClassName = runs.length === 1
					? "rounded-sm"
					: index === 0
						? "rounded-tl-[6px] rounded-tr-[6px] rounded-bl-[2px] rounded-br-[2px]"
						: index === runs.length - 1
							? "rounded-tl-[2px] rounded-tr-[2px] rounded-bl-[6px] rounded-br-[6px]"
							: "rounded-[2px]";

				return (
					<HoverCard
						key={run.id}
						onOpenChange={(open) => {
							setOpenRunId(open ? run.id : null);
							onOpenChange?.(open);
						}}
						open={openRunId === run.id}
					>
						<HoverCardTrigger
							closeDelay={0}
							delay={0}
							render={(
								<button
									aria-label={state.label ? `${run.agentName}: ${state.label}` : run.agentName}
									data-slot="jira-issue-agent-row"
									className={cn(
										"flex h-6 w-full items-center justify-between gap-2 px-2 py-1 text-left outline-none transition-colors duration-fast ease-out hover:bg-bg-neutral-subtle-hovered focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
										rowRadiusClassName,
									)}
									type="button"
								>
									<span className="flex min-w-0 items-center gap-2">
										<AgentAvatarVisual
											avatarClassName="shrink-0"
											avatarSrc={run.agentAvatarSrc}
											brandName={run.agentBrandName}
											fallbackText={run.agentName}
											label={run.agentName}
											sizePx={16}
										/>
										<span className="truncate text-sm leading-5 text-text-subtlest">{run.summary}</span>
									</span>
									{run.showStateIcon !== false && state.icon ? (
										<span className={cn("-my-1 grid size-6 shrink-0 place-items-center", state.iconClassName)} aria-hidden="true">
											{state.icon}
										</span>
									) : null}
								</button>
							)}
						/>
						<HoverCardContent
							align="start"
							alignOffset={0}
							className="w-[440px] max-w-[calc(100vw-48px)] overflow-hidden rounded-xl bg-surface-overlay p-0 text-text shadow-overlay data-ending-style:transition-none"
							positionerClassName="z-[575] after:pointer-events-auto after:absolute after:-inset-2 after:-z-10 after:content-['']"
							side="right"
							sideOffset={8}
						>
							<JiraActivityChangedFiles
								entry={getCompletedRunEntry(run)}
								footer={
									<JiraIssueAgentPrompt
										className="w-full"
										onSubmit={(prompt) => onSubmit?.(run, prompt)}
									/>
								}
								onOutputOpen={(item) => {
									if (item.pullRequest) {
										setOpenRunId(null);
										onOpenChange?.(false);
										onReview?.(run);
									}
								}}
								onView={() => {
									setOpenRunId(null);
									onOpenChange?.(false);
									onView?.(run);
								}}
								status={run.state}
								variant="jira-issue"
								viewActionLabel={run.actionLabel}
							/>
						</HoverCardContent>
					</HoverCard>
				);
			})}
		</section>
	);
}
