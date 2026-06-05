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
 * of the agent instructions editor.
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
			if (!firstLine) {
				setTop(DEFAULT_TOP_PX);
				return;
			}
			const containerRect = root.getBoundingClientRect();
			const lineRect = firstLine.getBoundingClientRect();
			const next = Math.round(lineRect.top - containerRect.top);
			setTop((current) => (current === next ? current : next));
		}

		function scheduleMeasure(): void {
			if (frame) {
				cancelAnimationFrame(frame);
			}
			frame = requestAnimationFrame(measure);
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

		// The editor mounts/streams content asynchronously; re-measure when the
		// instructions subtree changes so the first line stays tracked.
		const mutationObserver = new MutationObserver(scheduleMeasure);
		mutationObserver.observe(container, { childList: true, subtree: true });

		scheduleMeasure();

		return () => {
			if (frame) {
				cancelAnimationFrame(frame);
			}
			resizeObserver.disconnect();
			mutationObserver.disconnect();
			scrollTarget?.removeEventListener("scroll", scheduleMeasure);
		};
	}, [containerRef]);

	return top;
}
