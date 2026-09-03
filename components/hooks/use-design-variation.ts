"use client";

import { useEffect, useSyncExternalStore } from "react";

import {
	DESIGN_VARIATION_STORAGE_KEY,
	getDefaultDesignVariation,
	getDesignVariation,
	hydrateDesignVariation,
	isDesignVariationId,
	readStoredDesignVariation,
	setDesignVariation,
	subscribeToDesignVariation,
	type DesignVariationId,
} from "@/components/utils/design-variation";

interface UseDesignVariationResult {
	designVariation: DesignVariationId;
	setDesignVariation: (variation: DesignVariationId) => void;
}

/**
 * Reads and writes the global design-variation preference.
 *
 * Hydration-safe: `useSyncExternalStore` renders the default on the server and
 * during hydration, then an effect adopts the stored preference — the same
 * shape `ThemeWrapper` uses for `ui-theme`.
 */
export function useDesignVariation(): UseDesignVariationResult {
	const designVariation = useSyncExternalStore(
		subscribeToDesignVariation,
		getDesignVariation,
		getDefaultDesignVariation,
	);

	// Adopt the stored preference after mount, and make sure the document root
	// always carries `data-design-variation` so CSS can target the variation.
	useEffect(() => {
		hydrateDesignVariation(readStoredDesignVariation() ?? getDesignVariation());
	}, []);

	// Keep tabs in sync. The writing tab already persisted the value, so adopt
	// it without writing back.
	useEffect(() => {
		const handleStorage = (event: StorageEvent) => {
			if (event.key !== DESIGN_VARIATION_STORAGE_KEY) {
				return;
			}
			if (isDesignVariationId(event.newValue)) {
				hydrateDesignVariation(event.newValue);
			}
		};

		window.addEventListener("storage", handleStorage);
		return () => {
			window.removeEventListener("storage", handleStorage);
		};
	}, []);

	return { designVariation, setDesignVariation };
}
