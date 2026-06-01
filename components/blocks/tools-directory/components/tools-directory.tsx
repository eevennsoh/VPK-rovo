"use client";

import Image from "next/image";
import { useMemo, useState, type ReactNode } from "react";
import AngleBracketsIcon from "@atlaskit/icon/core/angle-brackets";
import ArrowLeftIcon from "@atlaskit/icon/core/arrow-left";
import BranchIcon from "@atlaskit/icon/core/branch";
import ChartTrendUpIcon from "@atlaskit/icon/core/chart-trend-up";
import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";
import CrossIcon from "@atlaskit/icon/core/cross";
import DeleteIcon from "@atlaskit/icon/core/delete";
import EditIcon from "@atlaskit/icon/core/edit";
import EmailIcon from "@atlaskit/icon/core/email";
import GlobeIcon from "@atlaskit/icon/core/globe";
import PeopleGroupIcon from "@atlaskit/icon/core/people-group";
import SearchIcon from "@atlaskit/icon/core/search";
import SettingsIcon from "@atlaskit/icon/core/settings";
import ShieldIcon from "@atlaskit/icon/core/shield";
import StatusVerifiedIcon from "@atlaskit/icon/core/status-verified";
import SupportIcon from "@atlaskit/icon/core/support";
import TimelineIcon from "@atlaskit/icon/core/timeline";
import CartIcon from "@atlaskit/icon-lab/core/cart";

import type {
	AgentBrowserAgent,
	AgentBrowserSidebarGroup,
	AgentBrowserSidebarItem,
} from "@/components/blocks/agent-browser";
import { TOOLS_DIRECTORY_CATEGORIES } from "@/components/blocks/tools-directory/data/categories";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Icon } from "@/components/ui/icon";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { AtlassianLogo, type AtlassianLogoName } from "@/components/ui/logo";
import { Switch } from "@/components/ui/switch";
import { Tile } from "@/components/ui/tile";
import { CardDirectoryTool } from "@/components/ui-custom/card-directory";
import { SidebarNavItem } from "@/components/ui-custom/sidebar-nav-item";
import { useHasVerticalOverflow } from "@/components/hooks/use-has-vertical-overflow";
import { token } from "@/lib/tokens";
import { cn } from "@/lib/utils";

export interface ToolsDirectoryPermission {
	id: string;
	name: string;
	description: string;
	enabled?: boolean;
	disabled?: boolean;
}

export interface ToolsDirectoryTool extends AgentBrowserAgent {
	categoryId?: string;
	lastUpdatedLabel?: string;
	logoName?: AtlassianLogoName;
	logoSrc?: string;
	publisherName?: string;
	readOnlyTools?: readonly ToolsDirectoryPermission[];
	teammateCount?: number;
	toolCount?: number;
	verified?: boolean;
	writeDeleteTools?: readonly ToolsDirectoryPermission[];
}

export type ToolsDirectorySidebarGroup = AgentBrowserSidebarGroup;

export interface ToolsDirectoryDialogProps {
	addedToolIds?: readonly string[];
	defaultAddedToolIds?: readonly string[];
	onAddedToolIdsChange?: (toolIds: readonly string[]) => void;
	onCreateTool?: () => void;
	onOpenChange: (open: boolean) => void;
	onSelectTool?: (tool: ToolsDirectoryTool) => void;
	open: boolean;
	sessionTools?: readonly ToolsDirectoryTool[];
	sidebarGroups?: readonly ToolsDirectorySidebarGroup[];
	title?: string;
	tools: readonly ToolsDirectoryTool[];
}

const EMPTY_TOOLS_DIRECTORY_TOOLS: readonly ToolsDirectoryTool[] = [];
const EMPTY_TOOLS_DIRECTORY_SIDEBAR_GROUPS: readonly ToolsDirectorySidebarGroup[] = [];

const PRIMARY_CATEGORIES = [
	{ id: "all", label: "All" },
	{ id: "my-tools", label: "My tools" },
] as const;

const DEFAULT_READ_ONLY_TOOLS: readonly ToolsDirectoryPermission[] = [
	{
		id: "search-projects",
		name: "Search projects",
		description: "Find project plans, issues, and related work.",
	},
	{
		id: "read-pages",
		name: "Read pages",
		description: "Retrieve documentation and decision records.",
	},
	{
		id: "inspect-analytics",
		name: "Inspect analytics",
		description: "Review dashboard data without making changes.",
	},
	{
		id: "list-users",
		name: "List users",
		description: "View teammates and group membership.",
		enabled: false,
	},
] as const;

const DEFAULT_WRITE_DELETE_TOOLS: readonly ToolsDirectoryPermission[] = [
	{
		id: "create-tasks",
		name: "Create tasks",
		description: "Open new tasks from approved requests.",
	},
	{
		id: "update-status",
		name: "Update status",
		description: "Move work between tracked phases.",
	},
	{
		id: "comment-on-work",
		name: "Comment on work",
		description: "Add context to issues and documents.",
	},
	{
		id: "assign-owners",
		name: "Assign owners",
		description: "Route work to responsible teammates.",
	},
	{
		id: "create-pages",
		name: "Create pages",
		description: "Draft team documentation.",
	},
	{
		id: "update-fields",
		name: "Update fields",
		description: "Change configured project fields.",
	},
	{
		id: "send-notifications",
		name: "Send notifications",
		description: "Notify teams about important updates.",
	},
	{
		id: "delete-drafts",
		name: "Delete drafts",
		description: "Remove temporary drafts when they are no longer needed.",
		enabled: false,
	},
] as const;

const CATEGORY_ICON_RENDERERS: Record<string, (label: string) => ReactNode> = {
	"project-management": (label) => <TimelineIcon label={label} size="small" color="currentColor" />,
	"administrative-tools": (label) => <SettingsIcon label={label} size="small" color="currentColor" />,
	"content-and-communication": (label) => <EditIcon label={label} size="small" color="currentColor" />,
	"data-and-analytics": (label) => <ChartTrendUpIcon label={label} size="small" color="currentColor" />,
	"software-development": (label) => <AngleBracketsIcon label={label} size="small" color="currentColor" />,
	"it-support-and-service": (label) => <SupportIcon label={label} size="small" color="currentColor" />,
	"design-and-diagramming": (label) => <BranchIcon label={label} size="small" color="currentColor" />,
	"security-and-compliance": (label) => <ShieldIcon label={label} size="small" color="currentColor" />,
	"hr-and-team-building": (label) => <PeopleGroupIcon label={label} size="small" color="currentColor" />,
	"sales-and-customer-relations": (label) => <CartIcon label={label} size="small" color="currentColor" />,
};

function derivePublisher(tool: ToolsDirectoryTool): string {
	if (tool.publisherName) return tool.publisherName;

	const match = /\bby\s+(.+)$/i.exec(tool.byline);
	return (match?.[1] ?? tool.byline).trim();
}

function isVerifiedTool(tool: ToolsDirectoryTool, publisher: string): boolean {
	if (typeof tool.verified === "boolean") return tool.verified;
	if (tool.attributionKind) return tool.attributionKind === "company";
	return ["atlassian", "google", "github", "slack", "notion", "figma", "canva"].includes(publisher.toLowerCase());
}

function filterTools(
	tools: readonly ToolsDirectoryTool[],
	query: string,
	activeCategory: string,
	addedIds: ReadonlySet<string>,
): readonly ToolsDirectoryTool[] {
	const normalizedQuery = query.trim().toLowerCase();

	return tools.filter((tool) => {
		if (activeCategory === "my-tools" && !addedIds.has(tool.id)) return false;
		if (
			activeCategory !== "all" &&
			activeCategory !== "my-tools" &&
			tool.categoryId !== activeCategory
		) {
			return false;
		}

		if (!normalizedQuery) return true;

		const category = TOOLS_DIRECTORY_CATEGORIES.find((item) => item.id === tool.categoryId);
		const haystack = [
			tool.name,
			tool.byline,
			tool.description,
			tool.publisherName,
			category?.label,
			category?.description,
		]
			.filter(Boolean)
			.join(" ")
			.toLowerCase();

		return haystack.includes(normalizedQuery);
	});
}

function getSidebarGroupItems(
	all: readonly ToolsDirectoryTool[],
	group: ToolsDirectorySidebarGroup,
): readonly AgentBrowserSidebarItem[] {
	if (group.items) return group.items;

	return (group.agentIds ?? [])
		.map((id) => all.find((tool) => tool.id === id))
		.filter((tool): tool is ToolsDirectoryTool => Boolean(tool))
		.map((tool) => ({
			id: tool.id,
			label: tool.name,
			avatarSrc: tool.avatarSrc,
		}));
}

function getToolLogo(tool: ToolsDirectoryTool): ReactNode {
	return (
		<Image
			alt=""
			aria-hidden
			className="size-full object-contain"
			height={24}
			src={tool.logoSrc ?? tool.avatarSrc}
			width={24}
		/>
	);
}

function getDetailLogo(tool: ToolsDirectoryTool): ReactNode {
	if (tool.logoName || tool.id === "atlassian") {
		return (
			<AtlassianLogo
				label={tool.name}
				name={tool.logoName ?? "atlassian"}
				size="xlarge"
				themeAware
			/>
		);
	}

	return (
		<Image
			alt=""
			aria-hidden
			className="size-16 object-contain"
			height={64}
			src={tool.logoSrc ?? tool.avatarSrc}
			width={64}
		/>
	);
}

function getPermissionGroups(tool: ToolsDirectoryTool) {
	return [
		{
			id: "read-only",
			label: "Read-only tools",
			permissions: tool.readOnlyTools ?? DEFAULT_READ_ONLY_TOOLS,
		},
		{
			id: "write-delete",
			label: "Write / Delete tools",
			permissions: tool.writeDeleteTools ?? DEFAULT_WRITE_DELETE_TOOLS,
		},
	] as const;
}

export function ToolsDirectoryDialog({
	addedToolIds,
	defaultAddedToolIds = [],
	onAddedToolIdsChange,
	onCreateTool,
	onOpenChange,
	onSelectTool,
	open,
	sessionTools = EMPTY_TOOLS_DIRECTORY_TOOLS,
	sidebarGroups = EMPTY_TOOLS_DIRECTORY_SIDEBAR_GROUPS,
	title,
	tools,
}: Readonly<ToolsDirectoryDialogProps>) {
	const directoryTools = useMemo(
		() => [...tools, ...sessionTools],
		[tools, sessionTools],
	);
	const [activeCategory, setActiveCategory] = useState<string>("all");
	const [query, setQuery] = useState("");
	const [selectedToolId, setSelectedToolId] = useState<string | null>(null);
	const [uncontrolledAddedToolIds, setUncontrolledAddedToolIds] = useState<ReadonlySet<string>>(
		() => new Set(defaultAddedToolIds),
	);
	const [permissionSelections, setPermissionSelections] = useState<Record<string, Record<string, boolean>>>({});
	const controlledAddedIds = typeof addedToolIds !== "undefined";
	const addedIds = useMemo(
		() => new Set(controlledAddedIds ? addedToolIds : uncontrolledAddedToolIds),
		[addedToolIds, controlledAddedIds, uncontrolledAddedToolIds],
	);
	const selectedTool = selectedToolId
		? directoryTools.find((tool) => tool.id === selectedToolId) ?? null
		: null;
	const filteredTools = useMemo(
		() => filterTools(directoryTools, query, activeCategory, addedIds),
		[directoryTools, query, activeCategory, addedIds],
	);

	function commitAddedToolIds(nextAddedIds: ReadonlySet<string>): void {
		if (!controlledAddedIds) {
			setUncontrolledAddedToolIds(nextAddedIds);
		}

		onAddedToolIdsChange?.([...nextAddedIds]);
	}

	function handleOpenChange(nextOpen: boolean): void {
		if (!nextOpen) {
			setSelectedToolId(null);
		}

		onOpenChange(nextOpen);
	}

	function handleSelectTool(tool: ToolsDirectoryTool): void {
		setSelectedToolId(tool.id);
		onSelectTool?.(tool);
	}

	function handleAddTool(tool: ToolsDirectoryTool): void {
		const nextAddedIds = new Set(addedIds);
		nextAddedIds.add(tool.id);
		commitAddedToolIds(nextAddedIds);
	}

	function handleRemoveTool(tool: ToolsDirectoryTool): void {
		const nextAddedIds = new Set(addedIds);
		nextAddedIds.delete(tool.id);
		commitAddedToolIds(nextAddedIds);
	}

	function setPermission(tool: ToolsDirectoryTool, permissionId: string, checked: boolean): void {
		setPermissionSelections((current) => ({
			...current,
			[tool.id]: {
				...current[tool.id],
				[permissionId]: checked,
			},
		}));
	}

	function checkPermissionGroup(tool: ToolsDirectoryTool, permissions: readonly ToolsDirectoryPermission[]): void {
		setPermissionSelections((current) => {
			const toolSelections = { ...current[tool.id] };

			for (const permission of permissions) {
				toolSelections[permission.id] = true;
			}

			return {
				...current,
				[tool.id]: toolSelections,
			};
		});
	}

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent
				className="grid h-[min(768px,calc(100svh-2rem))] !max-w-[calc(100vw-2rem)] max-h-[calc(100svh-2rem)] grid-rows-[auto_minmax(0,1fr)] gap-0 overflow-hidden p-0 sm:!max-w-[1200px]"
				showCloseButton={false}
			>
				<ToolsDirectoryHeader
					title={title ?? "Browse tools"}
					onCreateTool={onCreateTool}
				/>
				{selectedTool ? (
					<ToolDetailView
						added={addedIds.has(selectedTool.id)}
						onAddTool={() => handleAddTool(selectedTool)}
						onBack={() => setSelectedToolId(null)}
						onCheckGroup={(permissions) => checkPermissionGroup(selectedTool, permissions)}
						onPermissionChange={(permissionId, checked) => setPermission(selectedTool, permissionId, checked)}
						onRemoveTool={() => handleRemoveTool(selectedTool)}
						permissionSelections={permissionSelections[selectedTool.id] ?? {}}
						tool={selectedTool}
					/>
				) : (
					<ToolsDirectoryView
						activeCategory={activeCategory}
						addedIds={addedIds}
						filteredTools={filteredTools}
						onSelectCategory={setActiveCategory}
						onSelectTool={handleSelectTool}
						query={query}
						setQuery={setQuery}
						sidebarGroups={sidebarGroups}
						tools={directoryTools}
					/>
				)}
			</DialogContent>
		</Dialog>
	);
}

interface ToolsDirectoryHeaderProps {
	onCreateTool?: () => void;
	title: string;
}

function ToolsDirectoryHeader({ onCreateTool, title }: Readonly<ToolsDirectoryHeaderProps>) {
	return (
		<div className="flex items-center justify-between px-6 py-6">
			<DialogTitle className="text-xl font-semibold leading-6 text-text">
				{title}
			</DialogTitle>
			<div className="flex items-center gap-2">
				<Button onClick={onCreateTool} type="button">
					New tool
				</Button>
				<DialogClose render={<Button variant="ghost" size="icon" />}>
					<CrossIcon label="" />
					<span className="sr-only">Close</span>
				</DialogClose>
			</div>
		</div>
	);
}

interface ToolsDirectoryViewProps {
	activeCategory: string;
	addedIds: ReadonlySet<string>;
	filteredTools: readonly ToolsDirectoryTool[];
	onSelectCategory: (categoryId: string) => void;
	onSelectTool: (tool: ToolsDirectoryTool) => void;
	query: string;
	setQuery: (query: string) => void;
	sidebarGroups: readonly ToolsDirectorySidebarGroup[];
	tools: readonly ToolsDirectoryTool[];
}

function ToolsDirectoryView({
	activeCategory,
	addedIds,
	filteredTools,
	onSelectCategory,
	onSelectTool,
	query,
	setQuery,
	sidebarGroups,
	tools,
}: Readonly<ToolsDirectoryViewProps>) {
	const contentOverflow = useHasVerticalOverflow<HTMLDivElement>();

	return (
		<div className="grid min-h-0 grid-cols-1 md:grid-cols-[280px_minmax(0,1fr)]">
			<ToolsDirectorySidebar
				activeCategory={activeCategory}
				addedIds={addedIds}
				onSelectCategory={onSelectCategory}
				onSelectTool={onSelectTool}
				sidebarGroups={sidebarGroups}
				tools={tools}
			/>
			<div
				ref={contentOverflow.ref}
				className={cn(
					"flex min-h-0 min-w-0 flex-col gap-3 overflow-y-auto px-6 pb-6 md:pl-4",
					contentOverflow.showTopScrollMask && "scroll-mask-top overscroll-contain",
				)}
			>
				<InputGroup>
					<InputGroupAddon>
						<SearchIcon label="" />
					</InputGroupAddon>
					<InputGroupInput
						aria-label="Search tools"
						placeholder="Search for a tool by name, or describe it"
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
						Showing {filteredTools.length.toLocaleString("en-US")} results
					</p>
				</div>
				{filteredTools.length === 0 ? (
					<p className="py-6 text-sm text-text-subtlest">
						No tools match &ldquo;{query}&rdquo;.
					</p>
				) : (
					<ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
						{filteredTools.map((tool) => (
							<li key={tool.id}>
								<CardDirectoryTool
									appLogo={getToolLogo(tool)}
									className="min-h-[102px] hover:border-transparent"
									description={tool.description ?? "Short description about the app."}
									name={tool.name}
									onSelect={() => onSelectTool(tool)}
									teammateCount={tool.teammateCount ?? 258}
									toolCount={tool.toolCount ?? 36}
								/>
							</li>
						))}
					</ul>
				)}
			</div>
		</div>
	);
}

interface ToolsDirectorySidebarProps {
	activeCategory: string;
	addedIds: ReadonlySet<string>;
	onSelectCategory: (categoryId: string) => void;
	onSelectTool: (tool: ToolsDirectoryTool) => void;
	sidebarGroups: readonly ToolsDirectorySidebarGroup[];
	tools: readonly ToolsDirectoryTool[];
}

function ToolsDirectorySidebar({
	activeCategory,
	addedIds,
	onSelectCategory,
	onSelectTool,
	sidebarGroups,
	tools,
}: Readonly<ToolsDirectorySidebarProps>) {
	return (
		<nav
			aria-label="Tool categories"
			className="hidden min-h-0 w-[280px] shrink-0 flex-col overflow-y-auto pl-6 md:flex"
		>
			<ul className="flex w-64 flex-col">
				{PRIMARY_CATEGORIES.map((category) => (
					<li key={category.id}>
						<SidebarNavItem
							isSelected={activeCategory === category.id}
							label={category.label}
							onClick={() => onSelectCategory(category.id)}
						/>
					</li>
				))}
			</ul>
			<div className="h-3 w-64 shrink-0" />
			<div className="w-64 py-2 pl-1.5">
				<p className="text-text-subtlest" style={{ font: token("font.heading.xxsmall") }}>
					Category
				</p>
			</div>
			<ul className="flex w-64 flex-col">
				{TOOLS_DIRECTORY_CATEGORIES.map((category) => (
					<li key={category.id}>
						<SidebarNavItem
							isSelected={activeCategory === category.id}
							label={category.label}
							leading={CATEGORY_ICON_RENDERERS[category.id]?.(category.label)}
							leadingSize="medium"
							onClick={() => onSelectCategory(category.id)}
						/>
					</li>
				))}
			</ul>
			{sidebarGroups.length > 0 ? (
				<div className="mt-5 flex w-64 flex-col gap-5 pb-6">
					{sidebarGroups.map((group) => (
						<ToolsDirectorySidebarGroup
							key={group.title}
							addedIds={addedIds}
							group={group}
							onSelectTool={onSelectTool}
							tools={tools}
						/>
					))}
				</div>
			) : null}
		</nav>
	);
}

interface ToolsDirectorySidebarGroupProps {
	addedIds: ReadonlySet<string>;
	group: ToolsDirectorySidebarGroup;
	onSelectTool: (tool: ToolsDirectoryTool) => void;
	tools: readonly ToolsDirectoryTool[];
}

function ToolsDirectorySidebarGroup({
	addedIds,
	group,
	onSelectTool,
	tools,
}: Readonly<ToolsDirectorySidebarGroupProps>) {
	const items = getSidebarGroupItems(tools, group);

	if (items.length === 0) return null;

	return (
		<div className="flex flex-col gap-1.5">
			<p className="px-1.5 text-text-subtlest" style={{ font: token("font.heading.xxsmall") }}>
				{group.title}
			</p>
			<ul className="flex flex-col">
				{items.map((item) => {
					const tool = tools.find((candidate) => candidate.id === item.id);
					return (
						<li key={item.id}>
							<SidebarNavItem
								isSelected={tool ? addedIds.has(tool.id) : false}
								label={item.label}
								leading={<SidebarToolAvatar item={item} />}
								leadingSize="medium"
								onClick={tool ? () => onSelectTool(tool) : undefined}
							/>
						</li>
					);
				})}
			</ul>
		</div>
	);
}

function SidebarToolAvatar({ item }: Readonly<{ item: AgentBrowserSidebarItem }>) {
	return (
		<Image
			alt=""
			aria-hidden
			className="size-4 object-contain"
			height={16}
			src={item.avatarSrc}
			width={16}
		/>
	);
}

interface ToolDetailViewProps {
	added: boolean;
	onAddTool: () => void;
	onBack: () => void;
	onCheckGroup: (permissions: readonly ToolsDirectoryPermission[]) => void;
	onPermissionChange: (permissionId: string, checked: boolean) => void;
	onRemoveTool: () => void;
	permissionSelections: Readonly<Record<string, boolean>>;
	tool: ToolsDirectoryTool;
}

function ToolDetailView({
	added,
	onAddTool,
	onBack,
	onCheckGroup,
	onPermissionChange,
	onRemoveTool,
	permissionSelections,
	tool,
}: Readonly<ToolDetailViewProps>) {
	const publisher = derivePublisher(tool);
	const verified = isVerifiedTool(tool, publisher);
	const groups = getPermissionGroups(tool);
	const contentOverflow = useHasVerticalOverflow<HTMLDivElement>();

	return (
		<div className="grid min-h-0 grid-cols-1 md:grid-cols-[280px_minmax(0,1fr)]">
			<aside className="hidden min-h-0 w-[280px] shrink-0 overflow-y-auto pl-6 md:block">
				<button
					type="button"
					className="mb-6 flex items-center gap-2 text-sm leading-5 text-text outline-none hover:text-text-subtle focus-visible:rounded-md focus-visible:ring-3 focus-visible:ring-ring/50"
					onClick={onBack}
				>
					<ArrowLeftIcon label="" size="small" color="currentColor" />
					Back
				</button>
				<div className="flex w-64 flex-col gap-4">
					<Tile
						className="size-24 rounded-xl"
						hasBorder
						isInset={false}
						label={tool.name}
						size="xlarge"
						variant="transparent"
					>
						{getDetailLogo(tool)}
					</Tile>
					<div className="flex flex-col gap-2">
						<div className="flex items-center gap-2">
							<h2 className="text-2xl font-semibold leading-7 text-text">{tool.name}</h2>
							{verified ? (
								<Icon
									className="text-icon-information"
									render={<StatusVerifiedIcon label="Verified" size="small" color="currentColor" />}
								/>
							) : null}
						</div>
						<p className="text-sm leading-5 text-text">
							{tool.description ??
								"Specializes in collaboration tools designed primarily for software development and project management."}
						</p>
					</div>
					<div className="flex flex-col gap-1 text-xs leading-4 text-text-subtlest">
						<p>
							By <span className="text-link">{publisher}</span>
						</p>
						<p>Used by {(tool.teammateCount ?? 258).toLocaleString("en-US")} teammates</p>
						<p>{tool.lastUpdatedLabel ?? "Last updated 2mo ago"}</p>
					</div>
					<div className="flex items-center gap-2 text-icon-subtle">
						<SupportIcon label="Support" size="small" color="currentColor" />
						<GlobeIcon label="Website" size="small" color="currentColor" />
						<EmailIcon label="Email" size="small" color="currentColor" />
					</div>
					<div className="h-px bg-border" />
					{added ? (
						<Button variant="destructive" onClick={onRemoveTool} type="button">
							<DeleteIcon label="" />
							Remove
						</Button>
					) : (
						<Button onClick={onAddTool} type="button">
							Add to agent
						</Button>
					)}
				</div>
			</aside>
			<div
				ref={contentOverflow.ref}
				className={cn(
					"flex min-h-0 min-w-0 flex-col gap-4 overflow-y-auto px-6 pb-6 md:pl-4",
					contentOverflow.showTopScrollMask && "scroll-mask-top overscroll-contain",
				)}
			>
				<button
					type="button"
					className="flex items-center gap-2 self-start text-sm leading-5 text-text outline-none hover:text-text-subtle focus-visible:rounded-md focus-visible:ring-3 focus-visible:ring-ring/50 md:hidden"
					onClick={onBack}
				>
					<ArrowLeftIcon label="" size="small" color="currentColor" />
					Back
				</button>
				<div className="rounded-xl border border-border p-4 md:hidden">
					<div className="flex items-start gap-4">
						<Tile hasBorder isInset={false} label={tool.name} size="xlarge" variant="transparent">
							{getDetailLogo(tool)}
						</Tile>
						<div className="min-w-0 flex-1">
							<h2 className="truncate text-2xl font-semibold leading-7 text-text">{tool.name}</h2>
							<p className="mt-1 text-sm leading-5 text-text-subtle">{tool.description}</p>
						</div>
					</div>
				</div>
				{groups.map((group) => (
					<ToolPermissionGroup
						key={group.id}
						added={added}
						label={group.label}
						onCheckAll={() => onCheckGroup(group.permissions)}
						onPermissionChange={onPermissionChange}
						permissionSelections={permissionSelections}
						permissions={group.permissions}
					/>
				))}
			</div>
		</div>
	);
}

interface ToolPermissionGroupProps {
	added: boolean;
	label: string;
	onCheckAll: () => void;
	onPermissionChange: (permissionId: string, checked: boolean) => void;
	permissionSelections: Readonly<Record<string, boolean>>;
	permissions: readonly ToolsDirectoryPermission[];
}

function ToolPermissionGroup({
	added,
	label,
	onCheckAll,
	onPermissionChange,
	permissionSelections,
	permissions,
}: Readonly<ToolPermissionGroupProps>) {
	return (
		<section className="flex flex-col gap-2" aria-label={label}>
			<div className="flex h-8 items-center justify-between gap-3">
				<div className="flex min-w-0 items-center gap-2">
					<h3 className="text-text-subtlest" style={{ font: token("font.heading.xxsmall") }}>
						{label}
					</h3>
					<Badge max={false}>{permissions.length}</Badge>
				</div>
				<Button disabled={!added} variant="ghost" size="sm" onClick={onCheckAll} type="button">
					Check all
				</Button>
			</div>
			<div className="overflow-hidden rounded-xl border border-border">
				{permissions.map((permission, index) => {
					const checked = added
						? permissionSelections[permission.id] ?? permission.enabled ?? true
						: true;
					const disabled = !added || permission.disabled;

					return (
						<div
							key={permission.id}
							className={cn(
								"flex h-14 items-center gap-3 bg-surface px-3",
								index < permissions.length - 1 && "border-b border-border",
							)}
						>
							<div className="min-w-0 flex-1">
								<p className="truncate text-sm font-medium leading-5 text-text">{permission.name}</p>
								<p className="truncate text-xs leading-4 text-text-subtlest">{permission.description}</p>
							</div>
							<Switch
								aria-label={`${permission.name} permission`}
								checked={checked}
								disabled={disabled}
								onCheckedChange={(nextChecked) => onPermissionChange(permission.id, nextChecked)}
								size="sm"
							/>
						</div>
					);
				})}
			</div>
		</section>
	);
}
