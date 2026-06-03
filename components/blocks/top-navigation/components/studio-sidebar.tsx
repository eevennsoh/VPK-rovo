"use client";

import * as React from "react";
import AiAgentIcon from "@atlaskit/icon/core/ai-agent";
import AppsIcon from "@atlaskit/icon/core/apps";
import AutomationIcon from "@atlaskit/icon/core/automation";
import ChartTrendUpIcon from "@atlaskit/icon/core/chart-trend-up";
import PersonAvatarIcon from "@atlaskit/icon/core/person-avatar";
import SkillIcon from "@atlaskit/icon-lab/core/skill";
import TeamworkGraphIcon from "@atlaskit/icon-lab/core/teamwork-graph";
import { token } from "@/lib/tokens";
import { cn } from "@/lib/utils";
import { Sidebar, SidebarContent } from "@/components/ui/sidebar";
import { SidebarNavItem } from "@/components/ui-custom/sidebar-nav-item";

interface StudioSidebarNavItem {
	icon: React.ReactNode;
	isSelected?: boolean;
	label: string;
}

interface StudioSidebarNavSection {
	items: ReadonlyArray<StudioSidebarNavItem>;
	title?: string;
}

// Static, presentational mirror of the `/studio` shell's side-nav sections.
const STUDIO_SIDEBAR_NAV_SECTIONS: ReadonlyArray<StudioSidebarNavSection> = [
	{
		items: [
			{ icon: <PersonAvatarIcon label="" />, label: "For you" },
			{ icon: <ChartTrendUpIcon label="" />, label: "Insights" },
		],
	},
	{
		title: "Browse",
		items: [
			{ icon: <SkillIcon label="" />, label: "Skills" },
			{ icon: <TeamworkGraphIcon label="" />, label: "Teamwork Graph" },
		],
	},
	{
		title: "Build",
		items: [
			{ icon: <AppsIcon label="" />, label: "Apps" },
			{ icon: <AiAgentIcon label="" />, isSelected: true, label: "Agents" },
			{ icon: <AutomationIcon label="" />, label: "Automation" },
		],
	},
];

interface StudioSidebarProps {
	/** Height of the top chrome the sidebar should sit below, in px (default 56). */
	headerOffsetPx?: number;
	hoverOpen?: boolean;
	isResizing?: boolean;
	onSidebarMouseEnter?: () => void;
	onSidebarMouseLeave?: () => void;
	resizeHandle?: React.ReactNode;
	/** Offsets the sidebar below the top chrome header when standalone. */
	topOffset?: boolean;
}

export function StudioSidebar({
	headerOffsetPx = 56,
	hoverOpen = false,
	isResizing,
	onSidebarMouseEnter,
	onSidebarMouseLeave,
	resizeHandle,
	topOffset = false,
}: Readonly<StudioSidebarProps>) {
	return (
		<Sidebar
			aria-label="Studio navigation"
			className={cn(
				// Horizontal padding lives on the content wrapper, not here.
				"bg-sidebar !px-0 !pb-0",
				// The resize handle paints the divider; a container border would double it.
				!resizeHandle &&
					"group-data-[state=expanded]:group-data-[side=left]:border-r group-data-[state=expanded]:group-data-[side=left]:border-border",
			)}
			isResizing={isResizing}
			onMouseEnter={onSidebarMouseEnter}
			onMouseLeave={onSidebarMouseLeave}
			resizeHandle={resizeHandle}
			role="complementary"
			style={{
				zIndex: 50,
				...(topOffset
					? {
							top: `${headerOffsetPx}px`,
							height: `calc(100svh - ${headerOffsetPx}px)`,
						}
					: {}),
				...(hoverOpen
					? { left: 0, boxShadow: token("elevation.shadow.overlay") }
					: {}),
			}}
			variant="inset"
		>
			<SidebarContent className="gap-3 overflow-hidden bg-sidebar px-3">
				<nav aria-label="Studio" className="flex shrink-0 flex-col gap-3">
					{STUDIO_SIDEBAR_NAV_SECTIONS.map((section, sectionIndex) => (
						<div
							key={section.title ?? `section-${sectionIndex}`}
							className="flex flex-col gap-1"
						>
							{section.title ? (
								<div className="px-1.5 text-xs font-semibold leading-4 text-text-subtlest">
									{section.title}
								</div>
							) : null}
							<div className="flex flex-col">
								{section.items.map((item) => (
									<SidebarNavItem
										key={item.label}
										label={item.label}
										leading={item.icon}
										leadingSize="medium"
										isSelected={item.isSelected ?? false}
									/>
								))}
							</div>
						</div>
					))}
				</nav>
			</SidebarContent>
		</Sidebar>
	);
}
