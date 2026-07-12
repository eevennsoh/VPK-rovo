"use client";

import { useCallback, useState } from "react";
import type { SelectorPin, SelectorPinScope, SelectorStyleEdit, StyleReport } from "../lib/types";

type PinsByPage = Record<string, SelectorPin[]>;

type NewSelectorPin = Omit<SelectorPin, "createdAt" | "id"> & {
	comment?: string;
	scope?: SelectorPinScope;
};

function createPinId(): string {
	return `pin-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function updatePin(
	pinsByPage: PinsByPage,
	pinId: string,
	updater: (pin: SelectorPin) => SelectorPin,
): PinsByPage {
	let changed = false;
	const nextEntries = Object.entries(pinsByPage).map(([pagePath, pins]) => {
		const nextPins = pins.map((pin) => {
			if (pin.id !== pinId) {
				return pin;
			}
			changed = true;
			return updater(pin);
		});
		return [pagePath, nextPins] as const;
	});

	return changed ? Object.fromEntries(nextEntries) : pinsByPage;
}

export function useSelectorPins() {
	const [pinsByPage, setPinsByPage] = useState<PinsByPage>({});

	const addPin = useCallback((draft: NewSelectorPin): SelectorPin => {
		const pin: SelectorPin = {
			...draft,
			comment: draft.comment ?? "",
			createdAt: new Date().toISOString(),
			id: createPinId(),
			scope: draft.scope ?? "element",
		};

		setPinsByPage((current) => ({
			...current,
			[pin.pagePath]: [...(current[pin.pagePath] ?? []), pin],
		}));

		return pin;
	}, []);

	const removePin = useCallback((pinId: string) => {
		setPinsByPage((current) => {
			const nextEntries = Object.entries(current).map(([pagePath, pins]) => [
				pagePath,
				pins.filter((pin) => pin.id !== pinId),
			] as const);
			return Object.fromEntries(nextEntries);
		});
	}, []);

	const updatePinComment = useCallback((pinId: string, comment: string) => {
		setPinsByPage((current) => updatePin(current, pinId, (pin) => ({ ...pin, comment })));
	}, []);

	const updatePinScope = useCallback((pinId: string, scope: SelectorPinScope) => {
		setPinsByPage((current) => updatePin(current, pinId, (pin) => ({ ...pin, scope })));
	}, []);

	const updatePinStyleFindings = useCallback((pinId: string, styleFindings: StyleReport) => {
		setPinsByPage((current) => updatePin(current, pinId, (pin) => ({ ...pin, styleFindings })));
	}, []);

	const updatePinStyleEdits = useCallback((pinId: string, styleEdits: SelectorStyleEdit[]) => {
		setPinsByPage((current) => updatePin(current, pinId, (pin) => ({ ...pin, styleEdits })));
	}, []);

	const markStalePins = useCallback((pagePath: string, staleSelectors: ReadonlyArray<string>) => {
		const staleSet = new Set(staleSelectors);
		setPinsByPage((current) => {
			const pins = current[pagePath];
			if (!pins || pins.length === 0) {
				return current;
			}

			let changed = false;
			const nextPins = pins.map((pin) => {
				const stale = staleSet.has(pin.selector);
				if ((pin.stale ?? false) === stale) {
					return pin;
				}
				changed = true;
				return { ...pin, stale };
			});
			return changed ? { ...current, [pagePath]: nextPins } : current;
		});
	}, []);

	return {
		addPin,
		markStalePins,
		pinsByPage,
		removePin,
		updatePinComment,
		updatePinScope,
		updatePinStyleEdits,
		updatePinStyleFindings,
	};
}
