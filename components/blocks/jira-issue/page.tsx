"use client";

import { useCallback, useState } from "react";
import { AnimatePresence } from "motion/react";

import { RovoChatProvider, useRovoChat } from "@/app/contexts";
import { JiraEpic } from "@/components/blocks/jira-epic";
import { JIRA_EPIC_DEMO_EPICS } from "@/components/blocks/jira-epic/data/demo-epics";
import {
	JiraIssue,
	type JiraIssueAgentActivity,
	type JiraIssueCompletedAgentRun,
	type JiraIssueGenerativeActionRequest,
} from "@/components/blocks/jira-issue";
import { QUESTION_CARD_SINGLE_SELECT_DEMO } from "@/components/blocks/question-card/data/questions";
import RovoFloatingChat from "@/components/projects/rovo-floating-chat/components/rovo-floating-chat";
import FloatingRovoButton from "@/components/projects/shared/components/floating-rovo-button";
import { Button } from "@/components/ui/button";
import { getDeterministicAgentAvatarSrc } from "@/lib/agent-avatars";

const JIRA_ISSUE_DEMO_TAGS = [
	{ text: "Acmecorp", color: "discovery" },
	{ text: "qualification", color: "blue" },
	{ text: "enterprise", color: "discovery" },
] as const;

const JIRA_ISSUE_DEMO_SUBTASKS = [
	{
		summary: "Review Venn's test design pattern proposal",
		issueKey: "JDSN-230",
		status: "To Do",
		assigneeUnassignedKind: "person",
	},
] as const;

const SERVICE_IMPACT_AGENT_LABELS = [
	"Figuring out which services are affected",
	"Reading linked design notes",
	"Checking release ownership",
	"Mapping customer-facing impact",
	"Drafting the service impact summary",
] as const;

const DEPENDENCY_MAPPER_LABELS = [
	"Checking dependent components",
	"Following linked work items",
	"Comparing API usage",
	"Finding blocked handoffs",
	"Updating dependency notes",
] as const;

const JIRA_ISSUE_AGENT_ACTIVITIES = [
	{
		id: "service-impact-agent",
		name: "Service impact agent",
		avatarSrc: getDeterministicAgentAvatarSrc("service-impact-agent"),
		label: "Figuring out which services are affected",
		labels: SERVICE_IMPACT_AGENT_LABELS,
		cycleIntervalMs: 5200,
		cycleIntervalJitterMs: 1600,
		state: "working",
	},
	{
		id: "dependency-mapper",
		name: "Dependency mapper",
		avatarSrc: getDeterministicAgentAvatarSrc("dependency-mapper"),
		label: "Checking dependent components",
		labels: DEPENDENCY_MAPPER_LABELS,
		cycleIntervalMs: 6800,
		cycleIntervalJitterMs: 2200,
		state: "working",
	},
] as const satisfies readonly JiraIssueAgentActivity[];

const JIRA_ISSUE_AWAITING_INPUT_QUESTION = {
	...QUESTION_CARD_SINGLE_SELECT_DEMO[0],
	options: QUESTION_CARD_SINGLE_SELECT_DEMO[0].options.slice(0, 2),
};

const JIRA_ISSUE_AWAITING_INPUT_ACTIVITIES = [
	{
		...JIRA_ISSUE_AGENT_ACTIVITIES[0],
		label: "Awaiting user input",
		question: JIRA_ISSUE_AWAITING_INPUT_QUESTION,
		state: "awaiting-input",
	},
	JIRA_ISSUE_AGENT_ACTIVITIES[1],
] as const satisfies readonly JiraIssueAgentActivity[];

const JIRA_ISSUE_COMPLETED_AGENT_RUNS = [
	{
		id: "PD-40:service-impact-agent",
		summary: "Mapped affected services and added the implementation impact summary.",
		agentName: JIRA_ISSUE_AGENT_ACTIVITIES[0].name,
		agentAvatarSrc: JIRA_ISSUE_AGENT_ACTIVITIES[0].avatarSrc,
		issueKey: "PD-40",
		issueSummary: "Implement advanced date-range filter",
		relativeTime: "Just now",
	},
	{
		id: "PD-40:dependency-mapper",
		summary: "Documented dependent components, owners, and blocked handoffs.",
		agentName: JIRA_ISSUE_AGENT_ACTIVITIES[1].name,
		agentAvatarSrc: JIRA_ISSUE_AGENT_ACTIVITIES[1].avatarSrc,
		issueKey: "PD-40",
		issueSummary: "Implement advanced date-range filter",
		relativeTime: "1 min ago",
	},
] as const satisfies readonly JiraIssueCompletedAgentRun[];

type JiraIssueAgentActivityDemoState =
	| "default"
	| "single-agent-working"
	| "multiple-agents-working"
	| "awaiting-user-input"
	| "agent-completed-work";

const JIRA_ISSUE_AGENT_ACTIVITY_DEMO_STATES = [
	{ value: "default", label: "Default" },
	{ value: "single-agent-working", label: "1 agent" },
	{ value: "multiple-agents-working", label: "1-n agents" },
	{ value: "awaiting-user-input", label: "Needs input" },
	{ value: "agent-completed-work", label: "Done" },
] as const satisfies readonly { value: JiraIssueAgentActivityDemoState; label: string }[];

interface JiraIssuePageProps {
	variant?: "default" | "subtasks-collapsed" | "subtasks-expanded" | "parent-epic" | "agent-activity-states";
}

export default function JiraIssuePage({ variant = "default" }: Readonly<JiraIssuePageProps> = {}): React.ReactElement {
	const [selectedEpicId, setSelectedEpicId] = useState("agentic-jira");
	const isSubtasksVariant = variant === "subtasks-collapsed" || variant === "subtasks-expanded";
	const isParentEpicVariant = variant === "parent-epic";
	const isAgentActivityVariant = variant === "agent-activity-states";
	const hasCompactIssueContext = isSubtasksVariant || isParentEpicVariant;
	const issueKey = isParentEpicVariant ? "JDSN-157" : isSubtasksVariant ? "JDSN-229" : "RFP-101";
	const summary = isParentEpicVariant
		? "Next best action"
		: isSubtasksVariant
			? "Venn's test"
			: "Acmecorp: Prepare for bid recommendation for ESM RFP";

	if (isAgentActivityVariant) {
		return (
			<RovoChatProvider>
				<JiraIssueAgentActivityStatesDemo />
			</RovoChatProvider>
		);
	}

	return (
		<div className="flex h-full min-h-[360px] w-full items-center justify-center bg-surface p-6">
			<JiraIssue
				assigneeAvatarSrc="/avatar-user/andrea-wilson/color/asow-service-yellow.png"
				assigneeUnassignedKind={hasCompactIssueContext ? "person" : undefined}
				className="w-[320px]"
				defaultSubtasksExpanded={variant === "subtasks-expanded"}
				issueKey={issueKey}
				parentEpicControl={
					isParentEpicVariant ? (
						<JiraEpic
							epics={JIRA_EPIC_DEMO_EPICS}
							onAddParent={() => undefined}
							onEpicSelect={setSelectedEpicId}
							onRemoveParent={() => undefined}
							onViewParent={() => undefined}
							selectedEpicId={selectedEpicId}
							showLabel={false}
						/>
					) : undefined
				}
				priority="major"
				showAutomationIndicator={isSubtasksVariant}
				showPriorityIndicator={!isParentEpicVariant}
				subtasks={hasCompactIssueContext ? JIRA_ISSUE_DEMO_SUBTASKS : undefined}
				subtasksCompleted={0}
				summary={summary}
				tags={hasCompactIssueContext ? undefined : JIRA_ISSUE_DEMO_TAGS}
			/>
		</div>
	);
}

function JiraIssueAgentActivityStatesDemo(): React.ReactElement {
	const [agentActivityState, setAgentActivityState] = useState<JiraIssueAgentActivityDemoState>("default");
	const { chatSurface, openChat, sendPrompt } = useRovoChat();
	const agentActivities = agentActivityState === "single-agent-working"
		? JIRA_ISSUE_AGENT_ACTIVITIES.slice(0, 1)
		: agentActivityState === "multiple-agents-working"
			? JIRA_ISSUE_AGENT_ACTIVITIES.slice(0, 2)
			: agentActivityState === "awaiting-user-input"
				? JIRA_ISSUE_AWAITING_INPUT_ACTIVITIES
				: undefined;
	const handleAgentActivityViewChat = useCallback(() => {
		openChat("floating");
	}, [openChat]);
	const handleAgentActivityQuestionSubmit = useCallback(() => {
		openChat("floating");
	}, [openChat]);
	const handleGenerativeActionSubmit = useCallback((request: JiraIssueGenerativeActionRequest) => {
		openChat("floating");
		void sendPrompt(request.prompt, {
			messageMetadata: {
				source: "jira-issue-generative-action",
			},
		});
	}, [openChat, sendPrompt]);

	return (
		<div className="relative flex h-full min-h-[480px] w-full flex-col bg-surface">
			<div className="sticky top-0 z-10 w-full bg-surface pb-4 pt-6">
				<div className="flex w-full flex-nowrap items-center justify-center gap-2">
					{JIRA_ISSUE_AGENT_ACTIVITY_DEMO_STATES.map((state) => (
						<Button
							key={state.value}
							aria-pressed={agentActivityState === state.value}
							onClick={() => setAgentActivityState(state.value)}
							size="compact"
							variant={agentActivityState === state.value ? "default" : "outline"}
						>
							{state.label}
						</Button>
					))}
				</div>
			</div>
			<div className="flex flex-1 items-start justify-center overflow-visible px-6 pb-10 pt-6">
				<JiraIssue
					agentActivities={agentActivities}
					agentActivityMode={
						agentActivityState === "single-agent-working" || agentActivityState === "multiple-agents-working"
							? "working"
							: agentActivityState === "awaiting-user-input"
								? "awaiting-input"
								: agentActivityState === "agent-completed-work"
									? "completed"
									: "none"
					}
					agentDoneRuns={agentActivityState === "agent-completed-work" ? JIRA_ISSUE_COMPLETED_AGENT_RUNS : undefined}
					assigneeAvatarSrc="/avatar-user/andrea-wilson/color/asow-service-yellow.png"
					className="w-[260px]"
					generativeAction={{
						onSubmit: handleGenerativeActionSubmit,
					}}
					issueKey="PD-40"
					onAgentActivityQuestionSubmit={handleAgentActivityQuestionSubmit}
					onAgentActivityViewChat={handleAgentActivityViewChat}
					priority="major"
					subtasks={JIRA_ISSUE_DEMO_SUBTASKS}
					subtasksCompleted={0}
					summary="Implement advanced date-range filter"
					tags={[{ text: "FE Development", color: "purple" }]}
				/>
			</div>
			{chatSurface === null ? (
				<FloatingRovoButton
					ariaLabel="Open Rovo chat"
					forceVisible
					placement={{ right: "24px", bottom: "24px" }}
					positioning="container"
					product="jira"
				/>
			) : null}
			<AnimatePresence>
				{chatSurface === "floating" ? (
					<RovoFloatingChat key="floating-chat" />
				) : null}
			</AnimatePresence>
		</div>
	);
}

export { JiraIssue } from "@/components/blocks/jira-issue";
export type {
	JiraIssueAgentActivity,
	JiraIssueAgentActivityMode,
	JiraIssueAgentActivityState,
	JiraIssuePriority,
	JiraIssueProps,
	JiraIssueSubtask,
	JiraIssueTag,
} from "@/components/blocks/jira-issue";
