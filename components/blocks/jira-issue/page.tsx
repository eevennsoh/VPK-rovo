"use client";

import { useCallback, useState } from "react";

import { RovoChatProvider } from "@/app/contexts";
import { JiraEpic } from "@/components/blocks/jira-epic";
import { JIRA_EPIC_DEMO_EPICS } from "@/components/blocks/jira-epic/data/demo-epics";
import {
	JiraIssue,
	type JiraIssueAgentActivity,
	type JiraIssueChrome,
	type JiraIssueCompletedAgentRun,
	type JiraIssueGenerativeActionRequest,
} from "@/components/blocks/jira-issue";
import type { SmartLinkItem } from "@/components/blocks/smart-link";
import { QUESTION_CARD_SINGLE_SELECT_DEMO } from "@/components/blocks/question-card/data/questions";
import { ASX_CHAT_AGENT_PROFILES } from "@/components/projects/jira-golden-journeys-v0/data/agent-chat-data";
import { AsxRovoOverlay } from "@/components/projects/jira-golden-journeys-v0/components/jira-golden-journeys-v0-rovo-overlay";
import { useAsxAgentChatDemo } from "@/components/projects/jira-golden-journeys-v0/hooks/use-jira-golden-journeys-v0-agent-chat-demo";
import { Button } from "@/components/ui/button";
import { getDeterministicAgentAvatarSrc } from "@/lib/agent-avatars";

const JIRA_ISSUE_DEMO_TAGS = [
	{ text: "Acmecorp", color: "discovery" },
	{ text: "qualification", color: "blue" },
	{ text: "enterprise", color: "discovery" },
] as const;

const JIRA_ISSUE_UNCAPTURED_WORK_PARTICIPANTS = [
	{
		id: "andrea-wilson",
		name: "Andrea Wilson",
		avatarSrc: "/avatar-user/andrea-wilson/color/asow-service-yellow.png",
		avatarShape: "circle",
	},
	{
		id: "andrew-park",
		name: "Andrew Park",
		avatarSrc: "/avatar-user/andrew-park/color/asow-dev-lime.png",
		avatarShape: "circle",
	},
	{
		id: "priya-hansra",
		name: "Priya Hansra",
		avatarSrc: "/avatar-user/priya-hansra/color/asow-service-yellow.png",
		avatarShape: "circle",
	},
] as const;

const JIRA_ISSUE_UNCAPTURED_WORK_SOURCE_LINK = {
	id: "pay-101-adapter-session",
	href: "#lw-scope-thread",
	title: "Local · PAY-101",
	variant: "generic",
	provider: { name: "Claude", logo: { kind: "third-party", name: "claude" } },
	icon: { kind: "third-party", name: "claude" },
	description: "host local · worktree .worktrees/pay-101-adapter · the decision itself is not written down",
	avatars: JIRA_ISSUE_UNCAPTURED_WORK_PARTICIPANTS.map((participant) => ({
		name: participant.name,
		src: participant.avatarSrc,
	})),
} as const satisfies SmartLinkItem;

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
		label: "Needs input",
		question: JIRA_ISSUE_AWAITING_INPUT_QUESTION,
		state: "awaiting-input",
	},
	JIRA_ISSUE_AGENT_ACTIVITIES[1],
] as const satisfies readonly JiraIssueAgentActivity[];

const JIRA_ISSUE_COMPLETED_AGENT_RUNS = [
	{
		id: "PD-40:service-impact-agent",
		summary: "Map affected services and implementation impact",
		description: "Mapped affected services and added the implementation impact summary.",
		agentName: JIRA_ISSUE_AGENT_ACTIVITIES[0].name,
		agentAvatarSrc: JIRA_ISSUE_AGENT_ACTIVITIES[0].avatarSrc,
		issueKey: "PD-40",
		issueSummary: "Implement advanced date-range filter",
		completedSecondsAgo: 5 * 60,
		elapsedSeconds: 300,
		outputs: [
			{
				id: "service-impact-summary",
				title: "Service impact summary",
				source: "Jira work item",
				owner: "PD-40",
				iconName: "ai-chat",
			},
			{
				id: "implementation-notes",
				title: "Implementation notes",
				source: "Confluence page",
				owner: "Platform team",
				iconName: "globe",
			},
		],
		state: "done",
	},
	{
		id: "PD-40:dependency-mapper",
		summary: "Document dependent components and handoffs",
		description: "Documented dependent components, owners, and blocked handoffs.",
		agentName: JIRA_ISSUE_AGENT_ACTIVITIES[1].name,
		agentAvatarSrc: JIRA_ISSUE_AGENT_ACTIVITIES[1].avatarSrc,
		issueKey: "PD-40",
		issueSummary: "Implement advanced date-range filter",
		completedSecondsAgo: 68 * 60,
		elapsedSeconds: 64,
		state: "failed",
	},
] as const satisfies readonly JiraIssueCompletedAgentRun[];

type JiraIssueAgentActivityDemoState =
	| "default"
	| "single-agent-working"
	| "multiple-agents-working"
	| "awaiting-user-input"
	| "agent-completed-work"
	| "agent-dismissed-work";

const JIRA_ISSUE_AGENT_ACTIVITY_DEMO_STATES = [
	{ value: "default", label: "Default" },
	{ value: "single-agent-working", label: "1 agent" },
	{ value: "multiple-agents-working", label: "1-n agents" },
	{ value: "awaiting-user-input", label: "Needs input" },
	{ value: "agent-completed-work", label: "Review" },
	{ value: "agent-dismissed-work", label: "Done" },
] as const satisfies readonly { value: JiraIssueAgentActivityDemoState; label: string }[];

interface JiraIssuePageProps {
	variant?: "default" | "experimental" | "uncaptured-work" | "subtasks-collapsed" | "subtasks-expanded" | "parent-epic" | "agent-activity-states" | "agent-activity-states-experimental";
}

export default function JiraIssuePage({ variant = "default" }: Readonly<JiraIssuePageProps> = {}): React.ReactElement {
	const [selectedEpicId, setSelectedEpicId] = useState("agentic-jira");
	const [uncapturedWorkCaptured, setUncapturedWorkCaptured] = useState(false);
	const isExperimentalVariant = variant === "experimental";
	const isUncapturedWorkVariant = variant === "uncaptured-work";
	const isSubtasksVariant = variant === "subtasks-collapsed" || variant === "subtasks-expanded";
	const isParentEpicVariant = variant === "parent-epic";
	const isAgentActivityVariant = variant === "agent-activity-states" || variant === "agent-activity-states-experimental";
	const hasCompactIssueContext = isSubtasksVariant || isParentEpicVariant;
	const issueKey = isParentEpicVariant ? "JDSN-157" : isSubtasksVariant ? "JDSN-229" : "RFP-101";
	const summary = isParentEpicVariant
		? "Next best action"
		: isSubtasksVariant
			? "Venn's test"
			: "Acmecorp: Prepare for bid recommendation for ESM RFP";

	if (isAgentActivityVariant) {
		return (
			<RovoChatProvider agentProfiles={ASX_CHAT_AGENT_PROFILES}>
				<JiraIssueAgentActivityStatesDemo chrome={variant === "agent-activity-states-experimental" ? "stroke" : "raised"} />
			</RovoChatProvider>
		);
	}

	if (isUncapturedWorkVariant) {
		return (
			<div className="flex h-full min-h-[360px] w-full items-center justify-center bg-surface p-6">
				<JiraIssue
					captured={uncapturedWorkCaptured}
					className="w-[320px]"
					onCreateWorkItem={() => setUncapturedWorkCaptured(true)}
					onLinkWorkItem={() => setUncapturedWorkCaptured(true)}
					participants={JIRA_ISSUE_UNCAPTURED_WORK_PARTICIPANTS}
					sourceLink={JIRA_ISSUE_UNCAPTURED_WORK_SOURCE_LINK}
					summary="The adapter keep-or-delete argument still lives in a local Claude session"
					variant="uncaptured-work"
				/>
			</div>
		);
	}

	return (
		<div className="flex h-full min-h-[360px] w-full items-center justify-center bg-surface p-6">
			<JiraIssue
				assigneeAvatarSrc="/avatar-user/andrea-wilson/color/asow-service-yellow.png"
				assigneeUnassignedKind={hasCompactIssueContext ? "person" : undefined}
				chrome={isExperimentalVariant ? "stroke" : undefined}
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

const JIRA_ISSUE_CHAT_ISSUE_KEY = "PD-40";
const JIRA_ISSUE_CHAT_ISSUE_SUMMARY = "Implement advanced date-range filter";

interface JiraIssueAgentActivityStatesDemoProps {
	chrome?: JiraIssueChrome;
}

function JiraIssueAgentActivityStatesDemo({ chrome = "raised" }: Readonly<JiraIssueAgentActivityStatesDemoProps> = {}): React.ReactElement {
	const [agentActivityState, setAgentActivityState] = useState<JiraIssueAgentActivityDemoState>("default");
	// View chat / question submit / generative actions all drop into the shared
	// Rovo floating chat with the activity's agent already selected — matching the
	// ASX Kanban "View chat" behavior instead of a blank vanilla Rovo chat.
	const { chatContextBar, externalThinkingMessageId, openAgentChat } = useAsxAgentChatDemo();
	const [pendingChatQuestion, setPendingChatQuestion] = useState<Readonly<{ submit: () => void }> | null>(null);
	const agentActivities = agentActivityState === "single-agent-working"
		? JIRA_ISSUE_AGENT_ACTIVITIES.slice(0, 1)
		: agentActivityState === "multiple-agents-working"
			? JIRA_ISSUE_AGENT_ACTIVITIES.slice(0, 2)
			: agentActivityState === "awaiting-user-input"
				? JIRA_ISSUE_AWAITING_INPUT_ACTIVITIES
				: undefined;
	// Opens the floating chat for the activity's agent. When the activity is
	// awaiting input, the chat replays its question card; answering it there is
	// intercepted (via `pendingChatQuestion`) so the agent acknowledges and
	// continues, mirroring the ASX Kanban "View chat" flow.
	const openActivityChat = useCallback((activity: JiraIssueAgentActivity) => {
		setPendingChatQuestion(activity.question ? { submit: () => undefined } : null);
		openAgentChat({
			agentId: activity.id,
			agentName: activity.name,
			issueKey: JIRA_ISSUE_CHAT_ISSUE_KEY,
			issueSummary: JIRA_ISSUE_CHAT_ISSUE_SUMMARY,
			intro: activity.message,
			question: activity.question,
		});
	}, [openAgentChat]);
	const handleAgentActivityViewChat = openActivityChat;
	const handleAgentActivityQuestionSubmit = openActivityChat;
	const handleAgentDoneRunView = useCallback((run: JiraIssueCompletedAgentRun) => {
		setPendingChatQuestion(null);
		const agentId = run.id.includes(":") ? run.id.slice(run.id.indexOf(":") + 1) : run.id;
		openAgentChat({
			agentId,
			agentName: run.agentName,
			issueKey: run.issueKey,
			issueSummary: run.issueSummary,
			intro: run.description ?? run.summary,
		});
	}, [openAgentChat]);
	const handleAgentDoneRunSubmit = useCallback((run: JiraIssueCompletedAgentRun, prompt: string) => {
		setPendingChatQuestion(null);
		const agentId = run.id.includes(":") ? run.id.slice(run.id.indexOf(":") + 1) : run.id;
		openAgentChat({
			agentId,
			agentName: run.agentName,
			issueKey: run.issueKey,
			issueSummary: run.issueSummary,
			request: prompt,
		});
	}, [openAgentChat]);
	const handleGenerativeActionSubmit = useCallback((request: JiraIssueGenerativeActionRequest) => {
		setPendingChatQuestion(null);
		openAgentChat({
			agentId: JIRA_ISSUE_AGENT_ACTIVITIES[0].id,
			agentName: JIRA_ISSUE_AGENT_ACTIVITIES[0].name,
			issueKey: JIRA_ISSUE_CHAT_ISSUE_KEY,
			issueSummary: JIRA_ISSUE_CHAT_ISSUE_SUMMARY,
			request: request.prompt,
		});
	}, [openAgentChat]);
	const handleChatQuestionAnswer = useCallback(() => {
		setPendingChatQuestion(null);
	}, []);

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
					chrome={chrome}
					className="w-[260px]"
					generativeAction={{
						onSubmit: handleGenerativeActionSubmit,
					}}
					issueKey="PD-40"
					onAgentActivityQuestionSubmit={handleAgentActivityQuestionSubmit}
					onAgentActivityViewChat={handleAgentActivityViewChat}
					onAgentDoneRunSubmit={handleAgentDoneRunSubmit}
					onAgentDoneRunView={handleAgentDoneRunView}
					priority="major"
					subtasks={JIRA_ISSUE_DEMO_SUBTASKS}
					subtasksCompleted={0}
					summary="Implement advanced date-range filter"
					tags={[{ text: "FE Development", color: "purple" }]}
				/>
			</div>
			<AsxRovoOverlay
				chatContextBar={chatContextBar}
				externalThinkingMessageId={externalThinkingMessageId}
				onQuestionAnswer={pendingChatQuestion ? handleChatQuestionAnswer : undefined}
			/>
		</div>
	);
}

export { JiraIssue } from "@/components/blocks/jira-issue";
export type {
	JiraIssueAgentActivity,
	JiraIssueAgentActivityMode,
	JiraIssueAgentActivityState,
	JiraIssueParticipant,
	JiraIssuePriority,
	JiraIssueProps,
	JiraIssueSubtask,
	JiraIssueTag,
	JiraIssueUncapturedWorkProps,
	JiraIssueVariant,
} from "@/components/blocks/jira-issue";
