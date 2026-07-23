"use client";

import { useCallback, useState } from "react";

import type { AgentSessionsExperimentalPreset } from "@/components/blocks/agent-sessions";
import { createFilledPresetState, type AgentSessionsState, type StaticTimelineEvent } from "@/components/blocks/agent-sessions/data/session-state";
import type { WorkItemData } from "@/app/contexts/context-work-item-modal";
import { ExperimentalAgentSessions } from "@/components/blocks/agent-sessions/experimental/experimental-agent-sessions";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { getDeterministicAgentAvatarSrc } from "@/lib/agent-avatars";

const WORK_ITEM_STATES: readonly {
	label: string;
	value: AgentSessionsExperimentalPreset;
}[] = [
	{ label: "Empty", value: "blank" },
	{ label: "Suggestions", value: "empty" },
	{ label: "Running", value: "running" },
	{ label: "Done", value: "filled" },
];

export interface WorkItemStageController {
	preset: AgentSessionsExperimentalPreset;
	launchId: number;
	selectPreset: (preset: AgentSessionsExperimentalPreset) => void;
}

export function useWorkItemStageController(): WorkItemStageController {
	const [preset, setPreset] = useState<AgentSessionsExperimentalPreset>("blank");
	const [launchId, setLaunchId] = useState(0);

	const selectPreset = useCallback((nextPreset: AgentSessionsExperimentalPreset): void => {
		setPreset(nextPreset);
		setLaunchId((currentLaunchId) => currentLaunchId + 1);
	}, []);

	return { preset, launchId, selectPreset };
}

const JGP_251_WORK_ITEM: WorkItemData = {
	code: "JGP-251",
	title: "Remember assignee focus per board",
	description: "Restore each person's last focused assignee independently for every Jira board they visit.",
	assignee: { name: "Sarah", role: "Engineering lead" },
	reporter: { name: "Maya Chen", role: "Product designer" },
	priority: "Medium",
	status: "Done",
	parent: { code: "JGP-200", title: "Jira board focus workflows" },
	labels: ["Jira board", "Preferences"],
};

const SARAH = { id: "sarah", name: "Sarah", kind: "person" as const, avatarSrc: "/avatar-user/annie-clare/color/asow-strategy-orange.png" };
const MAYA = { id: "maya-chen", name: "Maya Chen", kind: "person" as const, avatarSrc: "/avatar-user/andrea-wilson/color/asow-service-yellow.png" };
const OWEN = { id: "owen-kim", name: "Owen Kim", kind: "person" as const, avatarSrc: "/avatar-user/david-hsieh/color/asow-service-yellow.png" };
const ELENA = { id: "elena-ruiz", name: "Elena Ruiz", kind: "person" as const, avatarSrc: "/avatar-user/aoife-burke/color/asow-service-yellow.png" };
const CURSOR = { id: "cursor", name: "Cursor", kind: "agent" as const, avatarSrc: getDeterministicAgentAvatarSrc("cursor") };
const GITHUB = { id: "github", name: "GitHub", kind: "app" as const, brandName: "github" as const };
const JGP_251_TIMELINE: readonly StaticTimelineEvent[] = [
	{ id: "jgp-251-delegated", kind: "event", actor: SARAH, segments: [{ type: "text", text: "answered Cursor's product question and confirmed that focus should be remembered per board" }], createdAtMs: Date.UTC(2026, 6, 22, 7, 0) },
	{ id: "jgp-251-implemented", kind: "event", actor: CURSOR, segments: [{ type: "text", text: "implemented board-scoped preference storage and restore behavior on cursor/jgp-251-remember-assignee-focus" }], createdAtMs: Date.UTC(2026, 6, 22, 7, 35) },
	{ id: "jgp-251-data-review", kind: "event", actor: OWEN, segments: [{ type: "text", text: "reviewed the preference key and confirmed it remains isolated by person and board" }], createdAtMs: Date.UTC(2026, 6, 22, 8, 5) },
	{ id: "jgp-251-design-review", kind: "event", actor: MAYA, segments: [{ type: "text", text: "tested the return-to-board flow and requested a safe fallback when a saved assignee is no longer available" }], createdAtMs: Date.UTC(2026, 6, 22, 8, 25) },
	{ id: "jgp-251-follow-up", kind: "event", actor: CURSOR, segments: [{ type: "text", text: "added the stale-assignee fallback and regression coverage for switching between boards" }], createdAtMs: Date.UTC(2026, 6, 22, 8, 50) },
	{ id: "jgp-251-pr", kind: "event", actor: GITHUB, icon: "linked", segments: [], pullRequest: { number: 837, title: "JGP-251 Remember assignee focus per board", status: "Merged", additions: 142, deletions: 21 }, createdAtMs: Date.UTC(2026, 6, 22, 9, 10) },
	{ id: "jgp-251-verified", kind: "event", actor: ELENA, segments: [{ type: "text", text: "verified restore, clear, and unavailable-assignee paths across two boards" }], createdAtMs: Date.UTC(2026, 6, 22, 9, 35) },
	{ id: "jgp-251-merged", kind: "event", actor: SARAH, icon: "status", segments: [{ type: "text", text: "approved the team contribution and moved the work item to " }, { type: "lozenge", text: "Done" }], createdAtMs: Date.UTC(2026, 6, 22, 10, 0) },
];

function createJgpCompletedState(): AgentSessionsState {
	const base = createFilledPresetState(JGP_251_WORK_ITEM);
	return {
		...base,
		contextResources: {
			...base.contextResources,
			title: JGP_251_WORK_ITEM.title,
			description: JGP_251_WORK_ITEM.description ?? "",
			tldr: ["Assignee focus is now remembered independently for every board.", "Cursor added a safe fallback for unavailable saved assignees.", "Sarah, Maya, Owen, and Elena reviewed and verified the delivery together."],
			nextSteps: [], attachments: [], subtasks: [], linkedItems: [],
		},
		comments: [],
		sessions: [],
		staticEvents: [...JGP_251_TIMELINE],
		metadata: { ...base.metadata, crew: [] },
	};
}

export function WorkItemControls({
	controller,
}: Readonly<{ controller: WorkItemStageController }>): React.ReactElement {
	return (
		<ButtonGroup
			variant="connected"
			aria-label="Open a work item state"
			className="[&>[data-slot]~[data-slot]]:-ml-px [&>[data-slot]~[data-slot]]:border-l!"
		>
			{WORK_ITEM_STATES.map((option) => (
				<Button
					key={option.value}
					type="button"
					variant="outline"
					size="compact"
					aria-pressed={controller.preset === option.value}
					onClick={() => controller.selectPreset(option.value)}
					className="aria-pressed:z-10"
				>
					{option.label}
				</Button>
			))}
		</ButtonGroup>
	);
}

/** The experimental Agent Sessions work-item design with deterministic preset jumps. */
export function WorkItemStage({
	controller,
}: Readonly<{ controller: WorkItemStageController; scenario?: "completed-timeline" }>): React.ReactElement {
	return (
		<div className="relative left-1/2 flex h-full min-h-0 w-screen -translate-x-1/2 items-start justify-center overflow-hidden px-8 pt-4 pb-4">
			<ExperimentalAgentSessions
				key={controller.launchId}
				initialPreset="filled"
				initialState={createJgpCompletedState()}
				presentation="inline"
				primaryCodingAgentId="cursor"
				workItem={JGP_251_WORK_ITEM}
			/>
		</div>
	);
}
