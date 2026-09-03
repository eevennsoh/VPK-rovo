"use client";

import { useCallback, useRef, useState } from "react";

import { RovoChatProvider } from "@/app/contexts/context-rovo-chat";
import type { AgentSessionItem } from "@/components/blocks/agent-session";
import type {
	JiraIssueAgentActivity,
	JiraIssueCompletedAgentRun,
} from "@/components/blocks/jira-issue";
import { toJiraIssueDemoAttachedActivity } from "@/components/blocks/jira-issue/agent-session-demo-attach";
import type { JiraIssueAgentSessionRef } from "@/components/blocks/jira-issue/agent-session-transfer";
import type { JiraKanbanCardData, JiraKanbanColumnData } from "@/components/blocks/jira-kanban";
import ExperimentalJiraKanbanPage from "@/components/blocks/jira-kanban/experimental/page";
import { isPulseAgentSession, type PulseLooseWork } from "@/components/blocks/jira-kanban/experimental/pulse/types";
import { linkJiraKanbanAgentSession, moveJiraKanbanAgentSession, unlinkJiraKanbanAgentSession } from "@/components/blocks/jira-kanban/state";
import { JiraList, type JiraListAssignedAgent } from "@/components/blocks/jira-list";
import { useDesignVariants } from "@/components/hooks/use-design-variants";
import { useDesignVariation } from "@/components/hooks/use-design-variation";
import { JgpRovoOverlay } from "@/components/projects/jira-golden-journeys-v1/components/jira-golden-journeys-v1-rovo-overlay";
import { JGP_CHAT_AGENT_PROFILES } from "@/components/projects/jira-golden-journeys-v1/data/agent-chat-data";
import { useJgpAgentChatDemo } from "@/components/projects/jira-golden-journeys-v1/hooks/use-jira-golden-journeys-v1-agent-chat-demo";
import { JiraViewTabs } from "@/components/projects/jira/components/jira-header";
import {
	DEFAULT_JIRA_WORK_ITEM_VIEW,
	DEFAULT_JIRA_WORK_ITEMS_TAB_LABEL,
	type JiraWorkItemView,
} from "@/components/projects/jira/data/tabs";
import { useJiraTabs } from "@/components/projects/jira/hooks/use-jira-tabs";
import { resolveJiraTab } from "@/components/projects/jira/lib/jira-tab-model";
import AppLayout from "@/components/projects/page";

import { getJiraGoldenJourneysV4AgentActivityIndicator } from "./data/agent-activity-indicators";
import {
	createJiraGoldenJourneysV4PayBoardColumns,
	toJiraGoldenJourneysV4DetachedAgentSession,
	JIRA_GOLDEN_JOURNEYS_V4_PAY_BOARD_AGENTS,
	JIRA_GOLDEN_JOURNEYS_V4_PAY_HEADER_ASSIGNEES,
	JIRA_GOLDEN_JOURNEYS_V4_PAY_SESSION_MEMBER_ID_BY_ASSIGNEE_ID,
} from "./data/presentation-story";
import { useJiraGoldenJourneysV4List } from "./hooks/use-jira-golden-journeys-v4-list";

export default function JiraGoldenJourneysV4Page(): React.ReactElement {
	return (
		<RovoChatProvider agentProfiles={JGP_CHAT_AGENT_PROFILES}>
			<JiraGoldenJourneysV4App />
		</RovoChatProvider>
	);
}

function JiraGoldenJourneysV4App(): React.ReactElement {
	const { chatContextBar, externalThinkingMessageId, openAgentChat } = useJgpAgentChatDemo();
	const [boardColumns, setBoardColumns] = useState(createJiraGoldenJourneysV4PayBoardColumns);
	const [detachedAgentSessionsByCard, setDetachedAgentSessionsByCard] = useState<
		Readonly<Record<string, readonly AgentSessionItem[]>>
	>({});
	const detachedActivitiesByIdRef = useRef<Record<string, JiraIssueAgentActivity>>({});
	// Team EU splits work items into Board and List tabs, so the tab bar owns the
	// view and the board header's own switcher stands down. 2000 years later
	// collapses them into one Work items tab and the switcher owns it instead.
	// Both write the same state, so the choice survives flipping variations.
	const tabs = useJiraTabs();
	// The one place the global variant store meets the board. Panel is on by
	// default, so untracked work starts in the floating side surface the list
	// view gets too; off, it stays the in-flow column.
	const { designVariants } = useDesignVariants();
	// Chin-row status glyphs are a variation choice too: Team EU keeps the stock
	// spinner (question circle while an agent waits on an answer), 2000 years
	// later runs the pixel loader.
	const { designVariation } = useDesignVariation();
	const renderAgentActivityIndicator = getJiraGoldenJourneysV4AgentActivityIndicator(designVariation);
	// Team EU is "what ships today": status columns only show sessions attached
	// to a work item. Untracked Pulse rows stay in the dedicated Untracked
	// surface. 2000 years later keeps proximity rows beside the related cards.
	const showUntrackedProximity = designVariation !== "team-eu";
	// Chin rows follow the same variation split. Team EU groups every active
	// agent into one merged row (hover opens assignment). 2000 years later
	// keeps a row per agent so the split exploration stays intact.
	const agentActivityLayout = designVariation === "team-eu" ? "merged" : "split";
	const [workItemView, setWorkItemView] = useState<JiraWorkItemView>(DEFAULT_JIRA_WORK_ITEM_VIEW);
	const [selectedTabLabel, setSelectedTabLabel] = useState(DEFAULT_JIRA_WORK_ITEMS_TAB_LABEL);
	const activeTab = resolveJiraTab(tabs, selectedTabLabel, workItemView);
	const tabOwnsView = activeTab?.view !== undefined;
	const activeView = activeTab?.view ?? workItemView;
	const handleTabChange = useCallback((tabLabel: string) => {
		setSelectedTabLabel(tabLabel);
		const tabView = tabs.find((tab) => tab.label === tabLabel)?.view;
		if (tabView) {
			setWorkItemView(tabView);
		}
	}, [tabs]);
	const [resumeAnnouncement, setResumeAnnouncement] = useState("");
	// Untracked work offers Resume on the rows running on the viewer's own
	// device; that gate is the board's default, so this route only supplies the
	// behavior. The card owns the clipboard copy and its own "Copied" label, so
	// the announcement here is the only thing a screen reader hears.
	const handleResumeLooseWork = useCallback((item: PulseLooseWork) => {
		if (!isPulseAgentSession(item)) return;
		setResumeAnnouncement(
			`Resume command copied for ${item.title}. Paste it in a terminal on ${item.machineName} to continue the session.`,
		);
	}, []);
	const handleViewChat = useCallback((activity: JiraIssueAgentActivity, card: JiraKanbanCardData) => {
		openAgentChat({
			agentId: activity.id,
			agentName: activity.name,
			issueKey: card.code,
			issueSummary: card.title,
			intro: activity.message,
			question: activity.question,
		});
	}, [openAgentChat]);
	const handleViewCompletedRun = useCallback((run: JiraIssueCompletedAgentRun) => {
		openAgentChat({
			agentId: run.agentName.toLowerCase().replace(/\s+/g, "-"),
			agentName: run.agentName,
			issueKey: run.issueKey,
			issueSummary: run.issueSummary,
			intro: run.description,
		});
	}, [openAgentChat]);
	const handleListAssignedAgentSelect = useCallback((
		issueKey: string,
		agent: JiraListAssignedAgent,
	) => {
		const card = boardColumns
			.flatMap((column) => column.cards)
			.find((candidate) => candidate.code === issueKey);
		if (!card) {
			openAgentChat({
				agentId: agent.id,
				agentName: agent.name,
				issueKey,
				issueSummary: "",
			});
			return;
		}

		const activity = card.agentActivities?.find((candidate) => (
			candidate.id === agent.id
			|| candidate.id.endsWith(`:${agent.id}`)
			|| candidate.name === agent.name
		));
		if (activity) {
			handleViewChat(activity, card);
			return;
		}

		const run = card.agentDoneRuns?.find((candidate) => (
			candidate.id === agent.id
			|| candidate.agentName === agent.name
		));
		if (run) {
			handleViewCompletedRun(run);
			return;
		}

		openAgentChat({
			agentId: agent.id,
			agentName: agent.name,
			issueKey: card.code,
			issueSummary: card.title,
		});
	}, [boardColumns, handleViewChat, handleViewCompletedRun, openAgentChat]);
	const { getProps: getListProps } = useJiraGoldenJourneysV4List({
		boardColumns,
		onAssignedAgentSelect: handleListAssignedAgentSelect,
		setBoardColumns,
	});
	// Unlink always lands in `detachedAgentSessionsByCard`. The Untracked list
	// reads that map, so the session reappears there immediately. Team EU keeps
	// `showUntrackedProximity` off, so it never parks beside the card.
	const handleAgentSessionUnlink = useCallback((session: { id: string }, card: JiraKanbanCardData) => {
		const activity = card.agentActivities?.find((candidate) => candidate.id === session.id);
		if (!activity) return;
		const detachedSession = toJiraGoldenJourneysV4DetachedAgentSession(activity, card);
		detachedActivitiesByIdRef.current = {
			...detachedActivitiesByIdRef.current,
			[activity.id]: activity,
		};
		setDetachedAgentSessionsByCard((current) => {
			const currentSessions = current[card.code] ?? [];
			return currentSessions.some((candidate) => candidate.id === detachedSession.id)
				? current
				: { ...current, [card.code]: [...currentSessions, detachedSession] };
		});
		setBoardColumns((columns) => unlinkJiraKanbanAgentSession(columns, card.code, session.id));
	}, []);
	const handleAgentSessionLink = useCallback((session: AgentSessionItem, card: JiraKanbanCardData) => {
		const activity = detachedActivitiesByIdRef.current[session.id]
			?? toJiraIssueDemoAttachedActivity(session);
		if (session.id in detachedActivitiesByIdRef.current) {
			const rest = { ...detachedActivitiesByIdRef.current };
			delete rest[session.id];
			detachedActivitiesByIdRef.current = rest;
		}
		setDetachedAgentSessionsByCard((current) => {
			let changed = false;
			const next: Record<string, readonly AgentSessionItem[]> = {};
			for (const [cardCode, sessions] of Object.entries(current)) {
				const nextSessions = sessions.filter((candidate) => candidate.id !== session.id);
				if (nextSessions.length !== sessions.length) {
					changed = true;
				}
				if (nextSessions.length > 0) {
					next[cardCode] = nextSessions;
				}
			}
			return changed ? next : current;
		});
		setBoardColumns((columns) => linkJiraKanbanAgentSession(columns, card.code, activity));
	}, []);
	const handleAgentSessionMove = useCallback((
		session: JiraIssueAgentSessionRef,
		sourceCard: JiraKanbanCardData,
		targetCard: JiraKanbanCardData,
	) => {
		setBoardColumns((columns) => moveJiraKanbanAgentSession(
			columns,
			sourceCard.code,
			targetCard.code,
			session.id,
		));
	}, []);

	return (
		<>
			<AppLayout
				chatContextBar={chatContextBar}
				chatPanelFlush
				defaultSidebarOpen={false}
				hideFloatingRovo
				product="jira"
			>
				<div className="h-full min-h-0 min-w-0 overflow-hidden bg-surface [&>div]:min-h-0">
					<ExperimentalJiraKanbanPage
						activeView={activeView}
						agentActivityLayout={agentActivityLayout}
						cardGenerativeActionPresentation="more-actions"
						agentSessionAssigneeIdAliases={JIRA_GOLDEN_JOURNEYS_V4_PAY_SESSION_MEMBER_ID_BY_ASSIGNEE_ID}
						agentSessionPresentation={designVariants.panel ? "panel" : "column"}
						agents={JIRA_GOLDEN_JOURNEYS_V4_PAY_BOARD_AGENTS}
						ariaLabel="Track the Payments SDK v2 migration. Scroll horizontally to review all delivery statuses."
						boardColumns={boardColumns}
						defaultAgentSessionColumnCollapsed
						defaultShowUntracked={showUntrackedProximity}
						detachedAgentSessionsByCard={detachedAgentSessionsByCard}
						headerAssignees={JIRA_GOLDEN_JOURNEYS_V4_PAY_HEADER_ASSIGNEES}
						insightsEnabled={false}
						onBoardColumnsChange={(columns: readonly JiraKanbanColumnData[]) => {
							setBoardColumns([...columns]);
						}}
						onCardAgentActivityViewChat={handleViewChat}
						onCardAgentDoneRunView={handleViewCompletedRun}
						onCardAgentSessionLink={handleAgentSessionLink}
						onCardAgentSessionMove={handleAgentSessionMove}
						onCardAgentSessionUnlink={handleAgentSessionUnlink}
						showAgentSessionUnlinkWell={designVariation !== "team-eu"}
						onResumeLooseWork={handleResumeLooseWork}
						onViewChange={tabOwnsView ? undefined : setWorkItemView}
						renderListContent={(columns) => {
							const listProps = getListProps(columns);
							return (
								<div className="min-h-0 flex-1 overflow-hidden p-4 md:p-5">
									<JiraList {...listProps} />
								</div>
							);
						}}
						renderAgentActivityIndicator={renderAgentActivityIndicator}
						showAgentSessionColumn
						showBoardContent={activeTab?.hasContent === true}
						viewTabs={(
							<JiraViewTabs
								selectedTabLabel={selectedTabLabel}
								onTabChange={handleTabChange}
								workItemView={workItemView}
							/>
						)}
					/>
				</div>
			</AppLayout>
			{/* Resume swaps the button label to "Copied" — colour and text alone,
			    which a screen reader on the row never hears. Announce it instead. */}
			<span aria-live="polite" className="sr-only" role="status">
				{resumeAnnouncement}
			</span>
			<JgpRovoOverlay
				chatContextBar={chatContextBar}
				externalThinkingMessageId={externalThinkingMessageId}
			/>
		</>
	);
}
