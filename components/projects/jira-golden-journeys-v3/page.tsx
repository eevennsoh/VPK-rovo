"use client";

import { useCallback, useMemo, useState } from "react";

import { RovoChatProvider } from "@/app/contexts/context-rovo-chat";
import { Gallery, type GalleryItem } from "@/components/blocks/gallery";
import ExperimentalJiraKanbanPage from "@/components/blocks/jira-kanban/experimental/page";
import { ExperimentalV3JiraWorkItem } from "@/components/blocks/jira-work-item/experimental-v3/experimental-v3-jira-work-item";
import { JGP_CHAT_AGENT_PROFILES } from "@/components/projects/jira-golden-journeys-v1/data/agent-chat-data";
import { JgpRovoOverlay } from "@/components/projects/jira-golden-journeys-v1/components/jira-golden-journeys-v1-rovo-overlay";
import { useTerminalDemo } from "@/components/projects/jira-golden-journeys-v1/hooks/use-terminal-demo";

import { JIRA_GOLDEN_JOURNEYS_V3_GALLERY_ITEMS } from "./data/gallery-items";
import { createJiraGoldenJourneysV3InsightsSnapshot } from "./data/jira-insights";
import {
	JIRA_GOLDEN_JOURNEYS_V3_CLAUDE_SESSION_ID,
	JIRA_GOLDEN_JOURNEYS_V3_STATUS_PHASES,
	JIRA_GOLDEN_JOURNEYS_V3_STORY_BOARD_AGENTS,
	JIRA_GOLDEN_JOURNEYS_V3_STORY_COMPOSER_AGENTS,
	resolveJiraGoldenJourneysV3PullRequestChecks,
} from "./data/hotfix-story";
import type { JiraGoldenJourneysV3CiStatus } from "./data/story-model";
import {
	PullRequestContextBar,
	type PullRequestContextBarCiCheck,
	type PullRequestContextBarCiStatus,
} from "./pull-request-context-bar";
import {
	JiraGoldenJourneysV3CompactStoryControls,
	JiraGoldenJourneysV3StoryControls,
} from "./story-controls";
import { JiraGoldenJourneysV3TerminalStory } from "./terminal-story";
import {
	JIRA_GOLDEN_JOURNEYS_V3_TERMINAL_STEP_COUNT,
	JIRA_GOLDEN_JOURNEYS_V3_TERMINAL_STORY,
} from "./data/terminal-story";
import {
	useJiraGoldenJourneysV3Story,
	type JiraGoldenJourneysV3StoryController,
} from "./use-hotfix-story";

function summarizeCiChecks(
	checks: readonly PullRequestContextBarCiCheck[],
	status: PullRequestContextBarCiStatus,
	storyCiStatus: JiraGoldenJourneysV3CiStatus,
): string {
	const failed = checks.filter((check) => check.status === "failed").length;
	const passed = checks.filter((check) => check.status === "passed").length;
	const inProgress = checks.filter((check) => (
		check.status === "running" || check.status === "queued"
	)).length;
	if (failed > 0) {
		return `${failed} failed, ${passed} passed`;
	}
	if (storyCiStatus === "repairing" && inProgress > 0) {
		return `${passed} passed, ${inProgress} rerunning`;
	}
	if (status === "running" && inProgress > 0 && passed > 0) {
		return `${passed} passed, ${inProgress} in progress`;
	}
	if (status === "passed") {
		return `${passed} checks passed`;
	}
	return `${checks.length} CI checks`;
}

function getCiPresentation(
	controller: JiraGoldenJourneysV3StoryController,
): {
	checks: readonly PullRequestContextBarCiCheck[];
	status: PullRequestContextBarCiStatus;
	summary: string;
} {
	const checks = resolveJiraGoldenJourneysV3PullRequestChecks(controller.chapter, {
		approvalStep: controller.approvalStep,
		autoFixEnabled: controller.autoFixEnabled,
		autoMergeEnabled: controller.autoMergeEnabled,
		ciStatus: controller.ciStatus,
		fixStep: controller.fixStep,
		pullRequestMerged: controller.pullRequestMerged,
		reviewStep: controller.reviewStep,
	});
	const status: PullRequestContextBarCiStatus = controller.ciStatus === "failed"
		? "failed"
		: controller.ciStatus === "passed"
			? "passed"
			: "running";
	return {
		checks,
		status,
		summary: summarizeCiChecks(checks, status, controller.ciStatus),
	};
}

function getRevealActivityEntryId(controller: JiraGoldenJourneysV3StoryController): string {
	switch (controller.chapter) {
		case "terminal":
		case "track":
		case "build":
			return "story-channel-claude-pr-handoff";
		case "review":
			return controller.reviewStep === "failed" ? "story-ci-failed" : "story-pr-review";
		case "fix":
			return controller.fixStep === "complete"
				? "story-ci-passed"
				: controller.fixStep === "repairing"
					? "story-ci-repair"
					: "story-ci-failed";
		case "approve":
			return controller.approvalStep === 2
				? "story-jordan-approved"
				: controller.approvalStep === 1
					? "story-priya-approved"
					: "story-pr-review";
		case "release":
			return controller.pullRequestMerged ? "story-pr-merged" : "story-pr-review";
	}
}

function JiraGoldenJourneysV3PullRequestBar({
	controller,
	onDismiss,
}: Readonly<{
	controller: JiraGoldenJourneysV3StoryController;
	onDismiss: () => void;
}>): React.ReactElement {
	const ci = getCiPresentation(controller);
	return (
		<PullRequestContextBar
			additions={86}
			approvalsCurrent={controller.approvalCount}
			approvalsRequired={controller.requiredApprovalCount}
			autoFixEnabled={controller.autoFixEnabled}
			autoMergeEnabled={controller.autoMergeEnabled}
			branch="feature/shop-4821-guest-checkout"
			ciChecks={ci.checks}
			ciStatus={ci.status}
			ciSummary={ci.summary}
			deletions={21}
			mergeState={controller.mergeStatus}
			onAutoFixChange={controller.setAutoFixEnabled}
			onAutoMergeChange={controller.setAutoMergeEnabled}
			onDismiss={onDismiss}
			repository="eevensoh/vpk-rovo"
		/>
	);
}

function JiraGoldenJourneysV3TrackStage({
	controller,
}: Readonly<{
	controller: JiraGoldenJourneysV3StoryController;
}>): React.ReactElement {
	return (
		<div className="relative left-1/2 flex h-full min-h-0 w-[100cqw] -translate-x-1/2 flex-col overflow-hidden pt-4 [&>div]:h-full [&>div]:min-h-0">
			<ExperimentalJiraKanbanPage
				agents={JIRA_GOLDEN_JOURNEYS_V3_STORY_BOARD_AGENTS}
				ariaLabel="Track SHOP-4821 on the experimental Jira board. Scroll horizontally to review all statuses."
				boardColumns={controller.boardColumns}
				onBoardColumnsChange={controller.updateBoardColumns}
			/>
		</div>
	);
}

function JiraGoldenJourneysV3WorkItemStage({
	controller,
	onDismissPullRequestContext,
	showPullRequestContext,
}: Readonly<{
	controller: JiraGoldenJourneysV3StoryController;
	onDismissPullRequestContext: () => void;
	showPullRequestContext: boolean;
}>): React.ReactElement {
	const insightsSnapshot = useMemo(() => createJiraGoldenJourneysV3InsightsSnapshot(
		controller.chapter,
		{
			approvalStep: controller.approvalStep,
			ciStatus: controller.ciStatus,
			fixStep: controller.fixStep,
			pullRequestMerged: controller.pullRequestMerged,
			reviewStep: controller.reviewStep,
		},
		controller.insightsRevision,
	), [
		controller.approvalStep,
		controller.chapter,
		controller.ciStatus,
		controller.fixStep,
		controller.insightsRevision,
		controller.pullRequestMerged,
		controller.reviewStep,
	]);

	return (
		<div className="relative left-1/2 flex h-full min-h-0 w-[100cqw] -translate-x-1/2 items-start justify-center overflow-hidden px-8 pt-4 pb-4">
			<ExperimentalV3JiraWorkItem
				activitySessionThread={{
					parentSessionId: JIRA_GOLDEN_JOURNEYS_V3_CLAUDE_SESSION_ID,
					childSessionIds: [],
					visibleSessionIds: [JIRA_GOLDEN_JOURNEYS_V3_CLAUDE_SESSION_ID],
					autoScroll: controller.chapter !== "build",
					defaultRepliesExpanded: false,
				}}
				composerAgents={JIRA_GOLDEN_JOURNEYS_V3_STORY_COMPOSER_AGENTS}
				composerContextBar={showPullRequestContext
					? (
						<JiraGoldenJourneysV3PullRequestBar
							controller={controller}
							onDismiss={onDismissPullRequestContext}
						/>
					)
					: undefined}
				composerDelivery="broadcast-active-agents"
				initialPreset={controller.initialState.preset}
				initialState={controller.initialState}
				initialStateRevision={controller.launchId}
				insightsSnapshot={insightsSnapshot}
				preserveActiveSessionOnHydration
				inlineSurface="card-fill"
				presentation="inline"
				revealActivityEntryId={getRevealActivityEntryId(controller)}
				revealActivityKey={`${controller.chapter}:${controller.launchId}`}
				stageKey={`${controller.chapter}:${controller.chapterRevision}`}
				statusPhases={JIRA_GOLDEN_JOURNEYS_V3_STATUS_PHASES}
				workItem={controller.workItem}
			/>
		</div>
	);
}

export default function JiraGoldenJourneysV3Page(): React.ReactElement {
	const [selectedId, setSelectedId] = useState(JIRA_GOLDEN_JOURNEYS_V3_GALLERY_ITEMS[0]?.id ?? "");
	const [showPullRequestContext, setShowPullRequestContext] = useState(true);
	const [terminalTheme, setTerminalTheme] = useState<"dark" | "light">("dark");
	const storyController = useJiraGoldenJourneysV3Story(selectedId === "work-item");
	const isTerminalChapter = storyController.chapter === "terminal";
	const isWorkItemStage = selectedId === "work-item"
		&& storyController.chapter !== "terminal"
		&& storyController.chapter !== "track";
	const terminalController = useTerminalDemo(
		selectedId === "work-item" && isTerminalChapter,
		{ story: JIRA_GOLDEN_JOURNEYS_V3_TERMINAL_STORY },
	);
	const terminalStep = Math.min(
		terminalController.state.beatIndex + 2,
		JIRA_GOLDEN_JOURNEYS_V3_TERMINAL_STEP_COUNT,
	);
	const handleSelectedChange = useCallback((nextSelectedId: string) => {
		storyController.resetStory();
		setShowPullRequestContext(true);
		setSelectedId(nextSelectedId);
	}, [storyController]);
	const handleReset = useCallback(() => {
		storyController.resetStory();
		setShowPullRequestContext(true);
	}, [storyController]);
	const handleTerminalThemeCycle = useCallback(() => {
		setTerminalTheme((current) => current === "dark" ? "light" : "dark");
	}, []);
	const renderSelectedItem = useCallback((item: GalleryItem): React.ReactNode => {
		if (item.id !== "work-item") return null;
		if (storyController.chapter === "terminal") {
			return (
				<JiraGoldenJourneysV3TerminalStory
					controller={terminalController}
					resetKey={storyController.chapterRevision}
					theme={terminalTheme}
				/>
			);
		}
		if (storyController.chapter === "track") {
			return <JiraGoldenJourneysV3TrackStage controller={storyController} />;
		}
		return (
			<JiraGoldenJourneysV3WorkItemStage
				controller={storyController}
				onDismissPullRequestContext={() => setShowPullRequestContext(false)}
				showPullRequestContext={showPullRequestContext}
			/>
		);
	}, [showPullRequestContext, storyController, terminalController, terminalTheme]);
	const subtreeThemeProps = isTerminalChapter
		? {
				"data-subtree-theme": "",
				"data-color-mode": terminalTheme,
				"data-theme": `${terminalTheme}:${terminalTheme} spacing:spacing typography:typography shape:shape`,
			}
		: {};

	return (
		<RovoChatProvider
			agentProfiles={JGP_CHAT_AGENT_PROFILES}
			key={`${storyController.chapter}:${storyController.chapterRevision}`}
		>
			<div className="relative h-dvh w-full overflow-hidden bg-surface" {...subtreeThemeProps}>
				<Gallery
					items={JIRA_GOLDEN_JOURNEYS_V3_GALLERY_ITEMS}
					onReset={handleReset}
					title="Jira Golden Journeys v3"
					selectedId={selectedId}
					onSelectedChange={handleSelectedChange}
					renderSelectedItem={renderSelectedItem}
					showTopBarBorder={storyController.chapter === "terminal"}
					theme={isTerminalChapter ? terminalTheme : undefined}
					onThemeCycle={isTerminalChapter ? handleTerminalThemeCycle : undefined}
					topBarCenter={(
						<JiraGoldenJourneysV3StoryControls
							controller={storyController}
							terminalStep={terminalStep}
						/>
					)}
					topBarCenterCompact={(
						<JiraGoldenJourneysV3CompactStoryControls controller={storyController} />
					)}
				/>
			</div>
			<JgpRovoOverlay launcher={isWorkItemStage ? "hidden" : "auto"} />
		</RovoChatProvider>
	);
}
