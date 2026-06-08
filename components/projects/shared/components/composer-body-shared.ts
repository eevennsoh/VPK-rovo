"use client";

import type { ChatStatus, FileUIPart } from "ai";
import { useEffect, useRef } from "react";
import { usePromptInputController } from "@/components/ui-custom/prompt-input";
import type { ComposerDirectoryAutocompleteController } from "@/components/ui-custom/rich-text-editor";
import type { DirectoryAutocompleteState } from "@/lib/directory-autocomplete";

/** Props shared by both composer bodies (card + floating). */
export interface ComposerBodyBaseProps {
	autoFocus: boolean;
	canSubmit: boolean;
	clickyActive: boolean;
	composerStatus: ChatStatus;
	directoryAutocompleteListVisible: boolean;
	micStream: MediaStream | null | undefined;
	onDirectoryAutocompleteChange?: (state: DirectoryAutocompleteState | null) => void;
	onDirectoryAutocompleteControllerChange?: (controller: ComposerDirectoryAutocompleteController | null) => void;
	onPromptSubmit: (payload: { text: string; files: FileUIPart[] }) => void;
	onStop: () => Promise<void>;
	onToggleClicky?: () => void;
	onToggleRealtimeVoice?: () => void;
	placeholder: string;
	prefillText: string | null | undefined;
	realtimeVoiceActive: boolean;
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
export function usePrefillEffect(prefillText: string | null | undefined) {
	const controller = usePromptInputController();
	const appliedPrefillRef = useRef<string | null>(null);
	useEffect(() => {
		if (prefillText && prefillText !== appliedPrefillRef.current) {
			appliedPrefillRef.current = prefillText;
			controller.textInput.setInput(prefillText);
		} else if (prefillText === null && appliedPrefillRef.current !== null) {
			// Voice transcript cleared (auto-sent) — clear the input
			appliedPrefillRef.current = null;
			controller.textInput.clear();
		}
	}, [prefillText, controller.textInput]);
}
