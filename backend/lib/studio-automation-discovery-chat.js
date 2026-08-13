const { getAiSdk } = require("./ai-sdk-runtime");
const {
	buildQuestionMetaFromQuestionCardPayload,
} = require("./ai-gateway-deferred-tools");
const {
	sanitizeQuestionCardPayload,
} = require("./question-card-payload");
const {
	createRouteDecisionPart,
} = require("./route-decision");
const {
	DEMO_QUESTION_TOOL_NAME: STUDIO_AUTOMATION_DISCOVERY_QUESTION_TOOL_NAME,
	DEMO_WIDGET_TYPE: STUDIO_AUTOMATION_DISCOVERY_WIDGET_TYPE,
	buildStudioAutomationDiscoveryFinalText,
	buildStudioAutomationDiscoveryFollowupQuestionCardPayload,
	buildStudioAutomationDiscoveryQuestionCardPayload,
	buildStudioAutomationDiscoveryTrace,
	buildStudioAutomationDiscoveryWidgetPayload,
	isStudioAutomationDiscoveryDismissalPrompt,
	isStudioAutomationDiscoveryFollowupDismissalPrompt,
	isStudioAutomationDiscoveryFollowupSession,
	isStudioAutomationDiscoveryInitialDismissalPrompt,
	isStudioAutomationDiscoveryInitialSession,
	isStudioAutomationDiscoveryPrompt,
} = require("./studio-automation-discovery-demo");
const {
	writeThinkingTraceSteps: writeGenericThinkingTraceSteps,
} = require("./thinking-trace-writer");

const DEFAULT_QUESTION_CARD_OPTIONS = {
	widgetType: "question-card",
	maxPresetOptions: 8,
	customOptionPlaceholder: "Tell Rovo what to do...",
	maxLabelLength: 120,
};

function createFallbackAIGatewayDeferredToolCallId(toolName) {
	const normalizedToolName =
		(typeof toolName === "string" && toolName.trim().length > 0
			? toolName.trim().toLowerCase().replace(/[^a-z0-9_]+/g, "_")
			: null) || "tool";
	return `ai-gateway-${normalizedToolName}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function writeStudioAutomationDiscoveryText(writer, text) {
	const textId = `studio-automation-discovery-text-${Date.now()}`;
	writer.write({ type: "text-start", id: textId });
	writer.write({ type: "text-delta", id: textId, delta: text });
	writer.write({ type: "text-end", id: textId });
}

function buildStudioAutomationDiscoveryQuestionCardForRound({
	round,
	toolCallId,
}) {
	return round === "followup"
		? buildStudioAutomationDiscoveryFollowupQuestionCardPayload({ toolCallId })
		: buildStudioAutomationDiscoveryQuestionCardPayload({ toolCallId });
}

function getStudioAutomationDiscoveryQuestionIntro(round) {
	if (round === "followup") {
		return "I have enough signal to draft a few agents, but I need one boundary check before I create anything. There are strong candidates for Loom distribution, inactive-agent lifecycle triage, and weekly synthesis, plus a few weaker patterns that should stay out of the first pass unless you want a broader exploration. Choose how strict the creation boundary should be and I will turn the strongest candidates into approval-gated Studio drafts.";
	}
	return "I can start that. Before I create any agents, I need to lock the decision frame so I do not turn noisy activity into the wrong drafts. The request spans Slack, Jira, Confluence, Loom, Figma, GitHub, and Teamwork Graph signals, which can point to different kinds of repeated work: distribution loops, lifecycle cleanup, weekly synthesis, and design feedback follow-up. Choose how Studio should rank the signals, which evidence should carry the most weight, and how conservative it should be before creating a draft. After that I will scan the work history, separate create, skip, and needs-evidence candidates, and build the strongest agent drafts.";
}

function getStudioAutomationDiscoveryQuestionStatus(round) {
	if (round === "followup") {
		return {
			content: "Waiting for your create, approval, and hero-moment boundaries.",
			label: "Asking for draft boundaries",
			questions: ["creation-boundary", "approval-boundary", "hero-moment"],
			reason: "studio_automation_discovery_demo_followup",
		};
	}
	return {
		content: "Waiting for your priority, source weighting, and creation-confidence choices before scanning the full work history.",
		label: "Waiting for your choices",
		questions: ["priority", "source-weighting", "conservatism"],
		reason: "studio_automation_discovery_demo_clarification",
	};
}

function buildStudioAutomationDiscoveryInitialQuestionPreflightTrace(toolCallId) {
	const traceId = `${toolCallId}-preflight`;
	return [
		{
			toolName: "studio.scope_agent_discovery",
			toolCallId: `${traceId}-scope`,
			label: "Reviewing the request",
			contentRows: [
				{
					content: "Reading the requested work window, source list, and intended output before touching recent activity.",
					input: {
						window: "last 30 days",
						sources: ["Slack", "Jira", "Confluence", "Loom", "Figma", "GitHub"],
						output: "agentic automation candidates",
					},
					outputPreview: "The request has enough source coverage to start discovery.",
				},
				{
					content: "Checking whether Studio has enough direction to create agents immediately.",
					input: {
						decisionNeeded: ["ranking priority", "evidence weighting", "creation confidence"],
					},
					outputPreview: "Creation should wait until the ranking frame is clear.",
				},
			],
			input: {
				window: "last 30 days",
				sources: ["Slack", "Jira", "Confluence", "Loom", "Figma", "GitHub"],
			},
			outputPreview: "Need three choices before creating drafts.",
			delayMs: 900,
		},
		{
			toolName: "studio.plan_source_scan",
			toolCallId: `${traceId}-plan`,
			label: "Planning the source scan",
			contentRows: [
				{
					content: "Mapping the likely signal paths so the scan can separate recurring workflows from one-off collaboration.",
					input: {
						signals: ["distribution loops", "lifecycle cleanup", "weekly synthesis", "design follow-up"],
					},
					outputPreview: "Several plausible patterns may rank differently depending on your goal.",
				},
				{
					content: "Holding the scan at the question step until you choose the ranking and confidence boundaries.",
					input: {
						nextStep: "ask_user_questions",
					},
					outputPreview: "Ready to ask for the missing context.",
				},
			],
			input: {
				task: "prepare source scan",
			},
			outputPreview: "Question mode is required before draft creation.",
			delayMs: 1100,
		},
	];
}

async function writeStudioAutomationDiscoveryQuestionPreflightTrace({
	round,
	toolCallId,
	writer,
}) {
	if (round !== "initial") {
		return;
	}

	await writeGenericThinkingTraceSteps(
		writer,
		buildStudioAutomationDiscoveryInitialQuestionPreflightTrace(toolCallId),
		{
			defaultDelayMs: 900,
			narrationRowDelayMs: 350,
		},
	);
}

function writeStudioAutomationDiscoveryQuestionCard({
	questionCardOptions = DEFAULT_QUESTION_CARD_OPTIONS,
	recordQuestionMeta,
	round = "initial",
	requestOrigin,
	toolCallId,
	widgetId,
	writer,
}) {
	const resolvedQuestionCardOptions = {
		...DEFAULT_QUESTION_CARD_OPTIONS,
		...questionCardOptions,
	};
	const questionCardPayload = sanitizeQuestionCardPayload(
		buildStudioAutomationDiscoveryQuestionCardForRound({ round, toolCallId }),
		{
			widgetType: resolvedQuestionCardOptions.widgetType,
			maxRounds: 2,
			maxPresetOptions: resolvedQuestionCardOptions.maxPresetOptions,
			customOptionPlaceholder: resolvedQuestionCardOptions.customOptionPlaceholder,
			maxLabelLength: resolvedQuestionCardOptions.maxLabelLength,
		}
	);

	if (!questionCardPayload) {
		return false;
	}

	if (typeof recordQuestionMeta === "function") {
		recordQuestionMeta(
			questionCardPayload.sessionId,
			buildQuestionMetaFromQuestionCardPayload(questionCardPayload)
		);
	}

	const status = getStudioAutomationDiscoveryQuestionStatus(round);
	writer.write({
		type: "data-thinking-status",
		id: `${toolCallId}-status-0`,
		data: {
			label: status.label,
			content: status.content,
			toolCallId,
			activity: "data",
			source: "backend",
			timestamp: new Date().toISOString(),
		},
	});
	writer.write({
		type: "data-thinking-event",
		id: `${toolCallId}-start`,
		data: {
			eventId: `${toolCallId}-start`,
			phase: "start",
			toolName: STUDIO_AUTOMATION_DISCOVERY_QUESTION_TOOL_NAME,
			label: status.label,
			toolCallId,
			input: {
				questions: status.questions,
			},
			timestamp: new Date().toISOString(),
		},
	});
	writeStudioAutomationDiscoveryText(
		writer,
		getStudioAutomationDiscoveryQuestionIntro(round),
	);
	writer.write({
		type: "data-widget-loading",
		id: widgetId,
		data: {
			type: resolvedQuestionCardOptions.widgetType,
			loading: true,
		},
	});
	writer.write({
		type: "data-widget-data",
		id: widgetId,
		data: {
			type: resolvedQuestionCardOptions.widgetType,
			payload: questionCardPayload,
		},
	});
	writer.write({
		type: "data-widget-loading",
		id: widgetId,
		data: {
			type: resolvedQuestionCardOptions.widgetType,
			loading: false,
		},
	});
	writer.write(createRouteDecisionPart({
		intent: "chat",
		origin: requestOrigin,
		reason: status.reason,
	}));
	return true;
}

function streamStudioAutomationDiscoveryQuestionCard({
	createDeferredToolCallId = createFallbackAIGatewayDeferredToolCallId,
	questionCardOptions,
	recordQuestionMeta,
	res,
	requestOrigin,
	round = "initial",
}) {
	const toolCallId = createDeferredToolCallId(
		STUDIO_AUTOMATION_DISCOVERY_QUESTION_TOOL_NAME
	);
	const widgetId = `studio-automation-discovery-question-${round}-${Date.now()}`;

	const stream = createUIMessageStream({
		execute: async ({ writer }) => {
			await writeStudioAutomationDiscoveryQuestionPreflightTrace({
				round,
				toolCallId,
				writer,
			});
			const didWriteQuestionCard = writeStudioAutomationDiscoveryQuestionCard({
				questionCardOptions,
				recordQuestionMeta,
				round,
				requestOrigin,
				toolCallId,
				writer,
				widgetId,
			});
			if (!didWriteQuestionCard) {
				writeStudioAutomationDiscoveryText(
					writer,
					"I could not prepare the question card.",
				);
			}
			writer.write({
				type: "data-turn-complete",
				data: { timestamp: new Date().toISOString() },
			});
		},
		onError: (error) =>
			error instanceof Error
				? error.message
				: "Failed to stream Studio automation discovery clarification",
	});

	pipeUIMessageStreamToResponse({ response: res, stream });
	return true;
}

function streamStudioAutomationDiscoveryResult({
	clarificationSubmission,
	createDeferredToolCallId = createFallbackAIGatewayDeferredToolCallId,
	questionCardOptions,
	recordQuestionMeta,
	requestOrigin,
	res,
	phase = "generation",
}) {
	const stream = createUIMessageStream({
		execute: async ({ writer }) => {
			writer.write({
				type: "data-thinking-status",
				data: {
					label: phase === "discovery" ? "Analyzing your work patterns" : "Creating agent drafts",
					content: phase === "discovery"
						? "Reading recent activity, cycling through source apps, and correlating source signals through TWG."
						: "Applying draft boundaries, cycling through the final candidates, and creating draft Studio agents.",
					activity: "data",
					source: "backend",
				},
			});
			await writeGenericThinkingTraceSteps(
				writer,
				buildStudioAutomationDiscoveryTrace({
					clarificationSubmission: phase === "discovery" ? clarificationSubmission : undefined,
					followupSubmission: phase === "generation" ? clarificationSubmission : undefined,
					phase,
				}),
				{
					defaultDelayMs: 1800,
					narrationRowDelayMs: 900,
				},
			);
			if (phase === "discovery") {
				const toolCallId = createDeferredToolCallId(
					STUDIO_AUTOMATION_DISCOVERY_QUESTION_TOOL_NAME
				);
				writeStudioAutomationDiscoveryQuestionCard({
					questionCardOptions,
					recordQuestionMeta,
					round: "followup",
					requestOrigin,
					toolCallId,
					widgetId: `studio-automation-discovery-question-followup-${Date.now()}`,
					writer,
				});
				writer.write({
					type: "data-turn-complete",
					data: { timestamp: new Date().toISOString() },
				});
				return;
			}
			writeStudioAutomationDiscoveryText(
				writer,
				buildStudioAutomationDiscoveryFinalText(),
			);
			const widgetId = `studio-automation-discovery-widget-${Date.now()}`;
			writer.write({
				type: "data-widget-loading",
				id: widgetId,
				data: {
					type: STUDIO_AUTOMATION_DISCOVERY_WIDGET_TYPE,
					loading: true,
				},
			});
			writer.write({
				type: "data-widget-data",
				id: widgetId,
				data: {
					type: STUDIO_AUTOMATION_DISCOVERY_WIDGET_TYPE,
					payload: buildStudioAutomationDiscoveryWidgetPayload(),
				},
			});
			writer.write({
				type: "data-widget-loading",
				id: widgetId,
				data: {
					type: STUDIO_AUTOMATION_DISCOVERY_WIDGET_TYPE,
					loading: false,
				},
			});
			writer.write(createRouteDecisionPart({
				intent: "chat",
				origin: requestOrigin,
				reason: "studio_automation_discovery_demo",
			}));
			writer.write({
				type: "data-turn-complete",
				data: { timestamp: new Date().toISOString() },
			});
		},
		onError: (error) =>
			error instanceof Error
				? error.message
				: "Failed to stream Studio agent discovery flow",
	});

	pipeUIMessageStreamToResponse({ response: res, stream });
}

function markStudioAutomationDiscoveryBranch(stageTrace, phase) {
	if (!stageTrace || typeof stageTrace.mark !== "function") {
		return;
	}
	stageTrace.mark("pre_route_branch_entered", {
		branch: "studio_automation_discovery_demo",
		phase,
	});
}

function resolveStudioAutomationDiscoveryTurn({
	chatSdkSource,
	clarificationSubmission,
	clarificationToolCallId,
	latestUserMessageSource,
	latestVisiblePromptText,
}) {
	if (chatSdkSource !== "studio") {
		return null;
	}

	if (
		isStudioAutomationDiscoveryFollowupSession(clarificationSubmission?.sessionId) ||
		(
			latestUserMessageSource === "clarification-submit" &&
			isStudioAutomationDiscoveryFollowupSession(clarificationToolCallId)
		) ||
		isStudioAutomationDiscoveryFollowupDismissalPrompt(latestVisiblePromptText)
	) {
		return { phase: "generation", kind: "result" };
	}

	if (
		isStudioAutomationDiscoveryInitialSession(clarificationSubmission?.sessionId) ||
		(
			latestUserMessageSource === "clarification-submit" &&
			isStudioAutomationDiscoveryInitialSession(clarificationToolCallId)
		) ||
		isStudioAutomationDiscoveryInitialDismissalPrompt(latestVisiblePromptText) ||
		(
			isStudioAutomationDiscoveryDismissalPrompt(latestVisiblePromptText) &&
			!isStudioAutomationDiscoveryFollowupDismissalPrompt(latestVisiblePromptText)
		)
	) {
		return { phase: "discovery", kind: "result" };
	}

	if (isStudioAutomationDiscoveryPrompt(latestVisiblePromptText)) {
		return { phase: "clarification", kind: "question" };
	}

	return null;
}

function handleStudioAutomationDiscoveryChatTurn({
	chatSdkSource,
	clarificationSubmission,
	clarificationToolCallId,
	createDeferredToolCallId,
	latestUserMessageSource,
	latestVisiblePromptText,
	questionCardOptions,
	recordQuestionMeta,
	requestOrigin,
	res,
	stageTrace,
}) {
	const {
		createUIMessageStream,
		pipeUIMessageStreamToResponse,
	} = getAiSdk();
	const turn = resolveStudioAutomationDiscoveryTurn({
		chatSdkSource,
		clarificationSubmission,
		clarificationToolCallId,
		latestUserMessageSource,
		latestVisiblePromptText,
	});
	if (!turn) {
		return false;
	}

	markStudioAutomationDiscoveryBranch(stageTrace, turn.phase);
	if (turn.kind === "question") {
		return streamStudioAutomationDiscoveryQuestionCard({
			createDeferredToolCallId,
			questionCardOptions,
			recordQuestionMeta,
			requestOrigin,
			res,
		});
	}

	streamStudioAutomationDiscoveryResult({
		clarificationSubmission,
		createDeferredToolCallId,
		phase: turn.phase,
		questionCardOptions,
		recordQuestionMeta,
		requestOrigin,
		res,
	});
	return true;
}

module.exports = {
	buildStudioAutomationDiscoveryInitialQuestionPreflightTrace,
	handleStudioAutomationDiscoveryChatTurn,
	resolveStudioAutomationDiscoveryTurn,
	streamStudioAutomationDiscoveryQuestionCard,
	streamStudioAutomationDiscoveryResult,
};
