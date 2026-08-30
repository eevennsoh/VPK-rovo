"use client";

import { useEffect, useState } from "react";

import { ROVO_AGENT_SELECTOR_AGENTS } from "@/app/data/directory/agents";
import {
	AgentAssignment,
	type AgentAssignmentAgent,
	type AgentAssignmentStatusKind,
} from "@/components/blocks/agent-assignment";
import type { AgentSelectorAgent } from "@/components/blocks/agent-selector";
import {
	DEFAULT_PINNED_SPACE_AGENT_IDS,
	WORK_ITEM_PINNED_ITEMS_LABEL,
} from "@/components/blocks/jira-work-item/experimental-v3/lib/work-item-picker-options";
import { SONNER_TOAST_AUTO_DISMISS_MS } from "@/components/ui/sonner";

const INITIAL_ASSIGNED_AGENT_IDS = [
	"github-copilot",
	"release-notes-drafter",
	"code-reviewer",
	"readiness-checker",
] as const;

const DEMO_USED_AGENT_IDS = [
	"github-copilot",
	"release-notes-drafter",
] as const;

interface DemoAgentState {
	statusKind: AgentAssignmentStatusKind;
	statusLabel: string;
	status?: string;
	intervalMs?: number;
	jitterMs?: number;
	labels?: readonly string[];
}

const DEMO_AGENT_STATES: Readonly<Record<string, DemoAgentState>> = {
	"github-copilot": {
		statusKind: "working",
		statusLabel: "Running",
		intervalMs: 1700,
		jitterMs: 1900,
		labels: [
			"Inspecting changed files",
			"Tracing affected call sites",
			"Checking the proposed patch across every changed file in this review",
		],
	},
	"release-notes-drafter": {
		statusKind: "needs-input",
		statusLabel: "Needs input",
		status: "Needs input",
	},
	"code-reviewer": {
		statusKind: "idle",
		statusLabel: "Idle",
	},
	"readiness-checker": {
		statusKind: "idle",
		statusLabel: "Idle",
	},
};

function getDemoAssignedAgent(agent: AgentSelectorAgent): AgentAssignmentAgent {
	const demoStatus = DEMO_AGENT_STATES[agent.id] ?? {
		statusKind: "idle" as const,
		statusLabel: "Idle",
	};

	return {
		...agent,
		statusKind: demoStatus.statusKind,
		statusLabel: demoStatus.statusLabel,
		...(demoStatus.status ? { status: demoStatus.status } : {}),
		...(demoStatus.labels ? {
			statusSequence: demoStatus.labels,
			statusCycleIntervalMs: demoStatus.intervalMs,
			statusCycleJitterMs: demoStatus.jitterMs,
		} : {}),
	};
}

export default function AgentAssignmentPage() {
	const [assignedAgentIds, setAssignedAgentIds] = useState<readonly string[]>(INITIAL_ASSIGNED_AGENT_IDS);
	const [codeReviewerFinished, setCodeReviewerFinished] = useState(false);

	useEffect(() => {
		const timeoutId = window.setTimeout(() => {
			setCodeReviewerFinished(true);
		}, SONNER_TOAST_AUTO_DISMISS_MS + 400);

		return () => {
			window.clearTimeout(timeoutId);
		};
	}, []);

	const assignedAgents = assignedAgentIds.flatMap((agentId): AgentAssignmentAgent[] => {
		const agent = ROVO_AGENT_SELECTOR_AGENTS.find((candidate) => candidate.id === agentId);
		if (!agent) {
			return [];
		}
		if (agent.id === "code-reviewer") {
			return [{
				...getDemoAssignedAgent(agent),
				...(codeReviewerFinished ? {
					status: "Finished",
					statusKind: "finished" as const,
					statusLabel: "Finished",
				} : {}),
			}];
		}
		return [getDemoAssignedAgent(agent)];
	});

	return (
		<div className="w-80 rounded-xl bg-surface-raised p-4 shadow-lg">
			<div className="grid grid-cols-[5rem_minmax(0,1fr)] items-center gap-2">
				<span className="text-sm text-text-subtle">Agents</span>
				<AgentAssignment
					agents={ROVO_AGENT_SELECTOR_AGENTS}
					assignedAgents={assignedAgents}
					defaultPinnedAgentIds={DEFAULT_PINNED_SPACE_AGENT_IDS}
					onAssignedAgentIdsChange={setAssignedAgentIds}
					onAssignedAgentSelect={() => undefined}
					onBrowseAgents={() => undefined}
					onContinueExistingSession={() => undefined}
					onCreateAgent={() => undefined}
					onStartNewSession={() => undefined}
					pinnedItemsLabel={WORK_ITEM_PINNED_ITEMS_LABEL}
					usedAgentIds={DEMO_USED_AGENT_IDS}
				/>
			</div>
		</div>
	);
}

export { AgentAssignment } from "@/components/blocks/agent-assignment";
export type { AgentAssignmentAgent, AgentAssignmentProps } from "@/components/blocks/agent-assignment";
