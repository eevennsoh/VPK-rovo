"use client";

import { useCallback, useRef, useState } from "react";
import { useRovoChat } from "@/app/contexts";
import type { QueuedPromptItem } from "@/app/contexts";
import type { SendPromptOptions } from "@/app/contexts";
import { createRovoAppUserMessage } from "@/components/projects/studio/lib/rovo-app-user-message";
import { createId } from "@/lib/utils";
import type { RovoUIMessage } from "@/lib/rovo-ui-messages";
import type { FileUIPart } from "ai";

interface UseChatSubmitReturn {
	prompt: string;
	setPrompt: (prompt: string) => void;
	handleSubmit: (message: { text: string; files: FileUIPart[] }) => Promise<void>;
	submitPrompt: (prompt: string, files?: ReadonlyArray<FileUIPart>) => Promise<void>;
	abort: () => void;
	uiMessages: RovoUIMessage[];
	isStreaming: boolean;
	hasInFlightTurn: boolean;
	isSubmitPending: boolean;
	activeRequestStartedAt: number | null;
	queuedPrompts: ReadonlyArray<QueuedPromptItem>;
	removeQueuedPrompt: (id: string) => void;
}

interface UseChatSubmitOptions {
	defaultPromptOptions?: SendPromptOptions;
	/**
	 * Deterministic submit interceptor. When it reports the prompt as handled,
	 * the model call is skipped and the user message + returned `assistantReply`
	 * are injected locally. Used by the studio agent-edit chat to apply scripted
	 * agent edits without hitting the backend.
	 */
	onInterceptSubmit?: (text: string) => { handled: boolean; assistantReply?: string };
}

export function useChatSubmit({
	defaultPromptOptions,
	onInterceptSubmit,
}: Readonly<UseChatSubmitOptions> = {}): UseChatSubmitReturn {
	const [prompt, setPrompt] = useState("");
	const isSubmittingRef = useRef(false);
	const {
		uiMessages,
		sendPrompt,
		replaceMessages,
		stopStreaming,
		isStreaming,
		hasInFlightTurn,
		isSubmitPending,
		pendingSubmitStartedAt,
		activePrompt,
		queuedPrompts,
		removeQueuedPrompt,
	} = useRovoChat();

	const submitPrompt = useCallback(
		async (nextPrompt: string, files: ReadonlyArray<FileUIPart> = []) => {
			const promptText = nextPrompt.trim();
			if ((!promptText && files.length === 0) || isSubmittingRef.current) {
				return;
			}

			// Deterministic interception: when the prompt is a handled build intent,
			// skip the model and inject the user message + scripted reply locally so
			// the agent-edit conversation reads naturally.
			if (onInterceptSubmit && promptText) {
				const outcome = onInterceptSubmit(promptText);
				if (outcome.handled) {
					setPrompt("");
					const createdAt = new Date().toISOString();
					const userMessage = createRovoAppUserMessage({
						id: createId("rovo-chat-user"),
						createdAt,
						files,
						text: promptText,
					});
					const assistantMessage: RovoUIMessage = {
						id: createId("rovo-chat-assistant"),
						role: "assistant",
						metadata: { origin: "rovo", createdAt, updatedAt: createdAt },
						parts: outcome.assistantReply
							? [{ type: "text", text: outcome.assistantReply, state: "done" }]
							: [],
					};
					replaceMessages([...uiMessages, userMessage, assistantMessage]);
					return;
				}
			}

			isSubmittingRef.current = true;
			setPrompt("");

			try {
				await sendPrompt(promptText, defaultPromptOptions, files);
			} finally {
				isSubmittingRef.current = false;
			}
		},
		[defaultPromptOptions, onInterceptSubmit, replaceMessages, sendPrompt, uiMessages]
	);

	const handleSubmit = useCallback(async ({ files, text }: { text: string; files: FileUIPart[] }) => {
		await submitPrompt(text || prompt, files);
	}, [prompt, submitPrompt]);

	const abort = useCallback(() => {
		stopStreaming();
	}, [stopStreaming]);

	return {
		prompt,
		setPrompt,
		handleSubmit,
		submitPrompt,
		abort,
		uiMessages,
		isStreaming,
		hasInFlightTurn,
		isSubmitPending,
		activeRequestStartedAt: activePrompt?.createdAt ?? pendingSubmitStartedAt,
		queuedPrompts,
		removeQueuedPrompt,
	};
}
