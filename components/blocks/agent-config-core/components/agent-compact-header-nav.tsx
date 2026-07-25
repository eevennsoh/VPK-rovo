"use client";

// oxlint-disable react-doctor/jsx-no-jsx-as-prop -- Dropdown trigger uses render-node props for shadcn composition.

import { useLayoutEffect, useRef, useState } from "react";

import { AGENT_AVATAR_SRC } from "@/components/blocks/agent-config-core/components/agent-profile-cover";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/ui/icon";
import { AtlassianLogo, isAtlassianLogoSource } from "@/components/ui/logo";
import { MoreHorizontalIcon } from "@/components/ui/vpk-icons";
import { computeContextBarOverflow } from "@/components/ui-custom/context-bar/overflow";
import { cn } from "@/lib/utils";
import {
	AGENT_COMPACT_HEADER_DEFAULT_NAV_ITEMS,
	type AgentCompactHeaderNavItem,
	type AgentCompactHeaderSection,
} from "./agent-compact-header-nav-data";

const AGENT_COMPACT_HEADER_NAV_GAP = 4;
const AGENT_COMPACT_HEADER_AVATAR_NAV_GAP = 8;
const AGENT_COMPACT_HEADER_NAV_OVERFLOW_WIDTH = 24;

function AgentCompactHeaderNavButton({
	activeSection,
	item,
	onSectionChange,
}: Readonly<{
	activeSection?: AgentCompactHeaderSection | null;
	item: AgentCompactHeaderNavItem;
	onSectionChange?: (section: AgentCompactHeaderSection) => void;
}>) {
	const isSelected = activeSection === item.value;

	return (
		<Button
			type="button"
			aria-pressed={isSelected ? true : undefined}
			onClick={() => onSectionChange?.(item.value)}
			size="compact"
			variant={isSelected ? "outline" : "ghost"}
			className={cn(
				"h-6 gap-1.5 rounded px-2 text-sm font-medium leading-5",
				isSelected
					? "border-border-selected bg-bg-selected text-text-selected [&_svg]:text-icon-selected"
					: "text-text-subtle [&_svg]:text-icon-subtle"
			)}
		>
			<Icon render={item.icon} aria-hidden />
			{item.label}
		</Button>
	);
}

export interface AgentCompactHeaderNavProps {
	activeSection?: AgentCompactHeaderSection | null;
	avatarSrc?: string;
	items?: readonly AgentCompactHeaderNavItem[];
	onSectionChange?: (section: AgentCompactHeaderSection) => void;
}

export function AgentCompactHeaderNav({
	activeSection = null,
	avatarSrc = AGENT_AVATAR_SRC,
	items = AGENT_COMPACT_HEADER_DEFAULT_NAV_ITEMS,
	onSectionChange,
}: Readonly<AgentCompactHeaderNavProps>) {
	const containerRef = useRef<HTMLDivElement>(null);
	const measureRef = useRef<HTMLDivElement>(null);
	const [visibleCount, setVisibleCount] = useState<number>(items.length);
	const visibleItems = items.slice(0, visibleCount);
	const hiddenItems = items.slice(visibleCount);

	useLayoutEffect(() => {
		const container = containerRef.current;
		const measure = measureRef.current;
		if (!container || !measure) {
			return;
		}

		function recompute(): void {
			const widths = Array.from(measure!.children).map((node) => (node as HTMLElement).offsetWidth);
			setVisibleCount(
				computeContextBarOverflow(
					widths,
					container!.clientWidth,
					AGENT_COMPACT_HEADER_NAV_OVERFLOW_WIDTH,
					AGENT_COMPACT_HEADER_NAV_GAP,
				),
			);
		}

		recompute();
		const observer = new ResizeObserver(recompute);
		observer.observe(container);
		return () => observer.disconnect();
	}, [items]);

	return (
		<div className="flex min-w-0 flex-1 items-center" style={{ gap: AGENT_COMPACT_HEADER_AVATAR_NAV_GAP }}>
			<Avatar label="Agent" shape="hexagon" size="sm">
				{isAtlassianLogoSource(avatarSrc) ? (
					<AtlassianLogo name="atlassian" label="Agent" size="small" />
				) : (
					<AvatarImage alt="" src={avatarSrc} />
				)}
			</Avatar>
			<div
				// `overflow-x-clip` hides horizontally-overflowing items (the "..."
				// menu absorbs them). The first item ("Insights") would otherwise sit
				// flush at the clip box's left edge, so its 3px focus ring gets
				// shorn flat on the left even with a clip margin. `pl-1` insets the
				// content 4px inside the clip box so the ring clears the edge; `py-1
				// -my-1` adds matching vertical room, and the clip margin covers the
				// trailing "..." item on the right.
				className="relative -my-1 flex min-w-0 flex-1 items-center overflow-x-clip overflow-y-visible py-1 pl-1 [overflow-clip-margin:6px]"
				ref={containerRef}
				style={{ gap: AGENT_COMPACT_HEADER_NAV_GAP }}
			>
				<div aria-hidden className="pointer-events-none absolute top-0 left-0 h-0 w-0 overflow-clip">
					<div className="invisible flex items-center" ref={measureRef} style={{ gap: AGENT_COMPACT_HEADER_NAV_GAP }}>
						{items.map((item) => (
							<AgentCompactHeaderNavButton
								activeSection={activeSection}
								item={item}
								key={`measure-${item.label}`}
								onSectionChange={onSectionChange}
							/>
						))}
					</div>
				</div>
				{visibleItems.map((item) => (
					<AgentCompactHeaderNavButton
						activeSection={activeSection}
						item={item}
						key={item.label}
						onSectionChange={onSectionChange}
					/>
				))}
				{hiddenItems.length > 0 ? (
					<DropdownMenu>
						<DropdownMenuTrigger
							aria-label="More agent sections"
							render={<Button className="size-6 rounded px-0" size="icon-compact" type="button" variant="ghost" />}
						>
							<MoreHorizontalIcon size="small" />
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuGroup>
								{hiddenItems.map((item) => (
									<DropdownMenuItem
										elemBefore={item.icon}
										key={item.label}
										onSelect={() => onSectionChange?.(item.value)}
									>
										{item.label}
									</DropdownMenuItem>
								))}
							</DropdownMenuGroup>
						</DropdownMenuContent>
					</DropdownMenu>
				) : null}
			</div>
		</div>
	);
}
