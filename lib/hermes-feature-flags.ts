"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Runtime control for the Hermes "embed" surfaced inside the Rovo and Studio
 * chat experiences (inline skill review bar, skill selection/fetching, and
 * Hermes prompt-context injection).
 *
 * While disabled the experience does not:
 *  - fetch Hermes skills or skill drafts,
 *  - render the inline Hermes skill review embed, or
 *  - inject any Hermes skill context into outgoing prompts.
 *
 * The user toggles this from Settings → Runtime options. The choice persists in
 * localStorage so it applies across the whole experience.
 */
export const HERMES_EMBED_STORAGE_KEY = "vpk-hermes-embed-enabled";

/** Default state when the user has not made a choice yet. */
export const HERMES_EMBED_DEFAULT_ENABLED = false;

const STORAGE_EVENT_NAME = `vpk-persistent-state:${HERMES_EMBED_STORAGE_KEY}`;

/**
 * Synchronous reader for non-React call sites (e.g. building prompt context at
 * send time). Falls back to the default during SSR or storage failures.
 */
export function isHermesEmbedEnabled(): boolean {
	if (typeof window === "undefined") {
		return HERMES_EMBED_DEFAULT_ENABLED;
	}

	try {
		const rawValue = window.localStorage.getItem(HERMES_EMBED_STORAGE_KEY);
		if (rawValue === null) {
			return HERMES_EMBED_DEFAULT_ENABLED;
		}
		return JSON.parse(rawValue) === true;
	} catch {
		return HERMES_EMBED_DEFAULT_ENABLED;
	}
}

export function setHermesEmbedEnabled(enabled: boolean): void {
	if (typeof window === "undefined") {
		return;
	}

	try {
		window.localStorage.setItem(HERMES_EMBED_STORAGE_KEY, JSON.stringify(enabled));
		window.dispatchEvent(new Event(STORAGE_EVENT_NAME));
	} catch {
		// Ignore storage failures in private/incognito or hardened contexts.
	}
}

function subscribe(listener: () => void): () => void {
	if (typeof window === "undefined") {
		return () => {};
	}

	const handleStorage = (event: StorageEvent) => {
		if (event.key === HERMES_EMBED_STORAGE_KEY || event.key === null) {
			listener();
		}
	};

	window.addEventListener("storage", handleStorage);
	window.addEventListener(STORAGE_EVENT_NAME, listener);

	return () => {
		window.removeEventListener("storage", handleStorage);
		window.removeEventListener(STORAGE_EVENT_NAME, listener);
	};
}

/**
 * Reactive hook for React components. Returns the current enabled state and a
 * setter that persists the choice and notifies every subscriber.
 */
export function useHermesEmbedEnabled(): readonly [boolean, (enabled: boolean) => void] {
	const enabled = useSyncExternalStore(
		subscribe,
		isHermesEmbedEnabled,
		() => HERMES_EMBED_DEFAULT_ENABLED,
	);

	const setEnabled = useCallback((next: boolean) => {
		setHermesEmbedEnabled(next);
	}, []);

	return [enabled, setEnabled] as const;
}
