"use client"

import type { ReactElement, ReactNode } from "react"

import type { StudioSessionAgentEntry } from "@/app/contexts/context-rovo-chat"
import { ProgressTracker, type ProgressTrackerStep } from "@/components/ui/progress-tracker"
import { Tag } from "@/components/ui/tag"
import {
	getAgentExecutionSummaries,
	getMessageReasoningTimestamps,
	getThinkingToolCallSummaries,
	type RovoUIMessage,
} from "@/lib/rovo-ui-messages"
import {
	buildAgentActivitySteps,
	executionSummaryToEntry,
	toolCallSummaryToEntry,
	type AgentActivityEntry,
} from "../lib/agent-activity-timeline"

/**
 * Byline mirroring the progress-tracker docs "Activity timeline" demo: a
 * timestamp/summary line followed by optional blue Tag chips (here, the
 * agent's connected tools instead of the demo's thread links).
 */
function ActivityByline({
	byline,
	toolTags,
}: Readonly<{
	byline?: string
	toolTags?: readonly string[]
}>): ReactElement {
	return (
		<span className="grid gap-1">
			{byline ? <span>{byline}</span> : null}
			{toolTags && toolTags.length > 0 ? (
				<span className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
					{toolTags.map((toolTag) => (
						<Tag key={toolTag} color="blue">
							{toolTag}
						</Tag>
					))}
				</span>
			) : null}
		</span>
	)
}

function toProgressTrackerStep(entry: AgentActivityEntry): ProgressTrackerStep {
	const hasByline = Boolean(entry.byline) || (entry.toolTags?.length ?? 0) > 0
	return {
		id: entry.id,
		label: entry.label,
		state: entry.state,
		byline: hasByline ? <ActivityByline byline={entry.byline} toolTags={entry.toolTags} /> : undefined,
	}
}

// Flatten the current thread's assistant turns into chronological activity
// rows. The pure helper handles state mapping, ordering, and clamping.
function buildRuntimeEntries(messages: readonly RovoUIMessage[]): AgentActivityEntry[] {
	const entries: AgentActivityEntry[] = []

	messages.forEach((message, messageIndex) => {
		if (message.role !== "assistant") {
			return
		}

		const reasoning = getMessageReasoningTimestamps(message)
		const messageTimestamp = reasoning.completedAt ?? reasoning.startedAt

		for (const execution of getAgentExecutionSummaries(message)) {
			entries.push(executionSummaryToEntry(execution, messageIndex, messageTimestamp))
		}

		for (const toolCall of getThinkingToolCallSummaries(message)) {
			entries.push(toolCallSummaryToEntry(toolCall, messageIndex, messageTimestamp))
		}
	})

	return entries
}

/**
 * Activity tab content for a custom agent. Renders a ProgressTracker timeline
 * derived from the agent's real data (session config + current-thread runtime
 * events). Falls back to `emptyState` when nothing is derivable.
 */
export function AgentActivityTimeline({
	entry,
	messages,
	emptyState,
}: Readonly<{
	entry: StudioSessionAgentEntry | null
	messages: readonly RovoUIMessage[]
	emptyState: ReactNode
}>): ReactElement {
	const runtimeEntries = buildRuntimeEntries(messages)
	const steps = buildAgentActivitySteps({ runtimeEntries, entry }).map(toProgressTrackerStep)

	if (steps.length === 0) {
		return <>{emptyState}</>
	}

	return (
		<ProgressTracker
			aria-label="Agent activity timeline"
			bylineClassName="text-xs leading-4"
			className="[&_[data-slot=progress-tracker-content]]:gap-0"
			labelClassName="text-sm leading-5"
			steps={steps}
		/>
	)
}
