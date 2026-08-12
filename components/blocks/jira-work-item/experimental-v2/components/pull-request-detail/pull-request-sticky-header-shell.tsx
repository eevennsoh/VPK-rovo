"use client";

import { useEffect, useRef, type ReactNode, type RefObject } from "react";

/** CSS custom properties published for sticky code-review chrome under the PR header. */
const PULL_REQUEST_DETAIL_HEADER_HEIGHT_VAR = "--pull-request-detail-header-height";
const PULL_REQUEST_DETAIL_SCROLLPORT_HEIGHT_VAR = "--pull-request-detail-scrollport-height";

interface PullRequestStickyHeaderShellProps {
	children: ReactNode;
	scrollContainerRef: RefObject<HTMLElement | null>;
}

/**
 * Sticky PR header wrapper that publishes measured header + scrollport heights
 * for Files-tab code-review sticky offsets.
 *
 * `pb-6` (space-300 / 24px) is part of this sticky chrome — not empty space
 * between two sticky layers — so diffs cannot paint through the gap under the
 * header. Measured `--pull-request-detail-header-height` includes that padding.
 */
export function PullRequestStickyHeaderShell({
	children,
	scrollContainerRef,
}: Readonly<PullRequestStickyHeaderShellProps>) {
	const stickyHeaderRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		const header = stickyHeaderRef.current;
		const root = header?.closest<HTMLElement>("[data-jira-work-item-pull-request-detail]");
		if (!header || !root) return;

		const syncStickyMetrics = () => {
			root.style.setProperty(
				PULL_REQUEST_DETAIL_HEADER_HEIGHT_VAR,
				`${header.offsetHeight}px`,
			);
			const scrollport = scrollContainerRef.current;
			if (scrollport) {
				root.style.setProperty(
					PULL_REQUEST_DETAIL_SCROLLPORT_HEIGHT_VAR,
					`${scrollport.clientHeight}px`,
				);
			}
		};

		syncStickyMetrics();
		if (typeof ResizeObserver === "undefined") {
			return;
		}

		const observer = new ResizeObserver(syncStickyMetrics);
		observer.observe(header);
		const scrollport = scrollContainerRef.current;
		if (scrollport) {
			observer.observe(scrollport);
		}
		return () => observer.disconnect();
	}, [scrollContainerRef]);

	return (
		<div className="sticky top-0 z-10 shrink-0 bg-surface pb-6" ref={stickyHeaderRef}>
			{children}
		</div>
	);
}
