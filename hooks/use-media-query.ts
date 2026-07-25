"use client";

import { useCallback, useSyncExternalStore } from "react";

export function useMediaQuery(query: string, serverSnapshot = false): boolean {
	const subscribe = useCallback((onStoreChange: () => void) => {
		const mediaQuery = window.matchMedia(query);
		mediaQuery.addEventListener("change", onStoreChange);
		return () => mediaQuery.removeEventListener("change", onStoreChange);
	}, [query]);
	const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query]);
	const getServerSnapshot = useCallback(() => serverSnapshot, [serverSnapshot]);

	return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
