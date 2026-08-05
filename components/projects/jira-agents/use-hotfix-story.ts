"use client";

import { useCallback, useMemo, useState } from "react";

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

export interface JiraAgentsStoryController {
	boardColumns: readonly JiraKanbanColumnData[];
	chapter: JiraAgentsStoryChapter;
	initialState: JiraWorkItemState;
	launchId: number;
	sections: readonly JiraForYouSection[];
	selectChapter: (chapter: JiraAgentsStoryChapter) => void;
	updateBoardColumns: (columns: readonly JiraKanbanColumnData[]) => void;
	workItem: WorkItemData;
}

export function useJiraAgentsStory(): JiraAgentsStoryController {
	const [chapter, setChapter] = useState<JiraAgentsStoryChapter>("brief");
	const [launchId, setLaunchId] = useState(0);
	const [boardColumns, setBoardColumns] = useState<JiraKanbanColumnData[]>(
		() => createJiraAgentsBoardColumns("brief"),
	);

	const selectChapter = useCallback((nextChapter: JiraAgentsStoryChapter) => {
		setChapter(nextChapter);
		setLaunchId((current) => current + 1);
		setBoardColumns((current) => createJiraAgentsBoardColumns(nextChapter, current));
	}, []);

	const updateBoardColumns = useCallback((nextColumns: readonly JiraKanbanColumnData[]) => {
		const storyColumn = getJiraAgentsStoryColumn(nextColumns);
		const nextChapter = storyColumn
			? getJiraAgentsStoryChapterForStatus(storyColumn)
			: null;
		const resolvedChapter = nextChapter ?? chapter;

		setBoardColumns(createJiraAgentsBoardColumns(resolvedChapter, nextColumns));
		if (nextChapter && nextChapter !== chapter) {
			setChapter(nextChapter);
			setLaunchId((current) => current + 1);
		}
	}, [chapter]);

	const initialState = useMemo(() => createJiraAgentsStoryState(chapter), [chapter]);
	const sections = useMemo(() => createJiraAgentsWorkspaceSections(chapter), [chapter]);
	const workItem = useMemo(() => createJiraAgentsStoryWorkItem(chapter), [chapter]);

	return {
		boardColumns,
		chapter,
		initialState,
		launchId,
		sections,
		selectChapter,
		updateBoardColumns,
		workItem,
	};
}
