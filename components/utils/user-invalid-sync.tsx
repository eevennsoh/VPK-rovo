"use client";

import { useEffect } from "react";
import {
	consumeBridgeOwnedMutation,
	isUserInvalidSyncControl,
	releaseUserInvalidBridgeOwnership,
	syncUserInvalidAriaState,
	USER_INVALID_SYNC_ATTRIBUTE,
} from "@/components/utils/user-invalid-sync-state";

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
