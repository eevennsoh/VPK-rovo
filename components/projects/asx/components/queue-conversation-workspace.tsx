"use client";

import ChangesIcon from "@atlaskit/icon/core/changes";
import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";
import ProjectStatusIcon from "@atlaskit/icon/core/project-status";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { FileUIPart } from "ai";
import { AnimatePresence, motion, useReducedMotion, type Transition } from "motion/react";
import { QuestionCard } from "@/components/blocks/question-card/components/question-card";
import type { QuestionCardAnswers } from "@/components/blocks/question-card/types";
import type { ConversationContextValue } from "@/components/ui-custom/conversation";
import {
	ContextBarPill,
	ContextBarTagGroup,
} from "@/components/ui-custom/context-bar";
import { ChatMessages } from "@/components/projects/shared/components/chat-messages";
import { QuestionCardShortcutsFooter } from "@/components/projects/shared/components/question-card-shortcuts-footer";
import { RovoAppComposer } from "@/components/projects/rovo/components/rovo-app-composer";
import {
	type DelegationRequest,
	useRealtimeVoice,
} from "@/components/projects/rovo/hooks/use-realtime-voice";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Footer } from "@/components/ui-custom/footer";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Lozenge } from "@/components/ui/lozenge";
import type { RovoAgentProfile } from "@/app/data/directory/agents";
import type { AsxQueueJiraColumn, AsxQueueSession } from "../data/queue-sessions";
import { QueueConversationHeader } from "./queue-conversation-header";
import { QueueEnvironmentPanel } from "./queue-environment-panel";

const PANEL_FALLBACK_WIDTH_PX = 320;
const CHAT_BODY_OPEN_TRANSITION: Transition = {
	duration: 0.25,
	ease: [0.4, 0, 0, 1], // duration-slow + ease-in-out
};
const CHAT_BODY_CLOSE_TRANSITION: Transition = {
	duration: 0.2,
	ease: [0.6, 0, 0.8, 0.6], // duration-medium + ease-in
};
const CHAT_BODY_REDUCED_MOTION_TRANSITION: Transition = { duration: 0 };
const QUEUE_JIRA_COLUMNS: readonly AsxQueueJiraColumn[] = [
	"To do",
	"In progress",
	"In review",
	"Done",
];
const QUEUE_JIRA_COLUMN_VARIANTS = {
	"To do": "neutral",
	"In progress": "information",
	"In review": "information",
	Done: "success",
} as const;

interface QueueConversationWorkspaceProps {
	agent: RovoAgentProfile;
	onAnswerQuestion: (answers: QuestionCardAnswers) => Promise<void> | void;
	onDismissFileChanges: () => void;
	onJiraColumnChange: (column: AsxQueueJiraColumn) => void;
	onSubmit: (payload: { files: FileUIPart[]; text: string }) => Promise<void>;
	session: AsxQueueSession;
}

function QueueSessionContextBar({
	onDismissFileChanges,
	onJiraColumnChange,
	session,
}: Readonly<Pick<
	QueueConversationWorkspaceProps,
	"onDismissFileChanges" | "onJiraColumnChange" | "session"
>>) {
	const fileChanges = session.fileChanges?.isDismissed ? undefined : session.fileChanges;
	const shouldShowJiraColumn = session.status === "pr-open";

	if (!fileChanges && !shouldShowJiraColumn) return null;

	const items = [];
	if (fileChanges) {
		items.push({
			id: "changes",
			label: `Dismiss changes: +${fileChanges.additions} -${fileChanges.deletions}`,
			icon: <ChangesIcon label="" size="small" />,
			onSelect: onDismissFileChanges,
			content: (
				<ContextBarPill
					aria-label="Dismiss file changes"
					icon={<ChangesIcon color="currentColor" label="" size="small" />}
					onClick={onDismissFileChanges}
					title={fileChanges.files.join("\n")}
				>
					Changes:
					<span className="inline-flex items-center gap-0.5">
						<span className="font-mono font-normal text-text-success">+{fileChanges.additions}</span>
						<span className="font-mono font-normal text-text-danger">-{fileChanges.deletions}</span>
					</span>
				</ContextBarPill>
			),
		});
	}
	if (shouldShowJiraColumn) {
		items.push({
			id: "jira-column",
			label: `Move to ${session.jiraColumn}`,
			icon: <ProjectStatusIcon label="" size="small" />,
			onSelect: () => onJiraColumnChange(session.jiraColumn),
			content: (
				<ContextBarPill
					className="gap-2 pr-2"
					icon={<ProjectStatusIcon color="currentColor" label="" size="small" />}
					interactive={false}
				>
					Move to:
					<ButtonGroup aria-label="Move Jira issue" variant="split">
						<Button
							aria-label={`Move Jira issue to ${session.jiraColumn}`}
							onClick={() => onJiraColumnChange(session.jiraColumn)}
							size="compact"
							variant="outline"
						>
							{session.jiraColumn}
						</Button>
						<DropdownMenu>
							<DropdownMenuTrigger
								render={<Button aria-label="Choose Jira column" size="icon-compact" variant="outline" />}
							>
								<ChevronDownIcon label="" size="small" />
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="min-w-44" side="top">
								<DropdownMenuGroup>
									{QUEUE_JIRA_COLUMNS.map((column) => (
										<DropdownMenuItem
											key={column}
											onSelect={() => onJiraColumnChange(column)}
										>
											<Lozenge className="pointer-events-none" variant={QUEUE_JIRA_COLUMN_VARIANTS[column]}>
												{column}
											</Lozenge>
										</DropdownMenuItem>
									))}
								</DropdownMenuGroup>
							</DropdownMenuContent>
						</DropdownMenu>
					</ButtonGroup>
				</ContextBarPill>
			),
		});
	}

	return (
		<ContextBarTagGroup
			className="mb-3 w-full"
			items={items}
			overflowAriaLabel="Show more session actions"
		/>
	);
}

export function QueueConversationWorkspace({
	agent,
	onAnswerQuestion,
	onDismissFileChanges,
	onJiraColumnChange,
	onSubmit,
	session,
}: Readonly<QueueConversationWorkspaceProps>) {
	const [isEnvironmentPanelOpen, setIsEnvironmentPanelOpen] = useState(false);
	const [chatBodyShift, setChatBodyShift] = useState(0);
	const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);
	const workspaceRef = useRef<HTMLDivElement | null>(null);
	const chatBodyRef = useRef<HTMLDivElement | null>(null);
	const chatBodyShiftRef = useRef(0);
	const conversationContextRef = useRef<ConversationContextValue | null>(null);
	const scrollSpacerRef = useRef<HTMLDivElement | null>(null);
	const shouldReduceMotion = useReducedMotion();
	const awaitingQuestion = session.status === "awaiting-input" ? session.question : undefined;
	const realtime = useRealtimeVoice({
		chatMessages: session.messages,
		isGenerating: false,
		onDelegateToRovo: useCallback((request: DelegationRequest) => {
			const text = request.prompt.trim();
			if (!text) return;
			void onSubmit({ files: [], text });
		}, [onSubmit]),
	});
	const handleToggleRealtimeVoice = useCallback(() => {
		if (realtime.voiceState === "idle") {
			realtime.connect();
			return;
		}

		realtime.disconnect();
	}, [realtime]);
	const handleAnswerQuestion = useCallback(async (answers: QuestionCardAnswers) => {
		setIsSubmittingAnswer(true);

		try {
			await onAnswerQuestion(answers);
		} catch {
			setIsSubmittingAnswer(false);
		}
	}, [onAnswerQuestion]);
	const commitChatBodyShift = useCallback((nextShift: number) => {
		if (chatBodyShiftRef.current === nextShift) return;
		chatBodyShiftRef.current = nextShift;
		setChatBodyShift(nextShift);
	}, []);

	useEffect(() => {
		if (!awaitingQuestion) return;

		const frameId = window.requestAnimationFrame(() => {
			void conversationContextRef.current?.scrollToBottom({
				animation: false,
				ignoreEscapes: true,
				target: "bottom",
			});
		});

		return () => window.cancelAnimationFrame(frameId);
	}, [awaitingQuestion]);

	useLayoutEffect(() => {
		if (!isEnvironmentPanelOpen) {
			commitChatBodyShift(0);
			return;
		}

		const workspace = workspaceRef.current;
		const chatBody = chatBodyRef.current;
		if (!workspace || !chatBody) return;

		const panel = workspace.querySelector<HTMLElement>("#asx-queue-environment-panel");
		const updateChatBodyShift = () => {
			const workspaceRect = workspace.getBoundingClientRect();
			const chatBodyRect = chatBody.getBoundingClientRect();
			const chatBodyTransform = getComputedStyle(chatBody).transform;
			const renderedChatShift = chatBodyTransform === "none"
				? 0
				: new DOMMatrixReadOnly(chatBodyTransform).m41;
			const panelWidth = panel?.getBoundingClientRect().width ?? PANEL_FALLBACK_WIDTH_PX;
			const panelLeft = workspaceRect.right - Math.min(panelWidth, workspaceRect.width);
			const unshiftedChatLeft = chatBodyRect.left - renderedChatShift;
			const unshiftedChatRight = chatBodyRect.right - renderedChatShift;
			const availableCenter = (workspaceRect.left + panelLeft) / 2;
			const unshiftedChatCenter = (unshiftedChatLeft + unshiftedChatRight) / 2;
			const centeredShift = availableCenter - unshiftedChatCenter;
			const leftEdgeShift = workspaceRect.left - unshiftedChatLeft;
			const nextShift = Math.round(Math.min(0, Math.max(leftEdgeShift, centeredShift)));
			commitChatBodyShift(nextShift);
		};

		updateChatBodyShift();
		const resizeObserver = new ResizeObserver(updateChatBodyShift);
		resizeObserver.observe(workspace);
		resizeObserver.observe(chatBody);
		if (panel) resizeObserver.observe(panel);

		return () => resizeObserver.disconnect();
	}, [commitChatBodyShift, isEnvironmentPanelOpen]);

	const chatBodyTransition = shouldReduceMotion
		? CHAT_BODY_REDUCED_MOTION_TRANSITION
		: isEnvironmentPanelOpen
			? CHAT_BODY_OPEN_TRANSITION
			: CHAT_BODY_CLOSE_TRANSITION;
	const composerPlaceholder = session.status === "stopped"
		? "Resume this session"
		: session.status === "pr-open"
			? session.pullRequestNumber
				? `Ask about pull request #${session.pullRequestNumber}`
				: "Ask about the pull request"
			: session.status === "merged"
				? "Ask about the merged changes"
				: `Message ${agent.name}`;

	return (
		<div
			className="relative flex h-full min-h-0 min-w-0 flex-1 overflow-hidden bg-background text-foreground"
			ref={workspaceRef}
		>
			<section
				aria-label={`Conversation: ${session.title}`}
				className="flex min-h-0 min-w-0 flex-1 flex-col"
				data-testid="asx-queue-conversation"
			>
				<QueueConversationHeader
					agent={agent}
					isEnvironmentPanelOpen={isEnvironmentPanelOpen}
					onEnvironmentPanelToggle={() => setIsEnvironmentPanelOpen((current) => !current)}
				/>
				<motion.div
					animate={{ transform: `translateX(${chatBodyShift}px)` }}
					className="mx-auto flex min-h-0 w-full max-w-[800px] flex-1 flex-col px-3"
					data-testid="asx-queue-chat-body"
					initial={false}
					ref={chatBodyRef}
					style={shouldReduceMotion ? undefined : { willChange: "transform" }}
					transition={chatBodyTransition}
				>
					<ChatMessages
						contentBottomPadding="32px"
						contentTopPadding="32px"
						conversationContextRef={conversationContextRef}
						hideScrollbar={false}
						messageMode="ask"
						resizeTarget={awaitingQuestion ? "bottom" : "follow"}
						scrollSpacerRef={scrollSpacerRef}
						showAwaitingIndicator={Boolean(awaitingQuestion)}
						showFeedbackActions={false}
						showFollowUpSuggestions={false}
						uiMessages={session.messages}
					/>
					<div className="sticky bottom-0 z-10 shrink-0 bg-background/90 backdrop-blur">
						{awaitingQuestion ? (
							<>
								<QuestionCard
									isSubmitting={isSubmittingAnswer}
									onSubmit={(answers) => void handleAnswerQuestion(answers)}
									questions={awaitingQuestion.questions}
								/>
								<QuestionCardShortcutsFooter />
							</>
						) : (
							<>
								<QueueSessionContextBar
									onDismissFileChanges={onDismissFileChanges}
									onJiraColumnChange={onJiraColumnChange}
									session={session}
								/>
								<RovoAppComposer
									composerStatus="ready"
									experimentalDarkCta
									hideSourceAndModelControls
									micStream={realtime.micStream}
									onStop={async () => realtime.disconnect()}
									onSubmit={onSubmit}
									onToggleRealtimeVoice={handleToggleRealtimeVoice}
									placeholder={composerPlaceholder}
									realtimeVoiceActive={realtime.voiceState !== "idle"}
										realtimeVoiceState={realtime.voiceState}
									/>
								<Footer />
							</>
						)}
					</div>
				</motion.div>
			</section>
			<AnimatePresence initial={false}>
				{isEnvironmentPanelOpen ? (
					<QueueEnvironmentPanel
						agent={agent}
						key="environment-panel"
						onClose={() => setIsEnvironmentPanelOpen(false)}
						session={session}
					/>
				) : null}
			</AnimatePresence>
		</div>
	);
}
