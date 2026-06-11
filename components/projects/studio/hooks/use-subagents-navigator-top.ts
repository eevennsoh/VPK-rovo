"use client";

import { useEffect, useState, type RefObject } from "react";

/**
 * Vertical offset (px) used as a sensible first-paint fallback before the
 * editor's first text line has been measured. Matches the config panel's
 * content top padding (`py-5` = 20px) plus the compact editor's `pt-4` (16px)
 * so the floating navigator starts close to its final resting place and only
 * settles by a few pixels once the real measurement lands.
 */
const DEFAULT_TOP_PX = 36;

/**
 * Keeps the floating {@link SubagentsNavigator} top-aligned with the first line
 * of the agent instructions editor, whether the user is viewing rendered text
 * or Markdown source.
 *
 * The instructions editor lives inside a scrollable column (the agent profile
 * sits above it), so its first text line moves as the user scrolls or as the
 * profile/content reflows. A fixed `top` can't track that, so we measure the
 * editor's first line relative to the navigator's positioning container (the
 * nearest positioned ancestor — the `relative` TabsContent) and keep it synced.
 *
 * @param containerRef - The navigator's positioning context. The returned
 *   `top` is expressed relative to this element's top padding edge.
 * @returns The pixel `top` to apply to the navigator wrapper.
 */
export function useSubagentsNavigatorTop(
	containerRef: RefObject<HTMLElement | null>,
): number {
	const [top, setTop] = useState<number>(DEFAULT_TOP_PX);

	useEffect(() => {
		const container = containerRef.current;
		if (!container || typeof ResizeObserver === "undefined") {
			return;
		}

		let frame = 0;
		let scrollTarget: HTMLElement | null = null;

		function findFirstLine(root: HTMLElement): HTMLElement | null {
			const section = root.querySelector<HTMLElement>(
				'[data-agent-field="instructions"]',
			);
			if (!section) {
				return null;
			}
			const markdownSource = section.querySelector<HTMLElement>(
				"[data-rich-text-markdown-source]",
			);
			if (markdownSource) {
				return markdownSource;
			}

			// The ProseMirror editor carries this class; its first child is the
			// first rendered line/paragraph. Fall back to the editor or section
			// element itself when content hasn't mounted yet.
			const editor = section.querySelector<HTMLElement>(
				".agent-instructions-tiptap-editor",
			);
			const firstChild = editor?.firstElementChild;
			return (firstChild as HTMLElement | null) ?? editor ?? section;
		}

		function measure(): void {
			const root = containerRef.current;
			if (!root) {
				return;
			}
			const firstLine = findFirstLine(root);
			// Keep the last known position instead of snapping back to the
			// fallback if the editor subtree momentarily can't be measured (e.g.
			// during a tab/agent swap) — snapping would make the navigator jump.
			if (!firstLine) {
				return;
			}
			const containerRect = root.getBoundingClientRect();
			const lineRect = firstLine.getBoundingClientRect();
			// A collapsed/unpainted layout can report a rect at the container top
			// (≈0). Treat that as "not ready yet" and keep the current value so we
			// don't park the navigator at the top of the cover banner.
			if (lineRect.height === 0 && lineRect.top <= containerRect.top) {
				return;
			}
			const next = Math.round(lineRect.top - containerRect.top);
			setTop((current) => (current === next ? current : next));
		}

		function scheduleMeasure(): void {
			if (frame) {
				cancelAnimationFrame(frame);
			}
			frame = requestAnimationFrame(measure);
		}

		// The editor's vertical position depends on async-settling siblings above
		// it (the profile cover image, avatars, InlineEdit name/description). Those
		// reflows don't always surface as DOM mutations or observed-node resizes,
		// so a one-shot measurement can park the navigator too high. Re-measure a
		// few times over the first second to catch image loads and font/layout
		// settling, then stop.
		let settleTimers: number[] = [];
		function scheduleSettlePasses(): void {
			settleTimers = [0, 60, 160, 320, 640, 1000].map((delay) =>
				window.setTimeout(scheduleMeasure, delay),
			);
		}

		function findScrollParent(node: HTMLElement | null): HTMLElement | null {
			let current = node?.parentElement ?? null;
			while (current && current !== container) {
				const overflowY = getComputedStyle(current).overflowY;
				if (overflowY === "auto" || overflowY === "scroll") {
					return current;
				}
				current = current.parentElement;
			}
			return null;
		}

		const resizeObserver = new ResizeObserver(scheduleMeasure);
		resizeObserver.observe(container);

		const section = container.querySelector<HTMLElement>(
			'[data-agent-field="instructions"]',
		);
		if (section) {
			resizeObserver.observe(section);
			scrollTarget = findScrollParent(section);
			scrollTarget?.addEventListener("scroll", scheduleMeasure, {
				passive: true,
			});
		}
		// The profile column above the editor reflows as it settles; observe it so
		// the first line stays tracked when the name/description height changes.
		const profileName = container.querySelector<HTMLElement>(
			'[data-agent-field="name"]',
		);
		if (profileName) {
			resizeObserver.observe(profileName);
		}

		// Images above the editor (cover banner, avatars) load asynchronously and
		// push the editor down without firing a mutation or observed-node resize.
		// Re-measure when each finishes loading.
		const pendingImages = Array.from(
			container.querySelectorAll<HTMLImageElement>("img"),
		).filter((img) => !img.complete);
		for (const img of pendingImages) {
			img.addEventListener("load", scheduleMeasure, { once: true });
			img.addEventListener("error", scheduleMeasure, { once: true });
		}

		// The editor mounts/streams content asynchronously; re-measure when the
		// instructions subtree changes so the first line stays tracked.
		const mutationObserver = new MutationObserver(scheduleMeasure);
		mutationObserver.observe(container, { childList: true, subtree: true });

		// Late web-font swaps and the window's own load event can shift the
		// editor's baseline after our first pass.
		window.addEventListener("resize", scheduleMeasure, { passive: true });
		window.addEventListener("load", scheduleMeasure);

		scheduleMeasure();
		scheduleSettlePasses();

		return () => {
			if (frame) {
				cancelAnimationFrame(frame);
			}
			for (const timer of settleTimers) {
				window.clearTimeout(timer);
			}
			resizeObserver.disconnect();
			mutationObserver.disconnect();
			scrollTarget?.removeEventListener("scroll", scheduleMeasure);
			for (const img of pendingImages) {
				img.removeEventListener("load", scheduleMeasure);
				img.removeEventListener("error", scheduleMeasure);
			}
			window.removeEventListener("resize", scheduleMeasure);
			window.removeEventListener("load", scheduleMeasure);
		};
	}, [containerRef]);

	return top;
}
