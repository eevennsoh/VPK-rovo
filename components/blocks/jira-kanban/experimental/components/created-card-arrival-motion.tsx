"use client";

import type { ReactNode } from "react";
import { motion, type MotionProps } from "motion/react";

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

interface CreatedCardArrivalMotionProps {
	arrival?: JiraKanbanCreatedCardArrival;
	cardCode: string;
	cardMovePhase: JiraKanbanCardMoveAnimation["phase"] | undefined;
	children: ReactNode;
	className?: string;
	dropTarget: "attach" | "unlink" | null | undefined;
	onArrivalComplete: (arrivalId: number) => void;
	shouldAnimateCardMoves: boolean;
	shouldReduceMotion: boolean | null;
}

function isCardArriving(
	arrival: JiraKanbanCreatedCardArrival | undefined,
	cardCode: string,
): boolean {
	return arrival?.cardCodes.includes(cardCode) ?? false;
}

function isLastArrivingCard(
	arrival: JiraKanbanCreatedCardArrival | undefined,
	cardCode: string,
	arriving: boolean,
): boolean {
	return arriving && arrival?.cardCodes.at(-1) === cardCode;
}

function getCardMoveAnimation(
	shouldAnimateCardMoves: boolean,
	cardMovePhase: JiraKanbanCardMoveAnimation["phase"] | undefined,
): MotionProps["animate"] {
	return shouldAnimateCardMoves
		? { scale: getJiraKanbanCardScale(cardMovePhase) }
		: undefined;
}

function getArrivalId(
	arrival: JiraKanbanCreatedCardArrival | undefined,
	arriving: boolean,
): number | undefined {
	return arriving ? arrival?.id : undefined;
}

function getArrivalCompletionHandler(
	arrival: JiraKanbanCreatedCardArrival | undefined,
	isFinalArrivingCard: boolean,
	onArrivalComplete: (arrivalId: number) => void,
): MotionProps["onAnimationComplete"] {
	if (!isFinalArrivingCard || !arrival) {
		return undefined;
	}
	return () => onArrivalComplete(arrival.id);
}

function getCardMotionStyle(
	arriving: boolean,
	shouldReduceMotion: boolean | null,
	cardMovePhase: JiraKanbanCardMoveAnimation["phase"] | undefined,
): MotionProps["style"] {
	if (arriving && !shouldReduceMotion) {
		return { willChange: "transform, opacity" };
	}
	return cardMovePhase ? { willChange: "transform" } : undefined;
}

function getCardMotionTransition(
	arriving: boolean,
	shouldReduceMotion: boolean | null,
	cardMovePhase: JiraKanbanCardMoveAnimation["phase"] | undefined,
): MotionProps["transition"] {
	if (arriving) {
		return shouldReduceMotion
			? JIRA_KANBAN_CARD_ARRIVE_REDUCED
			: JIRA_KANBAN_CARD_ARRIVE;
	}
	return cardMovePhase === "departing" ? JIRA_KANBAN_CARD_DEPART : JIRA_KANBAN_CARD_MOVE;
}

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
}: Readonly<CreatedCardArrivalMotionProps>) {
	const isArriving = isCardArriving(arrival, cardCode);
	const isFinalArrivingCard = isLastArrivingCard(arrival, cardCode, isArriving);
	const cardMoveAnimation = getCardMoveAnimation(shouldAnimateCardMoves, cardMovePhase);
	const arrivalId = getArrivalId(arrival, isArriving);
	const handleAnimationComplete = getArrivalCompletionHandler(
		arrival,
		isFinalArrivingCard,
		onArrivalComplete,
	);
	const motionStyle = getCardMotionStyle(isArriving, shouldReduceMotion, cardMovePhase);
	const motionTransition = getCardMotionTransition(isArriving, shouldReduceMotion, cardMovePhase);

	return (
		<motion.div
			animate={isArriving
				? { opacity: 1, y: 0 }
				: cardMoveAnimation}
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
			data-created-card-arrival-id={arrivalId}
			data-created-card-arrival-last={isFinalArrivingCard || undefined}
			data-issue-key={cardCode}
			initial={isArriving && !shouldReduceMotion ? { opacity: 0, y: 8 } : false}
			onAnimationComplete={handleAnimationComplete}
			style={motionStyle}
			transition={motionTransition}
		>
			{children}
		</motion.div>
	);
}
