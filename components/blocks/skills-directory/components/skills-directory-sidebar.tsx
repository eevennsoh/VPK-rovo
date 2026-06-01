"use client";

import Image from "next/image";
import AlignTextLeftIcon from "@atlaskit/icon/core/align-text-left";
import AngleBracketsIcon from "@atlaskit/icon/core/angle-brackets";
import ChartTrendUpIcon from "@atlaskit/icon/core/chart-trend-up";
import EditIcon from "@atlaskit/icon/core/edit";
import SettingsIcon from "@atlaskit/icon/core/settings";
import TimelineIcon from "@atlaskit/icon/core/timeline";
import { type ReactElement } from "react";

import { Avatar } from "@/components/ui/avatar";
import { Tile } from "@/components/ui/tile";
import { SidebarNavItem } from "@/components/ui-custom/sidebar-nav-item";
import { token } from "@/lib/tokens";

import {
	getSkillById,
	getSkillIcon,
	type SkillsDirectorySkill,
} from "../data/skills";
import type {
	SkillNavIcon,
	SkillsDirectoryPrimaryItem,
	SkillsDirectorySidebarGroup,
} from "../data/sidebar-groups";

function getNavIcon(icon: SkillNavIcon): ReactElement {
	switch (icon) {
		case "settings":
			return <SettingsIcon label="" />;
		case "edit":
			return <EditIcon label="" />;
		case "chart-trend-up":
			return <ChartTrendUpIcon label="" />;
		case "angle-brackets":
			return <AngleBracketsIcon label="" />;
		case "timeline":
		default:
			return <TimelineIcon label="" />;
	}
}

/** Gray square tile holding a 16px icon — ignores props injected by the nav-item leading slot. */
function TileLeading({ children }: Readonly<{ children: ReactElement }>) {
	return (
		<Tile aria-hidden className="shrink-0 text-icon-subtle" label="" size="small" variant="neutral">
			{children}
		</Tile>
	);
}

/** Square 24px company logo — mirrors the agent-browser sidebar avatar treatment. */
function LogoLeading({ src }: Readonly<{ src: string }>) {
	return (
		<Avatar size="sm" shape="square" className="shrink-0 after:border-0">
			<Image alt="" aria-hidden className="size-full object-contain" height={24} src={src} width={24} />
		</Avatar>
	);
}

export interface SkillsDirectorySidebarProps {
	primaryItems: readonly SkillsDirectoryPrimaryItem[];
	activeItem: string;
	onSelectPrimary: (id: string) => void;
	groups: readonly SkillsDirectorySidebarGroup[];
	skills: readonly SkillsDirectorySkill[];
	onSelectSkill?: (skill: SkillsDirectorySkill) => void;
}

export function SkillsDirectorySidebar({
	primaryItems,
	activeItem,
	onSelectPrimary,
	groups,
	skills,
	onSelectSkill,
}: Readonly<SkillsDirectorySidebarProps>) {
	return (
		<nav
			aria-label="Skill categories"
			className="hidden h-full min-h-0 w-[220px] shrink-0 flex-col gap-5 overflow-y-auto pt-1 md:flex"
		>
			<ul className="flex flex-col gap-0.5">
				{primaryItems.map((item) => (
					<li key={item.id}>
						<SidebarNavItem
							label={item.label}
							isSelected={activeItem === item.id}
							onClick={() => onSelectPrimary(item.id)}
						/>
					</li>
				))}
			</ul>

			{groups.map((group) => (
				<SkillsSidebarGroup
					key={group.title}
					group={group}
					skills={skills}
					onSelectSkill={onSelectSkill}
				/>
			))}
		</nav>
	);
}

interface SkillsSidebarGroupProps {
	group: SkillsDirectorySidebarGroup;
	skills: readonly SkillsDirectorySkill[];
	onSelectSkill?: (skill: SkillsDirectorySkill) => void;
}

function SkillsSidebarGroup({ group, skills, onSelectSkill }: Readonly<SkillsSidebarGroupProps>) {
	if (group.items.length === 0) return null;

	return (
		<div className="flex flex-col gap-1.5">
			<p style={{ font: token("font.heading.xxsmall") }} className="px-1.5 text-text-subtlest">
				{group.title}
			</p>
			<ul className="flex flex-col gap-0.5">
				{group.items.map((item) => {
					if (item.kind === "skill") {
						const skill = getSkillById(skills, item.id);
						if (!skill) return null;
						return (
							<li key={`skill-${item.id}`}>
								<SidebarNavItem
									label={skill.name}
									leading={<TileLeading>{getSkillIcon(skill.icon)}</TileLeading>}
									leadingSize="medium"
									onClick={onSelectSkill ? () => onSelectSkill(skill) : undefined}
								/>
							</li>
						);
					}

					if (item.kind === "category") {
						return (
							<li key={`category-${item.id}`}>
								<SidebarNavItem
									label={item.label}
									leading={<TileLeading>{getNavIcon(item.icon)}</TileLeading>}
									leadingSize="medium"
								/>
							</li>
						);
					}

					return (
						<li key={`company-${item.id}`}>
							<SidebarNavItem
								label={item.label}
								leading={<LogoLeading src={item.logoSrc} />}
								leadingSize="medium"
							/>
						</li>
					);
				})}
				{group.showAll ? (
					<li>
						<SidebarNavItem
							label="Show all"
							leading={<AlignTextLeftIcon label="" size="small" />}
							leadingSize="medium"
						/>
					</li>
				) : null}
			</ul>
		</div>
	);
}
