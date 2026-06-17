export type RealtimeAssistantTextSource = "none" | "text" | "audio_transcript";

export interface RealtimeAssistantTextStreamState {
	hasStarted: boolean;
	itemId: string | null;
	responseId: string | null;
	source: RealtimeAssistantTextSource;
	transcript: string;
}

export interface RealtimeAssistantTextDelta {
	delta: string;
	itemId?: string | null;
	responseId?: string | null;
	source: Exclude<RealtimeAssistantTextSource, "none">;
}

export interface RealtimeAssistantTextDeltaResult {
	messageId: string | null;
	shouldReplaceTranscript: boolean;
	shouldEmitStart: boolean;
	state: RealtimeAssistantTextStreamState;
}

export function createRealtimeAssistantTextStreamState(): RealtimeAssistantTextStreamState {
	return {
		hasStarted: false,
		itemId: null,
		responseId: null,
		source: "none",
		transcript: "",
	};
}

function resetAssistantTextBoundary(
	state: RealtimeAssistantTextStreamState,
	{
		itemId,
		responseId,
	}: {
		itemId?: string | null;
		responseId?: string | null;
	},
): RealtimeAssistantTextStreamState {
	return {
		...createRealtimeAssistantTextStreamState(),
		itemId: itemId ?? null,
		responseId: responseId ?? null,
	};
}

function mergeAudioTranscriptWithTextDelta(
	transcript: string,
	delta: string,
): {
	nextSource: RealtimeAssistantTextSource;
	transcript: string;
} {
	if (!transcript || delta.startsWith(transcript)) {
		return { nextSource: "text", transcript: delta };
	}

	if (transcript.startsWith(delta) || transcript.includes(delta)) {
		return { nextSource: "audio_transcript", transcript };
	}

	let overlap = 0;
	const maxOverlap = Math.min(transcript.length, delta.length);
	for (let length = maxOverlap; length > 0; length -= 1) {
		if (transcript.endsWith(delta.slice(0, length))) {
			overlap = length;
			break;
		}
	}

	return {
		nextSource: "text",
		transcript: `${transcript}${delta.slice(overlap)}`,
	};
}

export function reduceRealtimeAssistantTextDelta(
	state: RealtimeAssistantTextStreamState,
	{
		delta,
		itemId,
		responseId,
		source,
	}: RealtimeAssistantTextDelta,
): RealtimeAssistantTextDeltaResult {
	let nextState = state;

	if (responseId) {
		if (state.responseId !== responseId) {
			nextState = resetAssistantTextBoundary(state, {
				itemId,
				responseId,
			});
		} else if (!state.itemId && itemId) {
			nextState = {
				...state,
				itemId,
			};
		}
	} else if (itemId && state.itemId !== itemId) {
		nextState = resetAssistantTextBoundary(state, {
			itemId,
		});
	}

	if (nextState.source === "text" && source === "audio_transcript") {
		return {
			messageId: nextState.itemId,
			shouldReplaceTranscript: false,
			shouldEmitStart: false,
			state: nextState,
		};
	}

	if (nextState.source === "audio_transcript" && source === "text") {
		const merged = mergeAudioTranscriptWithTextDelta(nextState.transcript, delta);

		return {
			messageId: nextState.itemId,
			shouldReplaceTranscript: true,
			shouldEmitStart: false,
			state: {
				...nextState,
				hasStarted: true,
				source: merged.nextSource,
				transcript: merged.transcript,
			},
		};
	}

	const shouldEmitStart = !nextState.hasStarted;
	nextState = {
		...nextState,
		hasStarted: true,
		source,
		transcript: `${nextState.transcript}${delta}`,
	};

	return {
		messageId: nextState.itemId,
		shouldReplaceTranscript: false,
		shouldEmitStart,
		state: nextState,
	};
}

export function finalizeRealtimeAssistantText(
	state: RealtimeAssistantTextStreamState,
): {
	messageId: string | null;
	text: string;
} {
	return {
		messageId: state.itemId,
		text: state.transcript,
	};
}
