"use client";

import type { DragEventHandler, MouseEvent } from "react";

import { AgentSession, type AgentSessionItem } from "@/components/blocks/agent-session";
import {
	JiraIssue,
	type JiraIssueAgentActivityLayout,
	type JiraIssueGenerativeActionConfig,
	type JiraIssueGenerativeActionPresentation,
} from "@/components/blocks/jira-issue";
import {
	JIRA_ISSUE_SESSION_TRANSFER_GROUP_CLASS,
	type JiraIssueAgentSessionRef,
} from "@/components/blocks/jira-issue/agent-session-transfer";
import type {
	JiraKanbanCardData,
	JiraKanbanProps,
} from "../index";

interface ExperimentalJiraKanbanCardProps {
	active: boolean;
	agentActivityLayout: JiraIssueAgentActivityLayout;
	card: JiraKanbanCardData;
	columnTitle: string;
	detachedAgentSessions: readonly AgentSessionItem[];
	dragging: boolean;
	generativeActionAgents: JiraIssueGenerativeActionConfig["agents"];
	generativeActionPresentation: JiraIssueGenerativeActionPresentation;
	generativeActionSkills: JiraIssueGenerativeActionConfig["skills"];
	onAgentActivityOpenChange?: JiraKanbanProps["onCardAgentActivityOpenChange"];
	onAgentActivityViewChat?: JiraKanbanProps["onCardAgentActivityViewChat"];
	onAgentDoneRunReview?: JiraKanbanProps["onCardAgentDoneRunReview"];
	onAgentDoneRunView?: JiraKanbanProps["onCardAgentDoneRunView"];
	onClick: (event: MouseEvent<HTMLButtonElement>) => void;
	onDragEnd: DragEventHandler<HTMLButtonElement>;
	onDragStart: DragEventHandler<HTMLButtonElement>;
	onGenerativeActionSubmit?: JiraKanbanProps["onCardGenerativeActionSubmit"];
	onSessionLink?: (
		session: AgentSessionItem,
		card: JiraKanbanCardData,
		columnTitle: string,
	) => void;
	onSessionUnlink?: (
		session: JiraIssueAgentSessionRef,
		card: JiraKanbanCardData,
		columnTitle: string,
	) => void;
	selected: boolean;
}

function getCardAssigneeAvatarShape(card: JiraKanbanCardData) {
	if (card.avatarShape) {
		return card.avatarShape;
	}
	return card.avatarSrc?.startsWith("/avatar-agent/") ? "hexagon" as const : undefined;
}

export function ExperimentalJiraKanbanCard({
	active,
	agentActivityLayout,
	card,
	columnTitle,
	detachedAgentSessions,
	dragging,
	generativeActionAgents,
	generativeActionPresentation,
	generativeActionSkills,
	onAgentActivityOpenChange,
	onAgentActivityViewChat,
	onAgentDoneRunReview,
	onAgentDoneRunView,
	onClick,
	onDragEnd,
	onDragStart,
	onGenerativeActionSubmit,
	onSessionLink,
	onSessionUnlink,
	selected,
}: Readonly<ExperimentalJiraKanbanCardProps>) {
	const firstActiveAgentSession = card.agentActivities?.find(
		(activity) => activity.state !== "completed",
	);
	const canUnlinkAgentSession = Boolean(onSessionUnlink && firstActiveAgentSession);
	const canLinkAgentSession = Boolean(onSessionLink && detachedAgentSessions.length > 0);
	const canTransferAgentSession = canUnlinkAgentSession || canLinkAgentSession;

	function handleSessionLink(sessionId?: string) {
		const item = detachedAgentSessions.find((candidate) => candidate.id === sessionId);
		if (item) {
			onSessionLink?.(item, card, columnTitle);
		}
	}

	return (
		<JiraIssue
			active={active}
			agentActivities={card.agentActivities}
			agentActivityLayout={agentActivityLayout}
			agentActivityMode={card.agentActivityMode}
			agentDoneRuns={card.agentDoneRuns}
			agentSessionTransfer={canTransferAgentSession ? {
				onLink: canLinkAgentSession
					? (session) => handleSessionLink(session?.id)
					: undefined,
				onUnlink: canUnlinkAgentSession
					? (session) => {
						const resolvedSession = session ?? firstActiveAgentSession;
						if (resolvedSession) {
							onSessionUnlink?.(resolvedSession, card, columnTitle);
						}
					}
					: undefined,
			} : undefined}
			assigneeAvatarLabel={card.assignee?.name}
			assigneeAvatarShape={getCardAssigneeAvatarShape(card)}
			assigneeAvatarSrc={card.avatarSrc}
			assigneePulse={card.avatarPulse}
			assigneeUnassignedKind={card.avatarUnassignedKind}
			chrome="stroke"
			className={canTransferAgentSession ? JIRA_ISSUE_SESSION_TRANSFER_GROUP_CLASS : undefined}
			dragging={dragging}
			generativeAction={{
				agents: generativeActionAgents,
				onSubmit: (request) => {
					void onGenerativeActionSubmit?.(request, card, columnTitle);
				},
				skills: generativeActionSkills,
			}}
			generativeActionPresentation={generativeActionPresentation}
			issueKey={card.code}
			onAgentActivityOpenChange={onAgentActivityOpenChange
				? (open) => onAgentActivityOpenChange(open, card, columnTitle)
				: undefined}
			onAgentActivityViewChat={onAgentActivityViewChat
				? (activity) => onAgentActivityViewChat(activity, card, columnTitle)
				: undefined}
			onAgentDoneRunReview={onAgentDoneRunReview
				? (run) => onAgentDoneRunReview(run, card, columnTitle)
				: undefined}
			onAgentDoneRunView={onAgentDoneRunView
				? (run) => onAgentDoneRunView(run, card, columnTitle)
				: undefined}
			onClick={onClick}
			onDragEnd={onDragEnd}
			onDragStart={onDragStart}
			priority={card.priority}
			pullRequestNumber={card.pullRequestNumber}
			pullRequestPreview={card.pullRequestPreview}
			pullRequestStatus={card.pullRequestStatus}
			selected={selected}
			sessionTransferAfter={canLinkAgentSession
				? (sessionDrag) => (
					<AgentSession
						items={detachedAgentSessions}
						onLinkWorkItem={(item) => onSessionLink?.(item, card, columnTitle)}
						sessionDrag={sessionDrag}
						variant="medium-detached"
					/>
				)
				: undefined}
			summary={card.title}
			tags={card.tags}
		/>
	);
}
