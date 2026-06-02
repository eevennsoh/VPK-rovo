"use client";

import Image from "next/image";
import {
	type KeyboardEvent,
	useMemo,
	useState,
	type MouseEvent,
} from "react";
import ArrowLeftIcon from "@atlaskit/icon/core/arrow-left";
import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";
import ChevronRightIcon from "@atlaskit/icon/core/chevron-right";
import CrossIcon from "@atlaskit/icon/core/cross";
import DownloadIcon from "@atlaskit/icon/core/download";
import EyeOpenIcon from "@atlaskit/icon/core/eye-open";
import FileIcon from "@atlaskit/icon/core/file";
import FolderClosedIcon from "@atlaskit/icon/core/folder-closed";
import FolderOpenIcon from "@atlaskit/icon/core/folder-open";
import LinkIcon from "@atlaskit/icon/core/link";
import PageIcon from "@atlaskit/icon/core/page";
import SearchIcon from "@atlaskit/icon/core/search";
import ShowMoreHorizontalIcon from "@atlaskit/icon/core/show-more-horizontal";
import StarUnstarredIcon from "@atlaskit/icon/core/star-unstarred";

import type { AgentBrowserAgent } from "@/components/blocks/agent-browser";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/ui/icon";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { SplitButton } from "@/components/ui/split-button";
import { Tile } from "@/components/ui/tile";
import {
	CardDirectory,
	CardDirectoryDescription,
	CardDirectoryFooter,
	CardDirectoryStat,
	formatCompact,
} from "@/components/ui-custom/card-directory";
import { useHasVerticalOverflow } from "@/components/hooks/use-has-vertical-overflow";
import { token } from "@/lib/tokens";
import { cn } from "@/lib/utils";

import { KnowledgeDirectorySidebar } from "./knowledge-directory-sidebar";
import {
	DEFAULT_SKILLS,
	getSkillCategoryId,
	getSkillIcon,
	getSkillPublisherAvatarSrc,
	getSkillPublisherName,
	type SkillCategory,
	type SkillIconKey,
	type KnowledgeDirectoryFileTreeItem,
	type KnowledgeDirectorySkill,
	type KnowledgeDirectoryToolTag,
} from "../data/skills";
import {
	DEFAULT_SKILLS_DIRECTORY_PRIMARY_ITEMS,
	DEFAULT_SKILLS_DIRECTORY_SIDEBAR_GROUPS,
	type KnowledgeDirectoryPrimaryItem,
	type KnowledgeDirectorySidebarGroup,
} from "../data/sidebar-groups";

export type KnowledgeDirectoryAgent = AgentBrowserAgent;
export type { KnowledgeDirectorySkill } from "../data/skills";
export type {
	KnowledgeDirectoryPrimaryItem,
	KnowledgeDirectorySidebarGroup,
} from "../data/sidebar-groups";

export interface KnowledgeDirectoryDialogProps {
	agents?: readonly KnowledgeDirectoryAgent[];
	defaultSelectedSkillIds?: readonly string[];
	onAddSkills?: (skillIds: readonly string[], skills: readonly KnowledgeDirectorySkill[]) => void;
	onCreateShareLink?: (skillIds: readonly string[], skills: readonly KnowledgeDirectorySkill[]) => void;
	onCreateSkill?: () => void;
	onDownloadSkills?: (skillIds: readonly string[], skills: readonly KnowledgeDirectorySkill[]) => void;
	onFavoriteSkills?: (skillIds: readonly string[], skills: readonly KnowledgeDirectorySkill[]) => void;
	onNewSkill?: () => void;
	onOpenChange: (open: boolean) => void;
	onOpenSkill?: (skill: KnowledgeDirectorySkill) => void;
	onSelectAgent?: (agent: KnowledgeDirectoryAgent) => void;
	onSelectedSkillIdsChange?: (skillIds: readonly string[]) => void;
	onSelectSkill?: (skill: KnowledgeDirectorySkill) => void;
	onTryInChat?: (skill: KnowledgeDirectorySkill) => void;
	open: boolean;
	primaryItems?: readonly KnowledgeDirectoryPrimaryItem[];
	selectedSkillIds?: readonly string[];
	sessionAgents?: readonly KnowledgeDirectoryAgent[];
	sessionSkills?: readonly KnowledgeDirectorySkill[];
	sidebarGroups?: readonly KnowledgeDirectorySidebarGroup[];
	skills?: readonly KnowledgeDirectorySkill[];
	title?: string;
}

const EMPTY_SKILLS: readonly KnowledgeDirectorySkill[] = [];
const EMPTY_AGENTS: readonly KnowledgeDirectoryAgent[] = [];
const PRIMARY_ITEM_ALIASES: Record<string, string> = {
	all: "all-skills",
	"my-skills": "your-skills",
};

function deriveAgentPublisher(agent: KnowledgeDirectoryAgent): string {
	const match = /\bby\s+(.+)$/i.exec(agent.byline);
	return (match?.[1] ?? agent.byline).trim();
}

function normalizeAgentSkill(agent: KnowledgeDirectoryAgent): KnowledgeDirectorySkill {
	return {
		id: agent.id,
		name: agent.name,
		description: agent.description ?? agent.byline,
		icon: "page",
		iconColor: "text-blue-500",
		publisherName: deriveAgentPublisher(agent),
		publisherAvatarSrc: agent.avatarSrc,
		companyId: agent.attributionKind === "person" || agent.attributionKind === "team" ? "you" : undefined,
		categoryId: "software-development",
		starCount: 0,
		viewCount: 0,
	};
}

function normalizeActiveItem(item: string): string {
	return PRIMARY_ITEM_ALIASES[item] ?? item;
}

function isYourSkill(skill: KnowledgeDirectorySkill): boolean {
	const publisher = getSkillPublisherName(skill).toLowerCase();
	return skill.companyId === "you" || publisher === "by you" || publisher === "you";
}

function isCategoryItem(value: string): value is SkillCategory {
	return [
		"project-management",
		"administrative-tools",
		"content-communication",
		"data-analytics",
		"software-development",
	].includes(value);
}

function filterSkills(
	skills: readonly KnowledgeDirectorySkill[],
	query: string,
	activeItem: string,
): readonly KnowledgeDirectorySkill[] {
	const normalizedQuery = query.trim().toLowerCase();
	const normalizedActiveItem = normalizeActiveItem(activeItem);

	return skills.filter((skill) => {
		if (normalizedActiveItem === "favorite-skills" && !skill.favorite) return false;
		if (normalizedActiveItem === "your-skills" && !isYourSkill(skill)) return false;
		if (isCategoryItem(normalizedActiveItem) && getSkillCategoryId(skill) !== normalizedActiveItem) return false;
		if (
			normalizedActiveItem !== "all-skills" &&
			normalizedActiveItem !== "favorite-skills" &&
			normalizedActiveItem !== "your-skills" &&
			!isCategoryItem(normalizedActiveItem) &&
			skill.companyId !== normalizedActiveItem
		) {
			return false;
		}

		if (!normalizedQuery) return true;

		const haystack = [
			skill.name,
			skill.description,
			getSkillPublisherName(skill),
			getSkillCategoryId(skill),
			skill.companyId,
			...(skill.tools ?? []).map((tool) => tool.name),
		]
			.filter(Boolean)
			.join(" ")
			.toLowerCase();

		return haystack.includes(normalizedQuery);
	});
}

function getSelectedSkills(
	skills: readonly KnowledgeDirectorySkill[],
	selectedIds: readonly string[],
): readonly KnowledgeDirectorySkill[] {
	return selectedIds
		.map((id) => skills.find((skill) => skill.id === id))
		.filter((skill): skill is KnowledgeDirectorySkill => Boolean(skill));
}

function slugifySkillName(name: string): string {
	return name.toLowerCase().replace(/[^a-z0-9]+/gu, "-").replace(/^-|-$/gu, "");
}

function getDefaultFileTree(skill: KnowledgeDirectorySkill): readonly KnowledgeDirectoryFileTreeItem[] {
	const slug = slugifySkillName(skill.name);
	return [
		{ id: "root", label: slug, kind: "folder", expanded: true },
		{ id: "skill-md", label: "SKILL.md", kind: "file", depth: 1, selected: true },
		{ id: "license", label: "LICENSE.txt", kind: "file", depth: 1 },
		{ id: "references", label: "references", kind: "folder", depth: 1 },
		{ id: "scripts", label: "scripts", kind: "folder", depth: 1 },
	];
}

function getSkillInstructions(skill: KnowledgeDirectorySkill): string {
	return skill.instructions ?? `# ${skill.name}

${skill.description}`;
}

export function KnowledgeDirectoryDialog({
	agents,
	defaultSelectedSkillIds = [],
	onAddSkills,
	onCreateShareLink,
	onCreateSkill,
	onDownloadSkills,
	onFavoriteSkills,
	onNewSkill,
	onOpenChange,
	onOpenSkill,
	onSelectAgent,
	onSelectedSkillIdsChange,
	onSelectSkill,
	onTryInChat,
	open,
	primaryItems = DEFAULT_SKILLS_DIRECTORY_PRIMARY_ITEMS,
	selectedSkillIds,
	sessionAgents = EMPTY_AGENTS,
	sessionSkills = EMPTY_SKILLS,
	sidebarGroups = DEFAULT_SKILLS_DIRECTORY_SIDEBAR_GROUPS,
	skills,
	title = "Browse all",
}: Readonly<KnowledgeDirectoryDialogProps>) {
	const baseSkills = useMemo(
		() => skills ?? agents?.map(normalizeAgentSkill) ?? DEFAULT_SKILLS,
		[agents, skills],
	);
	const agentBySkillId = useMemo(() => new Map((agents ?? EMPTY_AGENTS).map((agent) => [agent.id, agent])), [agents]);
	const normalizedSessionSkills = useMemo(
		() => [...sessionSkills, ...sessionAgents.map(normalizeAgentSkill)],
		[sessionAgents, sessionSkills],
	);
	const directorySkills = useMemo(
		() => [...baseSkills, ...normalizedSessionSkills],
		[baseSkills, normalizedSessionSkills],
	);
	const [activeItem, setActiveItem] = useState<string>(primaryItems[0]?.id ?? "all-skills");
	const [query, setQuery] = useState("");
	const [selectedDetailSkillId, setSelectedDetailSkillId] = useState<string | null>(null);
	const [uncontrolledSelectedIds, setUncontrolledSelectedIds] = useState<readonly string[]>(defaultSelectedSkillIds);
	const controlledSelection = typeof selectedSkillIds !== "undefined";
	const resolvedSelectedIds = controlledSelection ? selectedSkillIds : uncontrolledSelectedIds;
	const selectedIdSet = useMemo(() => new Set(resolvedSelectedIds), [resolvedSelectedIds]);
	const selectedSkills = useMemo(
		() => getSelectedSkills(directorySkills, resolvedSelectedIds),
		[directorySkills, resolvedSelectedIds],
	);
	const selectedDetailSkill = selectedDetailSkillId
		? directorySkills.find((skill) => skill.id === selectedDetailSkillId) ?? null
		: null;
	const filteredSkills = useMemo(
		() => filterSkills(directorySkills, query, activeItem),
		[directorySkills, query, activeItem],
	);

	function commitSelectedIds(nextIds: readonly string[]): void {
		if (!controlledSelection) {
			setUncontrolledSelectedIds(nextIds);
		}

		onSelectedSkillIdsChange?.(nextIds);
	}

	function handleOpenChange(nextOpen: boolean): void {
		if (!nextOpen) {
			setSelectedDetailSkillId(null);
		}

		onOpenChange(nextOpen);
	}

	function handleSelectSkill(skill: KnowledgeDirectorySkill, checked?: boolean): void {
		const nextSelectedIdSet = new Set(resolvedSelectedIds);
		const nextChecked = checked ?? !nextSelectedIdSet.has(skill.id);

		if (nextChecked) {
			nextSelectedIdSet.add(skill.id);
		} else {
			nextSelectedIdSet.delete(skill.id);
		}

		const nextIds = directorySkills
			.filter((candidate) => nextSelectedIdSet.has(candidate.id))
			.map((candidate) => candidate.id);

		commitSelectedIds(nextIds);
		onSelectSkill?.(skill);

		const agent = agentBySkillId.get(skill.id);
		if (agent) {
			onSelectAgent?.(agent);
		}
	}

	function handleBulkAction(
		callback?: (skillIds: readonly string[], skills: readonly KnowledgeDirectorySkill[]) => void,
	): void {
		callback?.(resolvedSelectedIds, selectedSkills);
	}

	function handleClearSelection(): void {
		commitSelectedIds([]);
	}

	const createSkillHandler = onCreateSkill ?? onNewSkill;

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent
				className="grid h-[min(800px,calc(100svh-2rem))] max-h-[calc(100svh-2rem)] grid-rows-[auto_minmax(0,1fr)] gap-0 overflow-hidden p-0 sm:max-w-[1200px]"
				showCloseButton={false}
			>
				{selectedDetailSkill ? (
					<SkillDetailHeader
						onBack={() => setSelectedDetailSkillId(null)}
						onCreateShareLink={() => handleBulkAction(onCreateShareLink)}
						onDownloadSkills={() => handleBulkAction(onDownloadSkills)}
						onFavoriteSkills={() => handleBulkAction(onFavoriteSkills)}
						onOpenSkill={() => onOpenSkill?.(selectedDetailSkill)}
						onTryInChat={() => onTryInChat?.(selectedDetailSkill)}
					/>
				) : (
					<KnowledgeDirectoryHeader
						title={title}
					/>
				)}
				{selectedDetailSkill ? (
					<SkillDetailView skill={selectedDetailSkill} />
				) : (
					<>
						<KnowledgeDirectoryView
							activeItem={activeItem}
							filteredSkills={filteredSkills}
							hasSelection={resolvedSelectedIds.length > 0}
							onLearnMore={(skill) => setSelectedDetailSkillId(skill.id)}
							onSelectItem={setActiveItem}
							onSelectSkill={handleSelectSkill}
							primaryItems={primaryItems}
							query={query}
							onCreateSkill={createSkillHandler}
							selectedIds={selectedIdSet}
							setQuery={setQuery}
							sidebarGroups={sidebarGroups}
							skills={directorySkills}
						/>
						{resolvedSelectedIds.length > 0 ? (
							<SelectedSkillsToolbar
								count={resolvedSelectedIds.length}
								onAddSkills={() => handleBulkAction(onAddSkills)}
								onClear={handleClearSelection}
								onCreateShareLink={() => handleBulkAction(onCreateShareLink)}
								onDownloadSkills={() => handleBulkAction(onDownloadSkills)}
								onFavoriteSkills={() => handleBulkAction(onFavoriteSkills)}
							/>
						) : null}
					</>
				)}
			</DialogContent>
		</Dialog>
	);
}

interface KnowledgeDirectoryHeaderProps {
	title: string;
}

function KnowledgeDirectoryHeader({ title }: Readonly<KnowledgeDirectoryHeaderProps>) {
	return (
		<div className="flex items-center justify-between border-b border-border px-6 py-6">
			<DialogTitle className="text-xl font-semibold leading-6 text-text">
				{title}
			</DialogTitle>
			<div className="flex items-center gap-2">
				<DialogClose render={<Button variant="ghost" size="icon" />}>
					<CrossIcon label="" />
					<span className="sr-only">Close</span>
				</DialogClose>
			</div>
		</div>
	);
}

interface KnowledgeDirectoryViewProps {
	activeItem: string;
	filteredSkills: readonly KnowledgeDirectorySkill[];
	hasSelection: boolean;
	onLearnMore: (skill: KnowledgeDirectorySkill) => void;
	onCreateSkill?: () => void;
	onSelectItem: (id: string) => void;
	onSelectSkill: (skill: KnowledgeDirectorySkill, checked?: boolean) => void;
	primaryItems: readonly KnowledgeDirectoryPrimaryItem[];
	query: string;
	selectedIds: ReadonlySet<string>;
	setQuery: (query: string) => void;
	sidebarGroups: readonly KnowledgeDirectorySidebarGroup[];
	skills: readonly KnowledgeDirectorySkill[];
}

function KnowledgeDirectoryView({
	activeItem,
	filteredSkills,
	hasSelection,
	onLearnMore,
	onCreateSkill,
	onSelectItem,
	onSelectSkill,
	primaryItems,
	query,
	selectedIds,
	setQuery,
	sidebarGroups,
	skills,
}: Readonly<KnowledgeDirectoryViewProps>) {
	const contentOverflow = useHasVerticalOverflow<HTMLDivElement>();

	return (
		<div className="grid min-h-0 grid-cols-1 md:grid-cols-[280px_minmax(0,1fr)]">
			<KnowledgeDirectorySidebar
				activeItem={activeItem}
				groups={sidebarGroups}
				onSelectItem={onSelectItem}
				primaryItems={primaryItems}
				skills={skills}
			/>

			<div
				ref={contentOverflow.ref}
				className={cn(
					"flex min-h-0 min-w-0 flex-col gap-3 overflow-y-auto px-6 pb-6 md:pl-4",
					hasSelection && "pb-28",
					contentOverflow.showTopScrollMask && "scroll-mask-top overscroll-contain",
				)}
			>
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

				<div className="flex items-center justify-between gap-3">
					<Button variant="outline" type="button">
						Sort by latest
						<Icon render={<ChevronDownIcon label="" size="small" color="currentColor" />} />
					</Button>
					<Button onClick={onCreateSkill} type="button">
						New skill
					</Button>
				</div>

				{filteredSkills.length === 0 ? (
					<p className="py-6 text-sm text-text-subtlest">No skills match &ldquo;{query}&rdquo;.</p>
				) : (
					<SkillSection
						onLearnMore={onLearnMore}
						onSelectSkill={onSelectSkill}
						selectedIds={selectedIds}
						skills={filteredSkills}
					/>
				)}
			</div>
		</div>
	);
}

interface SkillSectionProps {
	onLearnMore: (skill: KnowledgeDirectorySkill) => void;
	onSelectSkill: (skill: KnowledgeDirectorySkill, checked?: boolean) => void;
	selectedIds: ReadonlySet<string>;
	skills: readonly KnowledgeDirectorySkill[];
}

function SkillSection({
	onLearnMore,
	onSelectSkill,
	selectedIds,
	skills,
}: Readonly<SkillSectionProps>) {
	return (
		<section aria-label="Skills">
			<ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
				{skills.map((skill) => {
					const selected = selectedIds.has(skill.id);
					return (
						<li key={skill.id}>
							<SkillCard
								onLearnMore={() => onLearnMore(skill)}
								onSelect={(checked) => onSelectSkill(skill, checked)}
								selected={selected}
								skill={skill}
							/>
						</li>
					);
				})}
			</ul>
		</section>
	);
}

interface SkillCardProps {
	onLearnMore: () => void;
	onSelect: (checked?: boolean) => void;
	selected: boolean;
	skill: KnowledgeDirectorySkill;
}

function SkillCard({ onLearnMore, onSelect, selected, skill }: Readonly<SkillCardProps>) {
	const publisher = getSkillPublisherName(skill);
	const publisherAvatarSrc = getSkillPublisherAvatarSrc(skill);

	function stopInteractivePropagation(event: KeyboardEvent<HTMLElement> | MouseEvent<HTMLElement>): void {
		event.stopPropagation();
	}

	return (
		<CardDirectory
			className={cn(
				"min-h-[112px] gap-4 hover:border-transparent",
				selected && "border-border-selected hover:border-border-selected",
			)}
			onSelect={() => onSelect()}
			selectLabel={`${selected ? "Deselect" : "Select"} ${skill.name}`}
		>
			<div className="flex items-center gap-2">
				<Checkbox
					aria-label={`${selected ? "Deselect" : "Select"} ${skill.name}`}
					checked={selected}
					onCheckedChange={(checked) => onSelect(Boolean(checked))}
					onClick={stopInteractivePropagation}
					onKeyDown={stopInteractivePropagation}
				/>
				<div className="min-w-0 flex-1">
					<h3 className="truncate text-text" style={{ font: token("font.heading.xsmall") }}>
						{skill.name}
					</h3>
				</div>
				<SkillMoreMenu onLearnMore={onLearnMore} skillName={skill.name} />
			</div>

			<CardDirectoryDescription className="text-text">
				{skill.description}
			</CardDirectoryDescription>

			<CardDirectoryFooter className="justify-between">
				<span className="inline-flex min-w-0 items-center gap-1 text-text-subtle">
					<Image
						alt=""
						aria-hidden
						className="size-4 shrink-0 rounded-full object-cover"
						height={16}
						src={publisherAvatarSrc}
						width={16}
					/>
					<span className="truncate">{publisher}</span>
				</span>
				<span className="inline-flex shrink-0 items-center gap-4 opacity-0 transition-opacity duration-fast ease-out group-hover/card:opacity-100 group-focus-within/card:opacity-100">
					{typeof skill.starCount === "number" ? (
						<CardDirectoryStat
							icon={<StarUnstarredIcon label="" size="small" spacing="none" color="currentColor" />}
						>
							{formatCompact(skill.starCount)}
						</CardDirectoryStat>
					) : null}
					{typeof skill.viewCount === "number" ? (
						<CardDirectoryStat
							icon={<EyeOpenIcon label="" size="small" spacing="none" color="currentColor" />}
						>
							{formatCompact(skill.viewCount)}
						</CardDirectoryStat>
					) : null}
				</span>
			</CardDirectoryFooter>
		</CardDirectory>
	);
}

function SkillMoreMenu({ onLearnMore, skillName }: Readonly<{ onLearnMore: () => void; skillName: string }>) {
	function stopPropagation(event: KeyboardEvent<HTMLElement> | MouseEvent<HTMLElement>): void {
		event.stopPropagation();
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<Button
						aria-label={`More actions for ${skillName}`}
						className="size-6 shrink-0 cursor-pointer opacity-0 transition-opacity duration-fast ease-out group-hover/card:opacity-100 group-focus-within/card:opacity-100"
						onClick={stopPropagation}
						onKeyDown={stopPropagation}
						size="icon-compact"
						type="button"
						variant="ghost"
					>
						<Icon render={<ShowMoreHorizontalIcon label="" size="small" color="currentColor" />} />
					</Button>
				}
			/>
			<DropdownMenuContent align="end" onClick={stopPropagation} sideOffset={6}>
				<DropdownMenuItem
					onClick={stopPropagation}
					onSelect={(event) => {
						event.stopPropagation();
						onLearnMore();
					}}
				>
					Learn more
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

interface SelectedSkillsToolbarProps {
	count: number;
	onAddSkills: () => void;
	onClear: () => void;
	onCreateShareLink: () => void;
	onDownloadSkills: () => void;
	onFavoriteSkills: () => void;
}

function SelectedSkillsToolbar({
	count,
	onAddSkills,
	onClear,
	onCreateShareLink,
	onDownloadSkills,
	onFavoriteSkills,
}: Readonly<SelectedSkillsToolbarProps>) {
	return (
		<div className="pointer-events-none absolute inset-x-0 bottom-6 z-20 flex justify-center px-6">
			<div
				aria-label="Selected skills actions"
				aria-live="polite"
				className="pointer-events-auto flex max-w-full items-center gap-2 overflow-x-auto rounded-lg bg-surface-overlay px-4 py-2 shadow-overlay"
				role="toolbar"
			>
				<Badge>{count}</Badge>
				<span className="shrink-0 text-sm font-medium leading-5 text-text">selected</span>
				<Button onClick={onAddSkills} size="default" type="button">
					Add skills
				</Button>
				<Button onClick={onCreateShareLink} size="default" type="button" variant="ghost">
					<LinkIcon label="" />
					Create link to share
				</Button>
				<Button onClick={onFavoriteSkills} size="default" type="button" variant="ghost">
					<StarUnstarredIcon label="" />
					Favorite
				</Button>
				<Button onClick={onDownloadSkills} size="default" type="button" variant="ghost">
					<DownloadIcon label="" />
					Download
				</Button>
				<Button aria-label="Clear selected skills" onClick={onClear} size="icon" type="button" variant="ghost">
					<CrossIcon label="" />
				</Button>
			</div>
		</div>
	);
}

interface SkillDetailHeaderProps {
	onBack: () => void;
	onCreateShareLink: () => void;
	onDownloadSkills: () => void;
	onFavoriteSkills: () => void;
	onOpenSkill: () => void;
	onTryInChat: () => void;
}

function SkillDetailHeader({
	onBack,
	onCreateShareLink,
	onDownloadSkills,
	onFavoriteSkills,
	onOpenSkill,
	onTryInChat,
}: Readonly<SkillDetailHeaderProps>) {
	return (
		<div className="flex items-center justify-between border-b border-border px-6 py-4">
			<button
				type="button"
				className="flex items-center gap-2 text-xl font-semibold leading-6 text-text outline-none hover:text-text-subtle focus-visible:rounded-md focus-visible:ring-3 focus-visible:ring-ring/50"
				onClick={onBack}
			>
				<ArrowLeftIcon label="" size="small" color="currentColor" />
				Back
			</button>
			<div className="flex items-center gap-2">
				<SplitButton
					items={[
						{ label: "Open in new tab", onSelect: onOpenSkill },
						{ label: "Copy link", onSelect: onCreateShareLink },
					]}
					label="Open"
					onClick={onOpenSkill}
					variant="outline"
				/>
				<Button onClick={onTryInChat} type="button">
					Try in chat
				</Button>
				<DropdownMenu>
					<DropdownMenuTrigger
						render={
							<Button aria-label="More skill actions" size="icon" type="button" variant="outline">
								<ShowMoreHorizontalIcon label="" />
							</Button>
						}
					/>
					<DropdownMenuContent align="end" sideOffset={6}>
						<DropdownMenuItem elemBefore={<LinkIcon label="" />} onSelect={() => onCreateShareLink()}>
							Create link to share
						</DropdownMenuItem>
						<DropdownMenuItem elemBefore={<StarUnstarredIcon label="" />} onSelect={() => onFavoriteSkills()}>
							Favorite
						</DropdownMenuItem>
						<DropdownMenuItem elemBefore={<DownloadIcon label="" />} onSelect={() => onDownloadSkills()}>
							Download
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
				<DialogClose render={<Button variant="ghost" size="icon" />}>
					<CrossIcon label="" />
					<span className="sr-only">Close</span>
				</DialogClose>
			</div>
		</div>
	);
}

function SkillDetailView({ skill }: Readonly<{ skill: KnowledgeDirectorySkill }>) {
	const contentOverflow = useHasVerticalOverflow<HTMLDivElement>();

	return (
		<div className="grid min-h-0 grid-cols-1 md:grid-cols-[280px_minmax(0,1fr)]">
			<SkillFileTreeSidebar skill={skill} />
			<div
				ref={contentOverflow.ref}
				className={cn(
					"flex min-h-0 min-w-0 flex-col gap-6 overflow-y-auto px-6 pb-6 md:pl-4",
					contentOverflow.showTopScrollMask && "scroll-mask-top overscroll-contain",
				)}
			>
				<SkillDetailSummary skill={skill} />
				<SkillToolsSection tools={skill.tools ?? []} />
				<section className="flex flex-col gap-2" aria-labelledby="skill-detail-instructions">
					<h3 id="skill-detail-instructions" className="text-xl font-semibold leading-6 text-text">
						Instructions
					</h3>
					<pre className="max-h-none overflow-x-auto whitespace-pre-wrap rounded-md bg-surface-sunken p-3 font-mono text-xs leading-5 text-text">
						<code>{getSkillInstructions(skill)}</code>
					</pre>
				</section>
			</div>
		</div>
	);
}

function SkillFileTreeSidebar({ skill }: Readonly<{ skill: KnowledgeDirectorySkill }>) {
	const items = skill.fileTreeItems ?? getDefaultFileTree(skill);

	return (
		<aside className="hidden min-h-0 w-[280px] shrink-0 overflow-y-auto pl-6 pr-4 md:block">
			<nav aria-label={`${skill.name} files`} className="flex w-full flex-col">
				{items.map((item) => (
					<button
						key={item.id}
						type="button"
						className={cn(
							"relative flex h-8 w-full items-center gap-1 rounded-sm px-1 text-left text-sm leading-5 text-text-subtle outline-none hover:bg-bg-neutral-subtle-hovered focus-visible:ring-3 focus-visible:ring-ring/50",
							item.selected && "bg-bg-selected text-text-selected",
						)}
						style={{ paddingLeft: `${4 + (item.depth ?? 0) * 18}px` }}
					>
						{item.kind === "folder" ? (
							<>
								{item.expanded ? (
									<ChevronDownIcon label="" size="small" color="currentColor" />
								) : (
									<ChevronRightIcon label="" size="small" color="currentColor" />
								)}
								{item.expanded ? (
									<FolderOpenIcon label="" size="small" color="currentColor" />
								) : (
									<FolderClosedIcon label="" size="small" color="currentColor" />
								)}
							</>
						) : (
							<>
								<span className="size-4 shrink-0" />
								<FileIcon label="" size="small" color="currentColor" />
							</>
						)}
						<span className="truncate">{item.label}</span>
						{item.selected ? <span className="absolute left-0 top-1/2 h-3 w-0.5 -translate-y-1/2 bg-border-selected" /> : null}
					</button>
				))}
			</nav>
		</aside>
	);
}

function SkillDetailSummary({ skill }: Readonly<{ skill: KnowledgeDirectorySkill }>) {
	const publisher = getSkillPublisherName(skill);
	const publisherAvatarSrc = getSkillPublisherAvatarSrc(skill);

	return (
		<section className="flex flex-col gap-6" aria-labelledby="skill-detail-title">
			<div className="flex flex-col gap-2">
				<Tile
					className="rounded-lg text-icon-subtle"
					hasBorder
					isInset={false}
					label={skill.name}
					size="large"
					variant="transparent"
				>
					<span className={cn("inline-flex items-center justify-center", skill.iconColor ?? "text-icon-subtle")}>
						{getSkillIcon(skill.icon)}
					</span>
				</Tile>
				<h2 id="skill-detail-title" className="text-2xl font-semibold leading-7 text-text">
					{skill.name}
				</h2>
				<p className="flex items-center gap-1 text-xs leading-4 text-text-subtle">
					<Image
						alt=""
						aria-hidden
						className="size-4 rounded-full object-cover"
						height={16}
						src={publisherAvatarSrc}
						width={16}
					/>
					{publisher}
				</p>
			</div>
			<div className="max-w-4xl text-sm leading-5 text-text">
				<p>{skill.description}</p>
			</div>
		</section>
	);
}

function SkillToolsSection({ tools }: Readonly<{ tools: readonly KnowledgeDirectoryToolTag[] }>) {
	const resolvedTools = tools.length > 0 ? tools : [
		{ id: "tool-1", name: "Tool1", icon: "page" as SkillIconKey },
		{ id: "tool-2", name: "Tool2", icon: "page" as SkillIconKey },
		{ id: "tool-3", name: "Tool3", icon: "page" as SkillIconKey },
	];

	return (
		<section className="flex flex-col gap-2" aria-labelledby="skill-detail-tools">
			<h3 id="skill-detail-tools" className="text-xl font-semibold leading-6 text-text">
				Tools
			</h3>
			<p className="text-sm leading-5 text-text">(Placeholder copy) Tools that are part of this skills.</p>
			<div className="flex flex-wrap gap-2">
				{resolvedTools.map((tool) => (
					<span
						key={tool.id}
						className="inline-flex items-center gap-1 rounded border border-border px-1 py-0.5 text-xs leading-4 text-text"
					>
						<PageIcon label="" size="small" color="currentColor" />
						{tool.name}
					</span>
				))}
			</div>
		</section>
	);
}
