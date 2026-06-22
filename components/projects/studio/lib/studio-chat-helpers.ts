"use client";

import type { StudioSessionAgentEntry } from "@/app/contexts";
import type { ChatPanelCardsProps, ChatPanelLocalConversation } from "@/components/projects/sidebar-chat/page";
import type { RovoUIMessage } from "@/lib/rovo-ui-messages";

interface StudioGenerationThreadSource {
	activeThreadId: string | null;
	messages: ReadonlyArray<RovoUIMessage>;
}

interface StudioGenerationThreadHydrator {
	hydrateThreadSnapshot?: (snapshot: { threadId: string; messages: ReadonlyArray<RovoUIMessage>; markPersisted?: boolean }) => void;
}

export function adoptStudioGenerationTranscript({
	chat,
	registry,
}: {
	chat: StudioGenerationThreadSource | null | undefined;
	registry: StudioGenerationThreadHydrator;
}): void {
	const generationThreadId = chat?.activeThreadId ?? null;
	const generationMessages = chat?.messages ?? [];
	if (!generationThreadId || generationMessages.length === 0) {
		return;
	}

	if (typeof registry.hydrateThreadSnapshot !== "function") {
		return;
	}

	registry.hydrateThreadSnapshot({
		markPersisted: true,
		messages: generationMessages,
		threadId: generationThreadId,
	});
}

export function createStudioAgentEditCards({
	entry,
	sourceMessageId,
}: {
	entry: StudioSessionAgentEntry | null | undefined;
	sourceMessageId: string | null | undefined;
}): ChatPanelCardsProps | undefined {
	if (!entry) {
		return undefined;
	}

	const freshGenerationMessageId = sourceMessageId ?? null;
	return {
		generatedAgentResult: freshGenerationMessageId ? entry.sourceResult : null,
		shouldRenderGeneratedAgentResult: ({ message }) => message.id === freshGenerationMessageId,
	};
}

export function buildStudioAgentOnboardingVoiceInput(voiceText: string): string {
	return `Speak much quicker than normal, with tight upbeat pacing. Read only this onboarding narration, without adding extra words:\n${voiceText}`;
}

export function createStudioAgentOnboardingLocalConversation({
	initialAgentName,
	initialVoiceKey,
	isActive,
	messages,
	onSubmit,
	resolveInitialVoiceText,
}: {
	initialAgentName: string | null;
	initialVoiceKey: string | null;
	isActive: boolean;
	messages: ReadonlyArray<RovoUIMessage>;
	onSubmit: ChatPanelLocalConversation["onSubmit"];
	resolveInitialVoiceText: (agentName: string | null) => string;
}): ChatPanelLocalConversation | null {
	if (!isActive || messages.length === 0) {
		return null;
	}

	return {
		buildVoiceInput: buildStudioAgentOnboardingVoiceInput,
		initialVoiceKey: initialVoiceKey ?? "generated-agent",
		initialVoiceText: resolveInitialVoiceText(initialAgentName),
		messages,
		onSubmit,
	};
}
