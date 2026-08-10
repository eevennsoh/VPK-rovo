"use client";

import { useMemo, useState, type KeyboardEvent } from "react";

import AddIcon from "@atlaskit/icon/core/add";
import AiChatIcon from "@atlaskit/icon/core/ai-chat";

import { ROVO_AGENT_SELECTOR_AGENTS, type SkillsDirectorySkill } from "@/app/data/directory";
import {
	EDITOR_PALETTE_MENTION_SOURCES,
	mapAgentToMentionItem,
} from "@/components/blocks/editor-palette/data/mention-sources";
import type { AgentSelectorAgent } from "@/components/blocks/agent-selector";
import { useJiraWorkItem } from "@/components/blocks/jira-work-item/experimental-v2/context-jira-work-item";
import { ActivityComposerContextPills } from "@/components/blocks/jira-work-item/experimental-v2/components/activity-composer-context-pills";
import { JiraWorkItemComposerMotion } from "@/components/blocks/jira-work-item/experimental-v2/components/jira-work-item-composer-motion";
import { JIRA_WORK_ITEM_CURRENT_USER } from "@/components/blocks/jira-work-item/experimental-v2/lib/jira-activity-adapter";
import {
	findMentionedAvailableAgents,
	findMentionedWorkingAgentSessions,
	findSteeredWorkingSessions,
} from "@/components/blocks/jira-work-item/experimental-v2/lib/activity-composer-session-routing";
import { JiraActivityComposer } from "@/components/blocks/jira-activity";
import {
	RichTextSuggestionMenu,
	type RichTextSuggestionMenuItem,
} from "@/components/ui-custom/rich-text-editor";
import { Tag } from "@/components/ui/tag";

const JIRA_WORK_ITEM_MENTION_LABELS = { subagent: "Agents" } as const;
const JIRA_WORK_ITEM_SUGGESTION_VARIANT = { command: "flat", mention: "flat" } as const;
const SESSION_TARGET_MENU_ITEMS = [
	{
		id: "continue",
		label: "Continue in existing session",
		icon: <AiChatIcon label="" size="small" />,
	},
	{
		id: "new",
		label: "Start a new session",
		icon: <AddIcon label="" size="small" />,
	},
] satisfies readonly RichTextSuggestionMenuItem[];

type SessionTargetChoice = "continue" | "new";

interface SessionTargetSelection {
	sessionId: string;
	choice: SessionTargetChoice;
}

/**
 * Unified comment/command composer. Reuses the Jira Activity prompt surface while
 * configuring its shared editor palette for direct people, team, and agent picks.
 * Mentioning a working session's agent offers a continue/new-session route; a
 * first-time agent mention invokes that agent and adds it to Crew.
 */
export function ActivityComposer({
	agents,
	onAgentPromptSubmit,
	onOpenAgentChat,
	onSkillInvoke,
}: Readonly<{
	agents?: readonly AgentSelectorAgent[];
	onAgentPromptSubmit?: (agentIds: readonly string[], prompt: string) => void;
	onOpenAgentChat?: (agentId: string) => void;
	onSkillInvoke?: (skill: SkillsDirectorySkill) => boolean | void;
}>) {
	const { state, actions, meta } = useJiraWorkItem();
	const availableAgents = agents ?? ROVO_AGENT_SELECTOR_AGENTS;
	const mentionSources = useMemo(() => agents
		? {
			...EDITOR_PALETTE_MENTION_SOURCES,
			subagent: agents.map(mapAgentToMentionItem),
		}
		: EDITOR_PALETTE_MENTION_SOURCES, [agents]);
	const [draft, setDraft] = useState("");
	const [sessionTargetSelection, setSessionTargetSelection] = useState<SessionTargetSelection | null>(null);
	const [selectedSessionTargetIndex, setSelectedSessionTargetIndex] = useState(0);
	const mentionedWorkingAgentSessions = findMentionedWorkingAgentSessions(state.sessions, draft);
	const mentionedWorkingAgentSession = mentionedWorkingAgentSessions.length === 1
		? mentionedWorkingAgentSessions[0]
		: null;
	const hasResolvedSessionTarget = Boolean(
		mentionedWorkingAgentSession
		&& sessionTargetSelection?.sessionId === mentionedWorkingAgentSession.id,
	);
	const showSessionTargetMenu = Boolean(mentionedWorkingAgentSession) && !hasResolvedSessionTarget;
	const startsNewSession = Boolean(
		mentionedWorkingAgentSession
		&& sessionTargetSelection?.sessionId === mentionedWorkingAgentSession.id
		&& sessionTargetSelection.choice === "new",
	);
	const workingSessions = state.sessions.filter((session) => session.status !== "completed");

	const handlePromptChange = (next: string) => {
		setDraft(next);
		const nextMentionedSessions = findMentionedWorkingAgentSessions(state.sessions, next);
		const nextMentionedSession = nextMentionedSessions.length === 1 ? nextMentionedSessions[0] : null;
		setSelectedSessionTargetIndex(0);
		setSessionTargetSelection((currentSelection) =>
			nextMentionedSession && currentSelection?.sessionId === nextMentionedSession.id
				? currentSelection
				: null,
		);
	};

	const chooseSessionTarget = (choice: SessionTargetChoice) => {
		if (!mentionedWorkingAgentSession) {
			return;
		}
		setSessionTargetSelection({ sessionId: mentionedWorkingAgentSession.id, choice });
	};

	const handleInvokeAgent = (agent: Pick<AgentSelectorAgent, "id" | "name" | "avatarSrc" | "brandName">) => {
		actions.invokeAgent(agent, "context-pill", `@${agent.name}`);
	};

	const handleInvokeSkill = (skill: SkillsDirectorySkill) => {
		if (onSkillInvoke?.(skill) === true) return;
		actions.launchSession(
			{ id: `skill:${skill.id}`, name: "Rovo" },
			`/${skill.name}`,
			skill.name,
		);
	};

	const handleOpenWorkingSession = (agentId: string, sessionId: string) => {
		actions.openSession(sessionId);
		onOpenAgentChat?.(agentId);
	};

	const handleSubmit = (body: string) => {
		const text = body.trim();
		if (!text) return;
		const mentionedAgentSessions = findMentionedWorkingAgentSessions(state.sessions, text);
		const mentionedAgentSession = mentionedAgentSessions.length === 1 ? mentionedAgentSessions[0] : null;
		const shouldStartNewSession = Boolean(
			mentionedAgentSession
			&& sessionTargetSelection?.sessionId === mentionedAgentSession.id
			&& sessionTargetSelection.choice === "new",
		);
		const steeredSessions = findSteeredWorkingSessions(state.sessions, text);
		const handledAgentIds = new Set<string>();
		const handledAgentNames = new Set<string>();
		if (mentionedAgentSession && shouldStartNewSession) {
			actions.invokeAgent(
				{
					id: mentionedAgentSession.agentId,
					name: mentionedAgentSession.agentName,
					avatarSrc: mentionedAgentSession.agentAvatarSrc,
				},
				"prompt",
				text,
			);
			handledAgentIds.add(mentionedAgentSession.agentId);
			handledAgentNames.add(mentionedAgentSession.agentName);
		} else {
			for (const steeredSession of steeredSessions) {
				actions.replySession(steeredSession.id, text);
				handledAgentIds.add(steeredSession.agentId);
				handledAgentNames.add(steeredSession.agentName);
			}
		}
		const invokedAgents = findMentionedAvailableAgents(
			availableAgents,
			text,
			handledAgentIds,
			handledAgentNames,
		);
		for (const invokedAgent of invokedAgents) {
			actions.invokeAgent(invokedAgent, "prompt", text);
		}
		onAgentPromptSubmit?.(
			[...handledAgentIds, ...invokedAgents.map((agent) => agent.id)],
			text,
		);
		if (handledAgentIds.size === 0 && invokedAgents.length === 0) {
			if (meta.composerDelivery === "broadcast-active-agents") {
				actions.broadcastComment(text);
			} else {
				actions.addComment(text);
			}
		}
		setDraft("");
		setSessionTargetSelection(null);
		setSelectedSessionTargetIndex(0);
	};

	const handleKeyDownCapture = (event: KeyboardEvent<HTMLDivElement>) => {
		if (!showSessionTargetMenu) {
			return;
		}
		switch (event.key) {
			case "ArrowDown":
				event.preventDefault();
				event.stopPropagation();
				setSelectedSessionTargetIndex((index) => (index + 1) % SESSION_TARGET_MENU_ITEMS.length);
				break;
			case "ArrowUp":
				event.preventDefault();
				event.stopPropagation();
				setSelectedSessionTargetIndex((index) => (index - 1 + SESSION_TARGET_MENU_ITEMS.length) % SESSION_TARGET_MENU_ITEMS.length);
				break;
			case "Enter":
			case "Tab":
				event.preventDefault();
				event.stopPropagation();
				chooseSessionTarget(SESSION_TARGET_MENU_ITEMS[selectedSessionTargetIndex].id === "new" ? "new" : "continue");
				break;
			case "Escape":
				event.preventDefault();
				event.stopPropagation();
				chooseSessionTarget("continue");
				break;
			default:
				break;
		}
	};

	return (
		<div onKeyDownCapture={handleKeyDownCapture}>
			<ActivityComposerContextPills
				onInvokeAgent={handleInvokeAgent}
				onInvokeSkill={handleInvokeSkill}
				onOpenAgentChat={onOpenAgentChat ? handleOpenWorkingSession : undefined}
				workingSessions={workingSessions}
			/>
			<div className="relative" data-jira-work-item-composer-state="sticky">
				<JiraWorkItemComposerMotion placement="sticky">
					<JiraActivityComposer
						author={JIRA_WORK_ITEM_CURRENT_USER}
						mentionSources={mentionSources}
						mentionSectionLabels={JIRA_WORK_ITEM_MENTION_LABELS}
						onSubmit={handleSubmit}
						onValueChange={handlePromptChange}
						placeholder="Comment, @mention an agent, or / for skills"
						submitAccessory={startsNewSession ? (
							<Tag
								className="self-center"
								color="gray"
								onRemove={() => chooseSessionTarget("continue")}
								removeButtonLabel="Continue in existing session instead"
								shape="rounded"
							>
								New session
							</Tag>
						) : null}
						suggestionVariant={JIRA_WORK_ITEM_SUGGESTION_VARIANT}
						value={draft}
						variant="comment"
					/>
				</JiraWorkItemComposerMotion>
				{showSessionTargetMenu ? (
					<div
						className="absolute inset-x-0 bottom-full z-20 mb-2"
						data-jira-work-item-session-target-menu
					>
						<RichTextSuggestionMenu
							className="rich-text-command-menu-borderless w-full!"
							emptyLabel=""
							items={SESSION_TARGET_MENU_ITEMS}
							onHover={setSelectedSessionTargetIndex}
							onSelect={(item) => chooseSessionTarget(item.id === "new" ? "new" : "continue")}
							selectedIndex={selectedSessionTargetIndex}
							title="Choose agent session"
						/>
					</div>
				) : null}
			</div>
		</div>
	);
}
