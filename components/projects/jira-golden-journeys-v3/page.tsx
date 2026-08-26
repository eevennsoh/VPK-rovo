"use client";

import { useCallback, useMemo, useState } from "react";

import { RovoChatProvider } from "@/app/contexts/context-rovo-chat";
import { Gallery, type GalleryItem } from "@/components/blocks/gallery";
import type { JiraKanbanCardData, JiraKanbanColumnData } from "@/components/blocks/jira-kanban";
import ExperimentalJiraKanbanPage from "@/components/blocks/jira-kanban/experimental/page";
import type {
	PulseLooseWork,
	PulseWorkItem,
} from "@/components/blocks/jira-kanban/experimental/pulse/types";
import { ExperimentalV3JiraWorkItem } from "@/components/blocks/jira-work-item/experimental-v3/experimental-v3-jira-work-item";
import { JGP_CHAT_AGENT_PROFILES } from "@/components/projects/jira-golden-journeys-v1/data/agent-chat-data";
import { JgpRovoOverlay } from "@/components/projects/jira-golden-journeys-v1/components/jira-golden-journeys-v1-rovo-overlay";
import { useTerminalDemo } from "@/components/projects/jira-golden-journeys-v1/hooks/use-terminal-demo";

import { JIRA_GOLDEN_JOURNEYS_V3_GALLERY_ITEMS } from "./data/gallery-items";
import {
	createJiraGoldenJourneysV3Pay101BuildState,
	createJiraGoldenJourneysV3PayBoardColumns,
	JIRA_GOLDEN_JOURNEYS_V3_PAY_101_SESSION_ID,
	JIRA_GOLDEN_JOURNEYS_V3_PAY_101_UNCAPTURED_SESSION_ID,
	JIRA_GOLDEN_JOURNEYS_V3_PAY_101_WORK_ITEM,
	JIRA_GOLDEN_JOURNEYS_V3_PAY_BOARD_AGENTS,
	JIRA_GOLDEN_JOURNEYS_V3_PAY_COMPOSER_AGENTS,
	type JiraGoldenJourneysV3PresentationChapter,
} from "./data/presentation-story";
import {
	JIRA_GOLDEN_JOURNEYS_V3_RESUME_PROMPT,
	JIRA_GOLDEN_JOURNEYS_V3_TERMINAL_STEP_COUNT,
	JIRA_GOLDEN_JOURNEYS_V3_TERMINAL_STORY,
} from "./data/terminal-story";
import {
	JiraGoldenJourneysV3CompactStoryControls,
	JiraGoldenJourneysV3StoryControls,
} from "./story-controls";
import { JiraGoldenJourneysV3TerminalStory } from "./terminal-story";

const PAY_101_ISSUE_KEY = "PAY-101";
const PAY_STATUS_PHASES = ["Review", "In progress", "In review", "To do", "Done"] as const;

function JiraGoldenJourneysV3TrackLearnStage({
	boardColumns,
	chapter,
	onBoardColumnsChange,
	onChapterChange,
	onResumeLooseWork,
}: Readonly<{
	boardColumns: readonly JiraKanbanColumnData[];
	chapter: "learn" | "track";
	onBoardColumnsChange: (columns: readonly JiraKanbanColumnData[]) => void;
	onChapterChange: (chapter: JiraGoldenJourneysV3PresentationChapter) => void;
	onResumeLooseWork: (item: PulseLooseWork) => void;
}>): React.ReactElement {
	const openBuild = useCallback((workItem: PulseWorkItem | JiraKanbanCardData) => {
		if (("key" in workItem ? workItem.key : workItem.code) === PAY_101_ISSUE_KEY) {
			onChapterChange("build");
		}
	}, [onChapterChange]);

	return (
		<div className="relative left-1/2 flex h-full min-h-0 w-[100cqw] -translate-x-1/2 flex-col overflow-hidden pt-4 [&>div]:h-full [&>div]:min-h-0">
			<ExperimentalJiraKanbanPage
				activeCardCode={PAY_101_ISSUE_KEY}
				agents={JIRA_GOLDEN_JOURNEYS_V3_PAY_BOARD_AGENTS}
				ariaLabel="Track the Payments SDK v2 migration. Scroll horizontally to review all delivery statuses."
				boardColumns={boardColumns}
				isInsightsWorkItemInteractive={(workItem) => workItem.key === PAY_101_ISSUE_KEY}
				isLooseWorkResumable={(item) => item.id === JIRA_GOLDEN_JOURNEYS_V3_PAY_101_UNCAPTURED_SESSION_ID}
				mode={chapter === "learn" ? "pulse" : "board"}
				onBoardColumnsChange={onBoardColumnsChange}
				onCardClick={openBuild}
				onInsightsWorkItemClick={openBuild}
				onModeChange={(mode) => onChapterChange(mode === "pulse" ? "learn" : "track")}
				onResumeLooseWork={onResumeLooseWork}
			/>
		</div>
	);
}

function JiraGoldenJourneysV3BuildStage({
	revision,
}: Readonly<{ revision: number }>): React.ReactElement {
	const initialState = useMemo(() => createJiraGoldenJourneysV3Pay101BuildState(), []);

	return (
		<div className="relative left-1/2 flex h-full min-h-0 w-[100cqw] -translate-x-1/2 items-start justify-center overflow-hidden px-8 pt-4 pb-4">
			<ExperimentalV3JiraWorkItem
				activitySessionThread={{
					parentSessionId: JIRA_GOLDEN_JOURNEYS_V3_PAY_101_SESSION_ID,
					childSessionIds: [],
					visibleSessionIds: [JIRA_GOLDEN_JOURNEYS_V3_PAY_101_SESSION_ID],
					autoScroll: false,
					defaultRepliesExpanded: false,
				}}
				composerAgents={JIRA_GOLDEN_JOURNEYS_V3_PAY_COMPOSER_AGENTS}
				composerDelivery="broadcast-active-agents"
				initialPreset={initialState.preset}
				initialState={initialState}
				initialStateRevision={revision}
				preserveActiveSessionOnHydration
				inlineSurface="card-fill"
				presentation="inline"
				stageKey={`build:${revision}`}
				statusPhases={PAY_STATUS_PHASES}
				workItem={JIRA_GOLDEN_JOURNEYS_V3_PAY_101_WORK_ITEM}
			/>
		</div>
	);
}

export default function JiraGoldenJourneysV3Page(): React.ReactElement {
	const [selectedId, setSelectedId] = useState(JIRA_GOLDEN_JOURNEYS_V3_GALLERY_ITEMS[0]?.id ?? "");
	const [chapter, setChapter] = useState<JiraGoldenJourneysV3PresentationChapter>("track");
	const [stageRevision, setStageRevision] = useState(0);
	const [terminalTheme, setTerminalTheme] = useState<"dark" | "light">("dark");
	const [boardColumns, setBoardColumns] = useState(createJiraGoldenJourneysV3PayBoardColumns);
	const [resumePromptCopied, setResumePromptCopied] = useState(false);
	const [resumeAnnouncement, setResumeAnnouncement] = useState("");
	const isTerminalChapter = chapter === "terminal";
	const isWorkItemStage = chapter === "build";
	const terminalController = useTerminalDemo(
		selectedId === "work-item" && isTerminalChapter,
		{ story: JIRA_GOLDEN_JOURNEYS_V3_TERMINAL_STORY },
	);
	const terminalStep = Math.min(
		terminalController.state.beatIndex + 2,
		JIRA_GOLDEN_JOURNEYS_V3_TERMINAL_STEP_COUNT,
	);
	const handleChapterChange = useCallback((nextChapter: JiraGoldenJourneysV3PresentationChapter) => {
		if (chapter === nextChapter) {
			setStageRevision((current) => current + 1);
		}
		setChapter(nextChapter);
	}, [chapter]);
	const resetStory = useCallback(() => {
		setChapter("track");
		setStageRevision((current) => current + 1);
		setBoardColumns(createJiraGoldenJourneysV3PayBoardColumns());
		setResumePromptCopied(false);
		setResumeAnnouncement("");
	}, []);
	const handleSelectedChange = useCallback((nextSelectedId: string) => {
		resetStory();
		setSelectedId(nextSelectedId);
	}, [resetStory]);
	const handleTerminalThemeCycle = useCallback(() => {
		setTerminalTheme((current) => current === "dark" ? "light" : "dark");
	}, []);
	const handleResumeLooseWork = useCallback(async (item: PulseLooseWork) => {
		if (
			item.kind !== "agent-session"
			|| item.id !== JIRA_GOLDEN_JOURNEYS_V3_PAY_101_UNCAPTURED_SESSION_ID
		) return;
		try {
			await navigator.clipboard.writeText(JIRA_GOLDEN_JOURNEYS_V3_RESUME_PROMPT);
			setResumePromptCopied(true);
			setResumeAnnouncement("Resume prompt copied. Open Terminal to paste it and restore the local Claude session.");
		} catch {
			setResumePromptCopied(false);
			setResumeAnnouncement("The resume prompt could not be copied. Check clipboard permissions and try again.");
		}
	}, []);
	const renderSelectedItem = useCallback((item: GalleryItem): React.ReactNode => {
		if (item.id !== "work-item") return null;
		if (chapter === "terminal") {
			return (
				<JiraGoldenJourneysV3TerminalStory
					controller={terminalController}
					promptCopied={resumePromptCopied}
					resetKey={stageRevision}
					theme={terminalTheme}
				/>
			);
		}
		if (chapter === "build") {
			return <JiraGoldenJourneysV3BuildStage revision={stageRevision} />;
		}
		return (
			<JiraGoldenJourneysV3TrackLearnStage
				boardColumns={boardColumns}
				chapter={chapter}
				onBoardColumnsChange={(columns) => setBoardColumns([...columns])}
				onChapterChange={handleChapterChange}
				onResumeLooseWork={(looseWork) => void handleResumeLooseWork(looseWork)}
			/>
		);
	}, [
		boardColumns,
		chapter,
		handleChapterChange,
		handleResumeLooseWork,
		resumePromptCopied,
		stageRevision,
		terminalController,
		terminalTheme,
	]);
	const subtreeThemeProps = isTerminalChapter
		? {
				"data-subtree-theme": "",
				"data-color-mode": terminalTheme,
				"data-theme": `${terminalTheme}:${terminalTheme} spacing:spacing typography:typography shape:shape`,
			}
		: {};

	return (
		<RovoChatProvider agentProfiles={JGP_CHAT_AGENT_PROFILES}>
			<div
				className="relative h-dvh w-full overflow-hidden bg-surface"
				data-flow-chapter={chapter}
				data-resume-prompt-copied={resumePromptCopied ? "true" : "false"}
				{...subtreeThemeProps}
			>
				<p aria-live="polite" className="sr-only" role="status">{resumeAnnouncement}</p>
				<Gallery
					items={JIRA_GOLDEN_JOURNEYS_V3_GALLERY_ITEMS}
					onReset={resetStory}
					title="Jira Golden Journeys v3"
					selectedId={selectedId}
					onSelectedChange={handleSelectedChange}
					renderSelectedItem={renderSelectedItem}
					showTopBarBorder={isTerminalChapter}
					theme={isTerminalChapter ? terminalTheme : undefined}
					onThemeCycle={isTerminalChapter ? handleTerminalThemeCycle : undefined}
					topBarCenter={(
						<JiraGoldenJourneysV3StoryControls
							chapter={chapter}
							onChapterChange={handleChapterChange}
							terminalStep={terminalStep}
						/>
					)}
					topBarCenterCompact={(
						<JiraGoldenJourneysV3CompactStoryControls
							chapter={chapter}
							onChapterChange={handleChapterChange}
						/>
					)}
				/>
			</div>
			<JgpRovoOverlay
				chat={isWorkItemStage ? "hidden" : "auto"}
				launcher={isWorkItemStage ? "hidden" : "auto"}
			/>
		</RovoChatProvider>
	);
}
