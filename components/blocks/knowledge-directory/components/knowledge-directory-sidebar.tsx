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
	type KnowledgeDirectorySkill,
} from "../data/skills";
import type {
	SkillNavIcon,
	KnowledgeDirectoryPrimaryItem,
	KnowledgeDirectorySidebarGroup,
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

function TileLeading({ children }: Readonly<{ children: ReactElement }>) {
	return (
		<Tile aria-hidden className="shrink-0 text-icon-subtle" label="" size="small" variant="neutral">
			{children}
		</Tile>
	);
}

function LogoLeading({ src }: Readonly<{ src: string }>) {
	return (
		<Avatar size="sm" shape="square" className="shrink-0 after:border-0">
			<Image alt="" aria-hidden className="size-full object-contain" height={24} src={src} width={24} />
		</Avatar>
	);
}

export interface KnowledgeDirectorySidebarProps {
	activeItem: string;
	groups: readonly KnowledgeDirectorySidebarGroup[];
	onSelectItem: (id: string) => void;
	primaryItems: readonly KnowledgeDirectoryPrimaryItem[];
	skills: readonly KnowledgeDirectorySkill[];
}

export function KnowledgeDirectorySidebar({
	activeItem,
	groups,
	onSelectItem,
	primaryItems,
	skills,
}: Readonly<KnowledgeDirectorySidebarProps>) {
	return (
		<nav
			aria-label="Skill categories"
			className="hidden min-h-0 w-[280px] shrink-0 flex-col overflow-y-auto pl-6 md:flex"
		>
			<ul className="flex w-64 flex-col">
				{primaryItems.map((item) => (
					<li key={item.id}>
						<SidebarNavItem
							label={item.label}
							isSelected={activeItem === item.id}
							onClick={() => onSelectItem(item.id)}
						/>
					</li>
				))}
			</ul>

			<div className="h-3 w-64 shrink-0" />

			{groups.map((group) => (
				<SkillsSidebarGroup
					key={group.title}
					activeItem={activeItem}
					group={group}
					onSelectItem={onSelectItem}
					skills={skills}
				/>
			))}
		</nav>
	);
}

interface SkillsSidebarGroupProps {
	activeItem: string;
	group: KnowledgeDirectorySidebarGroup;
	onSelectItem: (id: string) => void;
	skills: readonly KnowledgeDirectorySkill[];
}

function SkillsSidebarGroup({
	activeItem,
	group,
	onSelectItem,
	skills,
}: Readonly<SkillsSidebarGroupProps>) {
	if (group.items.length === 0) return null;

	return (
		<div className="flex w-64 flex-col">
			<div className="w-64 py-2 pl-1.5">
				<p style={{ font: token("font.heading.xxsmall") }} className="text-text-subtlest">
					{group.title}
				</p>
			</div>
			<ul className="flex flex-col">
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
									isSelected={activeItem === item.id}
									onClick={() => onSelectItem(item.id)}
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
									isSelected={activeItem === item.id}
									onClick={() => onSelectItem(item.id)}
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
								isSelected={activeItem === item.id}
								onClick={() => onSelectItem(item.id)}
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
							onClick={() => onSelectItem("all-skills")}
						/>
					</li>
				) : null}
			</ul>
			<div className="h-3 w-64 shrink-0" />
		</div>
	);
}
