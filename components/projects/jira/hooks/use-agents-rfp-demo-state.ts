"use client";

import { useCallback, useEffect, useState, type SetStateAction } from "react";
import { useLatestRef } from "@/lib/use-latest-ref";
import {
	attachRfpReportToWorkItem,
	approveRfpReport,
	createDefaultAgentsRfpDemoState,
	dismissRfpDemoToast,
	exportRfpReportPdf,
	generateRfpReport,
	moveRfpDemoCard,
	normalizeAgentsRfpDemoProfileMetadata,
	recordRfpReportArtifactUpdate,
	refineRfpReport,
	selectRfpReportVersion,
	clearRfpDraftingAgentTrigger,
	setRfp101AnswerSummary,
	setRfpDraftingAgentTrigger,
	setRfpDemoCanvasOpen,
	setRfpDemoCanvasView,
	setRfpDemoCardsAgentAssignment,
	type AgentsRfpDemoCanvasViewId,
	type AgentsRfpDemoState,
} from "../lib/rfp-demo-state";

export interface AgentsRfpDemoActions {
	reset: () => Promise<void>;
	generateReport: () => void;
	refineReport: () => void;
	recordReportUpdate: () => void;
	selectReportVersion: (versionId: string) => void;
	approveReport: () => void;
	exportPdf: () => void;
	attachReport: (reportPreviewHtml?: string) => void;
	createAgent: () => void;
	applyAgent: () => void;
	scheduleAgent: () => void;
	setAgentTrigger: (prompt: string) => void;
	clearAgentTrigger: () => void;
	moveCard: (cardCode: string, targetColumnTitle: string) => void;
	moveCards: (cardCodes: readonly string[], targetColumnTitle: string) => void;
	setCardsAgentAssignment: (cardCodes: readonly string[], agentId: string, assigned: boolean) => void;
	setAnswerSummary: (answerSummary: string) => void;
	setCanvasOpen: (open: boolean, mode?: "editable" | "read-only") => void;
	setCanvasView: (viewId: AgentsRfpDemoCanvasViewId) => void;
	dismissToast: (toastId: string) => void;
}

export interface AgentsRfpDemoController {
	state: AgentsRfpDemoState;
	actions: AgentsRfpDemoActions;
}

const RFP_DEMO_STATE_ENDPOINT = "/api/agents/rfp-demo/state";
const RFP_DEMO_RESET_ENDPOINT = "/api/agents/rfp-demo/reset";
const RFP_DEMO_APPLY_AGENT_ENDPOINT = "/api/agents/rfp-demo/agent/apply";
const RFP_DEMO_TICKET_EVENT_ENDPOINT = "/api/agents/rfp-demo/events/ticket-entered-column";

async function readJsonStateResponse(response: Response): Promise<AgentsRfpDemoState> {
	if (!response.ok) {
		let message = `Request failed with status ${response.status}`;
		try {
			const payload = await response.json() as { error?: unknown; details?: unknown };
			if (typeof payload.error === "string" && payload.error.trim()) {
				message = payload.error.trim();
			} else if (typeof payload.details === "string" && payload.details.trim()) {
				message = payload.details.trim();
			}
		} catch {
			const text = await response.text().catch(() => "");
			if (text.trim()) {
				message = text.trim();
			}
		}
		throw new Error(message);
	}

	const payload = await response.json() as { state?: AgentsRfpDemoState };
	return payload.state
		? normalizeAgentsRfpDemoProfileMetadata(payload.state)
		: createDefaultAgentsRfpDemoState();
}

export function useAgentsRfpDemoState(): AgentsRfpDemoController {
	const [state, setState] = useState<AgentsRfpDemoState>(() => createDefaultAgentsRfpDemoState());
	const stateRef = useLatestRef(state);
	const updateState = useCallback((updater: SetStateAction<AgentsRfpDemoState>) => {
		const nextState = typeof updater === "function"
			? (updater as (current: AgentsRfpDemoState) => AgentsRfpDemoState)(stateRef.current)
			: updater;
		stateRef.current = nextState;
		setState(nextState);
		return nextState;
	}, [stateRef]);
	const hasPendingAgentWork = Object.values(state.workItems).some((workItem) => (
		workItem.agentStatus === "queued" || workItem.agentStatus === "running"
	));

	useEffect(() => {
		let cancelled = false;

		async function loadState() {
			try {
				const nextState = await readJsonStateResponse(await fetch(RFP_DEMO_STATE_ENDPOINT));
				if (!cancelled) {
					updateState(nextState);
				}
			} catch (error) {
				console.error("[AgentsRfpDemo] Failed to load backend state:", error);
			}
		}

		void loadState();

		return () => {
			cancelled = true;
		};
	}, [updateState]);

	useEffect(() => {
		if (!hasPendingAgentWork) {
			return;
		}

		let cancelled = false;
		const pollState = async () => {
			try {
				const nextState = await readJsonStateResponse(await fetch(RFP_DEMO_STATE_ENDPOINT));
				if (!cancelled) {
					updateState(nextState);
				}
			} catch (error) {
				console.error("[AgentsRfpDemo] Failed to poll backend state:", error);
			}
		};
		const intervalId = window.setInterval(() => {
			void pollState();
		}, 1_000);

		return () => {
			cancelled = true;
			window.clearInterval(intervalId);
		};
	}, [hasPendingAgentWork, updateState]);

	const postStateMutation = useCallback(async (endpoint: string, body: Record<string, unknown> = {}) => {
		try {
			const nextState = await readJsonStateResponse(await fetch(endpoint, {
				body: JSON.stringify(body),
				headers: { "Content-Type": "application/json" },
				method: "POST",
			}));
			updateState(nextState);
		} catch (error) {
			console.error("[AgentsRfpDemo] Failed to mutate backend state:", error);
		}
	}, [updateState]);

	const persistStateMutation = useCallback((updater: SetStateAction<AgentsRfpDemoState>) => {
		const nextState = updateState(updater);
		void postStateMutation(RFP_DEMO_STATE_ENDPOINT, { state: nextState });
	}, [postStateMutation, updateState]);

	const reset = useCallback(() => postStateMutation(RFP_DEMO_RESET_ENDPOINT), [postStateMutation]);
	const generateReport = useCallback(() => persistStateMutation(generateRfpReport), [persistStateMutation]);
	const refineReport = useCallback(() => persistStateMutation(refineRfpReport), [persistStateMutation]);
	const recordReportUpdate = useCallback(
		() => persistStateMutation(recordRfpReportArtifactUpdate),
		[persistStateMutation],
	);
	const selectReportVersion = useCallback(
		(versionId: string) => persistStateMutation((currentState) => selectRfpReportVersion(currentState, versionId)),
		[persistStateMutation],
	);
	const approveReport = useCallback(() => persistStateMutation(approveRfpReport), [persistStateMutation]);
	const exportPdf = useCallback(() => persistStateMutation(exportRfpReportPdf), [persistStateMutation]);
	const attachReport = useCallback(
		(reportPreviewHtml?: string) => persistStateMutation((currentState) => attachRfpReportToWorkItem(
			currentState,
			reportPreviewHtml,
		)),
		[persistStateMutation],
	);
	const applyAgent = useCallback(() => {
		void postStateMutation(RFP_DEMO_APPLY_AGENT_ENDPOINT);
	}, [postStateMutation]);
	const createAgent = applyAgent;
	const scheduleAgent = applyAgent;
	const setAgentTrigger = useCallback(
		(prompt: string) => persistStateMutation((currentState) => setRfpDraftingAgentTrigger(currentState, prompt)),
		[persistStateMutation],
	);
	const clearAgentTrigger = useCallback(
		() => persistStateMutation(clearRfpDraftingAgentTrigger),
		[persistStateMutation],
	);
	const moveCard = useCallback(
		(cardCode: string, targetColumnTitle: string) => {
			updateState((currentState) => moveRfpDemoCard(currentState, cardCode, targetColumnTitle));
			void postStateMutation(RFP_DEMO_TICKET_EVENT_ENDPOINT, {
				ticketCode: cardCode,
				targetColumn: targetColumnTitle,
			});
		},
		[postStateMutation, updateState],
	);
	const moveCards = useCallback(
		(cardCodes: readonly string[], targetColumnTitle: string) => {
			if (cardCodes.length === 0) {
				return;
			}
			updateState((currentState) => cardCodes.reduce(
				(accState, cardCode) => moveRfpDemoCard(accState, cardCode, targetColumnTitle),
				currentState,
			));
			void (async () => {
				for (const cardCode of cardCodes) {
					await postStateMutation(RFP_DEMO_TICKET_EVENT_ENDPOINT, {
						ticketCode: cardCode,
						targetColumn: targetColumnTitle,
					});
				}
			})();
		},
		[postStateMutation, updateState],
	);
	const setCardsAgentAssignment = useCallback(
		(cardCodes: readonly string[], agentId: string, assigned: boolean) => {
			if (cardCodes.length === 0) {
				return;
			}
			persistStateMutation((currentState) => setRfpDemoCardsAgentAssignment(
				currentState,
				cardCodes,
				agentId,
				assigned,
			));
		},
		[persistStateMutation],
	);
	const setAnswerSummary = useCallback(
		(answerSummary: string) => persistStateMutation((currentState) => setRfp101AnswerSummary(currentState, answerSummary)),
		[persistStateMutation],
	);
	const setCanvasOpen = useCallback(
		(open: boolean, mode?: "editable" | "read-only") => persistStateMutation((currentState) => (
			setRfpDemoCanvasOpen(currentState, open, mode)
		)),
		[persistStateMutation],
	);
	const setCanvasView = useCallback(
		(viewId: AgentsRfpDemoCanvasViewId) => persistStateMutation((currentState) => setRfpDemoCanvasView(currentState, viewId)),
		[persistStateMutation],
	);
	const dismissToast = useCallback(
		(toastId: string) => persistStateMutation((currentState) => dismissRfpDemoToast(currentState, toastId)),
		[persistStateMutation],
	);

	const actions: AgentsRfpDemoActions = {
		reset,
		generateReport,
		refineReport,
		recordReportUpdate,
		selectReportVersion,
		approveReport,
		exportPdf,
		attachReport,
		createAgent,
		applyAgent,
		scheduleAgent,
		setAgentTrigger,
		clearAgentTrigger,
		moveCard,
		moveCards,
		setCardsAgentAssignment,
		setAnswerSummary,
		setCanvasOpen,
		setCanvasView,
		dismissToast,
	};

	return {
		state,
		actions,
	};
}
