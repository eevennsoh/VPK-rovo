export type RovoAppComposerIdleAction =
	| "background-stop"
	| "none"
	| "submit"
	| "voice-start";

export function resolveRovoAppComposerIdleAction(input: {
	canSubmit: boolean;
	isComposerBusy: boolean;
	realtimeVoiceActive: boolean;
	showBackgroundStop: boolean;
	submitDisabled: boolean;
	canStartDictation: boolean;
	canStartRealtimeVoice: boolean;
}): RovoAppComposerIdleAction {
	if (input.realtimeVoiceActive || input.isComposerBusy) {
		return "none";
	}

	if (input.canSubmit) {
		return "submit";
	}

	if (input.showBackgroundStop) {
		return "background-stop";
	}

	if (input.submitDisabled) {
		return "none";
	}

	if (input.canStartDictation || input.canStartRealtimeVoice) {
		return "voice-start";
	}

	return "none";
}
