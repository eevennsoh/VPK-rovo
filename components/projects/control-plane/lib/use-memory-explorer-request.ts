"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { API_ENDPOINTS } from "@/lib/api-config";
import type {
	WikiCanonicalMemoryDocuments,
	WikiMemoryExplorerFilters,
	WikiMemoryExplorerResponse,
} from "@/lib/rovo-runtime-types";

export type FilterState = {
	includeLinkedKnowledge: boolean;
	kind: string;
	scope: string;
	status: string;
	tag: string;
	threadId: string;
};

type ExplorerRequestState = {
	controller: AbortController | null;
	requestId: number;
};

export type ExplorerRefreshOptions = {
	includeMemories?: boolean;
};

interface UseMemoryExplorerRequestInput {
	filters: FilterState;
	onExplorerReceived?: (explorer: WikiMemoryExplorerResponse) => void;
}

const EXPLORER_FILTER_DEBOUNCE_MS = 250;

export function buildInitialFilterState(searchParams: { get(name: string): string | null } | null): FilterState {
	return {
		includeLinkedKnowledge: searchParams?.get("includeLinkedKnowledge") !== "false",
		kind: searchParams?.get("kind") ?? "all",
		scope: searchParams?.get("scope") ?? "all",
		status: searchParams?.get("status") ?? "all",
		tag: searchParams?.get("tag") ?? "",
		threadId: searchParams?.get("threadId") ?? "",
	};
}

function buildExplorerFilterInput(filters: FilterState): Partial<WikiMemoryExplorerFilters> {
	return {
		includeLinkedKnowledge: filters.includeLinkedKnowledge,
		kind: filters.kind === "all" ? null : filters.kind,
		scope: filters.scope === "all" ? null : filters.scope,
		status: filters.status === "all" ? null : filters.status,
		tag: filters.tag.trim() || null,
		threadId: filters.threadId.trim() || null,
	};
}

async function getApiErrorMessage(response: Response): Promise<string> {
	const fallback = `Request failed with status ${response.status}`;
	const body = await response.text().catch(() => "");
	if (!body.trim()) {
		return fallback;
	}

	try {
		const payload = JSON.parse(body) as { details?: unknown; error?: unknown };
		if (typeof payload.error === "string" && payload.error.trim()) {
			return payload.error.trim();
		}
		if (typeof payload.details === "string" && payload.details.trim()) {
			return payload.details.trim();
		}
	} catch {
		return body.trim();
	}

	return fallback;
}

function isAbortError(error: unknown): boolean {
	return error instanceof DOMException && error.name === "AbortError";
}

async function fetchWikiMemoryExplorerSnapshot(
	filters: Partial<WikiMemoryExplorerFilters>,
	signal: AbortSignal,
): Promise<WikiMemoryExplorerResponse> {
	const response = await fetch(API_ENDPOINTS.wikiMemoryExplorer(filters), {
		method: "GET",
		signal,
	});
	if (!response.ok) {
		throw new Error(await getApiErrorMessage(response));
	}

	const payload = await response.json() as { explorer?: WikiMemoryExplorerResponse };
	if (!payload.explorer) {
		throw new Error("Wiki memory explorer response was empty.");
	}
	return payload.explorer;
}

async function fetchWikiMemoryDocumentsSnapshot(signal: AbortSignal): Promise<WikiCanonicalMemoryDocuments> {
	const response = await fetch(API_ENDPOINTS.WIKI_MEMORIES, {
		method: "GET",
		signal,
	});
	if (!response.ok) {
		throw new Error(await getApiErrorMessage(response));
	}

	const payload = await response.json() as { memories?: WikiCanonicalMemoryDocuments };
	if (!payload.memories) {
		throw new Error("Wiki memory response was empty.");
	}
	return payload.memories;
}

export function useMemoryExplorerRequest({
	filters,
	onExplorerReceived,
}: Readonly<UseMemoryExplorerRequestInput>) {
	const [explorer, setExplorer] = useState<WikiMemoryExplorerResponse | null>(null);
	const [memoryDocuments, setMemoryDocuments] = useState<WikiCanonicalMemoryDocuments | null>(null);
	const [debouncedTextFilters, setDebouncedTextFilters] = useState<Pick<FilterState, "tag" | "threadId">>(() => ({
		tag: filters.tag,
		threadId: filters.threadId,
	}));
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const explorerRequestRef = useRef<ExplorerRequestState>({ controller: null, requestId: 0 });

	const filterInput = useMemo(() => buildExplorerFilterInput({
		includeLinkedKnowledge: filters.includeLinkedKnowledge,
		kind: filters.kind,
		scope: filters.scope,
		status: filters.status,
		tag: debouncedTextFilters.tag,
		threadId: debouncedTextFilters.threadId,
	}), [
		debouncedTextFilters.tag,
		debouncedTextFilters.threadId,
		filters.includeLinkedKnowledge,
		filters.kind,
		filters.scope,
		filters.status,
	]);

	const refreshExplorer = useCallback(async (nextFilters = filterInput, options: ExplorerRefreshOptions = {}) => {
		const nextRequestId = explorerRequestRef.current.requestId + 1;
		explorerRequestRef.current.controller?.abort();
		const controller = new AbortController();
		explorerRequestRef.current = {
			controller,
			requestId: nextRequestId,
		};
		setIsLoading(true);
		try {
			const shouldRefreshMemories = options.includeMemories === true || memoryDocuments === null;
			const [nextExplorer, nextMemories] = await Promise.all([
				fetchWikiMemoryExplorerSnapshot(nextFilters, controller.signal),
				shouldRefreshMemories
					? fetchWikiMemoryDocumentsSnapshot(controller.signal)
					: Promise.resolve(null),
			]);
			if (
				controller.signal.aborted
				|| explorerRequestRef.current.requestId !== nextRequestId
			) {
				return;
			}
			setExplorer(nextExplorer);
			if (nextMemories) {
				setMemoryDocuments(nextMemories);
			}
			setErrorMessage(null);
			onExplorerReceived?.(nextExplorer);
		} catch (error) {
			if (
				isAbortError(error)
				|| explorerRequestRef.current.requestId !== nextRequestId
			) {
				return;
			}
			setErrorMessage(error instanceof Error ? error.message : String(error));
		} finally {
			if (explorerRequestRef.current.requestId === nextRequestId) {
				explorerRequestRef.current = {
					controller: null,
					requestId: nextRequestId,
				};
				setIsLoading(false);
			}
		}
	}, [filterInput, memoryDocuments, onExplorerReceived]);

	useEffect(() => {
		const debounceTimer = window.setTimeout(() => {
			setDebouncedTextFilters({
				tag: filters.tag,
				threadId: filters.threadId,
			});
		}, EXPLORER_FILTER_DEBOUNCE_MS);

		return () => window.clearTimeout(debounceTimer);
	}, [filters.tag, filters.threadId]);

	useEffect(() => {
		void refreshExplorer(filterInput);
		// eslint-disable-next-line react-hooks/exhaustive-deps -- filters are fully represented by filterInput
	}, [filterInput.kind, filterInput.scope, filterInput.status, filterInput.tag, filterInput.threadId, filterInput.includeLinkedKnowledge]);

	useEffect(() => {
		return () => {
			const requestId = explorerRequestRef.current.requestId + 1;
			explorerRequestRef.current.controller?.abort();
			explorerRequestRef.current = {
				controller: null,
				requestId,
			};
		};
	}, []);

	return {
		explorer,
		filterInput,
		errorMessage,
		isLoading,
		memoryDocuments,
		refreshExplorer,
		setErrorMessage,
	};
}
