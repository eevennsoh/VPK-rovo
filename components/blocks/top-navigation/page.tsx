"use client";

import {
	useCallback,
	useEffect,
	useState,
	type CSSProperties,
} from "react";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarResizeHandle } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { token } from "@/lib/tokens";
import SearchSuggestionsPanel from "./components/search-suggestions-panel";
import { LeftNavigation } from "./components/left-navigation";
import { RightNavigation } from "./components/right-navigation";
import { CreateButton } from "./components/create-button";
import { StudioSidebar } from "./components/studio-sidebar";
import { useTopNavigation } from "./hooks/use-top-navigation";
import { useSidebarResize } from "@/components/projects/studio/hooks/use-sidebar-resize";
import {
	ROVO_APP_SEPARATOR_LINE_OFFSET_PX,
	ROVO_APP_SIDEBAR_MAX_WIDTH_PX,
	ROVO_APP_SIDEBAR_MIN_WIDTH_PX,
	TOP_NAV_COLLAPSED_HEADER_PADDING_PX,
	TOP_NAV_COLLAPSED_LEFT_SECTION_WIDTH_PX,
	TOP_NAV_HEADER_HEIGHT_PX,
	TOP_NAV_PADDING_PX,
	TOP_NAV_SEARCH_CENTER_BREAKPOINT_PX,
	TOP_NAV_SEARCH_ICON_BREAKPOINT_PX,
	TOP_NAV_SEARCH_MAX_WIDTH_PX,
	TOP_NAV_SEARCH_MIN_WIDTH_PX,
} from "./layout-constants";
import SearchIcon from "@atlaskit/icon/core/search";

type Product = "admin" | "agents" | "home" | "jira" | "confluence" | "rovo" | "search" | "studio";

interface TopNavigationProps {
	product?: Product;
	showSearch?: boolean;
	hideRovoAction?: boolean;
	/**
	 * Forces the "Ask Rovo" pill to render even for products that normally
	 * suppress it (Rovo/Studio). The Figma global top navigation always shows
	 * Ask Rovo in the right cluster, so the standalone block demo opts in.
	 */
	forceShowRovoAction?: boolean;
}

/**
 * Studio-style application shell with a resizable, pinned side-nav and a 56px
 * top navigation bar. The header mirrors the Figma global top navigation:
 * left chrome (sidebar toggle, app switcher, product logo) sits in the
 * sidebar-aligned region; the search + Create sit in a middle zone that centers
 * at wide widths and left-aligns below `TOP_NAV_SEARCH_CENTER_BREAKPOINT_PX`;
 * the right cluster (Ask Rovo, notifications, help, settings, avatar) collapses
 * into a "…" overflow popover at narrow widths. The search shrinks fluidly and
 * collapses to an icon button below `TOP_NAV_SEARCH_ICON_BREAKPOINT_PX`.
 */
export default function TopNavigation({
	product = "studio",
	showSearch = true,
	hideRovoAction = false,
	forceShowRovoAction = false,
}: Readonly<TopNavigationProps>) {
	const nav = useTopNavigation();

	// The chrome owns its own sidebar open state (decoupled from the demo's
	// `context-sidebar`) so the resizable shell works standalone.
	const [sidebarOpen, setSidebarOpen] = useState(true);

	const sidebarResize = useSidebarResize({
		defaultWidth: ROVO_APP_SEPARATOR_LINE_OFFSET_PX,
		minWidth: ROVO_APP_SIDEBAR_MIN_WIDTH_PX,
		maxWidth: ROVO_APP_SIDEBAR_MAX_WIDTH_PX,
		onCollapse: useCallback(() => setSidebarOpen(false), []),
	});

	const toggleSidebar = useCallback(() => setSidebarOpen((prev) => !prev), []);

	// Gate the chrome's width/border transition so it never plays on first paint.
	const [hasMountedChrome, setHasMountedChrome] = useState(false);
	useEffect(() => {
		const frame = requestAnimationFrame(() => setHasMountedChrome(true));
		return () => cancelAnimationFrame(frame);
	}, []);

	// Search collapses to an icon-only button on very narrow viewports; tapping
	// it expands the field (and focuses it) for the search session.
	const [isSearchIconExpanded, setIsSearchIconExpanded] = useState(false);
	const isSearchCollapsible =
		nav.windowWidth > 0 && nav.windowWidth < TOP_NAV_SEARCH_ICON_BREAKPOINT_PX;
	const showSearchField = !isSearchCollapsible || isSearchIconExpanded;
	useEffect(() => {
		if (!isSearchCollapsible) {
			setIsSearchIconExpanded(false);
		}
	}, [isSearchCollapsible]);

	// Center the search at wide widths (Figma), left-align it below the breakpoint.
	const centerSearch =
		nav.windowWidth === 0 || nav.windowWidth >= TOP_NAV_SEARCH_CENTER_BREAKPOINT_PX;

	const handleExpandSearchIcon = useCallback(() => {
		setIsSearchIconExpanded(true);
		nav.handleFocusSearch();
	}, [nav]);

	const sidebarStyle = {
		"--sidebar-width": `${sidebarResize.sidebarWidth}px`,
	} as CSSProperties;

	const headerHeightStyle: CSSProperties = {
		height: `${TOP_NAV_HEADER_HEIGHT_PX}px`,
	};

	return (
		<SidebarProvider
			className="h-svh overflow-hidden"
			defaultOpen
			onOpenChange={setSidebarOpen}
			open={sidebarOpen}
			style={sidebarStyle}
		>
			<StudioSidebar
				headerOffsetPx={TOP_NAV_HEADER_HEIGHT_PX}
				isResizing={sidebarResize.isResizing}
				resizeHandle={
					<SidebarResizeHandle
						data-active={sidebarResize.isResizing ? "" : undefined}
						data-will-collapse={sidebarResize.willCollapse ? "" : undefined}
						onDoubleClick={sidebarResize.onResizeHandleDoubleClick}
						onPointerDown={sidebarResize.onResizeHandlePointerDown}
						onPointerEnter={sidebarResize.onResizeHandlePointerEnter}
						onPointerLeave={sidebarResize.onResizeHandlePointerLeave}
					/>
				}
				topOffset
			/>

			{/* Persistent side-nav chrome: aligns to the sidebar width when open and
			    collapses to the shared left chrome width when closed. Hosts the sidebar toggle,
			    app switcher, and product logo. */}
			<div
				className={cn(
					"fixed top-0 left-0 z-50 flex items-center px-3",
					hasMountedChrome && !sidebarResize.isResizing && "transition-[width,border-color] duration-medium ease-in-out",
					sidebarResize.isResizing && "transition-none",
					sidebarOpen
						? cn(
								"w-(--sidebar-width) overflow-x-clip border-r",
								sidebarResize.isResizing || sidebarResize.isResizeHandleHovered
									? "border-border-selected"
									: "border-border",
							)
						: "border-b border-border",
				)}
				style={{
					...headerHeightStyle,
					width: sidebarOpen ? undefined : `${TOP_NAV_COLLAPSED_LEFT_SECTION_WIDTH_PX}px`,
					backgroundColor: token("elevation.surface"),
					viewTransitionName: "persistent-sidebar" as never,
				}}
			>
				<LeftNavigation
					product={product}
					windowWidth={nav.windowWidth}
					isVisible={sidebarOpen}
					isAppSwitcherOpen={nav.isAppSwitcherOpen}
					isSidebarResizing={sidebarResize.isResizing}
					separatorLineOffsetPx={sidebarResize.sidebarWidth - TOP_NAV_PADDING_PX}
					onToggleSidebar={toggleSidebar}
					onToggleAppSwitcher={nav.handleToggleAppSwitcher}
					onCloseAppSwitcher={nav.handleCloseAppSwitcher}
					onNavigate={nav.handleNavigate}
					onHoverEnter={nav.handleHoverEnter}
					onHoverLeave={nav.handleHoverLeave}
				/>
			</div>

			<div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
				{/* Top navigation bar */}
				<div
					className="flex shrink-0 items-center gap-2 border-b px-3 transition-[padding] duration-medium ease-in-out"
					style={{
						...headerHeightStyle,
						paddingLeft: sidebarOpen ? undefined : `${TOP_NAV_COLLAPSED_HEADER_PADDING_PX}px`,
						borderColor: token("color.border"),
						backgroundColor: token("elevation.surface"),
						viewTransitionName: "persistent-header" as never,
					}}
				>
					{/* Middle zone: search + Create. Centered at wide widths, left at narrow. */}
					<div
						className={cn(
							"flex min-w-0 flex-1 items-center gap-2",
							centerSearch ? "justify-center" : "justify-start",
						)}
					>
						{showSearch ? (
							showSearchField ? (
								<div
									ref={nav.searchContainerRef}
									className="relative flex h-9 min-w-0 grow items-center"
									style={{
										// Preferred width is the min; the search grows to the cap when
										// there's room and shrinks below the preferred width under
										// pressure (narrow pinned viewports) so it absorbs the squeeze
										// instead of clipping the right cluster off-screen.
										flexBasis: `${TOP_NAV_SEARCH_MIN_WIDTH_PX}px`,
										maxWidth: `${TOP_NAV_SEARCH_MAX_WIDTH_PX}px`,
									}}
								>
									<InputGroup
										className={cn(
											"h-8 origin-center rounded-md bg-bg-input shadow-none transition-[transform,background-color,box-shadow] duration-medium ease-out hover:bg-bg-input-hovered",
											"has-[[data-slot=input-group-control]:focus-visible]:border-transparent has-[[data-slot=input-group-control]:focus-visible]:ring-0",
											nav.isSearchFocused && "relative z-[1001] scale-y-[1.15]",
										)}
										style={
											nav.isSearchFocused
												? {
														backgroundColor: token("elevation.surface.overlay"),
														boxShadow: token("elevation.shadow.overlay"),
													}
												: undefined
										}
									>
										<InputGroupAddon align="inline-start">
											<span className="size-4 shrink-0 text-icon-subtle">
												<SearchIcon label="" spacing="none" />
											</span>
										</InputGroupAddon>
										<InputGroupInput
											type="search"
											aria-label="Search"
											autoFocus={isSearchIconExpanded}
											value={nav.searchValue}
											onChange={(event) => nav.setSearchValue(event.currentTarget.value)}
											onFocus={nav.handleFocusSearch}
											onKeyDown={nav.handleSearchKeyDown}
											placeholder="Search"
											className="h-full text-sm placeholder:text-sm [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden [&::-webkit-search-results-button]:hidden [&::-webkit-search-results-decoration]:hidden"
										/>
									</InputGroup>
									<SearchSuggestionsPanel
										anchorRef={nav.searchContainerRef}
										isVisible={nav.isSearchFocused}
										onSearchAllApps={nav.handleSearchAllApps}
										onRecentItemClick={nav.handleRecentItemClick}
										onRecentSearchClick={nav.handleRecentSearchClick}
										panelRef={nav.searchPanelRef}
									/>
								</div>
							) : (
								<Button
									aria-label="Search"
									size="icon"
									variant="ghost"
									onClick={handleExpandSearchIcon}
								>
									<SearchIcon label="" color={token("color.icon.subtle")} />
								</Button>
							)
						) : null}

						<CreateButton />
					</div>

					<RightNavigation
						product={product}
						windowWidth={nav.windowWidth}
						hideRovoAction={hideRovoAction}
						forceShowRovoAction={forceShowRovoAction}
						isChatOpen={nav.isSidebarChatOpen}
						onToggleChat={nav.toggleChat}
					/>
				</div>

				{/* Placeholder content area so the chrome has a body to frame. */}
				<main className="relative flex min-h-0 min-w-0 flex-1 bg-background px-3 text-foreground" />
			</div>
		</SidebarProvider>
	);
}
