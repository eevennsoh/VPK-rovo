export type ComposerDictationState = "idle" | "recording" | "processing";

export function appendDictationTranscript(currentText: string, transcript: string): string {
	const trimmedTranscript = transcript.trim();
	if (!trimmedTranscript) {
		return currentText;
	}

	if (!currentText.trim()) {
		return trimmedTranscript;
	}

	const separator = /\s$/u.test(currentText) ? "" : " ";
	return `${currentText}${separator}${trimmedTranscript}`;
}

export function resolveComposerDictationState(input: {
	active: boolean;
	voiceState: "idle" | "recording" | "processing" | "speaking" | "connecting" | "listening";
}): ComposerDictationState {
	if (!input.active) {
		return "idle";
	}

	if (input.voiceState === "recording" || input.voiceState === "listening") {
		return "recording";
	}

	if (input.voiceState === "processing" || input.voiceState === "speaking" || input.voiceState === "connecting") {
		return "processing";
	}

	return "recording";
}
