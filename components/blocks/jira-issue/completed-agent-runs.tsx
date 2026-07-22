"use client";

import StatusErrorIcon from "@atlaskit/icon/core/status-error";
import StatusSuccessIcon from "@atlaskit/icon/core/status-success";

import { JiraActivityChangedFiles } from "@/components/blocks/jira-activity/jira-activity-changed-files";
import type { JiraActivityChangedFilesEntry } from "@/components/blocks/jira-activity/jira-activity-types";
import { JiraIssueAgentPrompt } from "@/components/blocks/jira-issue/agent-activity";
import type { ArtifactListItem } from "@/components/ui-custom/artifact-list";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";

export type JiraIssueCompletedAgentRunState = "done" | "failed";

export interface JiraIssueCompletedAgentRun {
	id: string;
	summary: string;
	description?: string;
	agentName: string;
	agentAvatarSrc?: string;
	issueKey: string;
	issueSummary: string;
	relativeTime: string;
	elapsedSeconds?: number;
	outputs?: readonly ArtifactListItem[];
	state: JiraIssueCompletedAgentRunState;
}

const RUN_STATE_PRESENTATION = {
	done: {
		label: "Done",
		iconClassName: "text-icon-success",
		icon: <StatusSuccessIcon color="currentColor" label="" size="small" />,
	},
	failed: {
		label: "Alert",
		iconClassName: "text-icon-danger",
		icon: <StatusErrorIcon color="currentColor" label="" size="small" />,
	},
} as const;

function getAgentInitial(name: string): string {
	return name.trim()[0]?.toUpperCase() ?? "A";
}

function getCompletedRunEntry(run: JiraIssueCompletedAgentRun): JiraActivityChangedFilesEntry {
	return {
		id: run.id,
		kind: "changed-files",
		actor: {
			id: run.id,
			kind: "agent",
			name: run.agentName,
			avatarSrc: run.agentAvatarSrc,
		},
		timestamp: run.relativeTime,
		summary: run.summary,
		description: run.description ?? "",
		sessionItem: {
			id: run.id,
			title: run.summary,
			state: "complete",
			agent: {
				name: run.agentName,
				avatarSrc: run.agentAvatarSrc,
			},
			branch: "",
			elapsedSeconds: run.elapsedSeconds,
		},
		outputs: run.outputs ?? [],
	};
}

export function JiraIssueAgentDone({
	onOpenChange,
	onSubmit,
	onView,
	runs,
}: Readonly<{
	onOpenChange?: (open: boolean) => void;
	onSubmit?: (run: JiraIssueCompletedAgentRun, prompt: string) => void;
	onView?: (run: JiraIssueCompletedAgentRun) => void;
	runs: readonly JiraIssueCompletedAgentRun[];
}>) {
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
					<HoverCard key={run.id} onOpenChange={onOpenChange}>
						<HoverCardTrigger
							closeDelay={0}
							delay={0}
							render={(
								<button
									aria-label={`${run.agentName}: ${state.label}`}
									data-slot="jira-issue-agent-row"
									className={cn(
										"flex h-6 w-full items-center justify-between gap-2 px-2 py-1 text-left outline-none transition-colors duration-fast ease-out hover:bg-bg-neutral-subtle-hovered focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
										rowRadiusClassName,
									)}
									type="button"
								>
									<span className="flex min-w-0 items-center gap-2">
										<Avatar label={run.agentName} shape="hexagon" size="xs">
											{run.agentAvatarSrc ? <AvatarImage alt="" src={run.agentAvatarSrc} /> : null}
											<AvatarFallback>{getAgentInitial(run.agentName)}</AvatarFallback>
										</Avatar>
										<span className="truncate text-sm leading-5 text-text-subtlest">{run.summary}</span>
									</span>
									<span className={cn("-my-1 grid size-6 shrink-0 place-items-center", state.iconClassName)} aria-hidden="true">
										{state.icon}
									</span>
								</button>
							)}
						/>
						<HoverCardContent
							align="start"
							alignOffset={0}
							className="w-[440px] max-w-[calc(100vw-48px)] overflow-hidden rounded-xl bg-surface-overlay p-0 text-text shadow-overlay data-ending-style:transition-none"
							side="right"
							sideOffset={8}
						>
							<JiraActivityChangedFiles
								entry={getCompletedRunEntry(run)}
								footer={
									<JiraIssueAgentPrompt
										className="w-full shadow-none"
										onSubmit={(prompt) => onSubmit?.(run, prompt)}
									/>
								}
								onView={() => onView?.(run)}
								status={run.state}
								variant="jira-issue"
							/>
						</HoverCardContent>
					</HoverCard>
				);
			})}
		</section>
	);
}
