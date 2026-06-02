"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { useWindowWidth } from "@/components/hooks/use-window-width";
import { useClickOutside } from "@/components/hooks/use-click-outside";
import { useSidebar } from "@/app/contexts/context-sidebar";
import { useRovoChat } from "@/app/contexts";
import { useTheme } from "@/components/utils/theme-wrapper";
import { token } from "@/lib/tokens";
import { TOP_NAV_PADDING_PX, TOP_NAV_SIDEBAR_PIN_RELEASE_BREAKPOINT_PX } from "../layout-constants";

const TOP_NAV_CENTER_SECTION_MAX_WIDTH_PX = 762;
const TOP_NAV_CENTER_SECTION_SIDE_RAIL_WIDTH_PX = 330;
const TOP_NAV_COMPACT_SIDE_RAIL_WIDTH_PX = 284;
const TOP_NAV_NARROW_SIDE_RAIL_WIDTH_PX = 220;

export function useTopNavigation() {
	const router = useRouter();
	const [searchValue, setSearchValue] = useState("");
	const [isAppSwitcherOpen, setIsAppSwitcherOpen] = useState(false);
	const [isSearchFocused, setIsSearchFocused] = useState(false);
	const windowWidth = useWindowWidth();
	const { isVisible, toggleSidebar, setSidebarVisible, setHovered } = useSidebar();
	const { toggleChat, openChat, chatSurface } = useRovoChat();
	const isSidebarChatOpen = chatSurface === "sidebar";
	const { setTheme, actualTheme } = useTheme();
	const searchContainerRef = useRef<HTMLDivElement>(null);
	const searchPanelRef = useRef<HTMLDivElement>(null);

	const searchRefs = useMemo(() => [searchContainerRef, searchPanelRef], []);

	useClickOutside(searchRefs, () => setIsSearchFocused(false), isSearchFocused);

	// Smart sidebar pin release: below the small-viewport breakpoint a persistent
	// (pinned) sidebar reserves horizontal space and overlaps the top navigation,
	// so automatically un-pin it. We remember that we released a pinned sidebar so
	// the prior pinned state is restored once the viewport grows back. `windowWidth`
	// is 0 during SSR/first paint, so we wait for a real measurement before acting.
	const didAutoReleaseSidebarRef = useRef(false);
	useEffect(() => {
		if (windowWidth === 0) {
			return;
		}
		const isSmallViewport = windowWidth < TOP_NAV_SIDEBAR_PIN_RELEASE_BREAKPOINT_PX;
		if (isSmallViewport) {
			if (isVisible) {
				didAutoReleaseSidebarRef.current = true;
				setSidebarVisible(false);
			}
		} else if (didAutoReleaseSidebarRef.current) {
			didAutoReleaseSidebarRef.current = false;
			setSidebarVisible(true);
		}
	}, [windowWidth, isVisible, setSidebarVisible]);

	const toggleTheme = useCallback(() => {
		setTheme(actualTheme === "light" ? "dark" : "light");
	}, [setTheme, actualTheme]);

	const handleNavigate = useCallback(
		(path: string) => {
			router.push(path);
			setIsAppSwitcherOpen(false);
		},
		[router]
	);

	const handleSearchKeyDown = useCallback(
		(event: KeyboardEvent<HTMLInputElement>) => {
			if (event.key === "Enter") {
				router.push("/rovo");
				setIsSearchFocused(false);
			}
			if (event.key === "Escape") {
				setIsSearchFocused(false);
			}
		},
		[router]
	);

	const handleSearchAllApps = useCallback(() => {
		router.push("/rovo");
	}, [router]);

	const handleRecentItemClick = useCallback(() => {
		setIsSearchFocused(false);
	}, []);

	const handleRecentSearchClick = useCallback(
		(query: string) => {
			setSearchValue(query);
			router.push("/rovo");
			setIsSearchFocused(false);
		},
		[router]
	);

	const handleCloseSearch = useCallback(() => setIsSearchFocused(false), []);
	const handleFocusSearch = useCallback(() => setIsSearchFocused(true), []);
	const handleToggleAppSwitcher = useCallback(() => setIsAppSwitcherOpen((prev) => !prev), []);
	const handleCloseAppSwitcher = useCallback(() => setIsAppSwitcherOpen(false), []);
	const handleHoverEnter = useCallback(() => setHovered(true), [setHovered]);
	const handleHoverLeave = useCallback(() => setHovered(false), [setHovered]);

	const centerSectionStyle = useMemo(() => {
		const sideRailWidthPx =
			windowWidth >= 1028
				? TOP_NAV_CENTER_SECTION_SIDE_RAIL_WIDTH_PX
				: windowWidth >= 768
					? TOP_NAV_COMPACT_SIDE_RAIL_WIDTH_PX
					: TOP_NAV_NARROW_SIDE_RAIL_WIDTH_PX;
		const centeredWidthPx = windowWidth > 0
			? Math.min(
					TOP_NAV_CENTER_SECTION_MAX_WIDTH_PX,
					Math.max(0, windowWidth - TOP_NAV_PADDING_PX * 2 - sideRailWidthPx * 2),
				)
			: TOP_NAV_CENTER_SECTION_MAX_WIDTH_PX;
		const base = {
			boxSizing: "border-box" as const,
			display: "flex",
			alignItems: "center",
			gap: token("space.100"),
			width: `${centeredWidthPx}px`,
			minWidth: 0,
			maxWidth: `${TOP_NAV_CENTER_SECTION_MAX_WIDTH_PX}px`,
			flex: "0 0 auto" as const,
			paddingLeft: token("space.150"),
			paddingRight: token("space.150"),
		};

		if (windowWidth >= 1028) {
			return base;
		}
		return { ...base, maxWidth: "none", paddingLeft: token("space.100"), paddingRight: token("space.100") };
	}, [windowWidth]);

	return {
		searchValue,
		setSearchValue,
		isAppSwitcherOpen,
		isSearchFocused,
		windowWidth,
		isVisible,
		toggleSidebar,
		toggleChat,
		openChat,
		isSidebarChatOpen,
		toggleTheme,
		searchContainerRef,
		searchPanelRef,
		centerSectionStyle,
		handleNavigate,
		handleSearchKeyDown,
		handleSearchAllApps,
		handleRecentItemClick,
		handleRecentSearchClick,
		handleCloseSearch,
		handleFocusSearch,
		handleToggleAppSwitcher,
		handleCloseAppSwitcher,
		handleHoverEnter,
		handleHoverLeave,
	};
}
