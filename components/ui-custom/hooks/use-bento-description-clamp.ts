import { useCallback, useEffect, useRef } from "react";

/**
 * Clamp a bento card's description to the whole number of lines that fit its box.
 *
 * Attach the returned callback as `ref` on the description's flex-fill outer box;
 * its first element child must be the text element (the one carrying `line-clamp-*`).
 * A single `ResizeObserver` re-runs the clamp whenever a card resizes, so taller or
 * wider cards reveal more lines and squeezed cards truncate with an ellipsis —
 * correct at every viewport and across dynamic tile swaps (e.g. the studio bento's
 * category cycling). Shared by the studio (`HomeStarterBento`) and agent-config
 * (`AgentCompactOperationsBento`) bentos so their truncation stays identical.
 *
 * Observe/unobserve happen per element via a React 19 ref-cleanup callback, so the
 * clamp tracks tiles that mount and unmount over the component's life — not just the
 * set present on first paint.
 */
export function useBentoDescriptionClamp() {
	const observerRef = useRef<ResizeObserver | null>(null);

	const getObserver = useCallback(() => {
		if (typeof ResizeObserver === "undefined") {
			return null;
		}

		if (!observerRef.current) {
			observerRef.current = new ResizeObserver((entries) => {
				for (const entry of entries) {
					const box = entry.target as HTMLElement;
					const text = box.firstElementChild as HTMLElement | null;
					if (!text) {
						continue;
					}

					const lineHeight = Number.parseFloat(getComputedStyle(text).lineHeight) || 20;
					const lines = Math.max(1, Math.floor(box.clientHeight / lineHeight));
					text.style.setProperty("-webkit-line-clamp", String(lines));
				}
			});
		}

		return observerRef.current;
	}, []);

	useEffect(
		() => () => {
			observerRef.current?.disconnect();
			observerRef.current = null;
		},
		[],
	);

	return useCallback(
		(node: HTMLElement | null) => {
			if (!node) {
				return;
			}

			const observer = getObserver();
			observer?.observe(node);

			return () => observer?.unobserve(node);
		},
		[getObserver],
	);
}
