"use client";

import { useCallback, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { useElementWidth } from "@/components/hooks/use-element-width";
import { useClickOutside } from "@/components/hooks/use-click-outside";
import { useSidebar } from "@/app/contexts/context-sidebar";
import { useRovoChat } from "@/app/contexts";
import { useTheme } from "@/components/utils/theme-wrapper";
import { token } from "@/lib/tokens";

const TOP_NAV_CENTER_SECTION_MAX_WIDTH_PX = 762;

export function useTopNavigation() {
	const router = useRouter();
	const [searchValue, setSearchValue] = useState("");
	const [isAppSwitcherOpen, setIsAppSwitcherOpen] = useState(false);
	const [isSearchFocused, setIsSearchFocused] = useState(false);
	// Responsive breakpoints key off the nav's own rendered width, not the
	// window — the nav is also rendered inside narrower preview frames, where
	// window.innerWidth would overstate the available room and cause overlap.
	const [navRef, availableWidth] = useElementWidth<HTMLDivElement>();
	const { isVisible, toggleSidebar, setHovered } = useSidebar();
	const { toggleChat, openChat, chatSurface } = useRovoChat();
	const isSidebarChatOpen = chatSurface === "sidebar";
	const { setTheme, actualTheme } = useTheme();
	const searchContainerRef = useRef<HTMLDivElement>(null);
	const searchPanelRef = useRef<HTMLDivElement>(null);

	const searchRefs = useMemo(() => [searchContainerRef, searchPanelRef], []);

	useClickOutside(searchRefs, () => setIsSearchFocused(false), isSearchFocused);

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

	// The search + Create cluster fills the space between the left and right
	// clusters instead of being pinned to the viewport center. It grows to take
	// available room (capped at the max width) and shrinks freely when cramped,
	// so the right cluster can never be overlapped at narrow widths.
	const centerSectionStyle = useMemo(
		() => ({
			boxSizing: "border-box" as const,
			display: "flex",
			alignItems: "center",
			gap: token("space.100"),
			flex: "1 1 auto" as const,
			minWidth: 0,
			maxWidth: `${TOP_NAV_CENTER_SECTION_MAX_WIDTH_PX}px`,
			paddingLeft: token("space.150"),
			paddingRight: 0,
		}),
		[],
	);

	return {
		searchValue,
		setSearchValue,
		isAppSwitcherOpen,
		isSearchFocused,
		navRef,
		availableWidth,
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
