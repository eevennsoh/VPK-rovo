"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type { WorkItemData } from "@/app/contexts/context-work-item-modal";
import type { JiraWorkItemState } from "@/components/blocks/jira-work-item/data/session-state";
import type { JiraKanbanColumnData } from "@/components/blocks/jira-kanban";
import type { JiraForYouSection } from "@/components/projects/jira-for-you/jira-for-you-types";
import {
	createJiraAgentsBoardColumns,
	createJiraAgentsStoryState,
	createJiraAgentsStoryWorkItem,
	createJiraAgentsWorkspaceSections,
	getJiraAgentsStoryChapterForStatus,
	getJiraAgentsStoryColumn,
	JIRA_AGENTS_PULL_REQUEST_IDENTITY,
	type JiraAgentsDescriptionSkillPhase,
	type JiraAgentsReviewStep,
	type JiraAgentsStoryChapter,
} from "./data/hotfix-story";
import {
	createJiraAgentsOrchestrationState,
	type JiraAgentsOrchestrationStep,
} from "./data/orchestration-state";

const ORCHESTRATION_SEQUENCE = {
	"agents-working": { next: "comment", delayMs: 1_500 },
	comment: { next: "reaction-1", delayMs: 1_200 },
	"reaction-1": { next: "reaction-2", delayMs: 1_000 },
	"reaction-2": { next: "lead", delayMs: 1_500 },
	lead: { next: "consult", delayMs: 1_800 },
	consult: { next: "complete", delayMs: 1_500 },
} as const satisfies Record<
	Exclude<JiraAgentsOrchestrationStep, "idle" | "complete">,
	{ next: Exclude<JiraAgentsOrchestrationStep, "idle">; delayMs: number }
>;

const REVIEW_SEQUENCE = {
	queued: { next: "running", delayMs: 900 },
	running: { next: "failed", delayMs: 1_500 },
} as const satisfies Record<
	Exclude<JiraAgentsReviewStep, "failed">,
	{ next: JiraAgentsReviewStep; delayMs: number }
>;

const DESCRIPTION_SKILL_GENERATION_DELAY_MS = 4_000;

export type JiraAgentsPullRequestApprovalState = "available" | "approved";

export interface JiraAgentsStoryController {
	applyDescriptionSuggestion: () => void;
	approvePullRequest: (identity: string) => void;
	boardColumns: readonly JiraKanbanColumnData[];
	chapter: JiraAgentsStoryChapter;
	chapterRevision: number;
	descriptionSkillPhase: JiraAgentsDescriptionSkillPhase;
	descriptionImproved: boolean;
	dismissDescriptionSuggestion: () => void;
	initialState: JiraWorkItemState;
	invokeDescriptionSkill: () => void;
	launchId: number;
	orchestrationStep: JiraAgentsOrchestrationStep;
	pullRequestApprovalStates: Readonly<Record<string, JiraAgentsPullRequestApprovalState>>;
	resetCurrentChapter: () => void;
	reviewStep: JiraAgentsReviewStep;
	sections: readonly JiraForYouSection[];
	selectChapter: (chapter: JiraAgentsStoryChapter) => void;
	startOrchestration: () => void;
	updateBoardColumns: (columns: readonly JiraKanbanColumnData[]) => void;
	workItem: WorkItemData;
}

export function useJiraAgentsStory(active = true): JiraAgentsStoryController {
	const [chapter, setChapter] = useState<JiraAgentsStoryChapter>("intake");
	const [chapterRevision, setChapterRevision] = useState(0);
	const [descriptionSkillPhase, setDescriptionSkillPhase] = useState<JiraAgentsDescriptionSkillPhase>("idle");
	const [orchestrationStep, setOrchestrationStep] = useState<JiraAgentsOrchestrationStep>("idle");
	const [pullRequestApprovalStates, setPullRequestApprovalStates] = useState<
		Record<string, JiraAgentsPullRequestApprovalState>
	>({});
	const [reviewStep, setReviewStep] = useState<JiraAgentsReviewStep>("queued");
	const [launchId, setLaunchId] = useState(0);
	const [boardColumns, setBoardColumns] = useState<JiraKanbanColumnData[]>(
		() => createJiraAgentsBoardColumns("intake"),
	);

	const selectChapter = useCallback((nextChapter: JiraAgentsStoryChapter) => {
		if (nextChapter === chapter) {
			setChapterRevision((current) => current + 1);
		}
		setOrchestrationStep("idle");
		setChapter(nextChapter);
		setDescriptionSkillPhase(nextChapter === "intake" ? "idle" : "applied");
		setPullRequestApprovalStates(nextChapter === "approve"
			? { [JIRA_AGENTS_PULL_REQUEST_IDENTITY]: "available" }
			: {});
		setReviewStep("queued");
		setLaunchId((current) => current + 1);
		setBoardColumns((current) => createJiraAgentsBoardColumns(nextChapter, current));
	}, [chapter]);

	const resetCurrentChapter = useCallback(() => {
		selectChapter(chapter);
	}, [chapter, selectChapter]);

	const invokeDescriptionSkill = useCallback(() => {
		if (
			chapter !== "intake"
			|| descriptionSkillPhase === "running"
			|| descriptionSkillPhase === "awaiting-confirmation"
			|| descriptionSkillPhase === "applied"
		) return;
		setDescriptionSkillPhase("running");
		setLaunchId((current) => current + 1);
	}, [chapter, descriptionSkillPhase]);

	const applyDescriptionSuggestion = useCallback(() => {
		if (chapter !== "intake" || descriptionSkillPhase !== "awaiting-confirmation") return;
		setDescriptionSkillPhase("applied");
		setLaunchId((current) => current + 1);
	}, [chapter, descriptionSkillPhase]);

	const dismissDescriptionSuggestion = useCallback(() => {
		if (chapter !== "intake" || descriptionSkillPhase !== "awaiting-confirmation") return;
		setDescriptionSkillPhase("dismissed");
		setLaunchId((current) => current + 1);
	}, [chapter, descriptionSkillPhase]);

	const descriptionImproved = descriptionSkillPhase === "applied";

	const startOrchestration = useCallback(() => {
		if (chapter !== "intake" || !descriptionImproved || orchestrationStep !== "idle") return;
		setChapter("plan");
		setOrchestrationStep("agents-working");
		setPullRequestApprovalStates({});
		setReviewStep("queued");
		setLaunchId((current) => current + 1);
		setBoardColumns((current) => createJiraAgentsBoardColumns("plan", current));
	}, [chapter, descriptionImproved, orchestrationStep]);

	useEffect(() => {
		if (!active || chapter !== "intake" || descriptionSkillPhase !== "running") return undefined;
		const timeoutId = window.setTimeout(() => {
			setDescriptionSkillPhase("awaiting-confirmation");
			setLaunchId((current) => current + 1);
		}, DESCRIPTION_SKILL_GENERATION_DELAY_MS);
		return () => window.clearTimeout(timeoutId);
	}, [active, chapter, descriptionSkillPhase]);

	// These timers reveal authored state snapshots rather than animating layout,
	// so reduced motion keeps the same causal orchestration and CI evidence.
	useEffect(() => {
		if (!active || orchestrationStep === "idle") return undefined;
		if (orchestrationStep === "complete") {
			selectChapter("build");
			return undefined;
		}

		const transition = ORCHESTRATION_SEQUENCE[orchestrationStep];
		const timeoutId = window.setTimeout(() => {
			setOrchestrationStep(transition.next);
			setLaunchId((current) => current + 1);
		}, transition.delayMs);

		return () => window.clearTimeout(timeoutId);
	}, [active, orchestrationStep, selectChapter]);

	useEffect(() => {
		if (!active || chapter !== "review" || reviewStep === "failed") return undefined;
		const transition = REVIEW_SEQUENCE[reviewStep];
		const timeoutId = window.setTimeout(() => {
			setReviewStep(transition.next);
			setLaunchId((current) => current + 1);
		}, transition.delayMs);
		return () => window.clearTimeout(timeoutId);
	}, [active, chapter, reviewStep]);

	const approvePullRequest = useCallback((identity: string) => {
		if (
			chapter !== "approve"
			|| identity !== JIRA_AGENTS_PULL_REQUEST_IDENTITY
			|| pullRequestApprovalStates[identity] !== "available"
		) return;
		setPullRequestApprovalStates((current) => ({ ...current, [identity]: "approved" }));
		// Rehydrate the work-item session snapshot so Claude resolves its
		// waiting-on-user state. PR detail owns Guide progress by stable identity,
		// so this refresh updates approval evidence without remounting the Guide.
		setLaunchId((current) => current + 1);
	}, [chapter, pullRequestApprovalStates]);

	const updateBoardColumns = useCallback((nextColumns: readonly JiraKanbanColumnData[]) => {
		const storyColumn = getJiraAgentsStoryColumn(nextColumns);
		const nextChapter = storyColumn
			? getJiraAgentsStoryChapterForStatus(storyColumn)
			: null;
		const resolvedChapter = nextChapter ?? chapter;

		setBoardColumns(createJiraAgentsBoardColumns(resolvedChapter, nextColumns));
		if (nextChapter && nextChapter !== chapter) {
			setOrchestrationStep("idle");
			setChapter(nextChapter);
			setDescriptionSkillPhase(nextChapter === "intake" ? "idle" : "applied");
			setPullRequestApprovalStates(nextChapter === "approve"
				? { [JIRA_AGENTS_PULL_REQUEST_IDENTITY]: "available" }
				: {});
			setReviewStep("queued");
			setLaunchId((current) => current + 1);
		}
	}, [chapter]);

	const pullRequestApproved =
		pullRequestApprovalStates[JIRA_AGENTS_PULL_REQUEST_IDENTITY] === "approved";
	const initialState = useMemo(
		() => orchestrationStep === "idle"
			? createJiraAgentsStoryState(chapter, {
				descriptionSkillPhase,
				pullRequestApproved,
				reviewStep,
			})
			: createJiraAgentsOrchestrationState(orchestrationStep),
		[chapter, descriptionSkillPhase, orchestrationStep, pullRequestApproved, reviewStep],
	);
	const sections = useMemo(() => createJiraAgentsWorkspaceSections(chapter), [chapter]);
	const workItem = useMemo(
		() => createJiraAgentsStoryWorkItem(chapter, { descriptionSkillPhase }),
		[chapter, descriptionSkillPhase],
	);

	return {
		applyDescriptionSuggestion,
		approvePullRequest,
		boardColumns,
		chapter,
		chapterRevision,
		descriptionSkillPhase,
		descriptionImproved,
		dismissDescriptionSuggestion,
		initialState,
		invokeDescriptionSkill,
		launchId,
		orchestrationStep,
		pullRequestApprovalStates,
		resetCurrentChapter,
		reviewStep,
		sections,
		selectChapter,
		startOrchestration,
		updateBoardColumns,
		workItem,
	};
}
