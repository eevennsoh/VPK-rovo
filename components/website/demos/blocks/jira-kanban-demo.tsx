"use client";

import { useState } from "react";

import Page from "@/components/blocks/jira-kanban/page";
import ExperimentalPage from "@/components/blocks/jira-kanban/experimental/page";
import ExperimentalV2Page from "@/components/blocks/jira-kanban/experimental-v2/page";
import { JiraList } from "@/components/blocks/jira-list";
import {
	createJiraGoldenJourneysV4PayBoardColumns,
	JIRA_GOLDEN_JOURNEYS_V4_PAY_BOARD_AGENTS,
	JIRA_GOLDEN_JOURNEYS_V4_PAY_HEADER_ASSIGNEES,
	JIRA_GOLDEN_JOURNEYS_V4_PAY_SESSION_MEMBER_ID_BY_ASSIGNEE_ID,
} from "@/components/projects/jira-golden-journeys-v4/data/presentation-story";
import {
	applyAssignedAgentIdsToColumns,
	createListRows,
} from "@/components/projects/jira-golden-journeys-v4/lib/list-rows";

export default function JiraKanbanDemo() {
	return <Page />;
}

export function JiraKanbanDemoStandard() {
	return <Page />;
}

export function JiraKanbanDemoExperimental() {
	return <ExperimentalPage columnChrome="simple" />;
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
			columnChrome="simple"
			headerAssignees={JIRA_GOLDEN_JOURNEYS_V4_PAY_HEADER_ASSIGNEES}
			insightsEnabled={false}
			onBoardColumnsChange={(columns) => setBoardColumns([...columns])}
			onViewChange={setActiveView}
			renderListContent={(columns) => {
				const listRows = createListRows(columns, JIRA_GOLDEN_JOURNEYS_V4_PAY_BOARD_AGENTS);
				return (
					<div className="min-h-0 flex-1 overflow-auto p-4 md:p-5">
						<JiraList
							agentCatalog={JIRA_GOLDEN_JOURNEYS_V4_PAY_BOARD_AGENTS}
							ariaLabel="Payments SDK v2 migration work items list"
							className="max-h-full"
							onAssignedAgentIdsChange={(issueKey, agentIds) => {
								setBoardColumns((columns) => applyAssignedAgentIdsToColumns(
									columns,
									issueKey,
									agentIds,
									JIRA_GOLDEN_JOURNEYS_V4_PAY_BOARD_AGENTS,
								));
							}}
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
