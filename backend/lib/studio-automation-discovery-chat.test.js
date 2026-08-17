const assert = require("node:assert/strict");
const { before, test } = require("node:test");

const {
	handleStudioAutomationDiscoveryChatTurn,
	resolveStudioAutomationDiscoveryTurn,
} = require("./studio-automation-discovery-chat");
const { loadAiSdk } = require("./ai-sdk-runtime");
const { createCapturedResponse } = require("./in-process-http");
const {
	buildStudioAutomationDiscoveryFollowupQuestionCardPayload,
	buildStudioAutomationDiscoveryQuestionCardPayload,
} = require("./studio-automation-discovery-demo");

const CANONICAL_PROMPT = [
	"Look back over my recent work from the last 30 days and identify repeated manual workflows",
	"worth creating an agentic automation for. Look at my work history from Slack, Jira, Confluence, Loom, Figma, and GitHub.",
].join(" ");

before(async () => {
	await loadAiSdk();
});

test("Studio automation discovery strategy routes the kickoff prompt to clarification", () => {
	assert.deepEqual(
		resolveStudioAutomationDiscoveryTurn({
			chatSdkSource: "studio",
			latestVisiblePromptText: CANONICAL_PROMPT,
		}),
		{ phase: "clarification", kind: "question" },
	);
	assert.equal(
		resolveStudioAutomationDiscoveryTurn({
			chatSdkSource: "rovo",
			latestVisiblePromptText: CANONICAL_PROMPT,
		}),
		null,
	);
});

test("Studio automation discovery handler streams kickoff and continuation turns", async (t) => {
	const originalSetTimeout = globalThis.setTimeout;
	globalThis.setTimeout = (callback, _delay, ...args) =>
		originalSetTimeout(callback, 0, ...args);
	t.after(() => {
		globalThis.setTimeout = originalSetTimeout;
	});

	const response = createCapturedResponse();
	assert.equal(
		handleStudioAutomationDiscoveryChatTurn({
			chatSdkSource: "studio",
			createDeferredToolCallId: () => "tool-initial",
			latestVisiblePromptText: CANONICAL_PROMPT,
			questionCardOptions: {},
			recordQuestionMeta: () => {},
			requestOrigin: "text",
			res: response,
			stageTrace: { mark() {} },
		}),
		true,
	);

	const webResponse = response.toWebResponse();
	const payload = await webResponse.text();
	assert.match(webResponse.headers.get("content-type") || "", /text\/event-stream/iu);
	assert.match(payload, /studio-automation-discovery-question-initial/u);
	assert.match(payload, /data: \[DONE\]/u);

	const continuationResponse = createCapturedResponse();
	assert.equal(
		handleStudioAutomationDiscoveryChatTurn({
			chatSdkSource: "studio",
			clarificationSubmission: {
				sessionId: buildStudioAutomationDiscoveryQuestionCardPayload({
					toolCallId: "tool-initial",
				}).sessionId,
			},
			createDeferredToolCallId: () => "tool-followup",
			questionCardOptions: {},
			recordQuestionMeta: () => {},
			requestOrigin: "text",
			res: continuationResponse,
			stageTrace: { mark() {} },
		}),
		true,
	);

	const continuationPayload = await continuationResponse.toWebResponse().text();
	assert.match(continuationPayload, /studio-automation-discovery-question-followup/u);
	assert.match(continuationPayload, /data: \[DONE\]/u);
});

test("Studio automation discovery strategy routes clarification continuations to the right phase", () => {
	const initialPayload = buildStudioAutomationDiscoveryQuestionCardPayload({
		toolCallId: "tool-initial",
	});
	const followupPayload = buildStudioAutomationDiscoveryFollowupQuestionCardPayload({
		toolCallId: "tool-followup",
	});

	assert.deepEqual(
		resolveStudioAutomationDiscoveryTurn({
			chatSdkSource: "studio",
			clarificationSubmission: { sessionId: initialPayload.sessionId },
		}),
		{ phase: "discovery", kind: "result" },
	);
	assert.deepEqual(
		resolveStudioAutomationDiscoveryTurn({
			chatSdkSource: "studio",
			clarificationSubmission: { sessionId: followupPayload.sessionId },
		}),
		{ phase: "generation", kind: "result" },
	);
});
