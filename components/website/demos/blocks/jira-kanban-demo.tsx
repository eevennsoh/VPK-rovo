"use client";

import { useState } from "react";

import type { JiraKanbanColumnData } from "@/components/blocks/jira-kanban";
import Page from "@/components/blocks/jira-kanban/page";
import ExperimentalPage from "@/components/blocks/jira-kanban/experimental/page";
import ExperimentalV2Page from "@/components/blocks/jira-kanban/experimental-v2/page";
import { JiraList, type JiraListRowData } from "@/components/blocks/jira-list";
import {
	createJiraGoldenJourneysV4PayBoardColumns,
	JIRA_GOLDEN_JOURNEYS_V4_PAY_BOARD_AGENTS,
	JIRA_GOLDEN_JOURNEYS_V4_PAY_HEADER_ASSIGNEES,
	JIRA_GOLDEN_JOURNEYS_V4_PAY_SESSION_MEMBER_ID_BY_ASSIGNEE_ID,
} from "@/components/projects/jira-golden-journeys-v4/data/presentation-story";

const STATUS_VARIANTS: Readonly<Record<string, JiraListRowData["statusVariant"]>> = {
	"To do": "neutral",
	"In progress": "information",
	"In review": "warning",
	Done: "success",
};

function createListRows(columns: readonly JiraKanbanColumnData[]): JiraListRowData[] {
	return columns.flatMap((column) => column.cards.map((card) => ({
		issueKey: card.code,
		summary: card.title,
		issueType: "task",
		priority: card.priority,
		status: column.title,
		statusVariant: STATUS_VARIANTS[column.title],
		assignee: card.assignee,
		agentSessions: [
			...(card.agentActivities?.map((activity) => activity.name) ?? []),
			...(card.agentDoneRuns?.map((run) => run.agentName) ?? []),
		],
		labels: card.tags,
		contributors: card.assignee ? [card.assignee] : [],
	})));
}

export default function JiraKanbanDemo() {
	return <Page />;
}

export function JiraKanbanDemoStandard() {
	return <Page />;
}

export function JiraKanbanDemoExperimental() {
	return <ExperimentalPage />;
}

export function JiraKanbanDemoExperimentalV2() {
	const [activeView, setActiveView] = useState<"board" | "list">("board");
	const [boardColumns, setBoardColumns] = useState(createJiraGoldenJourneysV4PayBoardColumns);

	return (
		<ExperimentalV2Page
			activeView={activeView}
			agentActivityLayout="split"
			agentSessionAssigneeIdAliases={JIRA_GOLDEN_JOURNEYS_V4_PAY_SESSION_MEMBER_ID_BY_ASSIGNEE_ID}
			agents={JIRA_GOLDEN_JOURNEYS_V4_PAY_BOARD_AGENTS}
			ariaLabel="Track the Payments SDK v2 migration. Scroll horizontally to review all delivery statuses."
			boardColumns={boardColumns}
			headerAssignees={JIRA_GOLDEN_JOURNEYS_V4_PAY_HEADER_ASSIGNEES}
			insightsEnabled={false}
			onBoardColumnsChange={(columns) => setBoardColumns([...columns])}
			onViewChange={setActiveView}
			renderListContent={(columns) => {
				const listRows = createListRows(columns);
				return (
					<div className="min-h-0 flex-1 overflow-auto p-4 md:p-5">
						<JiraList
							ariaLabel="Payments SDK v2 migration work items list"
							className="h-full max-h-none"
							rows={listRows}
							totalCountLabel={`${listRows.length}`}
							visibleCount={listRows.length}
						/>
					</div>
				);
			}}
			showAgentSessionColumn
		/>
	);
}
