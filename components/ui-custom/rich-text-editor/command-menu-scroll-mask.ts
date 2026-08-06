"use client";

import { useCallback, useMemo, useRef, useState, type RefObject } from "react";

/**
 * Scroll-mask plumbing for command-menu lists that hand-roll their row markup.
 * Spread `listProps` onto the list scroller and `menuProps` onto the menu root.
 */
export function useCommandMenuScrollMask(): {
	listProps: {
		onScroll: () => void;
		ref: RefObject<HTMLDivElement | null>;
	};
	menuProps: { "data-list-scrolled": "true" | undefined };
	remeasure: () => void;
} {
	const listRef = useRef<HTMLDivElement | null>(null);
	const [hasScrolledList, setHasScrolledList] = useState(false);

	const remeasure = useCallback(() => {
		const listElement = listRef.current;
		setHasScrolledList(Boolean(listElement && listElement.scrollTop > 0));
	}, []);

	const listProps = useMemo(() => ({ onScroll: remeasure, ref: listRef }), [remeasure]);
	const menuProps = useMemo(
		() => ({ "data-list-scrolled": hasScrolledList ? ("true" as const) : undefined }),
		[hasScrolledList],
	);

	return { listProps, menuProps, remeasure };
}
