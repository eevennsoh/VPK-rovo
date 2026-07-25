import type { ComponentProps } from "react";
import type { MenubarMenu } from "@/components/ui/menubar";

type AgentCompactNavMenuOpenChange = NonNullable<ComponentProps<typeof MenubarMenu>["onOpenChange"]>;

export function shouldClearCompactNavInitialHighlight(
	eventDetails: Parameters<AgentCompactNavMenuOpenChange>[1],
): boolean {
	if (
		eventDetails.reason === "trigger-focus" ||
		eventDetails.reason === "trigger-hover" ||
		eventDetails.reason === "sibling-open"
	) {
		return true;
	}

	if (eventDetails.reason !== "trigger-press") {
		return false;
	}

	const event = eventDetails.event;
	if (typeof PointerEvent !== "undefined" && event instanceof PointerEvent) {
		return true;
	}
	return !(event instanceof MouseEvent) || event.detail !== 0;
}

export function clearCompactNavInitialHighlight(contentElement: HTMLElement): void {
	const activeElement = contentElement.ownerDocument.activeElement;

	for (const highlightedElement of contentElement.querySelectorAll<HTMLElement>("[data-highlighted]")) {
		highlightedElement.removeAttribute("data-highlighted");

		if (highlightedElement.getAttribute("tabindex") === "0") {
			highlightedElement.setAttribute("tabindex", "-1");
		}
	}

	if (
		activeElement instanceof HTMLElement &&
		contentElement.contains(activeElement) &&
		activeElement !== contentElement
	) {
		contentElement.focus({ preventScroll: true });
	}
}
