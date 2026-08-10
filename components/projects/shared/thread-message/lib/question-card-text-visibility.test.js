const test = require("node:test");
const assert = require("node:assert/strict");

const {
	isTranslationClarificationQuestionCard,
	sanitizeQuestionCardMessageText,
	shouldSuppressQuestionCardMessageText,
} = require("./question-card-text-visibility.ts");

test("detects translation clarification cards by session id prefix", () => {
	assert.equal(
		isTranslationClarificationQuestionCard({
			sessionId: "translation-clarification-12345-abc123",
		}),
		true
	);
});

test("does not treat generic clarification cards as translation cards", () => {
	assert.equal(
		isTranslationClarificationQuestionCard({
			sessionId: "clarification-12345-abc123",
		}),
		false
	);
});

test("detects translation clarification cards from question payload text", () => {
	assert.equal(
		isTranslationClarificationQuestionCard({
			title: "Help me translate this",
			questions: [
				{
					id: "source-text",
					label: "What text should I translate?",
				},
			],
		}),
		true
	);
});

test("detects translation clarification cards from assistant message text", () => {
	assert.equal(
		isTranslationClarificationQuestionCard(
			{
				sessionId: "request-user-input-12345",
				questions: [{ id: "q-1", label: "What do you need?" }],
			},
			"To translate this, please provide the target language."
		),
		true
	);
});

test("does not suppress meaningful text for non-translation question cards", () => {
	assert.equal(
		shouldSuppressQuestionCardMessageText({
			shouldShowWidgetSections: true,
			widgetType: "question-card",
			isStreaming: false,
			widgetPayload: {
				sessionId: "request-user-input-12345",
				questions: [{ id: "q-1", label: "Which Jira site?" }],
			},
			messageText: "Please choose a site before I continue.",
		}),
		false
	);
});

test("suppresses text when question-card message only contains scaffolding", () => {
	assert.equal(
		shouldSuppressQuestionCardMessageText({
			shouldShowWidgetSections: true,
			widgetType: "question-card",
			isStreaming: false,
			widgetPayload: {
				sessionId: "request-user-input-12345",
				questions: [{ id: "q-1", label: "Which Jira site?" }],
			},
			messageText:
				"Great idea! Let me ask a few questions before putting together a plan. I've shared some questions to help. Once you answer those, I'll put together a detailed implementation plan. What are your preferences?",
		}),
		true
	);
});

test("sanitizes scaffolding text and keeps contextual lines", () => {
	assert.equal(
		sanitizeQuestionCardMessageText({
			widgetPayload: {
				sessionId: "request-user-input-12345",
				questions: [{ id: "q-1", label: "Which Jira site?" }],
			},
			messageText: [
				"Great idea! Let me ask a few questions before putting together a plan.",
				"Good news - there's already a sprint board foundation in this project.",
				"I've shared some questions to help me understand your vision.",
				"Good news - there's already a sprint board foundation in this project.",
				"Once you answer those, I'll put together a detailed implementation plan.",
			].join("\n"),
		}),
		"Good news - there's already a sprint board foundation in this project."
	);
});

test("preserves fenced Mermaid blocks and the Markdown that follows them", () => {
	const messageText = [
		"I drafted an improved description.",
		"",
		"#### Guest checkout flow",
		"```mermaid",
		"flowchart TD",
		'\tguest{\"Continue as guest?\"} --> confirmation[\"Confirmation\"]',
		"```",
		"",
		"#### Acceptance criteria",
		"1. A guest can complete checkout.",
	].join("\n");

	assert.equal(
		sanitizeQuestionCardMessageText({
			widgetPayload: {
				sessionId: "request-user-input-12345",
				questions: [{ id: "q-1", label: "Apply this description?" }],
			},
			messageText,
		}),
		messageText,
	);
});

test("keeps text visible for translation question cards", () => {
	assert.equal(
		shouldSuppressQuestionCardMessageText({
			shouldShowWidgetSections: true,
			widgetType: "question-card",
			isStreaming: false,
			widgetPayload: {
				sessionId: "request-user-input-12345",
				questions: [{ id: "q-1", label: "Which language should I translate into?" }],
			},
			messageText: "Tell me what text you want to translate.",
		}),
		false
	);
});

test("keeps translation guidance text unchanged during sanitization", () => {
	assert.equal(
		sanitizeQuestionCardMessageText({
			widgetPayload: {
				sessionId: "request-user-input-12345",
				questions: [{ id: "q-1", label: "Which language should I translate into?" }],
			},
			messageText: "Tell me what text you want to translate.",
		}),
		"Tell me what text you want to translate."
	);
});
