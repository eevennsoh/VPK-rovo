"use client";

import { useCallback, useEffect, useMemo, useReducer } from "react";

import type { AgentSessionItem } from "@/components/blocks/agent-session";

export type AgentSessionColumnView = "active" | "hidden";

type HiddenState = {
	hiddenIds: ReadonlySet<string>;
	view: AgentSessionColumnView;
};

type HiddenAction =
	| { type: "close" }
	| { type: "open" }
	| { items: readonly { id: string }[]; type: "prune" }
	| { id: string; type: "toggle" };

const INITIAL_HIDDEN_STATE: HiddenState = {
	hiddenIds: new Set<string>(),
	view: "active",
};

/**
 * Drop ids that are no longer in `items` (Pulse snapshot / filter changes).
 * Returns the same set when nothing was pruned, so reducers can bail out.
 */
export function pruneHiddenSessionIds(
	hiddenIds: ReadonlySet<string>,
	items: readonly { id: string }[],
): ReadonlySet<string> {
	const itemIds = new Set(items.map((item: { id: string }) => item.id));
	let changed = false;
	const next = new Set<string>();
	for (const id of hiddenIds) {
		if (itemIds.has(id)) {
			next.add(id);
		} else {
			changed = true;
		}
	}
	return changed ? next : hiddenIds;
}

export function splitSessionItemsByHidden(
	items: readonly AgentSessionItem[],
	hiddenIds: ReadonlySet<string>,
): {
	hiddenItems: readonly AgentSessionItem[];
	visibleItems: readonly AgentSessionItem[];
} {
	const visibleItems: AgentSessionItem[] = [];
	const hiddenItems: AgentSessionItem[] = [];
	for (const item of items) {
		if (hiddenIds.has(item.id)) {
			hiddenItems.push(item);
		} else {
			visibleItems.push(item);
		}
	}
	return { hiddenItems, visibleItems };
}

function hiddenViewAfterIds(
	view: AgentSessionColumnView,
	hiddenIds: ReadonlySet<string>,
): AgentSessionColumnView {
	return view === "hidden" && hiddenIds.size === 0 ? "active" : view;
}

function reduceHiddenState(state: HiddenState, action: HiddenAction): HiddenState {
	switch (action.type) {
		case "toggle": {
			const hiddenIds = new Set(state.hiddenIds);
			if (hiddenIds.has(action.id)) {
				hiddenIds.delete(action.id);
			} else {
				hiddenIds.add(action.id);
			}
			return {
				hiddenIds,
				view: hiddenViewAfterIds(state.view, hiddenIds),
			};
		}
		case "prune": {
			const hiddenIds = pruneHiddenSessionIds(state.hiddenIds, action.items);
			const view = hiddenViewAfterIds(state.view, hiddenIds);
			if (hiddenIds === state.hiddenIds && view === state.view) {
				return state;
			}
			return { hiddenIds, view };
		}
		case "open":
			return state.hiddenIds.size === 0 || state.view === "hidden"
				? state
				: { ...state, view: "hidden" };
		case "close":
			return state.view === "active" ? state : { ...state, view: "active" };
		default: {
			const exhaustive: never = action;
			return exhaustive;
		}
	}
}

/**
 * Column-owned hide set and the active / hidden two-pane view.
 *
 * Hidden ids are session state, not a host prop: they die on remount, prune
 * when `items` drops them, and never mix into the collapsed rail.
 */
export function useAgentSessionColumnHidden(items: readonly AgentSessionItem[]) {
	const [state, dispatch] = useReducer(reduceHiddenState, INITIAL_HIDDEN_STATE);

	useEffect(() => {
		dispatch({ items, type: "prune" });
	}, [items]);

	const { hiddenItems, visibleItems } = useMemo(
		() => splitSessionItemsByHidden(items, state.hiddenIds),
		[items, state.hiddenIds],
	);

	const toggleHidden = useCallback((item: AgentSessionItem) => {
		dispatch({ id: item.id, type: "toggle" });
	}, []);
	const openHiddenView = useCallback(() => {
		dispatch({ type: "open" });
	}, []);
	const closeHiddenView = useCallback(() => {
		dispatch({ type: "close" });
	}, []);

	return {
		closeHiddenView,
		hiddenCount: state.hiddenIds.size,
		hiddenItems,
		openHiddenView,
		toggleHidden,
		view: state.view,
		visibleItems,
	};
}
