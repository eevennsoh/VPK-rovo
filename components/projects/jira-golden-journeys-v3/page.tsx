"use client";

import { useCallback, useMemo, useState } from "react";

import { RovoChatProvider } from "@/app/contexts/context-rovo-chat";
import { Gallery, type GalleryItem } from "@/components/blocks/gallery";
import { ExperimentalV3JiraWorkItem } from "@/components/blocks/jira-work-item/experimental-v3/experimental-v3-jira-work-item";
import { JGP_CHAT_AGENT_PROFILES } from "@/components/projects/jira-golden-journeys-v1/data/agent-chat-data";
import { useTerminalDemo } from "@/components/projects/jira-golden-journeys-v1/hooks/use-terminal-demo";

import { JIRA_GOLDEN_JOURNEYS_V3_GALLERY_ITEMS } from "./data/gallery-items";
import { createJiraGoldenJourneysV3InsightsSnapshot } from "./data/jira-insights";
import {
	JIRA_GOLDEN_JOURNEYS_V3_CLAUDE_SESSION_ID,
	JIRA_GOLDEN_JOURNEYS_V3_STATUS_PHASES,
	JIRA_GOLDEN_JOURNEYS_V3_STORY_COMPOSER_AGENTS,
} from "./data/hotfix-story";
import {
	PullRequestContextBar,
	type PullRequestContextBarCiCounts,
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

function getCiPresentation(
	controller: JiraGoldenJourneysV3StoryController,
): {
	counts: PullRequestContextBarCiCounts;
	status: PullRequestContextBarCiStatus;
	summary: string;
} {
	if (controller.ciStatus === "failed") {
		return {
			counts: { failed: 1, inProgress: 0, passed: 2, skipped: 0 },
			status: "failed",
			summary: "1 failed, 2 passed",
		};
	}
	if (controller.ciStatus === "repairing") {
		return {
			counts: { failed: 0, inProgress: 1, passed: 2, skipped: 0 },
			status: "running",
			summary: "2 passed, 1 rerunning",
		};
	}
	if (controller.ciStatus === "passed") {
		return {
			counts: { failed: 0, inProgress: 0, passed: 3, skipped: 0 },
			status: "passed",
			summary: "3 checks passed",
		};
	}

	if (controller.chapter === "review" && controller.reviewStep === "unit-passed") {
		return {
			counts: { failed: 0, inProgress: 2, passed: 1, skipped: 0 },
			status: "running",
			summary: "1 passed, 2 in progress",
		};
	}
	if (controller.chapter === "review" && controller.reviewStep === "settling") {
		return {
			counts: { failed: 0, inProgress: 1, passed: 2, skipped: 0 },
			status: "running",
			summary: "2 passed, 1 in progress",
		};
	}
	return {
		counts: { failed: 0, inProgress: 3, passed: 0, skipped: 0 },
		status: "running",
		summary: "3 checks in progress",
	};
}

function getRevealActivityEntryId(controller: JiraGoldenJourneysV3StoryController): string {
	switch (controller.chapter) {
		case "terminal":
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
			ciCounts={ci.counts}
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
		return storyController.chapter === "terminal"
			? (
				<JiraGoldenJourneysV3TerminalStory
					controller={terminalController}
					resetKey={storyController.chapterRevision}
					theme={terminalTheme}
				/>
			)
			: (
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
		</RovoChatProvider>
	);
}
