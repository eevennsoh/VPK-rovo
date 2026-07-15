const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const STAGE_SOURCE = fs.readFileSync(
	path.join(process.cwd(), "components/projects/asx/components/kanban-stage.tsx"),
	"utf8",
);
const HOOK_SOURCE = fs.readFileSync(
	path.join(process.cwd(), "components/projects/asx/hooks/use-kanban-lifecycle.ts"),
	"utf8",
);

test("Kanban stage wires the shared issue lifecycle callbacks", () => {
	assert.match(STAGE_SOURCE, /onCardGenerativeActionSubmit=\{handleGenerativeActionSubmit\}/u);
	assert.match(STAGE_SOURCE, /onCardAgentActivityQuestionSubmit=\{handleQuestionSubmit\}/u);
	assert.match(STAGE_SOURCE, /onCardAgentActivityViewChat=\{handleViewChat\}/u);
	assert.match(STAGE_SOURCE, /selectedCardCodes=\{selectedCardCodes\}/u);
});

test("Kanban lifecycle uses deterministic generation and completion delays", () => {
	assert.match(HOOK_SOURCE, /const GENERATING_DELAY_MS = 1_200;/u);
	assert.match(HOOK_SOURCE, /const COMPLETION_DELAY_MS = 5_500;/u);
	assert.match(HOOK_SOURCE, /const INPUT_RESUME_COMPLETION_DELAY_MS = 2_500;/u);
	assert.match(HOOK_SOURCE, /const NEEDS_INPUT_CARD_CODE = "RFP-101";/u);
});

test("Kanban starts skill and custom-agent sparkle actions without opening chat", () => {
	assert.match(HOOK_SOURCE, /if \(request\.kind === "ask-rovo"\) \{[\s\S]*onNonAgentAction\?\.\(request, card\);[\s\S]*return;[\s\S]*\}/u);
	assert.match(HOOK_SOURCE, /startCards\(\[card\.code\], getAsxGenerativeAgentSelection\(request\)\);/u);
});

test("Kanban stage forwards chat thinking state to the ASX overlay", () => {
	assert.match(STAGE_SOURCE, /useAsxAgentChatDemo\(\)/u);
	assert.match(STAGE_SOURCE, /<AsxRovoOverlay[\s\S]*chatContextBar=\{chatContextBar\}[\s\S]*externalThinkingMessageId=\{externalThinkingMessageId\}/u);
	assert.match(STAGE_SOURCE, /question: activity\.question/u);
	assert.match(STAGE_SOURCE, /intro: activity\.message/u);
	assert.match(STAGE_SOURCE, /onQuestionAnswer=\{pendingChatQuestion \? handleChatQuestionAnswer : undefined\}/u);
});
