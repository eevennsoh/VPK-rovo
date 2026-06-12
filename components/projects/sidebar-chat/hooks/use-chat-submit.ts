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
	/**
	 * Runs the deterministic submit interceptor against `text`. When the prompt
	 * is a handled build intent, this aborts any in-flight turn, injects the user
	 * message + scripted reply locally, and returns `true` so the caller can skip
	 * the model. Returns `false` when no interceptor is configured or the prompt
	 * was not handled — the caller should fall back to its normal send path.
	 */
	interceptSubmit: (text: string, files?: ReadonlyArray<FileUIPart>) => Promise<boolean>;
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

	// `uiMessages` mutates on every streamed token. Keep it in a ref so the
	// interception closure can read the latest list without pulling it into the
	// `useCallback` deps below — otherwise `submitPrompt`/`handleSubmit` would get
	// a new identity per token for every (app-wide) ChatPanel consumer.
	const uiMessagesRef = useRef(uiMessages);
	uiMessagesRef.current = uiMessages;
	const isStreamingRef = useRef(isStreaming);
	isStreamingRef.current = isStreaming;
	const hasInFlightTurnRef = useRef(hasInFlightTurn);
	hasInFlightTurnRef.current = hasInFlightTurn;

	// Deterministic interception: when the prompt is a handled build intent, skip
	// the model and inject the user message + scripted reply locally so the
	// agent-edit conversation reads naturally. Returns true when handled.
	const interceptSubmit = useCallback(
		async (text: string, files: ReadonlyArray<FileUIPart> = []): Promise<boolean> => {
			const promptText = text.trim();
			if (!onInterceptSubmit || !promptText) {
				return false;
			}
			const outcome = onInterceptSubmit(promptText);
			if (!outcome.handled) {
				return false;
			}

			setPrompt("");
			// Abort any live turn before mutating the transcript — otherwise the
			// stream keeps writing tokens over our injection and corrupts it.
			if (isStreamingRef.current || hasInFlightTurnRef.current) {
				await stopStreaming();
			}

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
			replaceMessages([...uiMessagesRef.current, userMessage, assistantMessage]);
			return true;
		},
		[onInterceptSubmit, replaceMessages, stopStreaming]
	);

	const submitPrompt = useCallback(
		async (nextPrompt: string, files: ReadonlyArray<FileUIPart> = []) => {
			const promptText = nextPrompt.trim();
			if ((!promptText && files.length === 0) || isSubmittingRef.current) {
				return;
			}

			if (await interceptSubmit(nextPrompt, files)) {
				return;
			}

			isSubmittingRef.current = true;
			setPrompt("");

			try {
				await sendPrompt(promptText, defaultPromptOptions, files);
			} finally {
				isSubmittingRef.current = false;
			}
		},
		[defaultPromptOptions, interceptSubmit, sendPrompt]
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
		interceptSubmit,
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
