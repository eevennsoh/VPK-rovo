"use client";

import Image from "next/image";
import StarStarredIcon from "@atlaskit/icon/core/star-starred";
import BoardIcon from "@atlaskit/icon/core/board";
import PageIcon from "@atlaskit/icon/core/page";
import SettingsIcon from "@atlaskit/icon/core/settings";
import PersonIcon from "@atlaskit/icon/core/person";
import DashboardIcon from "@atlaskit/icon/core/dashboard";
import SearchIcon from "@atlaskit/icon/core/search";
import GridIcon from "@atlaskit/icon/core/grid";
import LinkExternalIcon from "@atlaskit/icon/core/link-external";
import ClockIcon from "@atlaskit/icon/core/clock";

import {
	MenuGroup,
	MenuSection,
	MenuItem,
	MenuLinkItem,
	MenuHeading,
	MenuSkeletonItem,
	MenuSkeletonHeading,
} from "@/components/ui/menu-group";

// ---------------------------------------------------------------------------
// Overview demo (default export) — Jira-style navigation menu
// ---------------------------------------------------------------------------

export default function MenuGroupDemo() {
	return (
		<div className="w-72 rounded-lg bg-popover py-1 shadow-2xl">
			<MenuGroup>
				<MenuSection>
					<MenuLinkItem href="#" iconBefore={<ClockIcon label="" />}>
						Your work
					</MenuLinkItem>
					<MenuLinkItem href="#" iconBefore={<GridIcon label="" />}>
						Projects
					</MenuLinkItem>
					<MenuLinkItem href="#" iconBefore={<BoardIcon label="" />}>
						Filters &amp; boards
					</MenuLinkItem>
					<MenuLinkItem href="#" iconBefore={<PersonIcon label="" />}>
						Teams &amp; people
					</MenuLinkItem>
				</MenuSection>
				<MenuSection hasSeparator>
					<MenuLinkItem href="#" iconBefore={<SettingsIcon label="" />}>
						Settings
					</MenuLinkItem>
				</MenuSection>
			</MenuGroup>
		</div>
	);
}

// ---------------------------------------------------------------------------
// 1 — Default
// ---------------------------------------------------------------------------

export function MenuGroupDemoDefault() {
	return (
		<div className="w-72 rounded-lg bg-popover py-1 shadow-2xl">
			<MenuGroup>
				<MenuSection title="Navigation">
					<MenuLinkItem href="#">Dashboard</MenuLinkItem>
					<MenuLinkItem href="#">Projects</MenuLinkItem>
					<MenuLinkItem href="#">Settings</MenuLinkItem>
				</MenuSection>
			</MenuGroup>
		</div>
	);
}

// ---------------------------------------------------------------------------
// 2 — Menu structure (sections + heading items)
// ---------------------------------------------------------------------------

export function MenuGroupDemoMenuStructure() {
	return (
		<div className="w-72 rounded-lg bg-popover py-1 shadow-2xl">
			<MenuGroup>
				<MenuSection title="Navigation">
					<MenuLinkItem href="#">Dashboard</MenuLinkItem>
					<MenuLinkItem href="#">Projects</MenuLinkItem>
					<MenuLinkItem href="#">Settings</MenuLinkItem>
				</MenuSection>
				<MenuSection title="Actions" hasSeparator>
					<MenuItem>Create new</MenuItem>
					<MenuItem>Import</MenuItem>
					<MenuItem>Export</MenuItem>
				</MenuSection>
				<MenuSection title="Help" hasSeparator>
					<MenuLinkItem href="#">Documentation</MenuLinkItem>
					<MenuLinkItem href="#">Support</MenuLinkItem>
				</MenuSection>
			</MenuGroup>
		</div>
	);
}

// ---------------------------------------------------------------------------
// 3 — Button item
// ---------------------------------------------------------------------------

export function MenuGroupDemoButtonItem() {
	return (
		<div className="w-72 rounded-lg bg-popover py-1 shadow-2xl">
			<MenuGroup>
				<MenuSection>
					<MenuItem description="Create a new project from scratch">
						Create project
					</MenuItem>
					<MenuItem description="Search your workspace content">
						Search
					</MenuItem>
					<MenuItem description="Customize your workspace">
						Preferences
					</MenuItem>
				</MenuSection>
			</MenuGroup>
		</div>
	);
}

// ---------------------------------------------------------------------------
// 4 — Link item
// ---------------------------------------------------------------------------

export function MenuGroupDemoLinkItem() {
	return (
		<div className="w-72 rounded-lg bg-popover py-1 shadow-2xl">
			<MenuGroup>
				<MenuSection>
					<MenuLinkItem
						href="#"
						iconBefore={<PageIcon label="" />}
						description="Read the latest documentation"
					>
						Documentation
					</MenuLinkItem>
					<MenuLinkItem
						href="#"
						iconBefore={<PersonIcon label="" />}
						description="Join the community discussion"
					>
						Community
					</MenuLinkItem>
					<MenuLinkItem
						href="#"
						iconBefore={<LinkExternalIcon label="" />}
						description="View the open source repository"
					>
						Source code
					</MenuLinkItem>
				</MenuSection>
			</MenuGroup>
		</div>
	);
}

// ---------------------------------------------------------------------------
// 5 — Custom item (project switcher with avatars)
// ---------------------------------------------------------------------------

export function MenuGroupDemoCustomItem() {
	return (
		<div className="w-72 rounded-lg bg-popover py-1 shadow-2xl">
			<MenuGroup>
				<MenuSection title="Recent projects">
					<MenuItem
						iconBefore={
							<Image
								src="/avatar-project/rocket.svg"
								alt=""
								width={24}
								height={24}
								className="rounded"
							/>
						}
						description="Software project"
					>
						Apollo
					</MenuItem>
					<MenuItem
						iconBefore={
							<Image
								src="/avatar-project/star.svg"
								alt=""
								width={24}
								height={24}
								className="rounded"
							/>
						}
						description="Service management"
					>
						Stellar
					</MenuItem>
					<MenuItem
						iconBefore={
							<Image
								src="/avatar-project/compass.svg"
								alt=""
								width={24}
								height={24}
								className="rounded"
							/>
						}
						description="Software project"
					>
						Navigator
					</MenuItem>
				</MenuSection>
			</MenuGroup>
		</div>
	);
}

// ---------------------------------------------------------------------------
// 6 — Section and heading item
// ---------------------------------------------------------------------------

export function MenuGroupDemoSectionAndHeading() {
	return (
		<div className="w-72 rounded-lg bg-popover py-1 shadow-2xl">
			<MenuGroup>
				<MenuSection>
					<MenuHeading>Starred</MenuHeading>
					<MenuItem iconBefore={<StarStarredIcon label="" />}>
						Apollo
					</MenuItem>
					<MenuItem iconBefore={<StarStarredIcon label="" />}>
						Stellar
					</MenuItem>
				</MenuSection>
				<MenuSection hasSeparator>
					<MenuHeading>Recent</MenuHeading>
					<MenuItem iconBefore={<DashboardIcon label="" />}>
						Navigator
					</MenuItem>
					<MenuItem iconBefore={<DashboardIcon label="" />}>
						Compass
					</MenuItem>
					<MenuItem iconBefore={<DashboardIcon label="" />}>
						Horizon
					</MenuItem>
				</MenuSection>
			</MenuGroup>
		</div>
	);
}

// ---------------------------------------------------------------------------
// 7 — Density (cozy vs compact side-by-side)
// ---------------------------------------------------------------------------

export function MenuGroupDemoDensity() {
	return (
		<div className="flex flex-wrap gap-4">
			<div className="w-56 rounded-lg bg-popover py-1 shadow-2xl">
				<MenuGroup spacing="cozy">
					<MenuSection title="Cozy">
						<MenuItem iconBefore={<DashboardIcon label="" />}>Dashboard</MenuItem>
						<MenuItem iconBefore={<SearchIcon label="" />}>Search</MenuItem>
						<MenuItem iconBefore={<SettingsIcon label="" />}>Settings</MenuItem>
					</MenuSection>
				</MenuGroup>
			</div>
			<div className="w-56 rounded-lg bg-popover py-1 shadow-2xl">
				<MenuGroup spacing="compact">
					<MenuSection title="Compact">
						<MenuItem iconBefore={<DashboardIcon label="" />}>Dashboard</MenuItem>
						<MenuItem iconBefore={<SearchIcon label="" />}>Search</MenuItem>
						<MenuItem iconBefore={<SettingsIcon label="" />}>Settings</MenuItem>
					</MenuSection>
				</MenuGroup>
			</div>
		</div>
	);
}

// ---------------------------------------------------------------------------
// 8 — Scrolling
// ---------------------------------------------------------------------------

export function MenuGroupDemoScrolling() {
	return (
		<div className="w-72 rounded-lg bg-popover py-1 shadow-2xl">
			<MenuGroup className="max-h-48 overflow-y-auto">
				<MenuSection title="All projects">
					<MenuItem>Apollo</MenuItem>
					<MenuItem>Stellar</MenuItem>
					<MenuItem>Navigator</MenuItem>
					<MenuItem>Compass</MenuItem>
					<MenuItem>Horizon</MenuItem>
					<MenuItem>Voyager</MenuItem>
					<MenuItem>Pioneer</MenuItem>
					<MenuItem>Artemis</MenuItem>
					<MenuItem>Orion</MenuItem>
					<MenuItem>Mercury</MenuItem>
				</MenuSection>
			</MenuGroup>
		</div>
	);
}

// ---------------------------------------------------------------------------
// 9 — Loading (skeleton placeholders)
// ---------------------------------------------------------------------------

export function MenuGroupDemoLoading() {
	return (
		<div className="w-72 rounded-lg bg-popover py-1 shadow-2xl">
			<MenuGroup>
				<MenuSkeletonHeading />
				<MenuSkeletonItem hasIcon />
				<MenuSkeletonItem hasIcon />
				<MenuSkeletonItem hasIcon />
				<MenuSkeletonHeading />
				<MenuSkeletonItem />
				<MenuSkeletonItem />
			</MenuGroup>
		</div>
	);
}
