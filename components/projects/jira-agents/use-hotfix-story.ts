"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type { WorkItemData } from "@/app/contexts/context-work-item-modal";
import type { JiraWorkItemState } from "@/components/blocks/jira-work-item/data/session-state";
import type { JiraKanbanColumnData } from "@/components/blocks/jira-kanban";
import type { JiraForYouSection } from "@/components/projects/jira-for-you/jira-for-you-types";
import {
	createJiraAgentsBoardColumns,
	createJiraAgentsStoryState,
	createJiraAgentsStoryWorkItem,
	createJiraAgentsWorkspaceSections,
	getJiraAgentsStoryChapterForStatus,
	getJiraAgentsStoryColumn,
	type JiraAgentsStoryChapter,
} from "./data/hotfix-story";
import {
	createJiraAgentsOrchestrationState,
	type JiraAgentsOrchestrationStep,
} from "./data/orchestration-state";

const ORCHESTRATION_SEQUENCE = {
	"agents-working": { next: "comment", delayMs: 1_500 },
	comment: { next: "reaction-1", delayMs: 1_200 },
	"reaction-1": { next: "reaction-2", delayMs: 1_000 },
	"reaction-2": { next: "lead", delayMs: 1_500 },
	lead: { next: "consult", delayMs: 1_800 },
	consult: { next: "complete", delayMs: 1_500 },
} as const satisfies Record<
	Exclude<JiraAgentsOrchestrationStep, "idle" | "complete">,
	{ next: Exclude<JiraAgentsOrchestrationStep, "idle">; delayMs: number }
>;

export interface JiraAgentsStoryController {
	boardColumns: readonly JiraKanbanColumnData[];
	chapter: JiraAgentsStoryChapter;
	initialState: JiraWorkItemState;
	launchId: number;
	orchestrationStep: JiraAgentsOrchestrationStep;
	sections: readonly JiraForYouSection[];
	selectChapter: (chapter: JiraAgentsStoryChapter) => void;
	startOrchestration: () => void;
	updateBoardColumns: (columns: readonly JiraKanbanColumnData[]) => void;
	workItem: WorkItemData;
}

export function useJiraAgentsStory(active = true): JiraAgentsStoryController {
	const [chapter, setChapter] = useState<JiraAgentsStoryChapter>("brief");
	const [orchestrationStep, setOrchestrationStep] = useState<JiraAgentsOrchestrationStep>("idle");
	const [launchId, setLaunchId] = useState(0);
	const [boardColumns, setBoardColumns] = useState<JiraKanbanColumnData[]>(
		() => createJiraAgentsBoardColumns("brief"),
	);

	const selectChapter = useCallback((nextChapter: JiraAgentsStoryChapter) => {
		setOrchestrationStep("idle");
		setChapter(nextChapter);
		setLaunchId((current) => current + 1);
		setBoardColumns((current) => createJiraAgentsBoardColumns(nextChapter, current));
	}, []);

	const startOrchestration = useCallback(() => {
		if (chapter !== "brief" || orchestrationStep !== "idle") return;
		setOrchestrationStep("agents-working");
		setLaunchId((current) => current + 1);
	}, [chapter, orchestrationStep]);

	// Keep this authored sequence under reduced motion as well. Each step is a
	// discrete state reveal (no entrance transform); ActivityPanel separately
	// switches its follow-scroll from smooth to instant.
	useEffect(() => {
		if (!active || orchestrationStep === "idle") return undefined;
		if (orchestrationStep === "complete") {
			selectChapter("working");
			return undefined;
		}

		const transition = ORCHESTRATION_SEQUENCE[orchestrationStep];
		const timeoutId = window.setTimeout(() => {
			setOrchestrationStep(transition.next);
			setLaunchId((current) => current + 1);
		}, transition.delayMs);

		return () => window.clearTimeout(timeoutId);
	}, [active, orchestrationStep, selectChapter]);

	const updateBoardColumns = useCallback((nextColumns: readonly JiraKanbanColumnData[]) => {
		const storyColumn = getJiraAgentsStoryColumn(nextColumns);
		const nextChapter = storyColumn
			? getJiraAgentsStoryChapterForStatus(storyColumn)
			: null;
		const resolvedChapter = nextChapter ?? chapter;

		setBoardColumns(createJiraAgentsBoardColumns(resolvedChapter, nextColumns));
		if (nextChapter && nextChapter !== chapter) {
			setOrchestrationStep("idle");
			setChapter(nextChapter);
			setLaunchId((current) => current + 1);
		}
	}, [chapter]);

	const initialState = useMemo(
		() => orchestrationStep === "idle"
			? createJiraAgentsStoryState(chapter)
			: createJiraAgentsOrchestrationState(orchestrationStep),
		[chapter, orchestrationStep],
	);
	const sections = useMemo(() => createJiraAgentsWorkspaceSections(chapter), [chapter]);
	const workItem = useMemo(() => createJiraAgentsStoryWorkItem(chapter), [chapter]);

	return {
		boardColumns,
		chapter,
		initialState,
		launchId,
		orchestrationStep,
		sections,
		selectChapter,
		startOrchestration,
		updateBoardColumns,
		workItem,
	};
}
