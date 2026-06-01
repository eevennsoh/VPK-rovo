"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";
import CrossIcon from "@atlaskit/icon/core/cross";
import SearchIcon from "@atlaskit/icon/core/search";

import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Icon } from "@/components/ui/icon";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { CardDirectorySkill } from "@/components/ui-custom/card-directory";
import { cn } from "@/lib/utils";

import { SkillsDirectorySidebar } from "./skills-directory-sidebar";
import { DEFAULT_SKILLS, getSkillIcon, type SkillsDirectorySkill } from "../data/skills";
import {
	DEFAULT_SKILLS_DIRECTORY_PRIMARY_ITEMS,
	DEFAULT_SKILLS_DIRECTORY_SIDEBAR_GROUPS,
	type SkillsDirectoryPrimaryItem,
	type SkillsDirectorySidebarGroup,
} from "../data/sidebar-groups";

export type { SkillsDirectorySkill } from "../data/skills";
export type {
	SkillsDirectoryPrimaryItem,
	SkillsDirectorySidebarGroup,
} from "../data/sidebar-groups";

export interface SkillsDirectoryDialogProps {
	/** Skill catalog rendered in the grid. Defaults to the bundled demo skills. */
	skills?: readonly SkillsDirectorySkill[];
	/** Skills appended after the catalog (e.g. newly created in-session). */
	sessionSkills?: readonly SkillsDirectorySkill[];
	onSelectSkill?: (skill: SkillsDirectorySkill) => void;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** Sectionless rows above the first group (All / My skills). */
	primaryItems?: readonly SkillsDirectoryPrimaryItem[];
	sidebarGroups?: readonly SkillsDirectorySidebarGroup[];
	title?: string;
	/** Invoked by the header "New skill" primary button. */
	onNewSkill?: () => void;
}

const EMPTY_SKILLS: readonly SkillsDirectorySkill[] = [];

export function SkillsDirectoryDialog({
	skills = DEFAULT_SKILLS,
	sessionSkills = EMPTY_SKILLS,
	onSelectSkill,
	open,
	onOpenChange,
	primaryItems = DEFAULT_SKILLS_DIRECTORY_PRIMARY_ITEMS,
	sidebarGroups = DEFAULT_SKILLS_DIRECTORY_SIDEBAR_GROUPS,
	title = "Browse skills",
	onNewSkill,
}: Readonly<SkillsDirectoryDialogProps>) {
	const directorySkills = useMemo(
		() => [...skills, ...sessionSkills],
		[skills, sessionSkills],
	);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				className="grid h-[min(800px,calc(100svh-2rem))] max-h-[calc(100svh-2rem)] grid-rows-[auto_minmax(0,1fr)] gap-0 overflow-hidden p-0 sm:max-w-[1200px]"
				showCloseButton={false}
			>
				<div className="flex items-center justify-between px-6 pt-6 pb-4">
					<DialogTitle className="text-base font-medium leading-5 text-text">
						{title}
					</DialogTitle>
					<div className="flex items-center gap-2">
						<Button onClick={onNewSkill}>New skill</Button>
						<DialogClose render={<Button variant="ghost" size="icon" />}>
							<CrossIcon label="" />
							<span className="sr-only">Close</span>
						</DialogClose>
					</div>
				</div>
				<div className="min-h-0 overflow-hidden px-6">
					<SkillsBrowser
						skills={directorySkills}
						primaryItems={primaryItems}
						sidebarGroups={sidebarGroups}
						onSelectSkill={onSelectSkill}
					/>
				</div>
			</DialogContent>
		</Dialog>
	);
}

function filterSkills(
	skills: readonly SkillsDirectorySkill[],
	query: string,
): readonly SkillsDirectorySkill[] {
	const normalized = query.trim().toLowerCase();
	if (!normalized) return skills;
	return skills.filter((skill) => {
		const haystack = `${skill.name} ${skill.description} ${skill.publisher}`.toLowerCase();
		return haystack.includes(normalized);
	});
}

interface SkillsBrowserProps {
	skills: readonly SkillsDirectorySkill[];
	primaryItems: readonly SkillsDirectoryPrimaryItem[];
	sidebarGroups: readonly SkillsDirectorySidebarGroup[];
	onSelectSkill?: (skill: SkillsDirectorySkill) => void;
}

function SkillsBrowser({ skills, primaryItems, sidebarGroups, onSelectSkill }: Readonly<SkillsBrowserProps>) {
	const initialItem = primaryItems[0]?.id ?? "all";
	const [activeItem, setActiveItem] = useState<string>(initialItem);
	const [query, setQuery] = useState("");

	const filtered = useMemo(() => filterSkills(skills, query), [skills, query]);

	return (
		<div className="grid h-full min-h-0 grid-cols-1 gap-8 md:grid-cols-[220px_minmax(0,1fr)]">
			<SkillsDirectorySidebar
				primaryItems={primaryItems}
				activeItem={activeItem}
				onSelectPrimary={setActiveItem}
				groups={sidebarGroups}
				skills={skills}
				onSelectSkill={onSelectSkill}
			/>

			<div className="-mx-4 flex min-h-0 min-w-0 flex-col gap-5 overflow-y-auto px-4 pt-2 pb-6">
				<InputGroup>
					<InputGroupAddon>
						<SearchIcon label="" />
					</InputGroupAddon>
					<InputGroupInput
						aria-label="Search skills"
						placeholder="Search for a skill by name, or describe it"
						value={query}
						onChange={(event) => setQuery(event.target.value)}
					/>
				</InputGroup>

				<div className="flex items-center justify-between">
					<Button variant="outline">
						Sort by latest
						<Icon render={<ChevronDownIcon label="" size="small" color="currentColor" />} />
					</Button>
					<p className="text-sm leading-5 text-text-subtle">
						Showing {filtered.length.toLocaleString("en-US")} results
					</p>
				</div>

				{filtered.length === 0 ? (
					<p className="text-sm text-text-subtlest">No skills match &ldquo;{query}&rdquo;.</p>
				) : (
					<SkillSection skills={filtered} onSelectSkill={onSelectSkill} />
				)}
			</div>
		</div>
	);
}

interface SkillSectionProps {
	skills: readonly SkillsDirectorySkill[];
	onSelectSkill?: (skill: SkillsDirectorySkill) => void;
}

function SkillSection({ skills, onSelectSkill }: Readonly<SkillSectionProps>) {
	return (
		<section aria-label="Skills">
			<ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
				{skills.map((skill) => (
					<li key={skill.id}>
						<CardDirectorySkill
							name={skill.name}
							icon={
								<span className={cn("inline-flex items-center justify-center", skill.iconColor)}>
									{getSkillIcon(skill.icon)}
								</span>
							}
							iconTile={false}
							description={skill.description}
							publisher={skill.publisher}
							publisherLogo={
								<Image
									alt=""
									aria-hidden
									className="size-4 shrink-0 object-contain"
									height={16}
									src={skill.publisherLogoSrc}
									width={16}
								/>
							}
							starCount={skill.starCount}
							viewCount={skill.viewCount}
							revealStatsOnHover
							onSelect={onSelectSkill ? () => onSelectSkill(skill) : undefined}
						/>
					</li>
				))}
			</ul>
		</section>
	);
}
