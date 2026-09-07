"use client";

import type { ReactNode } from "react";
import { motion } from "motion/react";

import type { JiraKanbanCardMoveAnimation } from "@/components/blocks/jira-kanban";
import { cn } from "@/lib/utils";

import type { JiraKanbanCreatedCardArrival } from "../hooks/use-created-card-arrival";
import {
	getJiraKanbanCardScale,
	JIRA_KANBAN_CARD_ARRIVE,
	JIRA_KANBAN_CARD_ARRIVE_REDUCED,
	JIRA_KANBAN_CARD_DEPART,
	JIRA_KANBAN_CARD_MOVE,
} from "../lib/card-motion";

export function CreatedCardArrivalMotion({
	arrival,
	cardCode,
	cardMovePhase,
	children,
	className,
	dropTarget,
	onArrivalComplete,
	shouldAnimateCardMoves,
	shouldReduceMotion,
}: Readonly<{
	arrival?: JiraKanbanCreatedCardArrival;
	cardCode: string;
	cardMovePhase: JiraKanbanCardMoveAnimation["phase"] | undefined;
	children: ReactNode;
	className?: string;
	dropTarget: "attach" | "unlink" | null | undefined;
	onArrivalComplete: (arrivalId: number) => void;
	shouldAnimateCardMoves: boolean;
	shouldReduceMotion: boolean | null;
}>) {
	const isArriving = Boolean(arrival?.cardCodes.includes(cardCode));
	const isFinalArrivingCard = Boolean(
		isArriving && arrival?.cardCodes.at(-1) === cardCode,
	);

	return (
		<motion.div
			animate={isArriving
				? { opacity: 1, y: 0 }
				: shouldAnimateCardMoves
					? { scale: getJiraKanbanCardScale(cardMovePhase) }
					: undefined}
			className={cn(
				"flex w-full min-w-0 max-w-[280px] flex-col gap-2 rounded-lg",
				"transition-[background-color,opacity] duration-normal ease-out-practical motion-reduce:transition-none",
				"[&_[data-slot=jira-issue-agent-backdrop]]:transition-colors [&_[data-slot=jira-issue-agent-backdrop]]:duration-normal [&_[data-slot=jira-issue-agent-backdrop]]:ease-out-practical",
				"motion-reduce:[&_[data-slot=jira-issue-agent-backdrop]]:transition-none",
				isArriving && "[&_[data-slot=jira-issue-agent-backdrop]]:bg-bg-accent-blue-subtlest",
				className,
			)}
			data-board-agent-session-drop-zone="issue"
			data-board-agent-session-target={dropTarget ?? undefined}
			data-created-card-backdrop={isArriving || undefined}
			data-created-card-arrival-id={isArriving ? arrival?.id : undefined}
			data-created-card-arrival-last={isFinalArrivingCard || undefined}
			data-issue-key={cardCode}
			initial={isArriving && !shouldReduceMotion ? { opacity: 0, y: 8 } : false}
			onAnimationComplete={isFinalArrivingCard && arrival
				? () => onArrivalComplete(arrival.id)
				: undefined}
			style={isArriving && !shouldReduceMotion
				? { willChange: "transform, opacity" }
				: cardMovePhase ? { willChange: "transform" } : undefined}
			transition={isArriving
				? shouldReduceMotion
					? JIRA_KANBAN_CARD_ARRIVE_REDUCED
					: JIRA_KANBAN_CARD_ARRIVE
				: cardMovePhase === "departing" ? JIRA_KANBAN_CARD_DEPART : JIRA_KANBAN_CARD_MOVE}
		>
			{children}
		</motion.div>
	);
}
