"use client";

import { useCallback, useMemo, useState } from "react";

import type { AgentSessionItem } from "@/components/blocks/agent-session";

/**
 * Shared "nothing is hidden" set. Returning the SAME reference from the state
 * updater is what lets React bail out of the re-render when a restore is a
 * no-op, and it keeps {@link useScrollingVisibility}'s memo stable.
 */
const NONE_HIDDEN: ReadonlySet<string> = new Set<string>();

export interface ScrollingVisibility {
	/** The sessions the ticker should loop. Never empty while `items` is not. */
	visibleItems: readonly AgentSessionItem[];
	/** Bound to every card's hover archive control. */
	toggleVisibility: (item: AgentSessionItem) => void;
	/** Accessible name, tooltip and icon for that control; see the note below. */
	visibilityLabel: string;
}

/**
 * Local Archive / Unarchive state for the scroller's cards.
 *
 * ## Why this hook exists at all
 *
 * `AgentSessionCard` builds its hover pair unconditionally: the secondary
 * control is always rendered, always enabled and always in the tab order, and
 * its handler only optional-chains `onToggleVisibility`. A host that supplies no
 * handler therefore ships a focusable button that does nothing, which is an
 * accessibility defect, not just dead weight. The block exposes no way to omit
 * the control, so the fix is to make it real.
 *
 * ## The floor, and why the label flips
 *
 * Archiving removes the session from the loop. Ticker's whole geometry — pitch,
 * clone count, the fade — is derived from the items it is given, so letting the
 * list empty would leave a scroller with nothing to scroll AND no control left
 * to undo it with. So the LAST remaining card's control becomes "Unarchive"
 * (the Library icon, per the block's own `visibilityLabel === "Unarchive"`
 * branch) and restores every hidden session instead. The label always matches
 * what the button does, the toggle is always reversible, and no state is
 * reachable that the keyboard cannot get back out of.
 *
 * Degenerate case, stated rather than hidden: a caller that passes a single
 * item has one card that can neither be hidden (the floor) nor restore anything
 * (nothing is hidden). A one-card infinite scroller is already degenerate; the
 * default list is eight.
 */
export function useScrollingVisibility(
	items: readonly AgentSessionItem[],
): ScrollingVisibility {
	const [hiddenIds, setHiddenIds] = useState<ReadonlySet<string>>(NONE_HIDDEN);

	const visibleItems = useMemo(() => {
		if (hiddenIds.size === 0) return items;
		const remaining = items.filter((item: AgentSessionItem) => !hiddenIds.has(item.id));
		// Belt and braces for a host that swaps `items` while ids are hidden: the
		// floor below is enforced against the CURRENT list, but a wholesale swap
		// could still strand every id at once.
		return remaining.length > 0 ? remaining : items;
	}, [hiddenIds, items]);

	const toggleVisibility = useCallback((item: AgentSessionItem) => {
		setHiddenIds((current: ReadonlySet<string>) => {
			// Counted by filtering rather than by `items.length - current.size`, so
			// ids left over from a previous `items` array cannot fake the floor.
			const remaining = items.filter((entry: AgentSessionItem) => !current.has(entry.id));
			if (remaining.length <= 1) return NONE_HIDDEN;
			const next = new Set(current);
			next.add(item.id);
			return next;
		});
	}, [items]);

	return {
		toggleVisibility,
		visibilityLabel: visibleItems.length <= 1 ? "Unarchive" : "Archive",
		visibleItems,
	};
}
