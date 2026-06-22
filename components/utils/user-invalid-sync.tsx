"use client";

import { useEffect } from "react";

export const USER_INVALID_SYNC_ATTRIBUTE = "data-user-invalid-sync";

const pendingBridgeMutationTargets = new WeakSet<EventTarget>();

export function isUserInvalidSyncControl(target: EventTarget | null): target is HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement {
	return (
		(typeof HTMLInputElement !== "undefined" && target instanceof HTMLInputElement) ||
		(typeof HTMLTextAreaElement !== "undefined" && target instanceof HTMLTextAreaElement) ||
		(typeof HTMLSelectElement !== "undefined" && target instanceof HTMLSelectElement)
	);
}

function runBridgeOwnedAriaMutation(target: EventTarget, mutate: () => void): void {
	pendingBridgeMutationTargets.add(target);
	mutate();
}

function consumeBridgeOwnedMutation(target: EventTarget): boolean {
	if (!pendingBridgeMutationTargets.has(target)) {
		return false;
	}

	pendingBridgeMutationTargets.delete(target);
	return true;
}

export function releaseUserInvalidBridgeOwnership(target: EventTarget | null): void {
	if (!isUserInvalidSyncControl(target)) {
		return;
	}

	if (target.getAttribute(USER_INVALID_SYNC_ATTRIBUTE) !== "true") {
		return;
	}

	target.removeAttribute(USER_INVALID_SYNC_ATTRIBUTE);
}

export function syncUserInvalidAriaState(target: EventTarget | null): void {
	if (!isUserInvalidSyncControl(target)) {
		return;
	}

	const bridgeOwned = target.getAttribute(USER_INVALID_SYNC_ATTRIBUTE) === "true";
	const explicitInvalid = target.hasAttribute("aria-invalid") && !bridgeOwned;
	if (explicitInvalid) {
		return;
	}

	try {
		if (target.matches(":user-invalid")) {
			if (target.getAttribute("aria-invalid") !== "true") {
				runBridgeOwnedAriaMutation(target, () => {
					target.setAttribute("aria-invalid", "true");
				});
			}
			target.setAttribute(USER_INVALID_SYNC_ATTRIBUTE, "true");
			return;
		}

		if (bridgeOwned) {
			if (target.hasAttribute("aria-invalid")) {
				runBridgeOwnedAriaMutation(target, () => {
					target.removeAttribute("aria-invalid");
				});
			}
			target.removeAttribute(USER_INVALID_SYNC_ATTRIBUTE);
		}
	} catch {
		// :user-invalid not supported (older browser) - no-op.
	}
}

/**
 * UserInvalidSync mirrors the live `:user-invalid` CSS state onto the
 * `aria-invalid` attribute so screen readers stay in sync with the visual
 * error styling driven by the CSS pseudo-class.
 *
 * `:user-invalid` only matches *after* the user has interacted with a
 * required/constrained field (blur or submit), avoiding the "Invalid entry"
 * announcement when first tabbing into an untouched control.
 *
 * Mount this once at the root (in `app/providers.tsx`).
 */
export function UserInvalidSync() {
	useEffect(() => {
		const onBlur = (e: FocusEvent) => syncUserInvalidAriaState(e.target);
		const onInput = (e: Event) => {
			const target = e.target;
			if (isUserInvalidSyncControl(target) && target.getAttribute(USER_INVALID_SYNC_ATTRIBUTE) === "true") {
				syncUserInvalidAriaState(target);
			}
		};
		const observer = typeof MutationObserver === "undefined"
			? null
			: new MutationObserver((records) => {
				for (const record of records) {
					if (
						record.type === "attributes" &&
						record.attributeName === "aria-invalid" &&
						!consumeBridgeOwnedMutation(record.target)
					) {
						releaseUserInvalidBridgeOwnership(record.target);
					}
				}
			});
		document.addEventListener("blur", onBlur, true);
		document.addEventListener("input", onInput);
		observer?.observe(document.documentElement, {
			subtree: true,
			attributes: true,
			attributeFilter: ["aria-invalid"],
		});
		return () => {
			document.removeEventListener("blur", onBlur, true);
			document.removeEventListener("input", onInput);
			observer?.disconnect();
		};
	}, []);
	return null;
}
