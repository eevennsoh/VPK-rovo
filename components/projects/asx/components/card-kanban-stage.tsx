"use client";

import { useCallback } from "react";
import { motion } from "motion/react";

import { useRovoChat } from "@/app/contexts";
import {
	JiraIssue,
	type JiraIssueAgentActivityMode,
	type JiraIssueGenerativeActionRequest,
} from "@/components/blocks/jira-issue";
import {
	ASX_CARD_KANBAN_AWAITING_ACTIVITIES,
	ASX_CARD_KANBAN_CARD,
	ASX_CARD_KANBAN_DONE_COUNT,
	ASX_CARD_KANBAN_STATES,
	ASX_CARD_KANBAN_SUBTASKS,
	ASX_CARD_KANBAN_WORKING_ACTIVITIES,
} from "@/components/projects/asx/data/card-kanban-data";
import type { UseAutoCycleResult } from "@/components/projects/asx/hooks/use-auto-cycle";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { AsxRovoOverlay } from "./asx-rovo-overlay";

/**
 * The "Card Kanban" design pattern for the Agent Sessions Experience gallery.
 *
 * A single `components/blocks/jira-issue` card that transitions across the
 * "Agent activity states" — default, one agent working, multiple agents
 * working, an agent awaiting input, and completed agent work. The compact tab
 * bar above it auto-cycles through the states by default (reusing the
 * `components/blocks/agent-bento` auto-cycling category bar: a linear progress
 * fill sweeps the active tab, then advances). Hovering or focusing the demo
 * pauses the cycle; clicking a tab selects that state and restarts it. The card
 * animates between states; the agent-row "View chat" action and the card's
 * generative action both open the floating Rovo chat.
 *
 * Layout mirrors `KanbanStage`: the stage breaks out of the gallery's centered
 * `max-w-3xl` column to span the full viewport and fills the Gallery's available
 * stage height while the pinned dock floats over the lower portion.
 */
interface CardKanbanControlsProps {
	controller: UseAutoCycleResult;
	showProgress?: boolean;
}

export function CardKanbanControls({
	controller,
	showProgress = true,
}: Readonly<CardKanbanControlsProps>): React.ReactElement {
	const { activeIndex, setActiveIndex, progress, cycleRunning, pauseHandlers } = controller;

	return (
		<ButtonGroup variant="separated" {...pauseHandlers}>
			{ASX_CARD_KANBAN_STATES.map((option, index) => {
				const isActive = index === activeIndex;
				const showProgressFill = showProgress && isActive && cycleRunning;
				return (
					<Button
						key={option.value}
						type="button"
						variant="outline"
						size="compact"
						aria-pressed={isActive}
						onClick={() => setActiveIndex(index)}
						className="relative isolate overflow-hidden"
					>
						<span className="relative z-[2]">{option.label}</span>
						{showProgressFill ? (
							<motion.span
								aria-hidden
								className="pointer-events-none absolute inset-0 z-[1] origin-left bg-bg-selected-hovered"
								style={{ scaleX: progress, willChange: "transform" }}
							/>
						) : null}
					</Button>
				);
			})}
		</ButtonGroup>
	);
}

interface CardKanbanStageProps {
	controller: UseAutoCycleResult;
}

export function CardKanbanStage({ controller }: Readonly<CardKanbanStageProps>): React.ReactElement {
	const { openChat, sendPrompt } = useRovoChat();
	const {
		activeIndex,
		pauseHandlers,
		setExternalInteractionActive,
	} = controller;
	const state = ASX_CARD_KANBAN_STATES[activeIndex].value;

	const agentActivities =
		state === "single-agent-working"
			? ASX_CARD_KANBAN_WORKING_ACTIVITIES.slice(0, 1)
			: state === "multiple-agents-working"
				? ASX_CARD_KANBAN_WORKING_ACTIVITIES.slice(0, 2)
				: state === "awaiting-user-input"
					? ASX_CARD_KANBAN_AWAITING_ACTIVITIES
					: undefined;

	const agentActivityMode: JiraIssueAgentActivityMode =
		state === "single-agent-working" || state === "multiple-agents-working"
			? "working"
			: state === "awaiting-user-input"
				? "awaiting-input"
				: state === "agent-completed-work"
					? "completed"
					: "none";

	const handleViewChat = useCallback(() => {
		openChat("floating");
	}, [openChat]);

	const handleGenerativeActionSubmit = useCallback(
		(request: JiraIssueGenerativeActionRequest) => {
			openChat("floating");
			void sendPrompt(request.prompt, {
				messageMetadata: { source: "jira-issue-generative-action" },
			});
		},
		[openChat, sendPrompt],
	);

	return (
		<div className="relative left-1/2 flex h-full min-h-0 w-screen -translate-x-1/2 flex-col px-8">
			<div className="flex flex-1 flex-col items-center justify-center pb-28">
				{/* Tight wrapper so hover/focus only pauses the cycle over the card. */}
				<div className="flex flex-col items-center" {...pauseHandlers}>
					{/*
					 * Reserve the default card height so the demo reads as centered at
					 * rest while the toggle bar + card top stay anchored: taller states
					 * (agent rows, "Agent done") overflow downward instead of
					 * re-centering the group and shoving the toggle bar upward.
					 */}
					<div className="h-[149px] w-[280px]">
						<JiraIssue
							agentActivities={agentActivities}
							agentActivityMode={agentActivityMode}
							agentDoneCount={state === "agent-completed-work" ? ASX_CARD_KANBAN_DONE_COUNT : 0}
							assigneeAvatarSrc={ASX_CARD_KANBAN_CARD.assigneeAvatarSrc}
							className="w-full"
							generativeAction={{ onSubmit: handleGenerativeActionSubmit }}
							issueKey={ASX_CARD_KANBAN_CARD.issueKey}
							onAgentActivityOpenChange={setExternalInteractionActive}
							onAgentActivityViewChat={handleViewChat}
							priority={ASX_CARD_KANBAN_CARD.priority}
							subtasks={ASX_CARD_KANBAN_SUBTASKS}
							subtasksCompleted={0}
							summary={ASX_CARD_KANBAN_CARD.summary}
							tags={ASX_CARD_KANBAN_CARD.tags}
						/>
					</div>
				</div>
			</div>
			<AsxRovoOverlay />
		</div>
	);
}
