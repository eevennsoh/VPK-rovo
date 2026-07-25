"use client";

import { useCallback, useRef, useState } from "react";

export interface ChatMessage {
	id: string;
	type: "user" | "assistant";
	content: string;
}

interface UseChatSubmitReturn {
	prompt: string;
	setPrompt: (nextPrompt: string) => void;
	handleSubmit: () => void;
	abort: () => void;
	messages: ChatMessage[];
}

function createAssistantReply(promptText: string): string {
	return `Got it. I can help with: ${promptText}`;
}

export function useChatSubmit(): UseChatSubmitReturn {
	const [prompt, setPromptState] = useState("");
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const messageCountRef = useRef(0);
	const pendingResponseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const setPrompt = useCallback((nextPrompt: string) => {
		setPromptState(nextPrompt);
	}, []);

	const nextMessageId = useCallback((type: ChatMessage["type"]) => {
		messageCountRef.current += 1;
		return `${type}-${messageCountRef.current}`;
	}, []);

	const abort = useCallback(() => {
		if (pendingResponseTimerRef.current === null) {
			return;
		}

		clearTimeout(pendingResponseTimerRef.current);
		pendingResponseTimerRef.current = null;
	}, []);

	const handleSubmit = useCallback(() => {
		const promptText = prompt.trim();
		if (!promptText) {
			return;
		}

		abort();
		setPromptState("");
		const userMessageId = nextMessageId("user");
		setMessages((prev) => [
			...prev,
			{
				id: userMessageId,
				type: "user",
				content: promptText,
			},
		]);

		pendingResponseTimerRef.current = setTimeout(() => {
			const assistantMessageId = nextMessageId("assistant");
			setMessages((prev) => [
				...prev,
				{
					id: assistantMessageId,
					type: "assistant",
					content: createAssistantReply(promptText),
				},
			]);
			pendingResponseTimerRef.current = null;
		}, 280);
	}, [abort, nextMessageId, prompt]);

	return {
		prompt,
		setPrompt,
		handleSubmit,
		abort,
		messages,
	};
}
