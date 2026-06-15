const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const WRAPPER_SOURCE = fs.readFileSync(path.join(__dirname, "rovo-app-composer.tsx"), "utf8");
const SHELL_SOURCE = fs.readFileSync(path.join(__dirname, "rovo-app-shell.tsx"), "utf8");

test("Rovo RovoAppComposer wrapper renders the shared composer with card chrome", () => {
	assert.match(WRAPPER_SOURCE, /from "@\/components\/projects\/shared\/components\/rovo-app-composer"/u);
	assert.match(WRAPPER_SOURCE, /chrome="card"/u);
});

test("RovoAppShell adds side gutter for the compact artifact composer", () => {
	assert.match(SHELL_SOURCE, /isArtifactOpen \? "max-w-none px-3" : "max-w-\[800px\]"/u);
});

test("RovoAppShell wires dictation separately from realtime live voice", () => {
	assert.doesNotMatch(SHELL_SOURCE, /useLiveVoice/u);
	assert.match(SHELL_SOURCE, /const dictationCommittedTextRef = useRef<string \| null>\(null\);/u);
	assert.match(SHELL_SOURCE, /appendDictationTranscript\(dictationCommittedTextRef\.current \?\? dictationBaselineRef\.current \?\? "", text\)/u);
	assert.match(SHELL_SOURCE, /appendDictationTranscript\(dictationCommittedTextRef\.current \?\? dictationBaselineRef\.current \?\? "", transcript\)/u);
	assert.match(SHELL_SOURCE, /dictationCommittedTextRef\.current = nextText;/u);
	assert.match(SHELL_SOURCE, /setVoiceTranscript\(nextText\)/u);
	assert.doesNotMatch(SHELL_SOURCE, /setVoiceTranscript\(text\)/u);
	assert.doesNotMatch(SHELL_SOURCE, /setVoiceTranscript\(transcript\)/u);
	assert.doesNotMatch(SHELL_SOURCE, /setVoiceTranscript\(""\)/u);
	assert.doesNotMatch(SHELL_SOURCE, /transcriptToPreserve/u);
	assert.match(SHELL_SOURCE, /resolveComposerDictationState\(\{[\s\S]*active: isDictationActive,[\s\S]*voiceState: realtime\.voiceState,[\s\S]*\}\)/u);
	assert.match(SHELL_SOURCE, /dictationState=\{dictationState\}/u);
	assert.match(SHELL_SOURCE, /dictationTranscriptPreview=\{dictationTranscriptPreview\}/u);
	assert.match(SHELL_SOURCE, /onStartDictation=\{handleStartDictation\}/u);
	assert.match(SHELL_SOURCE, /onStopDictation=\{handleStopDictation\}/u);
	assert.match(SHELL_SOURCE, /const handleStopDictation = useCallback/u);
	assert.match(SHELL_SOURCE, /const handleStopDictation = useCallback\(\(\) => \{[\s\S]*manualVoiceStopRef\.current = true;/u);
	assert.match(SHELL_SOURCE, /onTextChange=\{handleComposerTextChange\}/u);
	assert.match(SHELL_SOURCE, /if \(isDictationActiveRef\.current\) \{[\s\S]*return;[\s\S]*\}[\s\S]*const c = chatRef\.current/u);
	assert.match(SHELL_SOURCE, /realtime\.connect\(\{ transcriptionOnly: true \}\);/u);
});

test("RovoAppShell clears shell-owned prefill sources only after submit succeeds", () => {
	assert.doesNotMatch(
		SHELL_SOURCE,
		/const latestUserMessageIdBeforeSubmit = getLatestUserMessageId\(chat\.messages\);\s*clearPrefillSources\(\);\s*if \(isRealtimeActive\)/u,
	);
	assert.match(
		SHELL_SOURCE,
		/await realtimeChat\.submitRealtimeText\(\{[\s\S]*?\}\);\s*if \(shouldClearHermesSkillSelection\) \{[\s\S]*?\}\s*clearPrefillSources\(\);/u,
	);
	assert.match(
		SHELL_SOURCE,
		/await realtimeVoice\.sendTextInput\(\{[\s\S]*?\}\);\s*\} catch \(error\) \{[\s\S]*?\}\s*clearPrefillSources\(\);\s*return;/u,
	);
	assert.match(
		SHELL_SOURCE,
		/await realtimeChat\.submitPrompt\(\{[\s\S]*?\}\);\s*if \(shouldClearHermesSkillSelection\) \{[\s\S]*?\}\s*clearPrefillSources\(\);/u,
	);
});
