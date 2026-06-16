"use client";

// oxlint-disable react-doctor/prefer-module-scope-pure-function -- These helpers are intentionally local to the component/demo because they depend on the surrounding interaction contract.

// oxlint-disable react-doctor/jsx-no-jsx-as-prop -- These components intentionally use slot/render-node props for icons, triggers, and adornments.

import Image from "next/image";
import {
	type KeyboardEvent,
	useMemo,
	useState,
	type MouseEvent,
} from "react";
import ArrowLeftIcon from "@atlaskit/icon/core/arrow-left";
import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";
import CrossIcon from "@atlaskit/icon/core/cross";
import DownloadIcon from "@atlaskit/icon/core/download";
import LinkIcon from "@atlaskit/icon/core/link";
import PeopleGroupIcon from "@atlaskit/icon/core/people-group";
import SearchIcon from "@atlaskit/icon/core/search";
import ShowMoreHorizontalIcon from "@atlaskit/icon/core/show-more-horizontal";
import StarUnstarredIcon from "@atlaskit/icon/core/star-unstarred";

import type { AgentBrowserAgent } from "@/components/blocks/agent-browser";
import {
	Agent,
	AgentConfigFields,
	AgentContent,
} from "@/components/blocks/skill-config";
import { FileTree, FileTreeFile, FileTreeFolder } from "@/components/ui-custom/file-tree";
import {
	SkillProfileCover,
	SkillProfileMeta,
	useSkillMdDraft,
	type SkillMdDraft,
} from "./skill-md-editor";
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
import { IconTile } from "@/components/ui/icon-tile";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { AtlassianLogoMark, BrandLogoMark } from "@/components/ui/logo-mark";
import { SplitButton } from "@/components/ui/split-button";
import {
	EntityCardShell,
	EntityCardDescription,
	EntityCardFooter,
	EntityCardStat,
	formatCompact,
} from "@/components/ui-custom/entity-card";
import { useHasVerticalOverflow } from "@/components/hooks/use-has-vertical-overflow";
import { token } from "@/lib/tokens";
import { cn } from "@/lib/utils";

import {
	frontmatterValueToString,
	getFrontmatterField,
	parseSkillMd,
} from "@/app/data/directory/skill-frontmatter";
import { SkillsDirectorySidebar } from "./skills-directory-sidebar";
import {
	DEFAULT_SKILLS,
	getSkillCategoryId,
	getSkillCollection,
	getSkillCollectionId,
	getSkillIcon,
	getSkillIconTileVariant,
	getSkillMarkdown,
	getSkillPublisherAvatarSrc,
	getSkillPublisherLogoName,
	getSkillPublisherName,
	isSkillPublisherPerson,
	slugifySkillName,
	type SkillCategory,
	type SkillsDirectoryFileTreeItem,
	type SkillsDirectorySkill,
} from "@/app/data/directory/skills";
import {
	DEFAULT_SKILLS_DIRECTORY_PRIMARY_ITEMS,
	DEFAULT_SKILLS_DIRECTORY_SIDEBAR_GROUPS,
	type SkillsDirectoryPrimaryItem,
	type SkillsDirectorySidebarGroup,
} from "../data/sidebar-groups";

export type SkillsDirectoryAgent = AgentBrowserAgent;
export type { SkillsDirectorySkill } from "@/app/data/directory/skills";
export type {
	SkillsDirectoryPrimaryItem,
	SkillsDirectorySidebarGroup,
} from "../data/sidebar-groups";

export interface SkillsDirectoryDialogProps {
	agents?: readonly SkillsDirectoryAgent[];
	defaultSelectedSkillIds?: readonly string[];
	onAddSkills?: (skillIds: readonly string[], skills: readonly SkillsDirectorySkill[]) => void;
	onCreateShareLink?: (skillIds: readonly string[], skills: readonly SkillsDirectorySkill[]) => void;
	onCreateSkill?: () => void;
	onDownloadSkills?: (skillIds: readonly string[], skills: readonly SkillsDirectorySkill[]) => void;
	onFavoriteSkills?: (skillIds: readonly string[], skills: readonly SkillsDirectorySkill[]) => void;
	onNewSkill?: () => void;
	onOpenChange: (open: boolean) => void;
	onOpenSkill?: (skill: SkillsDirectorySkill) => void;
	onSelectAgent?: (agent: SkillsDirectoryAgent) => void;
	onSelectedSkillIdsChange?: (skillIds: readonly string[]) => void;
	onSelectSkill?: (skill: SkillsDirectorySkill) => void;
	onTryInChat?: (skill: SkillsDirectorySkill) => void;
	open: boolean;
	primaryItems?: readonly SkillsDirectoryPrimaryItem[];
	selectedSkillIds?: readonly string[];
	sessionAgents?: readonly SkillsDirectoryAgent[];
	sessionSkills?: readonly SkillsDirectorySkill[];
	sidebarGroups?: readonly SkillsDirectorySidebarGroup[];
	skills?: readonly SkillsDirectorySkill[];
	title?: string;
}

const EMPTY_SKILLS: readonly SkillsDirectorySkill[] = [];
const EMPTY_AGENTS: readonly SkillsDirectoryAgent[] = [];
const PRIMARY_ITEM_ALIASES: Record<string, string> = {
	all: "all-skills",
	"my-skills": "your-skills",
};

function deriveAgentPublisher(agent: SkillsDirectoryAgent): string {
	const match = /\bby\s+(.+)$/i.exec(agent.byline);
	return (match?.[1] ?? agent.byline).trim();
}

function normalizeAgentSkill(agent: SkillsDirectoryAgent): SkillsDirectorySkill {
	return {
		id: agent.id,
		name: agent.name,
		description: agent.description ?? agent.byline,
		icon: "page",
		collectionId: "software",
		publisherName: deriveAgentPublisher(agent),
		publisherAvatarSrc: agent.avatarSrc,
		companyId: agent.attributionKind === "person" || agent.attributionKind === "team" ? "you" : undefined,
		categoryId: "software-development",
		starCount: 0,
		teammateCount: 0,
	};
}

function normalizeActiveItem(item: string): string {
	return PRIMARY_ITEM_ALIASES[item] ?? item;
}

function isYourSkill(skill: SkillsDirectorySkill): boolean {
	const publisher = (skill.publisherName ?? skill.publisher ?? "").trim().toLowerCase();
	return skill.companyId === "you" || publisher === "by you" || publisher === "you";
}

function isCategoryItem(value: string): value is SkillCategory {
	return [
		"project-management",
		"administrative-tools",
		"content-and-communication",
		"data-and-analytics",
		"software-development",
		"it-support-and-service",
		"design-and-diagramming",
		"security-and-compliance",
		"hr-and-team-building",
		"sales-and-customer-relations",
	].includes(value);
}

function isCollectionItem(value: string): boolean {
	return [
		"teamwork",
		"strategy",
		"service",
		"software",
		"product",
		"platform",
		"marketplace",
		"custom",
		"default",
	].includes(value);
}

function filterSkills(
	skills: readonly SkillsDirectorySkill[],
	query: string,
	activeItem: string,
): readonly SkillsDirectorySkill[] {
	const normalizedQuery = query.trim().toLowerCase();
	const normalizedActiveItem = normalizeActiveItem(activeItem);

	return skills.filter((skill) => {
		if (normalizedActiveItem === "favorite-skills" && !skill.favorite) return false;
		if (normalizedActiveItem === "your-skills" && !isYourSkill(skill)) return false;
		if (isCollectionItem(normalizedActiveItem) && getSkillCollectionId(skill) !== normalizedActiveItem) return false;
		if (isCategoryItem(normalizedActiveItem) && getSkillCategoryId(skill) !== normalizedActiveItem) return false;
		if (
			normalizedActiveItem !== "all-skills" &&
			normalizedActiveItem !== "favorite-skills" &&
			normalizedActiveItem !== "your-skills" &&
			!isCollectionItem(normalizedActiveItem) &&
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
			getSkillCollection(skill).label,
			getSkillCollection(skill).description,
			skill.collectionDescription,
			skill.collectionProducts?.join(" "),
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
	skills: readonly SkillsDirectorySkill[],
	selectedIds: readonly string[],
): readonly SkillsDirectorySkill[] {
	return selectedIds
		.map((id) => skills.find((skill) => skill.id === id))
		.filter((skill): skill is SkillsDirectorySkill => Boolean(skill));
}

function getDefaultFileTree(skill: SkillsDirectorySkill): readonly SkillsDirectoryFileTreeItem[] {
	const slug = slugifySkillName(skill.name);
	return [
		{ id: "root", label: slug, kind: "folder", expanded: true },
		{ id: "skill-md", label: "SKILL.md", kind: "file", depth: 1, selected: true },
		{ id: "license", label: "LICENSE.txt", kind: "file", depth: 1 },
		{ id: "references", label: "references", kind: "folder", depth: 1 },
		{ id: "scripts", label: "scripts", kind: "folder", depth: 1 },
	];
}

export function SkillsDirectoryDialog({
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
}: Readonly<SkillsDirectoryDialogProps>) {
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

	function handleSelectSkill(skill: SkillsDirectorySkill, checked?: boolean): void {
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
		callback?: (skillIds: readonly string[], skills: readonly SkillsDirectorySkill[]) => void,
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
					<SkillsDirectoryHeader
						onCreateSkill={createSkillHandler}
						title={title}
					/>
				)}
				{selectedDetailSkill ? (
					<SkillDetailView skill={selectedDetailSkill} onExit={() => setSelectedDetailSkillId(null)} />
				) : (
					<>
						<SkillsDirectoryView
							activeItem={activeItem}
							filteredSkills={filteredSkills}
							hasSelection={resolvedSelectedIds.length > 0}
							onLearnMore={(skill) => setSelectedDetailSkillId(skill.id)}
							onSelectItem={setActiveItem}
							onSelectSkill={handleSelectSkill}
							primaryItems={primaryItems}
							query={query}
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

interface SkillsDirectoryHeaderProps {
	onCreateSkill?: () => void;
	title: string;
}

function SkillsDirectoryHeader({ onCreateSkill, title }: Readonly<SkillsDirectoryHeaderProps>) {
	return (
		<div className="flex items-center justify-between px-6 pt-6 pb-4">
			<DialogTitle className="text-base font-medium leading-5 text-text">
				{title}
			</DialogTitle>
			<div className="flex items-center gap-2">
				<Button onClick={onCreateSkill} type="button">
					New skill
				</Button>
				<DialogClose render={<Button variant="ghost" size="icon" />}>
					<CrossIcon label="" />
					<span className="sr-only">Close</span>
				</DialogClose>
			</div>
		</div>
	);
}

interface SkillsDirectoryViewProps {
	activeItem: string;
	filteredSkills: readonly SkillsDirectorySkill[];
	hasSelection: boolean;
	onLearnMore: (skill: SkillsDirectorySkill) => void;
	onSelectItem: (id: string) => void;
	onSelectSkill: (skill: SkillsDirectorySkill, checked?: boolean) => void;
	primaryItems: readonly SkillsDirectoryPrimaryItem[];
	query: string;
	selectedIds: ReadonlySet<string>;
	setQuery: (query: string) => void;
	sidebarGroups: readonly SkillsDirectorySidebarGroup[];
	skills: readonly SkillsDirectorySkill[];
}

function SkillsDirectoryView({
	activeItem,
	filteredSkills,
	hasSelection,
	onLearnMore,
	onSelectItem,
	onSelectSkill,
	primaryItems,
	query,
	selectedIds,
	setQuery,
	sidebarGroups,
	skills,
}: Readonly<SkillsDirectoryViewProps>) {
	const contentOverflow = useHasVerticalOverflow<HTMLDivElement>();

	return (
		<div className="grid min-h-0 grid-cols-1 md:grid-cols-[280px_minmax(0,1fr)]">
			<SkillsDirectorySidebar
				activeItem={activeItem}
				groups={sidebarGroups}
				onSelectItem={onSelectItem}
				primaryItems={primaryItems}
				skills={skills}
			/>

			<div
				ref={contentOverflow.ref}
				className={cn(
					// overflow-y-auto forces overflow-x to compute to auto, so this scroll
					// viewport clips anything painted outside its content box. pt-1 gives the
					// search input's focus ring (ring-3) room at the top; pb-8 gives the card
					// hover shadow (elevation.shadow.overlay = 0 8px 12px, ~20px reach) room at
					// the bottom so it is not clipped. px-6 already clears the ~12px side reach.
					"flex min-h-0 min-w-0 flex-col gap-3 overflow-y-auto px-6 pt-1 pb-8 md:pl-4",
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
					<p className="text-sm leading-5 text-text-subtle">
						Showing {filteredSkills.length.toLocaleString("en-US")} results
					</p>
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
	onLearnMore: (skill: SkillsDirectorySkill) => void;
	onSelectSkill: (skill: SkillsDirectorySkill, checked?: boolean) => void;
	selectedIds: ReadonlySet<string>;
	skills: readonly SkillsDirectorySkill[];
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
							<SkillsDirectoryEntityCard
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

interface SkillsDirectoryEntityCardProps {
	onLearnMore: () => void;
	onSelect: (checked?: boolean) => void;
	selected: boolean;
	skill: SkillsDirectorySkill;
}

/** Publisher avatar — brand logos use the transparent Tile sizing (components/ui/tile) via the shared logo marks; human publishers stay a rounded avatar. */
function SkillPublisherAvatar({ skill }: Readonly<{ skill: SkillsDirectorySkill }>) {
	const logoName = getSkillPublisherLogoName(skill);
	if (logoName) {
		return <AtlassianLogoMark name={logoName} size="xxsmall" transparent label={getSkillPublisherName(skill)} />;
	}

	const src = getSkillPublisherAvatarSrc(skill);
	if (!src) {
		return null;
	}

	// Human avatars are rounded circles; company brand logos use the shared
	// transparent-Tile logo mark so their inset/border treatment matches the rest
	// of the app (editor-palette, logo docs).
	if (isSkillPublisherPerson(skill)) {
		return (
			<Image
				alt=""
				aria-hidden
				className="size-4 shrink-0 rounded-full object-cover"
				height={16}
				src={src}
				width={16}
			/>
		);
	}

	return <BrandLogoMark src={src} size="xxsmall" transparent label={getSkillPublisherName(skill)} />;
}

function SkillsDirectoryEntityCard({ onLearnMore, onSelect, selected, skill }: Readonly<SkillsDirectoryEntityCardProps>) {
	const [moreMenuOpen, setMoreMenuOpen] = useState(false);
	const publisher = getSkillPublisherName(skill);

	function stopInteractivePropagation(event: KeyboardEvent<HTMLElement> | MouseEvent<HTMLElement>): void {
		event.stopPropagation();
	}

	return (
		<EntityCardShell
			active={moreMenuOpen}
			className={cn(
				"min-h-[112px] gap-4 hover:border-transparent",
				selected && "border-border-selected hover:border-border-selected",
			)}
			onSelect={() => onSelect()}
			selectLabel={`${selected ? "Deselect" : "Select"} ${skill.name}`}
		>
			<div className="flex flex-col gap-2">
				<div className="flex items-center gap-2">
					<span className="relative size-8 shrink-0">
						<span
							aria-hidden
							className={cn(
								"absolute inset-0 flex items-center justify-center transition-opacity duration-fast ease-out",
								selected
									? "opacity-0"
									: "opacity-100 group-hover/card:opacity-0",
							)}
						>
							<IconTile
								icon={getSkillIcon(skill.icon)}
								label={skill.name}
								size="medium"
								variant={getSkillIconTileVariant(skill)}
							/>
						</span>
						<Checkbox
							aria-label={`${selected ? "Deselect" : "Select"} ${skill.name}`}
							checked={selected}
							className={cn(
								"absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 transition-opacity duration-fast ease-out focus-visible:pointer-events-auto focus-visible:opacity-100",
								selected
									? "pointer-events-auto opacity-100"
									: "pointer-events-none group-hover/card:pointer-events-auto group-hover/card:opacity-100",
							)}
							onCheckedChange={(checked) => onSelect(Boolean(checked))}
							onClick={stopInteractivePropagation}
							onKeyDown={stopInteractivePropagation}
						/>
					</span>
					<div className="min-w-0 flex-1">
						<h3 className="truncate text-text" style={{ font: token("font.heading.xsmall") }}>
							{skill.name}
						</h3>
					</div>
					<SkillMoreMenu
						onLearnMore={onLearnMore}
						onOpenChange={setMoreMenuOpen}
						open={moreMenuOpen}
						skillName={skill.name}
					/>
				</div>

				<EntityCardDescription className="text-text">
					{skill.description}
				</EntityCardDescription>
			</div>

			<EntityCardFooter>
				<span className="inline-flex min-w-0 items-center gap-1 text-text-subtle">
					<SkillPublisherAvatar skill={skill} />
					<span className="truncate">{publisher}</span>
				</span>
				<span className="inline-flex shrink-0 items-center gap-4">
					{typeof skill.starCount === "number" ? (
						<EntityCardStat
							icon={<StarUnstarredIcon label="" size="small" spacing="none" color="currentColor" />}
						>
							{formatCompact(skill.starCount)}
						</EntityCardStat>
					) : null}
					{typeof skill.teammateCount === "number" ? (
						<EntityCardStat
							icon={<PeopleGroupIcon label="" size="small" spacing="none" color="currentColor" />}
						>
							Used by {formatCompact(skill.teammateCount)} teammates
						</EntityCardStat>
					) : null}
				</span>
			</EntityCardFooter>
		</EntityCardShell>
	);
}

function SkillMoreMenu({
	onLearnMore,
	onOpenChange,
	open,
	skillName,
}: Readonly<{
	onLearnMore: () => void;
	onOpenChange: (open: boolean) => void;
	open: boolean;
	skillName: string;
}>) {
	function stopPropagation(event: KeyboardEvent<HTMLElement> | MouseEvent<HTMLElement>): void {
		event.stopPropagation();
	}

	return (
		<DropdownMenu open={open} onOpenChange={onOpenChange}>
			<DropdownMenuTrigger
				render={
					<Button
						aria-label={`More actions for ${skillName}`}
						aria-pressed={open || undefined}
						className={cn(
							"size-6 shrink-0 cursor-pointer opacity-0 transition-opacity duration-fast ease-out group-hover/card:opacity-100 group-focus-within/card:opacity-100",
							open && "opacity-100",
						)}
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
			<DropdownMenuContent align="end" className="min-w-fit" onClick={stopPropagation} sideOffset={6}>
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
				style={{ boxShadow: token("elevation.shadow.overlay") }}
			>
				<Badge>{count}</Badge>
				<span className="shrink-0 text-sm font-medium leading-5 text-text">selected</span>
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
				<Button onClick={onAddSkills} size="default" type="button">
					Add skills
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
				<DialogClose render={<Button variant="ghost" size="icon" />}>
					<CrossIcon label="" />
					<span className="sr-only">Close</span>
				</DialogClose>
			</div>
		</div>
	);
}

function SkillDetailView({ skill, onExit }: Readonly<{ skill: SkillsDirectorySkill; onExit: () => void }>) {
	return <SkillDetailConfig key={skill.id} skill={skill} onExit={onExit} />;
}

const SKILL_DRAFT_KEY_PREFIX = "vpk:skill-draft:";
const SKILL_DRAFT_VERSION = 1;
const SKILL_NAME_SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;

interface StoredSkillDraft extends SkillMdDraft {
	version: number;
}

/** Load a saved draft, discarding anything from an older/unknown schema. */
function loadSkillDraft(skillId: string): SkillMdDraft | null {
	if (typeof window === "undefined") {
		return null;
	}
	try {
		const raw = window.localStorage.getItem(`${SKILL_DRAFT_KEY_PREFIX}${skillId}`);
		if (!raw) {
			return null;
		}
		const parsed = JSON.parse(raw) as Partial<StoredSkillDraft>;
		if (parsed.version !== SKILL_DRAFT_VERSION || typeof parsed.skillMd !== "string") {
			return null;
		}
		return { skillMd: parsed.skillMd, descriptionOverride: parsed.descriptionOverride ?? null };
	} catch {
		return null;
	}
}

function saveSkillDraft(skillId: string, draft: SkillMdDraft): void {
	if (typeof window === "undefined") {
		return;
	}
	try {
		const stored: StoredSkillDraft = { version: SKILL_DRAFT_VERSION, ...draft };
		window.localStorage.setItem(`${SKILL_DRAFT_KEY_PREFIX}${skillId}`, JSON.stringify(stored));
	} catch {
		// Best-effort persistence (quota / privacy mode) — a failed write just means
		// the edit isn't restored on reopen, which is acceptable for the prototype.
	}
}

/**
 * Required-field validation (per the agentskills spec): a valid SKILL.md needs a
 * slug `name` and a non-empty `description` in its frontmatter. Returns "" when valid.
 */
function validateSkillMd(skillMd: string): string {
	const { frontmatter } = parseSkillMd(skillMd);
	const name = frontmatterValueToString(getFrontmatterField(frontmatter, "name")).trim();
	const description = frontmatterValueToString(getFrontmatterField(frontmatter, "description")).trim();
	if (!name) {
		return "Add a name to the frontmatter before saving.";
	}
	if (!SKILL_NAME_SLUG_RE.test(name)) {
		return "The frontmatter name must be a lowercase slug (e.g. design-landing-page).";
	}
	if (!description) {
		return "Add a description to the frontmatter before saving.";
	}
	return "";
}

/**
 * The skill detail editor. Edits a draft of the skill's SKILL.md (rendered with
 * the in-editor frontmatter card) plus the outside name + human-friendly
 * description, committed via the Save/Cancel footer (localStorage-backed).
 *
 * State lives in the shared {@link useSkillMdDraft} hook (single source = the full
 * SKILL.md); this component layers persistence, validation, and the commit flow.
 */
function SkillDetailConfig({ skill, onExit }: Readonly<{ skill: SkillsDirectorySkill; onExit: () => void }>) {
	const initialDraft = useMemo<SkillMdDraft>(
		() => loadSkillDraft(skill.id) ?? { skillMd: getSkillMarkdown(skill), descriptionOverride: null },
		[skill],
	);
	const { config, draft, handleTextChange, getDraft } = useSkillMdDraft(skill, initialDraft);

	const dirty =
		draft.skillMd !== initialDraft.skillMd || draft.descriptionOverride !== initialDraft.descriptionOverride;
	const validationError = useMemo(() => validateSkillMd(draft.skillMd), [draft.skillMd]);

	function handleSave() {
		// Read the freshest draft from the hook's ref so a value committed on blur by
		// the same click that triggers Save isn't missed by a not-yet-flushed update.
		const current = getDraft();
		if (validateSkillMd(current.skillMd)) {
			return;
		}
		saveSkillDraft(skill.id, current);
		onExit();
	}

	function handleCancel() {
		if (dirty && typeof window !== "undefined" && !window.confirm("Discard unsaved changes to this skill?")) {
			return;
		}
		onExit();
	}

	return (
		<div className="flex min-h-0 min-w-0 flex-col overflow-hidden">
			<div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[280px_minmax(0,1fr)]">
				<SkillFileTreeSidebar skill={skill} />
				<div className="flex min-h-0 min-w-0 flex-col overflow-hidden md:pl-4">
					<Agent className="flex min-h-0 flex-1 flex-col bg-transparent">
						<AgentContent className="flex min-h-0 flex-1 flex-col">
							<AgentConfigFields
								config={config}
								idPrefix={`skill-detail-${skill.id}`}
								profileCover={<SkillProfileCover skill={skill} />}
								profileMetaSlot={<SkillProfileMeta skill={skill} />}
								showConfigToolbar={false}
								frontmatter={{ enabled: true }}
								onTextChange={handleTextChange}
							/>
						</AgentContent>
					</Agent>
				</div>
			</div>
			<div className="flex shrink-0 items-center justify-between gap-3 border-t border-border px-6 py-3">
				<p className="min-w-0 truncate text-xs leading-4 text-text-danger">{validationError}</p>
				<div className="flex shrink-0 items-center gap-2">
					<Button onClick={handleCancel} type="button" variant="outline">
						Cancel
					</Button>
					<Button disabled={Boolean(validationError)} onClick={handleSave} type="button">
						Save
					</Button>
				</div>
			</div>
		</div>
	);
}

interface SkillFileTreeNode extends SkillsDirectoryFileTreeItem {
	children: SkillFileTreeNode[];
}

/** Convert the flat, depth-tagged file list into the nested shape the FileTree compound expects. */
function buildSkillFileTree(items: readonly SkillsDirectoryFileTreeItem[]): SkillFileTreeNode[] {
	const roots: SkillFileTreeNode[] = [];
	const ancestors: SkillFileTreeNode[] = [];

	for (const item of items) {
		const depth = item.depth ?? 0;
		const node: SkillFileTreeNode = { ...item, children: [] };
		ancestors.length = depth;
		const parent = ancestors[depth - 1];

		if (parent) {
			parent.children.push(node);
		} else {
			roots.push(node);
		}

		ancestors[depth] = node;
	}

	return roots;
}

function renderSkillFileTreeNode(node: SkillFileTreeNode) {
	if (node.kind === "folder") {
		return (
			<FileTreeFolder key={node.id} name={node.label} path={node.id}>
				{node.children.map(renderSkillFileTreeNode)}
			</FileTreeFolder>
		);
	}

	return <FileTreeFile key={node.id} name={node.label} path={node.id} />;
}

function SkillFileTreeSidebar({ skill }: Readonly<{ skill: SkillsDirectorySkill }>) {
	const items = skill.fileTreeItems ?? getDefaultFileTree(skill);
	const nodes = useMemo(() => buildSkillFileTree(items), [items]);
	const defaultExpanded = useMemo(
		() => new Set(items.filter((item) => item.kind === "folder" && item.expanded).map((item) => item.id)),
		[items],
	);
	const selectedPath = items.find((item) => item.selected)?.id;

	return (
		<aside className="hidden min-h-0 w-[280px] shrink-0 overflow-y-auto pl-6 pr-4 pt-6 md:block">
			<FileTree
				aria-label={`${skill.name} files`}
				className="text-xs"
				defaultExpanded={defaultExpanded}
				selectedPath={selectedPath}
			>
				{nodes.map(renderSkillFileTreeNode)}
			</FileTree>
		</aside>
	);
}

