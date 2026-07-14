"use client";

import { useCallback } from "react";
import { AnimatePresence, motion } from "motion/react";

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
import { useAutoCycle } from "@/components/projects/asx/hooks/use-auto-cycle";
import RovoFloatingChat from "@/components/projects/rovo-floating-chat/components/rovo-floating-chat";
import FloatingRovoButton from "@/components/projects/shared/components/floating-rovo-button";
import { cn } from "@/lib/utils";

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
 * `max-w-3xl` column to span the full viewport so the pinned dock floats over
 * the lower portion; the negative bottom margin cancels the stage's `pb-80`.
 */
export function CardKanbanStage(): React.ReactElement {
	const { chatSurface, openChat, sendPrompt } = useRovoChat();
	const {
		activeIndex,
		setActiveIndex,
		progress,
		cycleRunning,
		pauseHandlers,
		setExternalInteractionActive,
	} = useAutoCycle(ASX_CARD_KANBAN_STATES.length);
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
		<div className="relative left-1/2 -mb-80 flex h-[calc(100dvh-6.5rem)] w-screen -translate-x-1/2 flex-col px-8">
			<div className="flex flex-1 flex-col items-center justify-center pb-28">
				{/* Tight wrapper so hover/focus only pauses the cycle over the demo, not the whole stage. */}
				<div className="flex flex-col items-center" {...pauseHandlers}>
					<div className="flex flex-wrap items-center justify-center gap-2 pb-12">
						{ASX_CARD_KANBAN_STATES.map((option, index) => {
							const isActive = index === activeIndex;
							const showProgress = isActive && cycleRunning;
							return (
								<button
									key={option.value}
									type="button"
									aria-pressed={isActive}
									onClick={() => setActiveIndex(index)}
									className={cn(
										"relative isolate inline-flex h-6 shrink-0 items-center overflow-hidden rounded-md border px-2.5 text-xs font-medium leading-4 outline-none transition-[border-color,color,box-shadow] duration-fast ease-out focus-visible:ring-3 focus-visible:ring-ring/50",
										isActive
											? "border-border-selected bg-bg-selected text-text-selected"
											: "border-border bg-surface text-text-subtle hover:bg-bg-neutral-subtle-hovered active:bg-bg-neutral-subtle-pressed",
									)}
								>
									<span className="relative z-[2]">{option.label}</span>
									{showProgress ? (
										<motion.span
											aria-hidden
											className="pointer-events-none absolute inset-0 z-[1] origin-left bg-bg-selected-hovered"
											style={{ scaleX: progress, willChange: "transform" }}
										/>
									) : null}
								</button>
							);
						})}
					</div>
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
			{chatSurface === null ? (
				<FloatingRovoButton
					ariaLabel="Open Rovo chat"
					forceVisible
					positioning="container"
					product="home"
				/>
			) : null}
			<AnimatePresence>
				{chatSurface === "floating" ? <RovoFloatingChat key="floating-chat" /> : null}
			</AnimatePresence>
		</div>
	);
}
