"use client";

import Image from "next/image";
import { type KeyboardEvent, type MouseEvent, useMemo, useState } from "react";
import { AnimatePresence, cubicBezier, motion, useReducedMotion } from "motion/react";
import AlignTextLeftIcon from "@atlaskit/icon/core/align-text-left";
import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";
import CrossIcon from "@atlaskit/icon/core/cross";
import SearchIcon from "@atlaskit/icon/core/search";
import ShowMoreHorizontalIcon from "@atlaskit/icon/core/show-more-horizontal";

import {
	AGENT_TEMPLATES_CATEGORIES,
	type AgentTemplatesAgent,
	type AgentTemplatesCategory,
	type AgentTemplatesCategoryId,
} from "@/components/blocks/agent-templates";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { AtlassianLogo, type AtlassianLogoName } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/ui/icon";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { SidebarNavItem } from "@/components/ui-custom/sidebar-nav-item";
import { Tile } from "@/components/ui/tile";
import {
	CardDirectoryAgent,
	CardDirectoryAgentExpanded,
	type CardDirectoryCapability,
} from "@/components/ui-custom/card-directory";
import { useHasVerticalOverflow } from "@/components/hooks/use-has-vertical-overflow";
import { token } from "@/lib/tokens";
import { cn } from "@/lib/utils";

export interface AgentBrowserAgent {
	id: string;
	name: string;
	byline: string;
	attributionKind?: "company" | "team" | "person";
	avatarSrc?: string;
	/** When set, renders the ADS brand logo instead of an `avatarSrc` image. */
	logoName?: AtlassianLogoName;
	description?: string;
	favorite?: boolean;
}

export interface AgentBrowserSidebarGroup {
	title: string;
	agentIds?: readonly string[];
	items?: readonly AgentBrowserSidebarItem[];
	showAll?: boolean;
}

export interface AgentBrowserSidebarItem {
	id: string;
	label: string;
	avatarSrc?: string;
	/** When set, renders the ADS brand logo instead of an `avatarSrc` image. */
	logoName?: AtlassianLogoName;
}

export interface AgentBrowserCategory {
	id: string;
	label: string;
}

export interface AgentBrowserProps {
	agents: readonly AgentBrowserAgent[];
	categories?: readonly AgentBrowserCategory[];
	templateCategories?: readonly AgentTemplatesCategory[];
	templateAgents?: readonly AgentTemplatesAgent[];
	sidebarGroups?: readonly AgentBrowserSidebarGroup[];
	/** Template category selected when the browser first mounts (e.g. open straight onto "Planning"). */
	initialTemplateCategory?: AgentTemplatesCategoryId | null;
	onSelectAgent?: (agent: AgentBrowserAgent) => void;
	onSelectTemplateAgent?: (agent: AgentTemplatesAgent) => void;
}

export interface AgentBrowserDialogProps extends AgentBrowserProps {
	onPrimaryAction?: () => void;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	primaryActionLabel?: string;
	title?: string;
}

const DEFAULT_CATEGORIES: readonly AgentBrowserCategory[] = [
	{ id: "all", label: "All" },
	{ id: "favorite-agents", label: "Favourite agents" },
	{ id: "my-agents", label: "My agents" },
] as const;
const DEFAULT_TEMPLATE_CATEGORIES = AGENT_TEMPLATES_CATEGORIES;
const EMPTY_TEMPLATE_AGENTS: readonly AgentTemplatesAgent[] = [];
const EMPTY_TEMPLATE_CAPABILITIES: readonly CardDirectoryCapability[] = [];
const AGENT_BROWSER_TEMPLATE_MAX_VISIBLE_AGENTS = 8;
const AGENT_BROWSER_TEMPLATE_TAB_EXIT_TRANSITION = {
	duration: 0.13,
	ease: cubicBezier(0.6, 0.01, 0.8, 0.6),
};
const AGENT_BROWSER_TEMPLATE_TITLE_ENTER_TRANSITION = {
	duration: 0.3,
	ease: cubicBezier(0, 0.4, 0, 1),
};
const AGENT_BROWSER_TEMPLATE_CARD_ENTER_TRANSITION = {
	type: "spring",
	bounce: 0,
	visualDuration: 0.4,
} as const;
const AGENT_BROWSER_TEMPLATE_CARD_STAGGER = 0.05;
const AGENT_BROWSER_TEMPLATE_TITLE_SWAP_OFFSET = 12;
const AGENT_BROWSER_TEMPLATE_DECK_SWAP_OFFSET = 24;
const AGENT_BROWSER_TEMPLATE_CARD_ENTER_OFFSET = 16;
const NOOP_TEMPLATE_MORE_ACTIONS = () => undefined;

type AgentBrowserTemplateMotionDirection = 1 | -1;
type AgentBrowserTemplateMotionCustom = {
	direction: AgentBrowserTemplateMotionDirection;
	shouldReduceMotion: boolean;
};

const AGENT_BROWSER_TEMPLATE_TITLE_VARIANTS = {
	enter: ({ direction, shouldReduceMotion }: AgentBrowserTemplateMotionCustom) => ({
		opacity: 0,
		transform: shouldReduceMotion ? "translateY(0px)" : `translateY(${AGENT_BROWSER_TEMPLATE_TITLE_SWAP_OFFSET * direction}px)`,
	}),
	center: {
		opacity: 1,
		transform: "translateY(0px)",
		transition: AGENT_BROWSER_TEMPLATE_TITLE_ENTER_TRANSITION,
	},
	exit: ({ direction, shouldReduceMotion }: AgentBrowserTemplateMotionCustom) => ({
		opacity: 0,
		transform: shouldReduceMotion ? "translateY(0px)" : `translateY(${-AGENT_BROWSER_TEMPLATE_TITLE_SWAP_OFFSET * direction}px)`,
		transition: AGENT_BROWSER_TEMPLATE_TAB_EXIT_TRANSITION,
	}),
} as const;

const AGENT_BROWSER_TEMPLATE_GRID_VARIANTS = {
	enter: { opacity: 1 },
	center: { opacity: 1 },
	exit: ({ direction, shouldReduceMotion }: AgentBrowserTemplateMotionCustom) => ({
		opacity: 0,
		transform: shouldReduceMotion ? "translateY(0px)" : `translateY(${-AGENT_BROWSER_TEMPLATE_DECK_SWAP_OFFSET * direction}px)`,
		transition: AGENT_BROWSER_TEMPLATE_TAB_EXIT_TRANSITION,
	}),
} as const;

function derivePublisher(byline: string): string {
	const match = /\bby\s+(.+)$/i.exec(byline);
	return (match?.[1] ?? byline).trim();
}

function isVerified(agent: AgentBrowserAgent, publisher: string): boolean {
	if (agent.attributionKind) return agent.attributionKind === "company";
	return ["atlassian", "google", "github", "slack", "notion", "figma", "canva"].includes(publisher.toLowerCase());
}

function hashString(value: string): number {
	let hash = 0;
	for (let i = 0; i < value.length; i++) {
		hash = (hash * 31 + value.charCodeAt(i)) | 0;
	}
	return Math.abs(hash);
}

function syntheticRating(id: string): number {
	const remainder = hashString(id) % 16;
	return Number((3.5 + remainder / 10).toFixed(1));
}

function syntheticChats(id: string): number {
	return 100 + (hashString(`${id}-chats`) % 9900);
}

function syntheticFeedback(id: string): number {
	return 50 + (hashString(`${id}-feedback`) % 2000);
}

function filterAgents(
	agents: readonly AgentBrowserAgent[],
	query: string,
	activeCategory: string,
): readonly AgentBrowserAgent[] {
	const normalized = query.trim().toLowerCase();
	return agents.filter((agent) => {
		if (activeCategory === "favorite-agents" && !agent.favorite) return false;
		if (!normalized) return true;

		const haystack = `${agent.name} ${agent.byline} ${agent.description ?? ""}`.toLowerCase();
		return haystack.includes(normalized);
	});
}

function filterTemplateAgents(
	agents: readonly AgentTemplatesAgent[],
	query: string,
	activeCategory: AgentTemplatesCategoryId | null,
): readonly AgentTemplatesAgent[] {
	const normalized = query.trim().toLowerCase();
	const categoryAgents = activeCategory
		? agents.filter((agent) => agent.categoryId === activeCategory)
		: agents;
	const visibleAgents = categoryAgents.length > 0 ? categoryAgents : agents;

	return visibleAgents.filter((agent) => {
		if (!normalized) return true;

		const haystack = [
			agent.name,
			agent.byline,
			agent.publisher,
			agent.description,
			agent.sources?.map((source) => source.label).join(" "),
			agent.skills?.map((skill) => skill.label).join(" "),
		].filter(Boolean).join(" ").toLowerCase();

		return haystack.includes(normalized);
	}).slice(0, AGENT_BROWSER_TEMPLATE_MAX_VISIBLE_AGENTS);
}

function getTemplateCategoryIndex(
	categories: readonly AgentTemplatesCategory[],
	categoryId: AgentTemplatesCategoryId,
): number {
	const categoryIndex = categories.findIndex((category) => category.id === categoryId);
	return categoryIndex >= 0 ? categoryIndex : 0;
}

function deriveTemplatePublisher(agent: AgentTemplatesAgent): string {
	return agent.publisher ?? derivePublisher(agent.byline);
}

function pickAgentsByIds(
	all: readonly AgentBrowserAgent[],
	ids: readonly string[] = [],
): readonly AgentBrowserAgent[] {
	return ids
		.map((id) => all.find((agent) => agent.id === id))
		.filter((agent): agent is AgentBrowserAgent => Boolean(agent));
}

function getSidebarGroupItems(
	all: readonly AgentBrowserAgent[],
	group: AgentBrowserSidebarGroup,
): readonly AgentBrowserSidebarItem[] {
	if (group.items) return group.items;
	return pickAgentsByIds(all, group.agentIds).map((agent) => ({
		id: agent.id,
		label: agent.name,
		avatarSrc: agent.avatarSrc,
		logoName: agent.logoName,
	}));
}

// Third-party app marks that ship a purpose-built, self-contained 16px tile
// (`/3p/<id>/16-borderless.svg`). On the directory card these render in a
// borderless hexagon so the artwork isn't fighting an edge. Other surfaces
// (e.g. the sidebar) keep the standard `avatarSrc` at their own size.
const BORDERLESS_HEXAGON_AGENT_IDS: ReadonlySet<string> = new Set(["google-drive", "slack", "notion"]);

function isBorderlessHexagonAgent(agent: AgentBrowserAgent): boolean {
	return BORDERLESS_HEXAGON_AGENT_IDS.has(agent.id);
}

// Swap the standard 3p logo for its borderless 16px sibling used on the card.
function getDirectoryCardAvatarSrc(agent: AgentBrowserAgent): string | undefined {
	if (isBorderlessHexagonAgent(agent)) {
		return `/3p/${agent.id}/16-borderless.svg`;
	}

	return agent.avatarSrc;
}

export function AgentBrowserDialog({
	onPrimaryAction,
	open,
	onOpenChange,
	primaryActionLabel,
	title = "Browse agents",
	...browserProps
}: Readonly<AgentBrowserDialogProps>) {
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
						{primaryActionLabel ? (
							<Button onClick={onPrimaryAction} type="button">
								{primaryActionLabel}
							</Button>
						) : null}
						<DialogClose render={<Button variant="ghost" size="icon" />}>
							<CrossIcon label="" />
							<span className="sr-only">Close</span>
						</DialogClose>
					</div>
				</div>
				<div className="min-h-0 overflow-hidden">
					<AgentBrowser {...browserProps} />
				</div>
			</DialogContent>
		</Dialog>
	);
}

export function AgentBrowser({
	agents,
	categories = DEFAULT_CATEGORIES,
	templateCategories = DEFAULT_TEMPLATE_CATEGORIES,
	templateAgents = EMPTY_TEMPLATE_AGENTS,
	sidebarGroups = [],
	initialTemplateCategory = null,
	onSelectAgent,
	onSelectTemplateAgent,
}: Readonly<AgentBrowserProps>) {
	const initialCategory = categories[0]?.id ?? "all";
	const [activeCategory, setActiveCategory] = useState<string>(initialCategory);
	const [activeTemplateCategory, setActiveTemplateCategory] = useState<AgentTemplatesCategoryId | null>(initialTemplateCategory);
	const [templateMotionDirection, setTemplateMotionDirection] = useState<AgentBrowserTemplateMotionDirection>(1);
	const [query, setQuery] = useState("");
	const shouldReduceMotion = useReducedMotion() ?? false;
	const contentOverflow = useHasVerticalOverflow<HTMLDivElement>();
	const visibleTemplateCategories = templateAgents.length > 0 ? templateCategories : [];
	const activeTemplateCategoryOption = activeTemplateCategory
		? visibleTemplateCategories.find((category) => category.id === activeTemplateCategory) ?? null
		: null;
	const templateMotionCustom = {
		direction: templateMotionDirection,
		shouldReduceMotion,
	};

	const filtered = useMemo(() => filterAgents(agents, query, activeCategory), [agents, query, activeCategory]);
	const filteredTemplates = useMemo(
		() => filterTemplateAgents(templateAgents, query, activeTemplateCategory),
		[activeTemplateCategory, query, templateAgents],
	);

	const handleSelectCategory = (category: string) => {
		setActiveTemplateCategory(null);
		setActiveCategory(category);
	};

	const handleSelectTemplateCategory = (categoryId: AgentTemplatesCategoryId) => {
		if (categoryId === activeTemplateCategory) return;

		setTemplateMotionDirection(
			activeTemplateCategory && getTemplateCategoryIndex(visibleTemplateCategories, categoryId) < getTemplateCategoryIndex(visibleTemplateCategories, activeTemplateCategory)
				? -1
				: 1,
		);
		setActiveTemplateCategory(categoryId);
	};

	return (
		<div className="grid h-full min-h-0 grid-cols-1 md:grid-cols-[280px_minmax(0,1fr)]">
			<DirectorySidebar
				categories={categories}
				activeCategory={activeCategory}
				onSelectCategory={handleSelectCategory}
				activeTemplateCategory={activeTemplateCategory}
				onSelectTemplateCategory={handleSelectTemplateCategory}
				templateCategories={visibleTemplateCategories}
				sidebarGroups={sidebarGroups}
				agents={agents}
				onSelectAgent={onSelectAgent}
			/>

			<div
				ref={contentOverflow.ref}
				className={cn(
					"flex min-h-0 min-w-0 flex-col gap-5 overflow-y-auto px-6 pb-6 md:pl-4",
					contentOverflow.showTopScrollMask && "scroll-mask-top overscroll-contain",
				)}
			>
				{activeTemplateCategoryOption ? null : (
					<InputGroup>
						<InputGroupAddon>
							<SearchIcon label="" />
						</InputGroupAddon>
						<InputGroupInput
							aria-label="Search agents"
							placeholder="Search agents"
							value={query}
							onChange={(event) => setQuery(event.target.value)}
						/>
					</InputGroup>
				)}

				<div className="flex items-center justify-between">
					{activeTemplateCategoryOption ? (
						<AnimatePresence custom={templateMotionCustom} initial={false} mode="wait">
							<motion.div
								animate="center"
								className="min-h-14 overflow-hidden text-text"
								custom={templateMotionCustom}
								exit="exit"
								initial="enter"
								key={`template-title-${activeTemplateCategoryOption.id}`}
								style={{ font: token("font.heading.medium"), willChange: "transform, opacity" }}
								variants={AGENT_BROWSER_TEMPLATE_TITLE_VARIANTS}
							>
								<TemplateCategoryTitle category={activeTemplateCategoryOption} />
							</motion.div>
						</AnimatePresence>
					) : (
						<Button variant="outline">
							Sort by popularity
							<Icon render={<ChevronDownIcon label="" size="small" color="currentColor" />} />
						</Button>
					)}
					{activeTemplateCategoryOption ? null : (
						<p className="text-sm leading-5 text-text-subtle">
							Showing {filtered.length.toLocaleString("en-US")} results
						</p>
					)}
				</div>

				{activeTemplateCategoryOption ? (
					<AnimatePresence custom={templateMotionCustom} initial={false} mode="wait">
						{filteredTemplates.length === 0 ? (
							<motion.p
								animate="center"
								className="text-sm text-text-subtlest"
								custom={templateMotionCustom}
								exit="exit"
								initial="enter"
								key={`template-empty-${activeTemplateCategoryOption.id}`}
								style={{ willChange: "transform, opacity" }}
								variants={AGENT_BROWSER_TEMPLATE_GRID_VARIANTS}
							>
								No templates match &ldquo;{query}&rdquo;.
							</motion.p>
						) : (
							<motion.section
								animate="center"
								aria-label="Agent templates"
								custom={templateMotionCustom}
								exit="exit"
								initial="enter"
								key={`templates-${activeTemplateCategoryOption.id}`}
								style={{ willChange: "transform, opacity" }}
								variants={AGENT_BROWSER_TEMPLATE_GRID_VARIANTS}
							>
								<AgentTemplateSection
									agents={filteredTemplates}
									motionCustom={templateMotionCustom}
									onSelectAgent={onSelectTemplateAgent}
								/>
							</motion.section>
						)}
					</AnimatePresence>
				) : filtered.length === 0 ? (
					<p className="text-sm text-text-subtlest" key={`agents-empty-${activeCategory}`}>
						No agents match &ldquo;{query}&rdquo;.
					</p>
				) : (
					<AgentSection agents={filtered} key={`agents-${activeCategory}`} onSelectAgent={onSelectAgent} />
				)}
			</div>
		</div>
	);
}

interface DirectorySidebarProps {
	categories: readonly AgentBrowserCategory[];
	activeCategory: string;
	onSelectCategory: (category: string) => void;
	activeTemplateCategory: AgentTemplatesCategoryId | null;
	onSelectTemplateCategory: (category: AgentTemplatesCategoryId) => void;
	templateCategories: readonly AgentTemplatesCategory[];
	sidebarGroups: readonly AgentBrowserSidebarGroup[];
	agents: readonly AgentBrowserAgent[];
	onSelectAgent?: (agent: AgentBrowserAgent) => void;
}

function DirectorySidebar({
	categories,
	activeCategory,
	onSelectCategory,
	activeTemplateCategory,
	onSelectTemplateCategory,
	templateCategories,
	sidebarGroups,
	agents,
	onSelectAgent,
}: Readonly<DirectorySidebarProps>) {
	const sidebarOverflow = useHasVerticalOverflow<HTMLElement>();

	return (
		<nav
			aria-label="Agent categories"
			className={cn(
				"hidden min-h-0 w-[280px] shrink-0 flex-col gap-5 overflow-y-auto pl-6 md:flex",
				sidebarOverflow.showTopScrollMask && "scroll-mask-top overscroll-contain",
			)}
			ref={sidebarOverflow.ref}
		>
			<ul className="flex w-64 flex-col">
				{categories.map((category) => (
					<SidebarPrimaryItem
						key={category.id}
						label={category.label}
						active={!activeTemplateCategory && activeCategory === category.id}
						onClick={() => onSelectCategory(category.id)}
					/>
				))}
			</ul>
			<SidebarTemplateGroup
				activeCategory={activeTemplateCategory}
				categories={templateCategories}
				onSelectCategory={onSelectTemplateCategory}
			/>
			{sidebarGroups.map((group) => (
				<SidebarGroup
					key={group.title}
					title={group.title}
					items={getSidebarGroupItems(agents, group)}
					agents={agents}
					onSelectAgent={onSelectAgent}
					showAll={group.showAll}
				/>
			))}
		</nav>
	);
}

function SidebarTemplateGroup({
	activeCategory,
	categories,
	onSelectCategory,
}: Readonly<{
	activeCategory: AgentTemplatesCategoryId | null;
	categories: readonly AgentTemplatesCategory[];
	onSelectCategory: (category: AgentTemplatesCategoryId) => void;
}>) {
	if (categories.length === 0) return null;

	return (
		<div className="flex w-64 flex-col gap-1.5">
			<p style={{ font: token("font.heading.xxsmall") }} className="px-1.5 text-text-subtlest">
				Agent templates
			</p>
			<ul className="flex flex-col">
				{categories.map((category) => (
					<li key={category.id}>
						<SidebarNavItem
							isSelected={activeCategory === category.id}
							label={category.label}
							leading={<SidebarTemplateIcon category={category} />}
							leadingSize="medium"
							onClick={() => onSelectCategory(category.id)}
						/>
					</li>
				))}
			</ul>
		</div>
	);
}

interface SidebarPrimaryItemProps {
	label: string;
	active: boolean;
	onClick: () => void;
}

function SidebarPrimaryItem({ label, active, onClick }: Readonly<SidebarPrimaryItemProps>) {
	return (
		<li>
			<SidebarNavItem label={label} isSelected={active} onClick={onClick} />
		</li>
	);
}

interface SidebarGroupProps {
	title: string;
	items: readonly AgentBrowserSidebarItem[];
	agents: readonly AgentBrowserAgent[];
	onSelectAgent?: (agent: AgentBrowserAgent) => void;
	showAll?: boolean;
}

function SidebarGroup({ title, items, agents, onSelectAgent, showAll = false }: Readonly<SidebarGroupProps>) {
	if (items.length === 0) return null;
	return (
		<div className="flex w-64 flex-col gap-1.5">
			<p style={{ font: token("font.heading.xxsmall") }} className="px-1.5 text-text-subtlest">
				{title}
			</p>
			<ul className="flex flex-col">
				{items.map((item) => {
					const agent = agents.find((candidate) => candidate.id === item.id);
					return (
						<li key={item.id}>
							<SidebarNavItem
								label={item.label}
								leading={<SidebarItemAvatar item={item} />}
								leadingSize="medium"
								onClick={agent ? () => onSelectAgent?.(agent) : undefined}
							/>
						</li>
					);
				})}
				{showAll ? (
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

function SidebarItemAvatar({ item }: Readonly<{ item: AgentBrowserSidebarItem }>) {
	if (item.logoName) {
		// The 3p logos carry their own rounded-square tile inside the SVG; the
		// Atlassian brand mark is transparent, so wrap it in a bordered Tile to
		// match the company rows.
		return (
			<Tile label={item.label} variant="transparent" size="small" hasBorder className="shrink-0">
				<AtlassianLogo name={item.logoName} label={item.label} size="xsmall" themeAware />
			</Tile>
		);
	}

	if (item.avatarSrc?.startsWith("/avatar-project/")) {
		return (
			<span className="flex size-6 shrink-0 items-center justify-center">
				<Avatar size="sm" shape="square" label={item.label} className="size-5">
					<AvatarImage alt="" aria-hidden src={item.avatarSrc} />
				</Avatar>
			</span>
		);
	}

	return (
		<Avatar size="sm" shape="square" className="shrink-0 after:border-0">
			{item.avatarSrc ? (
				<Image
					alt=""
					aria-hidden
					className="size-full object-contain"
					height={24}
					src={item.avatarSrc}
					width={24}
				/>
			) : null}
		</Avatar>
	);
}

function SidebarTemplateIcon({ category }: Readonly<{ category: AgentTemplatesCategory }>) {
	return (
		<span aria-hidden className="flex size-6 shrink-0 items-center justify-center">
			<Image
				alt=""
				className={cn("size-6 object-contain", category.iconClassName)}
				height={24}
				src={category.iconSrc}
				width={24}
			/>
		</span>
	);
}

function TemplateCategoryTitle({ category }: Readonly<{ category: AgentTemplatesCategory }>) {
	return (
		<>
			<span className="block">{category.titleLines[0]}</span>
			<span className="block text-text-subtlest">{category.titleLines[1]}</span>
		</>
	);
}

interface AgentSectionProps {
	agents: readonly AgentBrowserAgent[];
	onSelectAgent?: (agent: AgentBrowserAgent) => void;
}

function AgentSection({ agents, onSelectAgent }: Readonly<AgentSectionProps>) {
	return (
		<section aria-label="Agents">
			<ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
				{agents.map((agent) => {
					const publisher = derivePublisher(agent.byline);
					return (
						<li key={agent.id}>
							<AgentCard
								agent={agent}
								onSelectAgent={onSelectAgent}
								publisher={publisher}
							/>
						</li>
					);
				})}
			</ul>
		</section>
	);
}

interface AgentTemplateSectionProps {
	agents: readonly AgentTemplatesAgent[];
	motionCustom: AgentBrowserTemplateMotionCustom;
	onSelectAgent?: (agent: AgentTemplatesAgent) => void;
}

function AgentTemplateSection({
	agents,
	motionCustom,
	onSelectAgent,
}: Readonly<AgentTemplateSectionProps>) {
	return (
		<ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
			{agents.map((agent, index) => (
				<motion.li
					animate={{ opacity: 1, transform: "translateY(0px)" }}
					className="h-[400px] [will-change:transform,opacity]"
					initial={{
						opacity: 0,
						transform: motionCustom.shouldReduceMotion ? "translateY(0px)" : `translateY(${motionCustom.direction * AGENT_BROWSER_TEMPLATE_CARD_ENTER_OFFSET}px)`,
					}}
					key={agent.id}
					transition={{
						...AGENT_BROWSER_TEMPLATE_CARD_ENTER_TRANSITION,
						delay: motionCustom.shouldReduceMotion ? 0 : index * AGENT_BROWSER_TEMPLATE_CARD_STAGGER,
					}}
				>
					<AgentTemplateCard
						agent={agent}
						onSelectAgent={onSelectAgent}
					/>
				</motion.li>
			))}
		</ul>
	);
}

function AgentTemplateCard({
	agent,
	onSelectAgent,
}: Readonly<{
	agent: AgentTemplatesAgent;
	onSelectAgent?: (agent: AgentTemplatesAgent) => void;
}>) {
	return (
		<CardDirectoryAgentExpanded
			attributionKind={agent.attributionKind}
			avatarSrc={agent.avatarSrc}
			capabilities={agent.capabilities ?? EMPTY_TEMPLATE_CAPABILITIES}
			className="h-full w-full"
			collaboratorOverflow={agent.collaboratorOverflow}
			collaborators={agent.collaborators}
			description={agent.description}
			name={agent.name}
			onMoreActions={NOOP_TEMPLATE_MORE_ACTIONS}
			onSelect={onSelectAgent ? () => onSelectAgent(agent) : undefined}
			publisher={deriveTemplatePublisher(agent)}
			publisherLogoSrc={agent.publisherLogoSrc}
			skills={agent.skills}
			sources={agent.sources}
			stats={agent.stats}
			verified={agent.verified}
		/>
	);
}

interface AgentCardProps {
	agent: AgentBrowserAgent;
	onSelectAgent?: (agent: AgentBrowserAgent) => void;
	publisher: string;
}

function AgentCard({ agent, onSelectAgent, publisher }: Readonly<AgentCardProps>) {
	const [moreMenuOpen, setMoreMenuOpen] = useState(false);
	const selectAgent = onSelectAgent ? () => onSelectAgent(agent) : undefined;

	return (
		<CardDirectoryAgent
			active={moreMenuOpen}
			avatarSrc={getDirectoryCardAvatarSrc(agent)}
			insetLogo={isBorderlessHexagonAgent(agent)}
			chatCount={syntheticChats(agent.id)}
			className="hover:border-transparent"
			description={agent.description}
			feedbackCount={syntheticFeedback(agent.id)}
			logoName={agent.logoName}
			moreAction={
				<DirectoryCardMoreMenu
					label={`More actions for ${agent.name}`}
					onLearnMore={selectAgent}
					onOpenChange={setMoreMenuOpen}
					open={moreMenuOpen}
				/>
			}
			name={agent.name}
			onSelect={selectAgent}
			publisher={publisher}
			rating={syntheticRating(agent.id)}
			verified={isVerified(agent, publisher)}
		/>
	);
}

interface DirectoryCardMoreMenuProps {
	label: string;
	onLearnMore?: () => void;
	onOpenChange: (open: boolean) => void;
	open: boolean;
}

function DirectoryCardMoreMenu({
	label,
	onLearnMore,
	onOpenChange,
	open,
}: Readonly<DirectoryCardMoreMenuProps>) {
	function stopPropagation(event: KeyboardEvent<HTMLElement> | MouseEvent<HTMLElement>): void {
		event.stopPropagation();
	}

	return (
		<DropdownMenu open={open} onOpenChange={onOpenChange}>
			<DropdownMenuTrigger
				render={
					<Button
						aria-label={label}
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
			<DropdownMenuContent align="end" onClick={stopPropagation} sideOffset={6}>
				<DropdownMenuItem
					onClick={stopPropagation}
					onSelect={(event) => {
						event.stopPropagation();
						onLearnMore?.();
					}}
				>
					Learn more
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
