"use client";

import Image from "next/image";
import { type KeyboardEvent, type MouseEvent, useMemo, useState } from "react";
import AlignTextLeftIcon from "@atlaskit/icon/core/align-text-left";
import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";
import CrossIcon from "@atlaskit/icon/core/cross";
import SearchIcon from "@atlaskit/icon/core/search";
import ShowMoreHorizontalIcon from "@atlaskit/icon/core/show-more-horizontal";

import { Avatar, AvatarImage } from "@/components/ui/avatar";
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
import { AtlassianLogo, isAtlassianLogoSource } from "@/components/ui/logo";
import { SidebarNavItem } from "@/components/ui-custom/sidebar-nav-item";
import { CardDirectoryAgent } from "@/components/ui-custom/card-directory";
import { useHasVerticalOverflow } from "@/components/hooks/use-has-vertical-overflow";
import { token } from "@/lib/tokens";
import { cn } from "@/lib/utils";

export interface AgentBrowserAgent {
	id: string;
	name: string;
	byline: string;
	attributionKind?: "company" | "team" | "person";
	avatarSrc: string;
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
	avatarSrc: string;
}

export interface AgentBrowserCategory {
	id: string;
	label: string;
}

export interface AgentBrowserProps {
	agents: readonly AgentBrowserAgent[];
	categories?: readonly AgentBrowserCategory[];
	sidebarGroups?: readonly AgentBrowserSidebarGroup[];
	onSelectAgent?: (agent: AgentBrowserAgent) => void;
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
	}));
}

function getDirectoryCardAvatarClassName(agent: AgentBrowserAgent): string {
	if (agent.id === "google-drive" || agent.id === "slack") {
		return "size-full scale-85 object-contain";
	}

	return "size-full object-contain";
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
	sidebarGroups = [],
	onSelectAgent,
}: Readonly<AgentBrowserProps>) {
	const initialCategory = categories[0]?.id ?? "all";
	const [activeCategory, setActiveCategory] = useState<string>(initialCategory);
	const [query, setQuery] = useState("");
	const contentOverflow = useHasVerticalOverflow<HTMLDivElement>();

	const filtered = useMemo(() => filterAgents(agents, query, activeCategory), [agents, query, activeCategory]);

	return (
		<div className="grid h-full min-h-0 grid-cols-1 md:grid-cols-[280px_minmax(0,1fr)]">
			<DirectorySidebar
				categories={categories}
				activeCategory={activeCategory}
				onSelectCategory={setActiveCategory}
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

				<div className="flex items-center justify-between">
					<Button variant="outline">
						Sort by popularity
						<Icon render={<ChevronDownIcon label="" size="small" color="currentColor" />} />
					</Button>
					<p className="text-sm leading-5 text-text-subtle">
						Showing {filtered.length.toLocaleString("en-US")} results
					</p>
				</div>

				{filtered.length === 0 ? (
					<p className="text-sm text-text-subtlest">No agents match &ldquo;{query}&rdquo;.</p>
				) : (
					<AgentSection agents={filtered} onSelectAgent={onSelectAgent} />
				)}
			</div>
		</div>
	);
}

interface DirectorySidebarProps {
	categories: readonly AgentBrowserCategory[];
	activeCategory: string;
	onSelectCategory: (category: string) => void;
	sidebarGroups: readonly AgentBrowserSidebarGroup[];
	agents: readonly AgentBrowserAgent[];
	onSelectAgent?: (agent: AgentBrowserAgent) => void;
}

function DirectorySidebar({
	categories,
	activeCategory,
	onSelectCategory,
	sidebarGroups,
	agents,
	onSelectAgent,
}: Readonly<DirectorySidebarProps>) {
	return (
		<nav aria-label="Agent categories" className="hidden min-h-0 w-[280px] shrink-0 flex-col gap-5 overflow-y-auto pl-6 md:flex">
			<ul className="flex w-64 flex-col">
				{categories.map((category) => (
					<SidebarPrimaryItem
						key={category.id}
						label={category.label}
						active={activeCategory === category.id}
						onClick={() => onSelectCategory(category.id)}
					/>
				))}
			</ul>
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
	if (isAtlassianLogoSource(item.avatarSrc)) {
		return (
			<span className="flex size-6 shrink-0 items-center justify-center">
				<AtlassianLogo name="atlassian" label={item.label} size="small" />
			</span>
		);
	}

	if (item.avatarSrc.startsWith("/avatar-project/")) {
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
			<Image
				alt=""
				aria-hidden
				className="size-full object-contain"
				height={24}
				src={item.avatarSrc}
				width={24}
			/>
		</Avatar>
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
			avatarImageClassName={getDirectoryCardAvatarClassName(agent)}
			avatarSrc={agent.avatarSrc}
			chatCount={syntheticChats(agent.id)}
			className="hover:border-transparent"
			description={agent.description}
			feedbackCount={syntheticFeedback(agent.id)}
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
