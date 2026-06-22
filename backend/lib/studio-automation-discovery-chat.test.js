const assert = require("node:assert/strict");
const test = require("node:test");

const {
	resolveStudioAutomationDiscoveryTurn,
} = require("./studio-automation-discovery-chat");
const {
	buildStudioAutomationDiscoveryFollowupQuestionCardPayload,
	buildStudioAutomationDiscoveryQuestionCardPayload,
} = require("./studio-automation-discovery-demo");

const CANONICAL_PROMPT = [
	"Look back over my recent work from the last 30 days and identify repeated manual workflows",
	"worth creating an agentic automation for. Look at my work history from Slack, Jira, Confluence, Loom, Figma, and GitHub.",
].join(" ");

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
