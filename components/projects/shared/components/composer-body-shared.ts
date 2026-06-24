"use client";

import type { ChatStatus, FileUIPart } from "ai";
import { useEffect, useRef } from "react";
import { usePromptInputController } from "@/components/ui-custom/prompt-input";
import type { ComposerDirectoryAutocompleteController } from "@/components/ui-custom/rich-text-editor";
import type { RovoComposerDictationState } from "@/components/projects/shared/components/rovo-composer-send-controls";
import type { DirectoryAutocompleteState } from "@/lib/directory-autocomplete";

/** Props shared by both composer bodies (card + floating). */
export interface ComposerBodyBaseProps {
	autoFocus: boolean;
	canSubmit: boolean;
	clickyActive: boolean;
	composerStatus: ChatStatus;
	directoryAutocompleteListVisible: boolean;
	directoryAutocompleteLimit?: number;
	dictationState: RovoComposerDictationState;
	dictationTranscriptPreview?: string | null;
	focusRequestKey: number | undefined;
	micStream: MediaStream | null | undefined;
	onDirectoryAutocompleteChange?: (state: DirectoryAutocompleteState | null) => void;
	onDirectoryAutocompleteControllerChange?: (controller: ComposerDirectoryAutocompleteController | null) => void;
	onPromptSubmit: (payload: { text: string; files: FileUIPart[] }) => void;
	onStartDictation?: () => void;
	onStopDictation?: () => void;
	onStop: () => Promise<void>;
	onToggleClicky?: () => void;
	onToggleRealtimeVoice?: () => void;
	placeholder: string;
	prefillText: string | null | undefined;
	prefillRequestKey: number;
	realtimeVoiceActive: boolean;
	realtimeVoiceState: "idle" | "connecting" | "listening" | "speaking";
	screenAssistantTargetPrefix?: string;
	showBackgroundStop: boolean;
	submitDisabled: boolean;
	textValue: string;
	attachmentCount: number;
}

/**
 * Apply prefilled text from gallery click or voice transcript streaming.
 * Routing through the controller lets the core editor sync the value into the
 * contentEditable (via setComposerPlainText), which auto-grows on its own —
 * no manual textarea height management is needed anymore.
 */
export function usePrefillEffect(prefillText: string | null | undefined, prefillRequestKey = 0) {
	const controller = usePromptInputController();
	const appliedPrefillRef = useRef<{
		key: number;
		text: string | null;
	}>({
		key: 0,
		text: null,
	});
	useEffect(() => {
		if (prefillText === undefined) {
			return;
		}

		if (prefillText === appliedPrefillRef.current.text && prefillRequestKey === appliedPrefillRef.current.key) {
			return;
		}

		appliedPrefillRef.current = {
			key: prefillRequestKey,
			text: prefillText,
		};

		if (prefillText === null) {
			// Voice transcript cleared (auto-sent) — clear the input.
			controller.textInput.clear();
		} else {
			controller.textInput.setInput(prefillText);
		}
	}, [prefillRequestKey, prefillText, controller.textInput]);
}
