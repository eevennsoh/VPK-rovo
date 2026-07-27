"use client";

import { useMemo, useState } from "react";

import { JiraKanbanBoardHeader } from "@/components/blocks/jira-kanban/board-header";
import JiraKanbanPage from "@/components/blocks/jira-kanban/page";
import type { JiraKanbanColumnData } from "@/components/blocks/jira-kanban";
import {
	filterJiraKanbanColumnsByAssignee,
	getJiraKanbanAssignees,
} from "@/components/blocks/jira-kanban/state";
import { JiraList } from "@/components/blocks/jira-list";
import { JIRA_DESIGN_PROJECT } from "@/components/blocks/product-sidebar/data/jira-navigation";
import { JiraForYouWorkspace } from "@/components/projects/jira-for-you/jira-for-you-workspace";
import { JiraForYouShell } from "@/components/projects/jira-for-you/page";
import type { JiraForYouItem } from "@/components/projects/jira-for-you/jira-for-you-types";
import {
	createJiraDesignListRows,
	JIRA_DESIGN_KANBAN_AGENTS,
	JIRA_DESIGN_KANBAN_COLUMNS,
	JIRA_DESIGN_WORK_ITEMS_BY_ID,
	JIRA_DESIGN_WORK_ITEMS_BY_KEY,
	JIRA_DESIGN_WORKSPACE_SECTIONS,
} from "../data/jira-design-work-items";
import { JiraDesignViewTabs, type JiraDesignView } from "./jira-design-view-tabs";

interface JiraShellStageProps {
	children?: React.ReactNode;
	defaultSelectedSidebarItem?: string;
	defaultSidebarOpen?: boolean;
}

export function JiraShellStage({
	children,
	defaultSelectedSidebarItem,
	defaultSidebarOpen,
}: Readonly<JiraShellStageProps>): React.ReactElement {
	return (
		<div className="relative left-1/2 h-full min-h-0 w-screen -translate-x-1/2 overflow-hidden">
			<JiraForYouShell
				defaultSelectedSidebarItem={defaultSelectedSidebarItem}
				defaultSidebarOpen={defaultSidebarOpen}
				shellHeight="parent"
				showConversationHeaderBorder={false}
			>
				{children ? (
					<div className="h-full min-h-0 min-w-0 flex-1 overflow-auto">
						{children}
					</div>
				) : undefined}
			</JiraForYouShell>
		</div>
	);
}

export function ForYouStage(): React.ReactElement {
	return <JiraShellStage />;
}

interface JiraDesignWorkspaceStageProps {
	view: JiraDesignView;
	onViewChange: (view: JiraDesignView) => void;
}

function JiraListFeed({
	activeIssueKey,
	boardColumns,
	compactHeader,
	onItemActivate,
	onViewChange,
}: Readonly<Pick<JiraDesignWorkspaceStageProps, "onViewChange"> & {
	activeIssueKey?: string;
	boardColumns: readonly JiraKanbanColumnData[];
	compactHeader: boolean;
	onItemActivate: (item: JiraForYouItem) => void;
}>): React.ReactElement {
	const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<Set<string>>(() => new Set());
	const assignees = useMemo(() => getJiraKanbanAssignees(boardColumns), [boardColumns]);
	const filteredBoardColumns = useMemo(
		() => filterJiraKanbanColumnsByAssignee(boardColumns, selectedAssigneeIds),
		[boardColumns, selectedAssigneeIds],
	);
	const rows = useMemo(() => createJiraDesignListRows(filteredBoardColumns), [filteredBoardColumns]);

	return (
		<div className="flex h-full min-h-0 flex-1 flex-col bg-surface">
			<JiraKanbanBoardHeader
				assignees={assignees}
				compact={compactHeader}
				onSelectedAssigneeIdsChange={setSelectedAssigneeIds}
				searchPlaceholder="Search list"
				selectedAssigneeIds={selectedAssigneeIds}
				surfaceLabel="list"
				viewTabs={<JiraDesignViewTabs activeView="list" onViewChange={onViewChange} />}
			/>
			<div className="min-h-0 flex-1 overflow-auto p-4 md:p-5">
				<JiraList
					activeIssueKey={activeIssueKey}
					ariaLabel="For you work items list"
					onIssueClick={(row) => {
						const item = JIRA_DESIGN_WORK_ITEMS_BY_KEY.get(row.issueKey);
						if (item) {
							onItemActivate(item);
						}
					}}
					rows={rows}
					totalCountLabel={`${rows.length}`}
					visibleCount={rows.length}
				/>
			</div>
		</div>
	);
}

export function JiraDesignWorkspaceStage({
	onViewChange,
	view,
}: Readonly<JiraDesignWorkspaceStageProps>): React.ReactElement {
	const [boardColumns, setBoardColumns] = useState(
		() => JIRA_DESIGN_KANBAN_COLUMNS.map((column) => ({
			...column,
			cards: [...column.cards],
		})),
	);

	return (
		<JiraShellStage
			defaultSelectedSidebarItem={JIRA_DESIGN_PROJECT.name}
			defaultSidebarOpen={false}
		>
			<JiraForYouWorkspace
				chrome="plain"
				className="h-full min-h-0 flex-1"
				defaultDetailPanelOpen
				defaultOpenItemId="vitafleet-presentation"
				feedResizeLabel="Resize Jira Design view panel"
				preserveChatWidthAcrossSidebar
				renderFeed={({ activeItemId, onItemActivate }) => (
					view === "board" ? (
						<JiraKanbanPage
							activeCardCode={activeItemId
								? JIRA_DESIGN_WORK_ITEMS_BY_ID.get(activeItemId)?.issueKey
								: undefined}
							agents={JIRA_DESIGN_KANBAN_AGENTS}
							ariaLabel="For you work items board. Scroll horizontally to review all statuses."
							boardColumns={boardColumns}
							compactHeader={Boolean(activeItemId)}
							onBoardColumnsChange={(columns) => setBoardColumns(columns.map((column) => ({
								...column,
								cards: [...column.cards],
							})))}
							onCardClick={(card) => {
								const item = JIRA_DESIGN_WORK_ITEMS_BY_KEY.get(card.code);
								if (item) {
									onItemActivate(item);
								}
							}}
							showScrollAffordance={false}
							viewTabs={<JiraDesignViewTabs activeView="board" onViewChange={onViewChange} />}
						/>
					) : (
						<JiraListFeed
							activeIssueKey={activeItemId
								? JIRA_DESIGN_WORK_ITEMS_BY_ID.get(activeItemId)?.issueKey
								: undefined}
							boardColumns={boardColumns}
							compactHeader={Boolean(activeItemId)}
							onItemActivate={onItemActivate}
							onViewChange={onViewChange}
						/>
					)
				)}
				sections={JIRA_DESIGN_WORKSPACE_SECTIONS}
				showConversationHeaderBorder={false}
			/>
		</JiraShellStage>
	);
}
