/**
 * Global "design variation" preference — the sibling of the light/dark theme
 * preference that sits next to it in the top navigation's settings menu.
 *
 * This module is deliberately React-free (like `theme-storage.ts`) so the
 * selection logic can be unit-tested without a renderer; `useDesignVariation`
 * in `components/hooks/use-design-variation.ts` is the React binding.
 *
 * The active variation is mirrored onto the document root as
 * `data-design-variation="<id>"`, so a variation's visual treatment can be
 * expressed purely in CSS:
 *
 *   html[data-design-variation="2000-years-later"] { … }
 *
 * and any component that needs to branch in JS can read the same value through
 * `useDesignVariation()`.
 */

export const DESIGN_VARIATION_STORAGE_KEY = "ui-design-variation";

export const DESIGN_VARIATIONS = [
	{ id: "team-eu", label: "Team EU" },
	{ id: "2000-years-later", label: "2000 years later" },
] as const;

export type DesignVariationId = (typeof DESIGN_VARIATIONS)[number]["id"];

/**
 * The baseline variation. Kept first in `DESIGN_VARIATIONS` so the menu reads
 * top-down from "what ships today" to the exploration.
 */
export const DEFAULT_DESIGN_VARIATION: DesignVariationId = DESIGN_VARIATIONS[0].id;

export function isDesignVariationId(value: unknown): value is DesignVariationId {
	return DESIGN_VARIATIONS.some((variation) => variation.id === value);
}

let currentDesignVariation: DesignVariationId = DEFAULT_DESIGN_VARIATION;
const listeners = new Set<() => void>();

function notify() {
	for (const listener of listeners) {
		listener();
	}
}

function applyDesignVariationToDocument(variation: DesignVariationId) {
	if (typeof document === "undefined") {
		return;
	}
	document.documentElement.dataset.designVariation = variation;
}

export function subscribeToDesignVariation(listener: () => void) {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
}

export function getDesignVariation(): DesignVariationId {
	return currentDesignVariation;
}

/** Stable server/hydration snapshot — storage is only read after mount. */
export function getDefaultDesignVariation(): DesignVariationId {
	return DEFAULT_DESIGN_VARIATION;
}

export function readStoredDesignVariation(): DesignVariationId | null {
	try {
		const stored = globalThis.localStorage?.getItem(DESIGN_VARIATION_STORAGE_KEY);
		return isDesignVariationId(stored) ? stored : null;
	} catch {
		// Storage can throw in privacy modes / sandboxed iframes.
		return null;
	}
}

/**
 * Adopt a variation without persisting it. Used on mount to reconcile the
 * in-memory default with whatever the user last chose, and by the cross-tab
 * `storage` listener (the writing tab already persisted the value).
 */
export function hydrateDesignVariation(variation: DesignVariationId) {
	applyDesignVariationToDocument(variation);
	if (currentDesignVariation === variation) {
		return;
	}
	currentDesignVariation = variation;
	notify();
}

/** Adopt a variation as an explicit user choice and persist it. */
export function setDesignVariation(variation: DesignVariationId) {
	try {
		globalThis.localStorage?.setItem(DESIGN_VARIATION_STORAGE_KEY, variation);
	} catch {
		// Non-fatal: the selection still applies for this session.
	}
	hydrateDesignVariation(variation);
}

/** Test-only reset so suites don't leak state between cases. */
export function resetDesignVariationForTests() {
	currentDesignVariation = DEFAULT_DESIGN_VARIATION;
	listeners.clear();
}
