const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const WRAPPER_SOURCE = fs.readFileSync(path.join(__dirname, "rovo-app-composer.tsx"), "utf8");
const SHELL_SOURCE = fs.readFileSync(path.join(__dirname, "rovo-app-shell.tsx"), "utf8");
const CLICKY_VOICE_HOOK_SOURCE = fs.readFileSync(
	path.join(__dirname, "..", "hooks", "use-clicky-voice.ts"),
	"utf8",
);

function sourceBetween(source, startNeedle, endNeedle) {
	const start = source.indexOf(startNeedle);
	const end = source.indexOf(endNeedle, start);

	assert.notEqual(start, -1, `Missing source marker: ${startNeedle}`);
	assert.notEqual(end, -1, `Missing source marker: ${endNeedle}`);
	return source.slice(start, end);
}

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

test("Rovo cursor activation starts live voice while cursor deactivation leaves live voice running", () => {
	const realtimeToggleSource = sourceBetween(SHELL_SOURCE, "const handleToggleRealtimeVoice", "const handleToggleClicky");
	const clickyToggleSource = sourceBetween(SHELL_SOURCE, "const handleToggleClicky", "// Keyboard shortcuts for Rovo");
	const keyboardShortcutSource = sourceBetween(SHELL_SOURCE, "// Keyboard shortcuts for Rovo", "const handleStartDictation");

	assert.match(SHELL_SOURCE, /activate: activateClicky,/u);
	assert.match(SHELL_SOURCE, /const startRealtimeVoice = useCallback\(\(\) => \{[\s\S]*manualVoiceStopRef\.current = false;[\s\S]*realtime\.connect\(\);[\s\S]*\}, \[realtime\]\);/u);

	assert.match(clickyToggleSource, /if \(isClickyActive\) \{[\s\S]*deactivateClicky\(\);[\s\S]*return;[\s\S]*\}/u);
	assert.match(clickyToggleSource, /activateClicky\(\);[\s\S]*if \(realtime\.voiceState === "idle"\) \{[\s\S]*startRealtimeVoice\(\);[\s\S]*\}/u);
	assert.doesNotMatch(clickyToggleSource, /realtime\.disconnect\(\)/u);

	assert.match(realtimeToggleSource, /if \(realtime\.voiceState === "idle"\) \{[\s\S]*startRealtimeVoice\(\);[\s\S]*return;[\s\S]*\}/u);
	assert.match(realtimeToggleSource, /realtime\.disconnect\(\);[\s\S]*deactivateClicky\(\);/u);

	assert.match(keyboardShortcutSource, /if \(e\.key === "K" && e\.shiftKey && \(e\.metaKey \|\| e\.ctrlKey\)\) \{[\s\S]*handleToggleClicky\(\);/u);
	assert.match(keyboardShortcutSource, /if \(e\.key === "Escape" && isClickyActive\) \{[\s\S]*deactivateClicky\(\);/u);
	assert.doesNotMatch(SHELL_SOURCE, /toggleClicky/u);
	assert.match(CLICKY_VOICE_HOOK_SOURCE, /Cursor deactivation must not stop/u);
	assert.doesNotMatch(CLICKY_VOICE_HOOK_SOURCE, /disconnectRealtime\(\)/u);
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
