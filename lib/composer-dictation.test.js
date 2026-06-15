const assert = require("node:assert/strict");
const test = require("node:test");

const {
	appendDictationTranscript,
	resolveComposerDictationState,
} = require("./composer-dictation.ts");

test("appendDictationTranscript fills an empty editor with the final transcript", () => {
	assert.equal(appendDictationTranscript("", "  hello world  "), "hello world");
	assert.equal(appendDictationTranscript("   ", "hello world"), "hello world");
});

test("appendDictationTranscript appends to existing text with one separating space", () => {
	assert.equal(appendDictationTranscript("Draft prompt", "more details"), "Draft prompt more details");
	assert.equal(appendDictationTranscript("Draft prompt ", "more details"), "Draft prompt more details");
});

test("appendDictationTranscript preserves newline edge spacing", () => {
	assert.equal(appendDictationTranscript("First line\n", "second line"), "First line\nsecond line");
	assert.equal(appendDictationTranscript("First line\n\n", "second line"), "First line\n\nsecond line");
	assert.equal(appendDictationTranscript("First line\nsecond line", "third line"), "First line\nsecond line third line");
});

test("appendDictationTranscript handles repeated final transcripts as separate utterances", () => {
	const first = appendDictationTranscript("Summarize", "the incident");
	const second = appendDictationTranscript(first, "the incident");
	assert.equal(second, "Summarize the incident the incident");
});

test("resolveComposerDictationState maps the live voice hook into composer UI states", () => {
	assert.equal(resolveComposerDictationState({ active: false, voiceState: "recording" }), "idle");
	assert.equal(resolveComposerDictationState({ active: true, voiceState: "recording" }), "recording");
	assert.equal(resolveComposerDictationState({ active: true, voiceState: "processing" }), "processing");
	assert.equal(resolveComposerDictationState({ active: true, voiceState: "speaking" }), "processing");
	assert.equal(resolveComposerDictationState({ active: true, voiceState: "idle" }), "recording");
});
