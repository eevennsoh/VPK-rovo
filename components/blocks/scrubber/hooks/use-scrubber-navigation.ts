"use client";

import { useRef, type KeyboardEvent, type RefObject } from "react";

import type { ScrubberEntry } from "@/components/blocks/scrubber/lib/scrubber-entries";

/**
 * Both axes' arrows are accepted on either orientation. Up/Down on a horizontal
 * rail is a harmless convenience, and one shared map keeps the two orientations
 * from drifting into different keyboard contracts.
 */
const KEY_DELTAS: Readonly<Record<string, number | undefined>> = {
	ArrowDown: 1,
	ArrowRight: 1,
	ArrowUp: -1,
	ArrowLeft: -1,
};

export interface ScrubberNavigation {
	/** Goes on the rail container — key events bubble up from the focused mark. */
	handleKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
	markRefs: RefObject<Array<HTMLButtonElement | null>>;
	/** Selects an entry and moves focus to it. Clamped, never wrapping. */
	moveTo: (index: number) => void;
}

/**
 * Roving-tabindex navigation over the whole rail, shared by both axes.
 *
 * Arrows step from the mark that has focus, not from the active entry. The two
 * agree the moment Tab lands on the rail, but selecting commits and the active
 * index only catches up on the next frame — stepping from the active index
 * would silently drop a keypress whenever key repeat outran the commit.
 * `document.activeElement` is only read inside an event handler, so there is no
 * server-render hazard.
 */
export function useScrubberNavigation(
	entries: readonly ScrubberEntry[],
	activeIndex: number,
	onSelect: (id: string) => void,
): ScrubberNavigation {
	const markRefs = useRef<Array<HTMLButtonElement | null>>([]);

	function moveTo(index: number) {
		if (entries.length === 0) {
			return;
		}
		const next = Math.min(Math.max(index, 0), entries.length - 1);
		onSelect(entries[next].id);
		markRefs.current[next]?.focus();
	}

	function toOriginIndex(): number {
		const focused = markRefs.current.findIndex((node) => node !== null && node === document.activeElement);
		return focused === -1 ? activeIndex : focused;
	}

	function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
		if (event.key === "Home" || event.key === "End") {
			event.preventDefault();
			moveTo(event.key === "Home" ? 0 : entries.length - 1);
			return;
		}
		const delta = KEY_DELTAS[event.key];
		// Unrecognised keys pass through unprevented, so Tab still escapes the rail.
		if (delta === undefined) {
			return;
		}
		event.preventDefault();
		moveTo(toOriginIndex() + delta);
	}

	return { handleKeyDown, markRefs, moveTo };
}
