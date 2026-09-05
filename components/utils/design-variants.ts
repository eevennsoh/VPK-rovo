/**
 * Global "design variants" preferences — the independent on/off siblings of the
 * single-choice design *variation* preference (`design-variation.ts`) that sits
 * directly above them in the top navigation's settings menu.
 *
 * A variation is exclusive ("which world am I in"); a variant is additive
 * ("also turn this on"). Each variant is an independent boolean, so the store's
 * snapshot is a frozen map rather than a single id.
 *
 * This module is deliberately React-free (like `design-variation.ts` and
 * `theme-storage.ts`) so the selection logic can be unit-tested without a
 * renderer; `useDesignVariants` in `components/hooks/use-design-variants.ts` is
 * the React binding.
 *
 * Deliberate asymmetry with `design-variation.ts`: there is **no DOM
 * mirroring** here. A variation only changes CSS, so it is mirrored onto the
 * document root as `data-design-variation="<id>"`. A variant changes component
 * *structure* (which components mount, and where), so it is only ever read in
 * JS through `useDesignVariants()`. Do not add a `data-design-variants`
 * attribute — nothing would consume it.
 *
 * Snapshot identity matters: `useSyncExternalStore` calls both snapshot getters
 * on every render and compares with `Object.is`. `getDesignVariants()` and
 * `getDefaultDesignVariants()` therefore return a *stable* module-level object
 * and never build a fresh one — a new object per call throws "The result of
 * getSnapshot should be cached" and re-renders forever.
 */

export const DESIGN_VARIANTS_STORAGE_KEY = "ui-design-variants";

export const DESIGN_VARIANTS = [
	{ id: "panel", label: "Panel" },
	{ id: "simpleKanban", label: "Simple kanban" },
] as const;

export type DesignVariantId = (typeof DESIGN_VARIANTS)[number]["id"];

export type DesignVariantState = Readonly<Record<DesignVariantId, boolean>>;

/**
 * The baseline state. Frozen and held in one place so the server/hydration
 * snapshot keeps a stable identity across renders.
 *
 * Panel starts on: Golden Journeys v4 ships untracked work in the floating
 * side surface unless the user turns it off. Simple kanban starts off: expanded
 * columns keep the sunken well unless the user turns it on.
 */
const DEFAULT_DESIGN_VARIANTS: DesignVariantState = Object.freeze({
	panel: true,
	simpleKanban: false,
});

export function isDesignVariantId(value: unknown): value is DesignVariantId {
	return DESIGN_VARIANTS.some((variant) => variant.id === value);
}

let currentDesignVariants: DesignVariantState = DEFAULT_DESIGN_VARIANTS;
const listeners = new Set<() => void>();

function notify() {
	for (const listener of listeners) {
		listener();
	}
}

/** Value (not identity) comparison — every stored/next state is a fresh object. */
function areDesignVariantsEqual(a: DesignVariantState, b: DesignVariantState) {
	return DESIGN_VARIANTS.every((variant) => a[variant.id] === b[variant.id]);
}

export function subscribeToDesignVariants(listener: () => void) {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
}

export function getDesignVariants(): DesignVariantState {
	return currentDesignVariants;
}

/** Stable server/hydration snapshot — storage is only read after mount. */
export function getDefaultDesignVariants(): DesignVariantState {
	return DEFAULT_DESIGN_VARIANTS;
}

/**
 * Read the persisted map, normalising it against the known variant ids so a
 * partial, stale, or hostile payload can never produce a state object with a
 * missing key. Unknown keys are dropped. Present non-boolean values coerce to
 * off; absent keys keep the store default. Returns `null` only when there is
 * nothing usable to adopt.
 */
export function readStoredDesignVariants(): DesignVariantState | null {
	try {
		const stored = globalThis.localStorage?.getItem(DESIGN_VARIANTS_STORAGE_KEY);
		if (!stored) {
			return null;
		}

		const parsed: unknown = JSON.parse(stored);
		if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
			return null;
		}

		const record = parsed as Record<string, unknown>;
		const next: Record<DesignVariantId, boolean> = { ...DEFAULT_DESIGN_VARIANTS };
		for (const variant of DESIGN_VARIANTS) {
			if (Object.hasOwn(record, variant.id)) {
				next[variant.id] = record[variant.id] === true;
			}
		}
		return Object.freeze(next);
	} catch {
		// Storage can throw in privacy modes / sandboxed iframes, and the stored
		// payload can be malformed JSON.
		return null;
	}
}

/**
 * Adopt a variant state without persisting it. Used on mount to reconcile the
 * in-memory default with whatever the user last chose, and by the cross-tab
 * `storage` listener (the writing tab already persisted the value).
 */
export function hydrateDesignVariants(next: DesignVariantState) {
	if (areDesignVariantsEqual(currentDesignVariants, next)) {
		return;
	}
	currentDesignVariants = next;
	notify();
}

/** Flip one variant as an explicit user choice and persist the whole map. */
export function setDesignVariant(id: DesignVariantId, enabled: boolean) {
	const next: DesignVariantState = Object.freeze({ ...currentDesignVariants, [id]: enabled });

	try {
		globalThis.localStorage?.setItem(DESIGN_VARIANTS_STORAGE_KEY, JSON.stringify(next));
	} catch {
		// Non-fatal: the selection still applies for this session.
	}

	hydrateDesignVariants(next);
}

/** Test-only reset so suites don't leak state between cases. */
export function resetDesignVariantsForTests() {
	currentDesignVariants = DEFAULT_DESIGN_VARIANTS;
	listeners.clear();
}
