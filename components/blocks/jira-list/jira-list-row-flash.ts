"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { JiraListRowFlash } from "@/components/blocks/jira-list/jira-list-types";

export const NO_JIRA_LIST_ROW_FLASH: JiraListRowFlash = { issueKeys: [], token: 0 };

const NO_FLASHING_KEYS: ReadonlySet<string> = new Set<string>();

/**
 * Has to outlast the `jira-list-row-flash` utility in `app/globals.css`, which
 * runs for `--duration-slowest` (600ms). Holding the class a beat longer lets
 * the animation finish before the row hands its background back to the cell's
 * own classes.
 */
export const JIRA_LIST_ROW_FLASH_HOLD_MS = 700;

export function appendRowFlash(
	current: JiraListRowFlash,
	issueKeys: readonly string[],
): JiraListRowFlash {
	return issueKeys.length === 0
		? current
		: { issueKeys: [...issueKeys], token: current.token + 1 };
}

/**
 * Owner side of the acknowledgement.
 *
 * A drop calls `flashRow` once per session, synchronously, from inside the same
 * event. Collecting those keys and publishing them from a microtask turns that
 * run of calls into a single flash, so a three-session drop lights three rows
 * together instead of replacing the flash twice on its way to the last one.
 */
export function useJiraListRowFlashSource(): Readonly<{
	flash: JiraListRowFlash;
	flashRow: (issueKey: string) => void;
}> {
	const [flash, setFlash] = useState<JiraListRowFlash>(NO_JIRA_LIST_ROW_FLASH);
	const batchRef = useRef<string[]>([]);

	const flashRow = useCallback((issueKey: string) => {
		const isFirstOfBatch = batchRef.current.length === 0;
		batchRef.current.push(issueKey);
		if (!isFirstOfBatch) {
			return;
		}

		queueMicrotask(() => {
			const issueKeys = batchRef.current;
			batchRef.current = [];
			setFlash((current) => appendRowFlash(current, issueKeys));
		});
	}, []);

	return { flash, flashRow };
}

/**
 * Consumer side: the keys currently flashing.
 *
 * The class has to be absent before it can be applied again, otherwise the CSS
 * animation never restarts — so the keys are held for one flash and dropped,
 * rather than mirrored from the prop for as long as it is set.
 */
export function useJiraListRowFlashKeys(
	flash: JiraListRowFlash | undefined,
): ReadonlySet<string> {
	const [flashed, setFlashed] = useState<Readonly<{
		keys: ReadonlySet<string>;
		token: number;
	}>>(() => ({
		keys: NO_FLASHING_KEYS,
		token: flash?.token ?? NO_JIRA_LIST_ROW_FLASH.token,
	}));

	if (flash !== undefined && flash.token !== flashed.token) {
		setFlashed({ keys: new Set(flash.issueKeys), token: flash.token });
	}

	useEffect(() => {
		if (flashed.keys.size === 0) {
			return;
		}

		const timer = window.setTimeout(() => {
			setFlashed((current) => ({ ...current, keys: NO_FLASHING_KEYS }));
		}, JIRA_LIST_ROW_FLASH_HOLD_MS);

		return () => window.clearTimeout(timer);
	}, [flashed]);

	return flashed.keys;
}
