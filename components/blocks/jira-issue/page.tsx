"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { RovoChatProvider } from "@/app/contexts";
import { JiraEpic } from "@/components/blocks/jira-epic";
import { JIRA_EPIC_DEMO_EPICS } from "@/components/blocks/jira-epic/data/demo-epics";
import {
	JiraIssue,
	type JiraIssueAgentActivity,
	type JiraIssueAgentActivityLayout,
	type JiraIssueAgentActivityMode,
	type JiraIssueAgentSessionTransferConfig,
	type JiraIssueChrome,
	type JiraIssueCompletedAgentRun,
	type JiraIssueGenerativeActionRequest,
	type JiraIssuePullRequestStatus,
} from "@/components/blocks/jira-issue";
import {
	JIRA_ISSUE_SESSION_TRANSFER_GROUP_CLASS,
	JiraIssueAgentSessionNotice,
} from "@/components/blocks/jira-issue/agent-session-transfer";
import type { JiraIssueMoveWorkItem } from "@/components/blocks/jira-issue/agent-session-transfer-model";
import { JiraIssueDetachedAgentSession } from "@/components/blocks/jira-issue/detached-agent-session";
import {
	GITHUB_BRANCH_SMART_LINK_ICON,
	GITHUB_COMMIT_SMART_LINK_ICON,
	toPullRequestSmartLink,
	type SmartLinkItem,
} from "@/components/blocks/smart-link";
import { QUESTION_CARD_SINGLE_SELECT_DEMO } from "@/components/blocks/question-card/data/questions";
import { ASX_CHAT_AGENT_PROFILES } from "@/components/projects/jira-golden-journeys-v0/data/agent-chat-data";
import { AsxRovoOverlay } from "@/components/projects/jira-golden-journeys-v0/components/jira-golden-journeys-v0-rovo-overlay";
import { useAsxAgentChatDemo } from "@/components/projects/jira-golden-journeys-v0/hooks/use-jira-golden-journeys-v0-agent-chat-demo";
import { Button } from "@/components/ui/button";
import { getDeterministicAgentAvatarSrc } from "@/lib/agent-avatars";
import { cn } from "@/lib/utils";

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

const JIRA_ISSUE_UNCAPTURED_GITHUB_VISUAL = { kind: "third-party", name: "github" } as const;
const JIRA_ISSUE_UNCAPTURED_GITHUB_AVATARS = JIRA_ISSUE_UNCAPTURED_WORK_PARTICIPANTS.map((participant) => ({
	name: participant.name,
	src: participant.avatarSrc,
}));

const JIRA_ISSUE_UNCAPTURED_WORK_EXAMPLES = [
	{
		id: "uncaptured-pr-1840",
		suggestedWorkItemKey: "PAY-101",
		summary: "Fourteen extra call sites, inventoried in an unlinked pull request",
		sourceLink: {
			...toPullRequestSmartLink({
				id: "uncaptured-pr-1840",
				number: 1840,
				title: "Fourteen extra call sites, inventoried in an unlinked pull request",
				status: "Open",
				files: 14,
				additions: 312,
				deletions: 0,
				repository: "eevensoh/vpk-rovo",
				branch: "inventory/forgotten-harnesses",
				targetBranch: "main",
				description: "eevensoh/vpk-rovo · PR #1840 · 14 files · no linked work item",
			}),
			title: "PR #1840",
			avatars: JIRA_ISSUE_UNCAPTURED_GITHUB_AVATARS,
		},
	},
	{
		id: "uncaptured-pr-1862",
		suggestedWorkItemKey: "PAY-113",
		summary: "Overnight contract suite merged without a work item to land on",
		sourceLink: {
			...toPullRequestSmartLink({
				id: "uncaptured-pr-1862",
				number: 1862,
				title: "Overnight contract suite merged without a work item to land on",
				status: "Merged",
				files: 18,
				additions: 1240,
				deletions: 86,
				repository: "eevensoh/vpk-rovo",
				branch: "agent/night-shift-contract-suite",
				targetBranch: "main",
				description: "eevensoh/vpk-rovo · PR #1862 · merged · no linked work item",
			}),
			title: "PR #1862",
			avatars: JIRA_ISSUE_UNCAPTURED_GITHUB_AVATARS,
		},
	},
	{
		id: "uncaptured-pr-1890",
		suggestedWorkItemKey: "PAY-102",
		summary: "Checks failed on the adapter-delete proof, still unlinked",
		sourceLink: {
			...toPullRequestSmartLink({
				id: "uncaptured-pr-1890",
				number: 1890,
				title: "Checks failed on the adapter-delete proof, still unlinked",
				status: "Failed",
				files: 41,
				additions: 0,
				deletions: 4180,
				repository: "eevensoh/vpk-rovo",
				branch: "proof/delete-legacy-gateway-adapter",
				targetBranch: "main",
				description: "eevensoh/vpk-rovo · PR #1890 · checks failed · no linked work item",
			}),
			title: "PR #1890",
			avatars: JIRA_ISSUE_UNCAPTURED_GITHUB_AVATARS,
		},
	},
	{
		id: "uncaptured-branch-spike",
		suggestedWorkItemKey: "PAY-102",
		summary: "Spike branch that proves the adapter can go, still unlinked",
		sourceLink: {
			id: "uncaptured-branch-spike",
			href: "https://github.com/eevensoh/vpk-rovo/tree/spike/delete-legacy-adapter",
			title: "spike/delete-legacy-adapter",
			variant: "generic",
			provider: { name: "GitHub", logo: JIRA_ISSUE_UNCAPTURED_GITHUB_VISUAL },
			icon: GITHUB_BRANCH_SMART_LINK_ICON,
			description: "eevensoh/vpk-rovo · unlinked spike branch",
			avatars: JIRA_ISSUE_UNCAPTURED_GITHUB_AVATARS,
		},
	},
	{
		id: "uncaptured-commit-b4c19e8",
		suggestedWorkItemKey: "PAY-101",
		summary: "The adapter-delete vote is recorded only as an unlinked commit",
		sourceLink: {
			id: "uncaptured-commit-b4c19e8",
			href: "https://github.com/eevensoh/vpk-rovo/commit/b4c19e8",
			title: "b4c19e8",
			variant: "generic",
			provider: { name: "GitHub", logo: JIRA_ISSUE_UNCAPTURED_GITHUB_VISUAL },
			icon: GITHUB_COMMIT_SMART_LINK_ICON,
			description: "eevensoh/vpk-rovo · b4c19e8 · never attached to a work item",
			avatars: JIRA_ISSUE_UNCAPTURED_GITHUB_AVATARS,
		},
	},
] as const satisfies readonly { id: string; suggestedWorkItemKey: string; summary: string; sourceLink: SmartLinkItem }[];

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
	| "agent-dismissed-work"
	| "agent-session-unlink"
	| "agent-session-move"
	| "agent-session-link";

const JIRA_ISSUE_AGENT_ACTIVITY_DEMO_STATES = [
	{ value: "default", label: "Default" },
	{ value: "single-agent-working", label: "1 agent" },
	{ value: "multiple-agents-working", label: "1-n agents" },
	{ value: "awaiting-user-input", label: "Needs input" },
	{ value: "agent-completed-work", label: "Review" },
	{ value: "agent-dismissed-work", label: "Done" },
] as const satisfies readonly { value: JiraIssueAgentActivityDemoState; label: string }[];

/** Only concatenated onto the tab list for the experimental (stroke) demo. */
const JIRA_ISSUE_AGENT_SESSION_TRANSFER_DEMO_STATES = [
	{ value: "agent-session-unlink", label: "Unlink" },
	{ value: "agent-session-move", label: "Move" },
	{ value: "agent-session-link", label: "Link" },
] as const satisfies readonly { value: JiraIssueAgentActivityDemoState; label: string }[];

/** Recently viewed work items offered by the Move search menu. */
const JIRA_ISSUE_MOVE_WORK_ITEMS = [
	{ key: "VENN-1", summary: "Coding Agents in Jira", type: "Epic" },
	{ key: "VENN-7", summary: "Try: Implement this work item from your IDE or terminal", type: "Task" },
	{ key: "VENN-8", summary: "Discover more agentic features", type: "Story" },
	{ key: "VENN-12", summary: "Bring agent sessions to the backlog view", type: "Story" },
	{ key: "PAY-105", summary: "Rate limit the payments adapter retries", type: "Bug" },
	{ key: "PAY-118", summary: "Split the date-range filter into its own subtask", type: "Subtask" },
] as const satisfies readonly JiraIssueMoveWorkItem[];

/** The session that leaves the card in the Unlink flow, then proposes a new home. */
const JIRA_ISSUE_DETACHED_SESSION = {
	id: JIRA_ISSUE_AGENT_ACTIVITIES[0].id,
	name: JIRA_ISSUE_AGENT_ACTIVITIES[0].name,
	title: "Mapping affected services for the date-range filter",
	avatarSrc: JIRA_ISSUE_AGENT_ACTIVITIES[0].avatarSrc,
} as const;

const JIRA_ISSUE_DETACHED_SESSION_PROPOSAL = {
	confidenceLabel: "High confidence",
	reason: "Some reasons why I think I should be linked here",
	suggestedWorkItemKey: "PAY-105",
} as const;

/** How long the post-move confirmation stays up before the demo settles. */
const JIRA_ISSUE_MOVE_NOTICE_MS = 2400;

function isSessionTransferDemoState(state: JiraIssueAgentActivityDemoState): boolean {
	return state === "agent-session-unlink" || state === "agent-session-move" || state === "agent-session-link";
}

function getDemoAgentActivities(
	state: JiraIssueAgentActivityDemoState,
	sessionMoved: boolean,
): readonly JiraIssueAgentActivity[] | undefined {
	switch (state) {
		case "single-agent-working":
			return JIRA_ISSUE_AGENT_ACTIVITIES.slice(0, 1);
		case "multiple-agents-working":
			return JIRA_ISSUE_AGENT_ACTIVITIES.slice(0, 2);
		case "awaiting-user-input":
			return JIRA_ISSUE_AWAITING_INPUT_ACTIVITIES;
		case "agent-session-unlink":
		case "agent-session-move":
			return sessionMoved ? undefined : JIRA_ISSUE_AGENT_ACTIVITIES.slice(0, 1);
		default:
			return undefined;
	}
}

function getDemoAgentActivityMode(
	state: JiraIssueAgentActivityDemoState,
	activities: readonly JiraIssueAgentActivity[] | undefined,
): JiraIssueAgentActivityMode {
	if (state === "agent-completed-work") {
		return "completed";
	}

	if (!activities?.length) {
		return "none";
	}

	return state === "awaiting-user-input" ? "awaiting-input" : "working";
}

function getExperimentalDemoPullRequest(
	chrome: JiraIssueChrome,
	agentActivityState: JiraIssueAgentActivityDemoState,
): { pullRequestNumber?: number; pullRequestStatus?: JiraIssuePullRequestStatus } {
	if (chrome !== "stroke") {
		return {};
	}

	switch (agentActivityState) {
		case "awaiting-user-input":
			return { pullRequestNumber: 812, pullRequestStatus: "open" };
		case "agent-completed-work":
			return { pullRequestNumber: 812, pullRequestStatus: "failed" };
		case "agent-dismissed-work":
			return { pullRequestNumber: 812, pullRequestStatus: "merged" };
		case "default":
		case "single-agent-working":
		case "multiple-agents-working":
		case "agent-session-unlink":
		case "agent-session-move":
		case "agent-session-link":
			return {};
		default: {
			const exhaustive: never = agentActivityState;
			throw new Error(`Unhandled agent activity demo state: ${String(exhaustive)}`);
		}
	}
}

interface JiraIssuePageProps {
	variant?: "default" | "experimental" | "uncaptured-work" | "subtasks-collapsed" | "subtasks-expanded" | "parent-epic" | "agent-activity-states" | "agent-activity-states-experimental";
}

function JiraIssueUncapturedWorkDemo() {
	const [capturedIds, setCapturedIds] = useState<ReadonlySet<string>>(() => new Set());

	return (
		<div
			className="flex h-full min-h-[360px] w-full flex-col items-center justify-center gap-2 bg-surface p-6"
			id="uncaptured-work"
		>
			{JIRA_ISSUE_UNCAPTURED_WORK_EXAMPLES.map((example) => (
				<JiraIssue
					captured={capturedIds.has(example.id)}
					className="w-[320px]"
					key={example.id}
					onCreateWorkItem={() => {
						setCapturedIds((current) => new Set(current).add(example.id));
					}}
					onLinkWorkItem={() => {
						setCapturedIds((current) => new Set(current).add(example.id));
					}}
					participants={JIRA_ISSUE_UNCAPTURED_WORK_PARTICIPANTS}
					sourceLink={example.sourceLink}
					suggestedWorkItemKey={example.suggestedWorkItemKey}
					summary={example.summary}
					variant="uncaptured-work"
				/>
			))}
		</div>
	);
}

export default function JiraIssuePage({ variant = "default" }: Readonly<JiraIssuePageProps> = {}): React.ReactElement {
	const [selectedEpicId, setSelectedEpicId] = useState("agentic-jira");
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
		const isExperimentalAgentActivityVariant = variant === "agent-activity-states-experimental";
		return (
			<RovoChatProvider agentProfiles={ASX_CHAT_AGENT_PROFILES}>
				<JiraIssueAgentActivityStatesDemo
					agentActivityLayout={isExperimentalAgentActivityVariant ? "split" : "merged"}
					chrome={isExperimentalAgentActivityVariant ? "stroke" : "raised"}
					showSessionTransferStates={isExperimentalAgentActivityVariant}
				/>
			</RovoChatProvider>
		);
	}

	if (isUncapturedWorkVariant) {
		return <JiraIssueUncapturedWorkDemo />;
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
	agentActivityLayout?: JiraIssueAgentActivityLayout;
	chrome?: JiraIssueChrome;
	/** Adds the Unlink / Move / Link session-transfer phases to the tab list. */
	showSessionTransferStates?: boolean;
}

function JiraIssueAgentActivityStatesDemo({
	agentActivityLayout = "merged",
	chrome = "raised",
	showSessionTransferStates = false,
}: Readonly<JiraIssueAgentActivityStatesDemoProps> = {}): React.ReactElement {
	const [agentActivityState, setAgentActivityState] = useState<JiraIssueAgentActivityDemoState>("default");
	const [movedWorkItemKey, setMovedWorkItemKey] = useState<string | null>(null);
	const moveNoticeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const transferStageRef = useRef<HTMLDivElement | null>(null);
	// View chat / question submit / generative actions all drop into the shared
	// Rovo floating chat with the activity's agent already selected — matching the
	// ASX Kanban "View chat" behavior instead of a blank vanilla Rovo chat.
	const { chatContextBar, externalThinkingMessageId, openAgentChat } = useAsxAgentChatDemo();
	const [pendingChatQuestion, setPendingChatQuestion] = useState<Readonly<{ submit: () => void }> | null>(null);
	const experimentalPullRequest = getExperimentalDemoPullRequest(chrome, agentActivityState);
	const isTransferPhase = showSessionTransferStates && isSessionTransferDemoState(agentActivityState);
	const isLinkPhase = isTransferPhase && agentActivityState === "agent-session-link";
	const sessionMoved = movedWorkItemKey !== null;
	const agentActivities = getDemoAgentActivities(agentActivityState, sessionMoved);
	const demoStates = showSessionTransferStates
		? [...JIRA_ISSUE_AGENT_ACTIVITY_DEMO_STATES, ...JIRA_ISSUE_AGENT_SESSION_TRANSFER_DEMO_STATES]
		: JIRA_ISSUE_AGENT_ACTIVITY_DEMO_STATES;
	const clearMoveNoticeTimeout = useCallback(() => {
		if (moveNoticeTimeoutRef.current !== null) {
			clearTimeout(moveNoticeTimeoutRef.current);
			moveNoticeTimeoutRef.current = null;
		}
	}, []);
	// A hidden demo must never advance in the background: the notice timer is
	// dropped on unmount and on every tab change.
	useEffect(() => clearMoveNoticeTimeout, [clearMoveNoticeTimeout]);
	const selectDemoState = useCallback((value: JiraIssueAgentActivityDemoState) => {
		clearMoveNoticeTimeout();
		setMovedWorkItemKey(null);
		setAgentActivityState(value);
	}, [clearMoveNoticeTimeout]);
	// The Move phase is defined by its open search menu, and the transfer region
	// owns that state internally, so the demo opens it the way a person would.
	useEffect(() => {
		if (agentActivityState !== "agent-session-move") {
			return;
		}

		const frame = requestAnimationFrame(() => {
			const zones = transferStageRef.current?.querySelectorAll<HTMLButtonElement>(
				"[data-slot='jira-issue-session-transfer'] button",
			);
			zones?.[zones.length - 1]?.click();
		});

		return () => cancelAnimationFrame(frame);
	}, [agentActivityState]);
	const handleSessionUnlink = useCallback(() => {
		selectDemoState("agent-session-link");
	}, [selectDemoState]);
	const handleSessionMove = useCallback((workItemKey: string) => {
		clearMoveNoticeTimeout();
		setMovedWorkItemKey(workItemKey);
		moveNoticeTimeoutRef.current = setTimeout(() => {
			moveNoticeTimeoutRef.current = null;
			setMovedWorkItemKey(null);
			setAgentActivityState("default");
		}, JIRA_ISSUE_MOVE_NOTICE_MS);
	}, [clearMoveNoticeTimeout]);
	const agentSessionTransfer: JiraIssueAgentSessionTransferConfig | undefined = useMemo(
		() => (isTransferPhase && !isLinkPhase
			? { moveWorkItems: JIRA_ISSUE_MOVE_WORK_ITEMS, onMove: handleSessionMove, onUnlink: handleSessionUnlink }
			: undefined),
		[handleSessionMove, handleSessionUnlink, isLinkPhase, isTransferPhase],
	);
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
					{demoStates.map((state) => (
						<Button
							key={state.value}
							aria-pressed={agentActivityState === state.value}
							onClick={() => selectDemoState(state.value)}
							size="compact"
							variant={agentActivityState === state.value ? "default" : "outline"}
						>
							{state.label}
						</Button>
					))}
				</div>
			</div>
			<div className="flex flex-1 items-start justify-center overflow-visible px-6 pb-10 pt-6">
				<div ref={transferStageRef} className="flex w-[260px] flex-col gap-2">
					<JiraIssue
						key={isTransferPhase ? agentActivityState : "base"}
						agentActivities={agentActivities}
						agentActivityLayout={agentActivityLayout}
						agentActivityMode={getDemoAgentActivityMode(agentActivityState, agentActivities)}
						agentDoneRuns={agentActivityState === "agent-completed-work" ? JIRA_ISSUE_COMPLETED_AGENT_RUNS : undefined}
						agentSessionTransfer={agentSessionTransfer}
						assigneeAvatarSrc="/avatar-user/andrea-wilson/color/asow-service-yellow.png"
						chrome={chrome}
						className={cn("w-full", agentSessionTransfer ? JIRA_ISSUE_SESSION_TRANSFER_GROUP_CLASS : undefined)}
						generativeAction={{
							onSubmit: handleGenerativeActionSubmit,
						}}
						issueKey="PD-40"
						onAgentActivityViewChat={handleAgentActivityViewChat}
						onAgentDoneRunSubmit={handleAgentDoneRunSubmit}
						onAgentDoneRunView={handleAgentDoneRunView}
						priority="major"
						pullRequestNumber={experimentalPullRequest.pullRequestNumber}
						pullRequestStatus={experimentalPullRequest.pullRequestStatus}
						subtasks={JIRA_ISSUE_DEMO_SUBTASKS}
						subtasksCompleted={0}
						summary="Implement advanced date-range filter"
						tags={[{ text: "FE Development", color: "purple" }]}
					/>
					{movedWorkItemKey === null ? null : (
						<JiraIssueAgentSessionNotice message={`Moved to ${movedWorkItemKey}`} />
					)}
					{isLinkPhase ? (
						<JiraIssueDetachedAgentSession
							confidenceLabel={JIRA_ISSUE_DETACHED_SESSION_PROPOSAL.confidenceLabel}
							onCreateWorkItem={() => selectDemoState("agent-session-unlink")}
							onDismiss={() => selectDemoState("default")}
							onLinkWorkItem={() => selectDemoState("agent-session-unlink")}
							reason={JIRA_ISSUE_DETACHED_SESSION_PROPOSAL.reason}
							session={JIRA_ISSUE_DETACHED_SESSION}
							suggestedWorkItemKey={JIRA_ISSUE_DETACHED_SESSION_PROPOSAL.suggestedWorkItemKey}
							usesStrokeChrome={chrome === "stroke"}
						/>
					) : null}
				</div>
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
	JiraIssueAgentActivityLayout,
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
