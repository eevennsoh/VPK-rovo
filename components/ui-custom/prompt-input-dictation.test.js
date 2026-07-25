const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const PROMPT_INPUT_SOURCE = fs.readFileSync(
	path.join(__dirname, "prompt-input.tsx"),
	"utf8",
);
const DICTATION_SOURCE = fs.readFileSync(
	path.join(__dirname, "prompt-input-dictation.tsx"),
	"utf8",
);
const SEND_CONTROLS_SOURCE = fs.readFileSync(
	path.join(
		__dirname,
		"../projects/shared/components/rovo-composer-send-controls.tsx",
	),
	"utf8",
);
const SIDEBAR_COMPOSER_SOURCE = fs.readFileSync(
	path.join(
		__dirname,
		"../projects/sidebar-chat/components/chat-composer.tsx",
	),
	"utf8",
);

test("PromptInput exposes an opt-in controlled dictation component", () => {
	assert.match(
		DICTATION_SOURCE,
		/export type PromptInputDictationState = "idle" \| "listening" \| "processing";/u,
	);
	assert.match(
		DICTATION_SOURCE,
		/export interface PromptInputDictationControlProps/u,
	);
	assert.match(
		DICTATION_SOURCE,
		/export const PromptInputDictationControl/u,
	);
	assert.match(DICTATION_SOURCE, /state = "idle"/u);
	assert.match(DICTATION_SOURCE, /state === "listening"/u);
	assert.match(
		PROMPT_INPUT_SOURCE,
		/export \{[\s\S]*PromptInputDictationControl,[\s\S]*\} from "@\/components\/ui-custom\/prompt-input-dictation";/u,
	);
});

test("PromptInput dictation supports disabled and unsupported hosts", () => {
	assert.match(DICTATION_SOURCE, /disabled\?: boolean;/u);
	assert.match(DICTATION_SOURCE, /supported\?: boolean;/u);
	assert.match(DICTATION_SOURCE, /if \(!supported\) \{\s*return null;\s*\}/u);
	assert.match(
		DICTATION_SOURCE,
		/<PromptInputButton[\s\S]*disabled=\{disabled\}/u,
	);
});

test("PromptInput dictation has accessible labels, tooltip, and host callbacks", () => {
	assert.match(DICTATION_SOURCE, /aria-label="Start dictation"/u);
	assert.match(DICTATION_SOURCE, /aria-label="Stop dictation"/u);
	assert.match(
		DICTATION_SOURCE,
		/tooltip=\{\{ content: "Dictate", delay: 0 \}\}/u,
	);
	assert.match(DICTATION_SOURCE, /onClick=\{onStart\}/u);
	assert.match(DICTATION_SOURCE, /onClick=\{onStop\}/u);
	assert.match(
		DICTATION_SOURCE,
		/Latest dictation transcript: \{transcriptPreview\}/u,
	);
});

test("sidebar send controls delegate dictation rendering to PromptInput", () => {
	assert.match(SIDEBAR_COMPOSER_SOURCE, /<RovoComposerSendControls/u);
	assert.match(SEND_CONTROLS_SOURCE, /PromptInputDictationControl/u);
	assert.match(
		SEND_CONTROLS_SOURCE,
		/state=\{isDictationRecording \? "listening" : "processing"\}/u,
	);
	assert.doesNotMatch(SEND_CONTROLS_SOURCE, /aria-label="Start dictation"/u);
	assert.doesNotMatch(SEND_CONTROLS_SOURCE, /aria-label="Stop dictation"/u);
	assert.doesNotMatch(SEND_CONTROLS_SOURCE, /dictationTranscriptPreview \? \(/u);
});
