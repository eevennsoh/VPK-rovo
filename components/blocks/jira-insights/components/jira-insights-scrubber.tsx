"use client";

import { useCallback } from "react";

import { formatJiraInsightTime } from "@/components/blocks/jira-insights/components/jira-insights-checkpoint";
import { useJiraInsights } from "@/components/blocks/jira-insights/context-jira-insights";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

export function JiraInsightsScrubber({ className }: Readonly<{ className?: string }>) {
	const { activeCheckpointId, checkpoints, selectCheckpoint } = useJiraInsights();
	const activeIndex = Math.max(0, checkpoints.findIndex((checkpoint) => checkpoint.id === activeCheckpointId));
	const activeCheckpoint = checkpoints[activeIndex];
	const handleValueChange = useCallback((value: number | readonly number[]) => {
		const index = Array.isArray(value) ? value[0] ?? 0 : value;
		const checkpoint = checkpoints[Math.round(index)];
		if (checkpoint) selectCheckpoint(checkpoint.id);
	}, [checkpoints, selectCheckpoint]);

	if (!activeCheckpoint) return null;
	const activeValueText = `${formatJiraInsightTime(activeCheckpoint.capturedAtMs)}, ${activeCheckpoint.title}`;

	return (
		<div className={cn("rounded-lg border border-border bg-surface-raised px-4 py-3", className)} data-jira-insights-scrubber>
			<div className="mb-3 flex min-w-0 items-baseline justify-between gap-3">
				<p className="truncate text-sm font-medium text-text">{activeCheckpoint.title}</p>
				<span className="shrink-0 text-xs tabular-nums text-text-subtlest">
					{activeIndex + 1} of {checkpoints.length}
				</span>
			</div>
			{checkpoints.length === 1 ? (
				<div className="flex items-center gap-2" aria-label={activeValueText}>
					<span aria-hidden className="size-3 rounded-full bg-bg-selected-bold" />
					<span className="text-xs tabular-nums text-text-subtlest">
						{formatJiraInsightTime(activeCheckpoint.capturedAtMs)}
					</span>
				</div>
			) : (
				<>
					<div className="relative px-1">
						<div
							aria-hidden
							className="pointer-events-none absolute inset-x-1 top-1/2 grid -translate-y-1/2"
							style={{ gridTemplateColumns: `repeat(${checkpoints.length}, minmax(0, 1fr))` }}
						>
							{checkpoints.map((checkpoint) => (
								<span className="flex justify-center" key={checkpoint.id}>
									<span className="size-2 rounded-full border border-border-bold bg-surface-raised" />
								</span>
							))}
						</div>
						<Slider
							aria-label="Decision timeline"
							aria-valuetext={activeValueText}
							max={checkpoints.length - 1}
							min={0}
							onValueChange={handleValueChange}
							step={1}
							value={[activeIndex]}
						/>
					</div>
					<div
						aria-hidden
						className="mt-2 grid text-center text-[0.6875rem] tabular-nums text-text-subtlest"
						style={{ gridTemplateColumns: `repeat(${checkpoints.length}, minmax(0, 1fr))` }}
					>
						{checkpoints.map((checkpoint, index) => (
							<span className={cn("truncate", index !== 0 && index !== activeIndex && index !== checkpoints.length - 1 ? "max-[520px]:invisible" : null)} key={checkpoint.id}>
								{formatJiraInsightTime(checkpoint.capturedAtMs)}
							</span>
						))}
					</div>
				</>
			)}
		</div>
	);
}
