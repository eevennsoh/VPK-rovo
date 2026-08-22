"use client";

import { useReducedMotion } from "motion/react";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { WorkItemData } from "@/app/contexts/context-work-item-modal";
import type { JiraWorkItemState } from "@/components/blocks/jira-work-item/data/session-state";
import type { JiraKanbanColumnData } from "@/components/blocks/jira-kanban";
import type { JiraForYouSection } from "@/components/projects/jira-for-you/jira-for-you-types";

import {
	createJiraGoldenJourneysV3BoardColumns,
	createJiraGoldenJourneysV3ReviewerApprovals,
	createJiraGoldenJourneysV3StoryState,
	createJiraGoldenJourneysV3StoryWorkItem,
	createJiraGoldenJourneysV3WorkspaceSections,
	evaluateJiraGoldenJourneysV3MergeGate,
	getJiraGoldenJourneysV3StoryChapterForStatus,
	getJiraGoldenJourneysV3StoryColumn,
	JIRA_GOLDEN_JOURNEYS_V3_REQUIRED_APPROVAL_COUNT,
	resolveJiraGoldenJourneysV3MergeStatus,
	type JiraGoldenJourneysV3ApprovalStep,
	type JiraGoldenJourneysV3CiStatus,
	type JiraGoldenJourneysV3FixStep,
	type JiraGoldenJourneysV3MergeGate,
	type JiraGoldenJourneysV3MergeStatus,
	type JiraGoldenJourneysV3ReviewerApproval,
	type JiraGoldenJourneysV3ReviewStep,
	type JiraGoldenJourneysV3StoryChapter,
	type JiraGoldenJourneysV3StoryStateOptions,
} from "./data/hotfix-story";

const REVIEW_SEQUENCE = {
	queued: { next: "running", delayMs: 1_200 },
	running: { next: "unit-passed", delayMs: 1_500 },
	"unit-passed": { next: "settling", delayMs: 1_300 },
	settling: { next: "failed", delayMs: 1_600 },
} as const satisfies Record<
	Exclude<JiraGoldenJourneysV3ReviewStep, "failed">,
	{ next: JiraGoldenJourneysV3ReviewStep; delayMs: number }
>;

const FIX_SEQUENCE = {
	repairing: { next: "complete", delayMs: 4_000 },
} as const satisfies Record<
	Exclude<JiraGoldenJourneysV3FixStep, "failed" | "complete">,
	{ next: JiraGoldenJourneysV3FixStep; delayMs: number }
>;

const APPROVAL_DELAY_MS = 1_600;
const AUTO_MERGE_DELAY_MS = 1_200;

export interface JiraGoldenJourneysV3StoryController {
	approvalCount: number;
	approvalStep: JiraGoldenJourneysV3ApprovalStep;
	approvals: readonly JiraGoldenJourneysV3ReviewerApproval[];
	autoFixEnabled: boolean;
	autoMergeEnabled: boolean;
	boardColumns: readonly JiraKanbanColumnData[];
	chapter: JiraGoldenJourneysV3StoryChapter;
	chapterRevision: number;
	ciStatus: JiraGoldenJourneysV3CiStatus;
	fixStep: JiraGoldenJourneysV3FixStep;
	initialState: JiraWorkItemState;
	insightsRevision: number;
	launchId: number;
	mergeGate: JiraGoldenJourneysV3MergeGate;
	mergeStatus: JiraGoldenJourneysV3MergeStatus;
	pullRequestMerged: boolean;
	requiredApprovalCount: number;
	resetCurrentChapter: () => void;
	resetStory: () => void;
	reviewStep: JiraGoldenJourneysV3ReviewStep;
	sections: readonly JiraForYouSection[];
	selectChapter: (chapter: JiraGoldenJourneysV3StoryChapter) => void;
	setAutoFixEnabled: (enabled: boolean) => void;
	setAutoMergeEnabled: (enabled: boolean) => void;
	toggleAutoFix: () => void;
	toggleAutoMerge: () => void;
	updateBoardColumns: (columns: readonly JiraKanbanColumnData[]) => void;
	workItem: WorkItemData;
}

export function useJiraGoldenJourneysV3Story(active = true): JiraGoldenJourneysV3StoryController {
	const shouldReduceMotion = useReducedMotion() ?? false;
	const [chapter, setChapter] = useState<JiraGoldenJourneysV3StoryChapter>("terminal");
	const [chapterRevision, setChapterRevision] = useState(0);
	const [reviewStep, setReviewStep] = useState<JiraGoldenJourneysV3ReviewStep>("queued");
	const [fixStep, setFixStep] = useState<JiraGoldenJourneysV3FixStep>("failed");
	const [approvalStep, setApprovalStep] = useState<JiraGoldenJourneysV3ApprovalStep>(0);
	const [ciStatus, setCiStatus] = useState<JiraGoldenJourneysV3CiStatus>("running");
	const [autoFixEnabled, setAutoFixEnabled] = useState(false);
	const [autoMergeEnabled, setAutoMergeEnabled] = useState(false);
	const [pullRequestMerged, setPullRequestMerged] = useState(false);
	const [insightsRevision, setInsightsRevision] = useState(0);
	const [launchId, setLaunchId] = useState(0);
	const [boardColumns, setBoardColumns] = useState<JiraKanbanColumnData[]>(
		() => createJiraGoldenJourneysV3BoardColumns("terminal"),
	);

	const restartChapter = useCallback((targetChapter: JiraGoldenJourneysV3StoryChapter) => {
		switch (targetChapter) {
			case "terminal":
				break;
			case "build":
				setReviewStep("queued");
				setFixStep("failed");
				setApprovalStep(0);
				setCiStatus("running");
				setPullRequestMerged(false);
				break;
			case "review":
				setReviewStep("queued");
				setFixStep("failed");
				setApprovalStep(0);
				setCiStatus("running");
				setPullRequestMerged(false);
				break;
			case "fix":
				setFixStep("failed");
				setApprovalStep(0);
				setCiStatus("failed");
				setPullRequestMerged(false);
				break;
			case "approve":
				setApprovalStep(0);
				setPullRequestMerged(false);
				break;
			case "release":
				// Release is a read-only reveal of the merge rule result. It must not
				// change CI, approvals, automation settings, or merge state.
				break;
		}
		setChapterRevision((current) => current + 1);
		setLaunchId((current) => current + 1);
	}, []);

	const selectChapter = useCallback((nextChapter: JiraGoldenJourneysV3StoryChapter) => {
		if (nextChapter === chapter) {
			restartChapter(nextChapter);
			return;
		}

		// Navigating back to an authored pre-merge chapter invalidates later
		// workflow evidence. Forward navigation preserves the facts already earned.
		if (nextChapter === "build" || nextChapter === "review") {
			restartChapter(nextChapter);
		} else if (nextChapter === "fix") {
			setFixStep(ciStatus === "passed" ? "complete" : "failed");
			setApprovalStep(0);
			if (ciStatus !== "passed") setCiStatus("failed");
			setPullRequestMerged(false);
		} else if (nextChapter === "approve" && chapter !== "approve") {
			setApprovalStep(0);
			setPullRequestMerged(false);
		}

		setChapter(nextChapter);
		setLaunchId((current) => current + 1);
		setBoardColumns((current) => createJiraGoldenJourneysV3BoardColumns(nextChapter, current));
	}, [chapter, ciStatus, restartChapter]);

	const resetCurrentChapter = useCallback(() => {
		restartChapter(chapter);
	}, [chapter, restartChapter]);

	const resetStory = useCallback(() => {
		setChapter("terminal");
		setChapterRevision((current) => current + 1);
		setReviewStep("queued");
		setFixStep("failed");
		setApprovalStep(0);
		setCiStatus("running");
		setAutoFixEnabled(false);
		setAutoMergeEnabled(false);
		setPullRequestMerged(false);
		setInsightsRevision((current) => current + 1);
		setLaunchId((current) => current + 1);
		setBoardColumns(createJiraGoldenJourneysV3BoardColumns("terminal"));
	}, []);

	const toggleAutoFix = useCallback(() => {
		setAutoFixEnabled((current) => !current);
	}, []);

	const toggleAutoMerge = useCallback(() => {
		setAutoMergeEnabled((current) => !current);
	}, []);

	useEffect(() => {
		if (!active || chapter !== "review" || reviewStep === "failed") return undefined;
		if (shouldReduceMotion) {
			setReviewStep("failed");
			setCiStatus("failed");
			setLaunchId((current) => current + 1);
			return undefined;
		}
		const transition = REVIEW_SEQUENCE[reviewStep];
		const timeoutId = window.setTimeout(() => {
			setReviewStep(transition.next);
			if (transition.next === "failed") setCiStatus("failed");
			setLaunchId((current) => current + 1);
		}, transition.delayMs);
		return () => window.clearTimeout(timeoutId);
	}, [active, chapter, reviewStep, shouldReduceMotion]);

	useEffect(() => {
		if (!active || chapter !== "fix" || !autoFixEnabled || fixStep !== "failed") return;
		setFixStep(shouldReduceMotion ? "complete" : "repairing");
		setCiStatus(shouldReduceMotion ? "passed" : "repairing");
		setLaunchId((current) => current + 1);
	}, [active, autoFixEnabled, chapter, fixStep, shouldReduceMotion]);

	useEffect(() => {
		if (!active || chapter !== "fix" || fixStep !== "repairing") return undefined;
		const transition = FIX_SEQUENCE[fixStep];
		const timeoutId = window.setTimeout(() => {
			setFixStep(transition.next);
			setCiStatus("passed");
			setLaunchId((current) => current + 1);
		}, transition.delayMs);
		return () => window.clearTimeout(timeoutId);
	}, [active, chapter, fixStep]);

	useEffect(() => {
		if (!active || chapter !== "approve" || ciStatus !== "passed" || approvalStep === 2) {
			return undefined;
		}
		if (shouldReduceMotion) {
			setApprovalStep(2);
			setLaunchId((current) => current + 1);
			return undefined;
		}
		const timeoutId = window.setTimeout(() => {
			setApprovalStep((current) => current === 0 ? 1 : 2);
			setLaunchId((current) => current + 1);
		}, APPROVAL_DELAY_MS);
		return () => window.clearTimeout(timeoutId);
	}, [active, approvalStep, chapter, ciStatus, shouldReduceMotion]);

	const mergeGate = useMemo(
		() => evaluateJiraGoldenJourneysV3MergeGate(ciStatus, approvalStep),
		[approvalStep, ciStatus],
	);

	useEffect(() => {
		if (!active || !autoMergeEnabled || !mergeGate.canMerge || pullRequestMerged) return undefined;
		if (shouldReduceMotion) {
			setPullRequestMerged(true);
			setLaunchId((current) => current + 1);
			return undefined;
		}
		const timeoutId = window.setTimeout(() => {
			setPullRequestMerged(true);
			setLaunchId((current) => current + 1);
		}, AUTO_MERGE_DELAY_MS);
		return () => window.clearTimeout(timeoutId);
	}, [active, autoMergeEnabled, mergeGate.canMerge, pullRequestMerged, shouldReduceMotion]);

	const updateBoardColumns = useCallback((nextColumns: readonly JiraKanbanColumnData[]) => {
		const storyColumn = getJiraGoldenJourneysV3StoryColumn(nextColumns);
		const nextChapter = storyColumn
			? getJiraGoldenJourneysV3StoryChapterForStatus(storyColumn)
			: null;
		setBoardColumns(createJiraGoldenJourneysV3BoardColumns(nextChapter ?? chapter, nextColumns));
		if (nextChapter && nextChapter !== chapter) selectChapter(nextChapter);
	}, [chapter, selectChapter]);

	const approvals = useMemo(
		() => createJiraGoldenJourneysV3ReviewerApprovals(approvalStep),
		[approvalStep],
	);
	const mergeStatus = resolveJiraGoldenJourneysV3MergeStatus({
		approvalCount: approvalStep,
		autoMergeEnabled,
		ciStatus,
		pullRequestMerged,
	});
	const stateOptions = useMemo<JiraGoldenJourneysV3StoryStateOptions>(() => ({
		approvalStep,
		autoFixEnabled,
		autoMergeEnabled,
		ciStatus,
		fixStep,
		pullRequestMerged,
		reviewStep,
	}), [
		approvalStep,
		autoFixEnabled,
		autoMergeEnabled,
		ciStatus,
		fixStep,
		pullRequestMerged,
		reviewStep,
	]);
	const initialState = useMemo(
		() => createJiraGoldenJourneysV3StoryState(chapter, stateOptions),
		[chapter, stateOptions],
	);
	const workItem = useMemo(
		() => createJiraGoldenJourneysV3StoryWorkItem(chapter, stateOptions),
		[chapter, stateOptions],
	);
	const sections = useMemo(() => createJiraGoldenJourneysV3WorkspaceSections(chapter), [chapter]);

	return {
		approvalCount: approvalStep,
		approvalStep,
		approvals,
		autoFixEnabled,
		autoMergeEnabled,
		boardColumns,
		chapter,
		chapterRevision,
		ciStatus,
		fixStep,
		initialState,
		insightsRevision,
		launchId,
		mergeGate,
		mergeStatus,
		pullRequestMerged,
		requiredApprovalCount: JIRA_GOLDEN_JOURNEYS_V3_REQUIRED_APPROVAL_COUNT,
		resetCurrentChapter,
		resetStory,
		reviewStep,
		sections,
		selectChapter,
		setAutoFixEnabled,
		setAutoMergeEnabled,
		toggleAutoFix,
		toggleAutoMerge,
		updateBoardColumns,
		workItem,
	};
}
