"use client";

import { useEffect, useState, type RefObject } from "react";

import {
	IN_FLOW_GUTTER_SCROLLPORT_SELECTOR,
	isInFlowGutterScrollMaskActive,
} from "./in-flow-gutter-scroll-mask";

/**
 * Watches the adjacent Board or List scrollport and reports when content has
 * started sliding under the leading Untracked gutter (`scrollLeft > 0`).
 */
export function useInFlowGutterScrollMask(
	hostRef: RefObject<HTMLElement | null>,
): boolean {
	const [maskActive, setMaskActive] = useState(false);

	useEffect(() => {
		const parent = hostRef.current?.parentElement;
		if (!parent) {
			return undefined;
		}

		let scrollport: HTMLElement | null = null;

		const syncMask = () => {
			setMaskActive(isInFlowGutterScrollMaskActive(scrollport?.scrollLeft ?? 0));
		};

		const unbindScrollport = () => {
			if (!scrollport) {
				return;
			}
			scrollport.removeEventListener("scroll", syncMask);
			scrollport = null;
		};

		const bindScrollport = () => {
			const nextScrollport = parent.querySelector<HTMLElement>(
				IN_FLOW_GUTTER_SCROLLPORT_SELECTOR,
			);
			if (nextScrollport === scrollport) {
				syncMask();
				return;
			}

			unbindScrollport();
			scrollport = nextScrollport;
			if (scrollport) {
				scrollport.addEventListener("scroll", syncMask, { passive: true });
			}
			syncMask();
		};

		bindScrollport();
		const observer = new MutationObserver(bindScrollport);
		observer.observe(parent, { childList: true });

		return () => {
			observer.disconnect();
			unbindScrollport();
		};
	}, [hostRef]);

	return maskActive;
}
