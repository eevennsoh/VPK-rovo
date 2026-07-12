"use client";

import type { ComponentProps, ReactNode, RefObject } from "react";
import { useCallback, useLayoutEffect, useRef, useState } from "react";

import type { MenubarMenu } from "@/components/ui/menubar";

export function AgentCompactNavMenuList({ children }: Readonly<{ children: ReactNode }>) {
	return <>{children}</>;
}

// Flex-column popup sizing for the Memory/Reasoning menus: the list scrolls
// within the available height while a pinned section stays put.
export const AGENT_COMPACT_NAV_MENU_FLEX_CONTENT_CLASS = "flex max-h-(--available-height) flex-col";

export type AgentCompactNavMenuOpenChange = NonNullable<ComponentProps<typeof MenubarMenu>["onOpenChange"]>;

export function shouldClearCompactNavInitialHighlight(eventDetails: Parameters<AgentCompactNavMenuOpenChange>[1]): boolean {
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

export function AgentCompactNavMenuInitialHighlightReset({
	enabled,
	resetToken,
}: Readonly<{
	enabled: boolean;
	resetToken: number;
}>) {
	const markerRef = useRef<HTMLSpanElement | null>(null);

	useLayoutEffect(() => {
		if (!enabled) {
			return;
		}

		const contentElement = markerRef.current?.closest<HTMLElement>(
			"[data-slot='menubar-content'], [data-slot='dropdown-menu-content']",
		);
		if (!contentElement) {
			return;
		}

		const clear = () => clearCompactNavInitialHighlight(contentElement);

		clear();

		// While the popup is opening, Base UI applies two auto-behaviors right after
		// our synchronous clear: the row under the pointer flashes highlighted, and
		// focus can auto-land on the first field. Suppress both until real input or
		// the short fallback timeout releases the opening guards.
		contentElement.setAttribute("data-agent-suppress-initial-highlight", "");

		let guardsReleased = false;
		const redirectInitialAutoFocus = (event: FocusEvent) => {
			if (guardsReleased) {
				return;
			}
			const target = event.target;
			if (
				target instanceof HTMLElement &&
				target !== contentElement &&
				contentElement.contains(target) &&
				target.matches("input, textarea, [contenteditable='true']")
			) {
				contentElement.focus({ preventScroll: true });
			}
		};
		const releaseInitialOpenGuards = () => {
			if (guardsReleased) {
				return;
			}
			guardsReleased = true;
			contentElement.removeAttribute("data-agent-suppress-initial-highlight");
			contentElement.removeEventListener("focusin", redirectInitialAutoFocus);
			window.removeEventListener("pointerdown", releaseInitialOpenGuards, true);
			window.removeEventListener("keydown", releaseInitialOpenGuards, true);
		};
		contentElement.addEventListener("focusin", redirectInitialAutoFocus);
		window.addEventListener("pointerdown", releaseInitialOpenGuards, true);
		window.addEventListener("keydown", releaseInitialOpenGuards, true);
		const guardTimeoutId = window.setTimeout(releaseInitialOpenGuards, 250);

		queueMicrotask(() => {
			clear();
			requestAnimationFrame(clear);
			window.setTimeout(clear, 120);
		});

		return () => {
			window.clearTimeout(guardTimeoutId);
			releaseInitialOpenGuards();
		};
	}, [enabled, resetToken]);

	return (
		<span
			aria-hidden
			className="hidden"
			data-agent-compact-nav-initial-highlight-reset=""
			ref={markerRef}
		/>
	);
}

export function useCompactNavMenuNoInitialHighlight(): {
	onOpenChange: AgentCompactNavMenuOpenChange;
	resetInitialHighlight: boolean;
	resetToken: number;
} {
	const shouldResetInitialHighlightRef = useRef(false);
	const [resetToken, setResetToken] = useState(0);
	const handleOpenChange = useCallback<AgentCompactNavMenuOpenChange>(
		(open, eventDetails) => {
			if (open && shouldClearCompactNavInitialHighlight(eventDetails)) {
				shouldResetInitialHighlightRef.current = true;
				setResetToken((currentResetToken) => currentResetToken + 1);
				return;
			}

			if (!open) {
				shouldResetInitialHighlightRef.current = false;
			}
		},
		[],
	);

	return {
		onOpenChange: handleOpenChange,
		resetInitialHighlight: shouldResetInitialHighlightRef.current,
		resetToken,
	};
}

export function useCompactNavMenuKeepOpen(controlled: boolean): {
	resetInitialHighlight: boolean;
	resetToken: number;
	rootProps: { open?: boolean; onOpenChange: AgentCompactNavMenuOpenChange };
	keepOpenRef: RefObject<boolean>;
	suppressNextClose: () => void;
} {
	const base = useCompactNavMenuNoInitialHighlight();
	const baseOnOpenChange = base.onOpenChange;
	const [open, setOpen] = useState(false);
	const keepOpenRef = useRef(false);
	const handleRootOpenChange = useCallback<AgentCompactNavMenuOpenChange>(
		(next, eventDetails) => {
			if (!next && keepOpenRef.current) {
				return;
			}
			setOpen(next);
			baseOnOpenChange(next, eventDetails);
		},
		[baseOnOpenChange],
	);
	const suppressNextClose = useCallback(() => {
		keepOpenRef.current = true;
		// Cleared after the focus-out close has had a chance to fire and be
		// ignored, so a later deliberate dismiss (outside press / Escape) still
		// closes the menu.
		window.setTimeout(() => {
			keepOpenRef.current = false;
		}, 150);
	}, []);

	return {
		resetInitialHighlight: base.resetInitialHighlight,
		resetToken: base.resetToken,
		rootProps: controlled ? { open, onOpenChange: handleRootOpenChange } : { onOpenChange: baseOnOpenChange },
		keepOpenRef,
		suppressNextClose,
	};
}
