"use client";

import { useCallback, useRef, useState } from "react";

import { useRealtimeVoice } from "@/components/projects/rovo-core/hooks/use-realtime-voice";
import type { RovoComposerDictationState } from "@/components/projects/shared/components/rovo-composer-send-controls";
import { appendDictationTranscript, resolveComposerDictationState } from "@/lib/composer-dictation";

type RealtimeTranscriptPayload =
	| string
	| {
			delta?: string;
			text?: string;
			transcript?: string;
	  };

interface PromptInputDemoVoiceOptions {
	onPromptChange: (value: string) => void;
	prompt: string;
}

interface PromptInputDemoVoiceControls {
	clickyActive: boolean;
	dictationState: RovoComposerDictationState;
	dictationTranscriptPreview: string | null;
	handleStartDictation: () => void;
	handleStop: () => void;
	handleStopDictation: () => void;
	handleToggleClicky: () => void;
	handleToggleRealtimeVoice: () => void;
	micStream: MediaStream | null;
	realtimeVoiceActive: boolean;
	realtimeVoiceState: "idle" | "connecting" | "listening" | "speaking";
	statusMessage: string | null;
}

function getRealtimeTranscriptText(payload: RealtimeTranscriptPayload): string {
	if (typeof payload === "string") {
		return payload;
	}

	return payload.text ?? payload.transcript ?? payload.delta ?? "";
}

const ignoreDemoDelegation = () => undefined;

export function usePromptInputDemoVoice({
	onPromptChange,
	prompt,
}: Readonly<PromptInputDemoVoiceOptions>): PromptInputDemoVoiceControls {
	const promptRef = useRef(prompt);
	promptRef.current = prompt;
	const dictationBaselineRef = useRef<string | null>(null);
	const dictationCommittedTextRef = useRef<string | null>(null);
	const isDictationActiveRef = useRef(false);
	const [isDictationActive, setIsDictationActive] = useState(false);
	const [dictationTranscriptPreview, setDictationTranscriptPreview] = useState<string | null>(null);
	const [clickyActive, setClickyActive] = useState(false);
	const [localStatusMessage, setLocalStatusMessage] = useState<string | null>(null);

	const updateDictationTranscript = useCallback((
		payload: RealtimeTranscriptPayload,
		commit: boolean,
	) => {
		if (!isDictationActiveRef.current) {
			return;
		}

		const transcript = getRealtimeTranscriptText(payload);
		if (!transcript.trim()) {
			return;
		}

		const nextPrompt = appendDictationTranscript(
			dictationCommittedTextRef.current ?? dictationBaselineRef.current ?? "",
			transcript,
		);
		if (commit) {
			dictationCommittedTextRef.current = nextPrompt;
		}
		promptRef.current = nextPrompt;
		setDictationTranscriptPreview(transcript);
		onPromptChange(nextPrompt);
	}, [onPromptChange]);

	const handleVoiceSessionEnded = useCallback(() => {
		setClickyActive(false);
	}, []);

	const realtime = useRealtimeVoice({
		chatMessages: [],
		onDelegateToRovo: ignoreDemoDelegation,
		onEndVoiceSession: handleVoiceSessionEnded,
		onSpeechStarted: useCallback(() => {
			if (isDictationActiveRef.current) {
				setDictationTranscriptPreview(null);
			}
		}, []),
		onSpeechTranscriptCompleted: useCallback((payload: RealtimeTranscriptPayload) => {
			updateDictationTranscript(payload, true);
		}, [updateDictationTranscript]),
		onSpeechTranscriptDelta: useCallback((payload: RealtimeTranscriptPayload) => {
			updateDictationTranscript(payload, false);
		}, [updateDictationTranscript]),
		sessionPolicyMode: "auto",
	});
	const {
		connect,
		disconnect,
		micStream,
		statusMessage: realtimeStatusMessage,
		voiceState: realtimeVoiceState,
	} = realtime;

	const handleStopDictation = useCallback(() => {
		dictationBaselineRef.current = null;
		dictationCommittedTextRef.current = null;
		isDictationActiveRef.current = false;
		setIsDictationActive(false);
		setDictationTranscriptPreview(null);
		disconnect();
	}, [disconnect]);

	const handleStartDictation = useCallback(() => {
		if (realtimeVoiceState !== "idle") {
			disconnect();
		}
		const baseline = promptRef.current;
		dictationBaselineRef.current = baseline;
		dictationCommittedTextRef.current = baseline;
		isDictationActiveRef.current = true;
		setIsDictationActive(true);
		setDictationTranscriptPreview(null);
		setLocalStatusMessage(null);
		connect({ transcriptionOnly: true });
	}, [connect, disconnect, realtimeVoiceState]);

	const realtimeVoiceActive = !isDictationActive && realtimeVoiceState !== "idle";
	const handleToggleRealtimeVoice = useCallback(() => {
		setLocalStatusMessage(null);
		if (realtimeVoiceActive) {
			setClickyActive(false);
			disconnect();
			return;
		}

		setClickyActive(false);
		connect();
	}, [connect, disconnect, realtimeVoiceActive]);

	const handleToggleClicky = useCallback(() => {
		setClickyActive((active) => !active);
	}, []);

	const handleStop = useCallback(() => {
		setClickyActive(false);
		if (isDictationActiveRef.current) {
			handleStopDictation();
			return;
		}
		disconnect();
	}, [disconnect, handleStopDictation]);

	return {
		clickyActive: realtimeVoiceActive && clickyActive,
		dictationState: resolveComposerDictationState({
			active: isDictationActive,
			voiceState: realtimeVoiceState,
		}),
		dictationTranscriptPreview,
		handleStartDictation,
		handleStop,
		handleStopDictation,
		handleToggleClicky,
		handleToggleRealtimeVoice,
		micStream,
		realtimeVoiceActive,
		realtimeVoiceState,
		statusMessage: localStatusMessage ?? realtimeStatusMessage,
	};
}
