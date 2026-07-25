"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";
import { fetchExplorer } from "../lib/personal-graph-api";
import type { VaultExplorer } from "../lib/personal-graph-types";

interface UseVaultExplorerOptions {
	enabled?: boolean;
}

interface VaultExplorerState {
	error: Error | null;
	explorer: VaultExplorer | null;
	isLoading: boolean;
	refresh: () => Promise<void>;
}

interface VaultExplorerRequestState {
	error: Error | null;
	explorer: VaultExplorer | null;
	isLoading: boolean;
}

type VaultExplorerAction =
	| { type: "disabled" }
	| { type: "failed"; error: Error }
	| { type: "loaded"; explorer: VaultExplorer }
	| { type: "loading" }
	| { type: "settled" };

function reduceVaultExplorer(
	state: VaultExplorerRequestState,
	action: VaultExplorerAction,
): VaultExplorerRequestState {
	switch (action.type) {
		case "disabled":
			return { error: null, explorer: null, isLoading: false };
		case "failed":
			return { error: action.error, explorer: null, isLoading: false };
		case "loaded":
			return { error: null, explorer: action.explorer, isLoading: false };
		case "loading":
			return { ...state, isLoading: true };
		case "settled":
			return state.isLoading ? { ...state, isLoading: false } : state;
		default:
			return state;
	}
}

export function useVaultExplorer({ enabled = true }: UseVaultExplorerOptions = {}): VaultExplorerState {
	const [{ error, explorer, isLoading }, dispatch] = useReducer(
		reduceVaultExplorer,
		{ error: null, explorer: null, isLoading: enabled },
	);
	const enabledRef = useRef(enabled);

	useEffect(() => {
		enabledRef.current = enabled;
	}, [enabled]);

	const refresh = useCallback(async () => {
		if (!enabledRef.current) {
			dispatch({ type: "disabled" });
			return;
		}

		const controller = new AbortController();
		dispatch({ type: "loading" });
		try {
			const nextExplorer = await fetchExplorer({ signal: controller.signal });
			dispatch({ type: "loaded", explorer: nextExplorer });
		} catch (nextError) {
			if (nextError instanceof Error && nextError.name === "AbortError") {
				return;
			}
			dispatch({
				type: "failed",
				error: nextError instanceof Error ? nextError : new Error(String(nextError)),
			});
		} finally {
			dispatch({ type: "settled" });
		}
	}, []);

	useEffect(() => {
		if (!enabled) {
			dispatch({ type: "disabled" });
			return;
		}

		void refresh();
	}, [enabled, refresh]);

	useEffect(() => {
		function handleFocus() {
			void refresh();
		}

		window.addEventListener("focus", handleFocus);
		return () => {
			window.removeEventListener("focus", handleFocus);
		};
	}, [refresh]);

	return {
		error,
		explorer,
		isLoading,
		refresh,
	};
}
