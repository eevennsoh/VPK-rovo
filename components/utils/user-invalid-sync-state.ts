export const USER_INVALID_SYNC_ATTRIBUTE = "data-user-invalid-sync";

const pendingBridgeMutationTargets = new WeakSet<EventTarget>();

export function isUserInvalidSyncControl(
	target: EventTarget | null,
): target is HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement {
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

export function consumeBridgeOwnedMutation(target: EventTarget): boolean {
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
