"use client";

import AiAgentIcon from "@atlaskit/icon/core/ai-agent";

import { JiraIssueCountBadge } from "@/components/blocks/jira-issue/count-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";

export interface JiraIssueCompletedAgentRun {
	id: string;
	summary: string;
	agentName: string;
	agentAvatarSrc?: string;
	issueKey: string;
	issueSummary: string;
	relativeTime: string;
}

function getAgentInitial(name: string): string {
	return name.trim()[0]?.toUpperCase() ?? "A";
}

function JiraIssueCompletedAgentRunRow({
	index,
	run,
}: Readonly<{
	index: number;
	run: JiraIssueCompletedAgentRun;
}>) {
	const issueDescription = `${run.issueKey}: ${run.issueSummary}`;

	return (
		<li className={cn("min-w-0 px-3 py-2.5", index > 0 ? "border-t border-border" : null)}>
			<p className="truncate text-sm font-medium leading-5 text-text" title={run.summary}>{run.summary}</p>
			<div className="mt-1 flex min-w-0 items-center gap-1.5 text-xs leading-4 text-text-subtle">
				<Avatar label={run.agentName} shape="hexagon" size="xs">
					{run.agentAvatarSrc ? <AvatarImage alt="" src={run.agentAvatarSrc} /> : null}
					<AvatarFallback>{getAgentInitial(run.agentName)}</AvatarFallback>
				</Avatar>
				<span className="shrink-0">{run.agentName}</span>
				<span className="shrink-0" aria-hidden="true">·</span>
				<span className="min-w-0 flex-1 truncate" title={issueDescription}>{issueDescription}</span>
				<span className="shrink-0" aria-hidden="true">·</span>
				<span className="shrink-0">{run.relativeTime}</span>
			</div>
		</li>
	);
}

export function JiraIssueAgentDone({
	onOpenChange,
	runs,
}: Readonly<{
	onOpenChange?: (open: boolean) => void;
	runs: readonly JiraIssueCompletedAgentRun[];
}>) {
	const count = runs.length;
	const triggerLabel = `View ${count} completed agent ${count === 1 ? "run" : "runs"}`;

	return (
		<HoverCard onOpenChange={onOpenChange}>
			<section aria-label="Agent done">
				<HoverCardTrigger
					closeDelay={80}
					delay={0}
					render={(
						<button
							type="button"
							aria-label={triggerLabel}
							className="mx-1 flex h-8 w-[calc(100%-8px)] items-center justify-between rounded-sm px-2 py-2 text-left outline-none transition-colors duration-fast ease-out hover:bg-bg-neutral-subtle-hovered focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
						>
							<span className="flex items-center gap-2 text-sm font-medium leading-5 text-text-subtle">
								<span className="grid size-4 shrink-0 place-items-center text-icon-subtle" aria-hidden="true">
									<AiAgentIcon label="" size="medium" spacing="none" color="currentColor" />
								</span>
								<span>Agent done</span>
								<JiraIssueCountBadge>{count}</JiraIssueCountBadge>
							</span>
						</button>
					)}
				/>
			</section>
			<HoverCardContent
				align="start"
				alignOffset={0}
				className="w-[400px] max-w-[calc(100vw-48px)] overflow-hidden rounded-xl bg-surface-overlay p-0 text-text shadow-overlay data-ending-style:transition-none"
				side="right"
				sideOffset={8}
			>
				<ul aria-label="Completed agent runs">
					{runs.map((run, index) => (
						<JiraIssueCompletedAgentRunRow index={index} key={run.id} run={run} />
					))}
				</ul>
			</HoverCardContent>
		</HoverCard>
	);
}
