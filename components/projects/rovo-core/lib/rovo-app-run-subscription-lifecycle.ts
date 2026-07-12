import type { UIMessageChunk } from "ai";
import type {
	RovoAppActiveRun,
	RovoAppRunStatus,
} from "@/lib/rovo-app-types";
import type { RovoUIMessage } from "@/lib/rovo-ui-messages";
import {
	isRovoAppDelegationAbortError,
	readRovoAppDelegationResponseStream,
} from "@/components/projects/rovo-core/lib/rovo-app-delegation-stream";
import { upsertRealtimeMessage } from "@/components/projects/rovo-core/lib/rovo-app-realtime-message-state";
import type { RovoAppThreadNavigationIdentity } from "@/components/projects/rovo-core/lib/rovo-app-thread-lifecycle";

interface MutableRef<T> {
	current: T;
}

type SetState<T> = (value: T | ((previousValue: T) => T)) => void;

export interface SubscribeToRovoAppRunLifecycleInput {
	activeRun: RovoAppActiveRun | null;
	activeThreadIdRef: MutableRef<string | null>;
	fetchRunStream: (
		threadId: string,
		signal: AbortSignal,
	) => Promise<Response>;
	handleAttachedRunChunk: (chunk: UIMessageChunk) => void;
	hydrateThreadById: (threadId: string) => Promise<unknown>;
	isNavigationCurrent: (navigationIdentity: RovoAppThreadNavigationIdentity) => boolean;
	navigationIdentity: RovoAppThreadNavigationIdentity;
	runSubscriptionAbortControllerRef: MutableRef<AbortController | null>;
	runSubscriptionThreadIdRef: MutableRef<string | null>;
	setAttachedRunStatus: (status: RovoAppRunStatus | null) => void;
	setInputError: (message: string | null) => void;
	setLocalThreadActiveRun: (threadId: string, activeRun: RovoAppActiveRun | null) => void;
	setRovoMessages: SetState<RovoUIMessage[]>;
	threadId: string;
	toUserErrorMessage: (error: unknown) => string;
}

export async function subscribeToRovoAppRunWithLifecycle({
	activeRun,
	activeThreadIdRef,
	fetchRunStream,
	handleAttachedRunChunk,
	hydrateThreadById,
	isNavigationCurrent,
	navigationIdentity,
	runSubscriptionAbortControllerRef,
	runSubscriptionThreadIdRef,
	setAttachedRunStatus,
	setInputError,
	setLocalThreadActiveRun,
	setRovoMessages,
	threadId,
	toUserErrorMessage,
}: SubscribeToRovoAppRunLifecycleInput): Promise<void> {
	function isCurrentNavigation(): boolean {
		return typeof isNavigationCurrent !== "function"
			|| isNavigationCurrent(navigationIdentity);
	}

	if (!isCurrentNavigation()) {
		return;
	}

	runSubscriptionAbortControllerRef.current?.abort();
	const abortController = new AbortController();
	runSubscriptionAbortControllerRef.current = abortController;
	runSubscriptionThreadIdRef.current = threadId;
	setAttachedRunStatus(activeRun?.status === "queued" ? "queued" : "streaming");

	try {
		const response = await fetchRunStream(threadId, abortController.signal);
		if (!isCurrentNavigation()) {
			abortController.abort();
			return;
		}
		if (response.status === 404) {
			setAttachedRunStatus(null);
			setLocalThreadActiveRun(threadId, null);
			if (activeThreadIdRef.current === threadId) {
				setInputError("The previous run is no longer active.");
				void hydrateThreadById(threadId);
			}
			return;
		}
		if (!response.ok || !response.body) {
			throw new Error(
				(await response.text().catch(() => "")) || "Failed to attach Rovo run.",
			);
		}

		for await (const streamedMessage of readRovoAppDelegationResponseStream({
			stream: response.body,
			onChunk: (chunk) => {
				if (isCurrentNavigation()) {
					handleAttachedRunChunk(chunk);
				}
			},
			onError: (error) => {
				console.error("[RovoApp] Failed to read attached run stream:", error);
			},
			terminateOnError: true,
		})) {
			if (!isCurrentNavigation()) {
				abortController.abort();
				return;
			}
			setAttachedRunStatus("streaming");
			setRovoMessages((previousMessages) =>
				upsertRealtimeMessage(previousMessages, streamedMessage),
			);
		}

		if (!isCurrentNavigation()) {
			return;
		}
		setAttachedRunStatus(null);
		setLocalThreadActiveRun(threadId, null);
		if (activeThreadIdRef.current === threadId) {
			void hydrateThreadById(threadId);
		}
	} catch (error) {
		if (isRovoAppDelegationAbortError(error) || abortController.signal.aborted) {
			return;
		}

		if (!isCurrentNavigation()) {
			return;
		}
		setInputError(toUserErrorMessage(error));
	} finally {
		if (runSubscriptionAbortControllerRef.current === abortController) {
			runSubscriptionAbortControllerRef.current = null;
			runSubscriptionThreadIdRef.current = null;
		}
	}
}
