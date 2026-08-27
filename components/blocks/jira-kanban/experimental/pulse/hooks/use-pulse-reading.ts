"use client";

import { useCallback, useEffect, useRef, useState, type RefCallback } from "react";

import {
	toActiveOutlineIndex,
	toPulseMeasureLineY,
	toPulseScrollOffset,
	type PulseOutlineEntry,
	type PulseScrollAlignment,
	type PulseScrollOptions,
} from "@/components/blocks/jira-kanban/experimental/pulse/lib/pulse-outline";

/**
 * Reading position for the continuous Pulse article.
 *
 * Every insight is on the page at once, so there is no gesture to intercept and
 * nothing to commit: the reader scrolls, and the ruler, the pill and the work
 * columns follow whatever they are reading. This replaces an overscroll
 * state machine — an accumulator, a dwell gate, a momentum lock and a landing
 * window — that existed only to fake continuity between separately mounted
 * snapshots. Native scrolling does it better and cannot fight the page.
 *
 * The active entry is read from live geometry rather than IntersectionObserver
 * thresholds: sections vary from one line to a screenful, and a ratio-based
 * observer makes a short section unreachable while a tall one holds the ruler.
 * Measuring "which anchor has passed the reading line" treats them equally.
 */

/** Where the reading line sits, as a fraction down the scrollport. */
const READING_LINE = 0.28;

function readStartInset(element: HTMLElement): number {
	const scrollportStyle = window.getComputedStyle(element);
	const configuredStartInset = Number.parseFloat(scrollportStyle.scrollPaddingTop);
	return configuredStartInset > 0
		? configuredStartInset
		: Number.parseFloat(scrollportStyle.paddingTop) || 0;
}

export interface UsePulseReadingOptions {
	outline: readonly PulseOutlineEntry[];
	/** Reset the position when the filter re-keys the article. */
	resetKey?: string | null;
}

export interface UsePulseReadingResult {
	/** Index into `outline` of the entry being read. */
	activeEntryIndex: number;
	/** Snapshot index of that entry, for the rail and the pill. */
	activeSnapshotIndex: number;
	/** Attach to the scrollport. */
	scrollRef: RefCallback<HTMLDivElement>;
	/** Attach to each anchored element, keyed by outline id. */
	registerAnchor: (id: string) => RefCallback<HTMLElement>;
	/** Jump the article to an outline entry. */
	scrollToEntry: (id: string, options?: PulseScrollOptions) => void;
	/** Move by whole insights — the chevrons and the keyboard. */
	scrollToSnapshot: (snapshotIndex: number, options?: PulseScrollOptions) => void;
}

export function usePulseReading({ outline, resetKey = null }: UsePulseReadingOptions): UsePulseReadingResult {
	const [element, setElement] = useState<HTMLDivElement | null>(null);
	const [activeEntryIndex, setActiveEntryIndex] = useState(0);
	const anchorsRef = useRef(new Map<string, HTMLElement>());
	// Start-aligned jumps park on the scroller top. Measure against that same
	// line until the reader scrolls themselves, or a short section sitting
	// above the 28% reading line would immediately light the next mark.
	const measureAlignmentRef = useRef<PulseScrollAlignment>("reading-line");
	const programmaticScrollRef = useRef(false);
	const jumpGenerationRef = useRef(0);
	// Read inside the scroll handler so the listener never re-subscribes as the
	// outline changes under a filter.
	const outlineRef = useRef(outline);
	useEffect(() => {
		outlineRef.current = outline;
	});

	const scrollRef = useCallback<RefCallback<HTMLDivElement>>((node) => {
		setElement(node);
	}, []);

	const registerAnchor = useCallback(
		(id: string): RefCallback<HTMLElement> => (node) => {
			if (node === null) {
				anchorsRef.current.delete(id);
				return;
			}
			anchorsRef.current.set(id, node);
		},
		[],
	);

	useEffect(() => {
		if (element === null) {
			return undefined;
		}

		let frame = 0;
		const measure = () => {
			frame = 0;
			const port = element.getBoundingClientRect();
			const line = toPulseMeasureLineY({
				alignment: measureAlignmentRef.current,
				readingLine: READING_LINE,
				scrollportHeight: port.height,
				scrollportTop: port.top,
				startInset: readStartInset(element),
			});
			const entries = outlineRef.current;
			const positions = entries.map((entry) => {
				const node = anchorsRef.current.get(entry.id);
				return node === undefined
					? Number.POSITIVE_INFINITY
					: node.getBoundingClientRect().top - line;
			});
			setActiveEntryIndex(toActiveOutlineIndex(positions));
		};

		const schedule = () => {
			if (frame !== 0) {
				return;
			}
			frame = requestAnimationFrame(measure);
		};
		const handleUserScroll = () => {
			if (!programmaticScrollRef.current) {
				measureAlignmentRef.current = "reading-line";
			}
			schedule();
		};

		measure();
		element.addEventListener("scroll", handleUserScroll, { passive: true });
		const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(schedule);
		observer?.observe(element);
		window.addEventListener("resize", schedule);

		return () => {
			if (frame !== 0) {
				cancelAnimationFrame(frame);
			}
			element.removeEventListener("scroll", handleUserScroll);
			observer?.disconnect();
			window.removeEventListener("resize", schedule);
		};
	}, [element, outline.length, resetKey]);

	// A filter rewrites the article, so start it from the top rather than
	// stranding the reader at an offset that now points at different prose.
	//
	// Only the scroll is written here. Setting the active entry as well would be
	// adjusting state in response to a prop change — the reader would see the
	// stale mark for a frame, and the value would then be overwritten anyway by
	// the measure pass the scroll itself triggers. Moving the scrollport is the
	// cause; the active entry is derived from it.
	useEffect(() => {
		if (element === null) {
			return;
		}
		element.scrollTop = 0;
	}, [element, resetKey]);

	const scrollToEntry = useCallback((id: string, { align = "reading-line" }: PulseScrollOptions = {}) => {
		const node = anchorsRef.current.get(id);
		if (node === undefined || element === null) {
			return;
		}
		const port = element.getBoundingClientRect();
		const offset = toPulseScrollOffset({
			alignment: align,
			anchorTop: node.getBoundingClientRect().top,
			readingLine: READING_LINE,
			scrollportHeight: port.height,
			scrollportTop: port.top,
			startInset: readStartInset(element),
		});
		const generation = jumpGenerationRef.current + 1;
		jumpGenerationRef.current = generation;
		measureAlignmentRef.current = align;
		programmaticScrollRef.current = true;
		if (align === "start") {
			const index = outlineRef.current.findIndex((entry) => entry.id === id);
			if (index !== -1) {
				setActiveEntryIndex(index);
			}
		}
		// `scroll-behavior` is set per gesture rather than in CSS: hover-scrubbing
		// the ruler must be instant to track the pointer, and the browser's own
		// smooth scrolling would lag a frame behind the cursor.
		element.scrollBy({ behavior: "auto", top: offset });
		requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				if (jumpGenerationRef.current === generation) {
					programmaticScrollRef.current = false;
				}
			});
		});
	}, [element]);

	const scrollToSnapshot = useCallback((snapshotIndex: number, options?: PulseScrollOptions) => {
		const entry = outlineRef.current.find(
			(candidate) => candidate.kind === "insight" && candidate.snapshotIndex === snapshotIndex,
		);
		if (entry !== undefined) {
			scrollToEntry(entry.id, options);
		}
	}, [scrollToEntry]);

	const activeSnapshotIndex = outline[activeEntryIndex]?.snapshotIndex ?? 0;

	return {
		activeEntryIndex,
		activeSnapshotIndex,
		registerAnchor,
		scrollRef,
		scrollToEntry,
		scrollToSnapshot,
	};
}
