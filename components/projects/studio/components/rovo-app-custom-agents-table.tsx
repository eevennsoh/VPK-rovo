"use client";

import { type KeyboardEvent, type MouseEvent, type ReactNode, useEffect, useMemo, useState } from "react";
import type { StudioSessionAgentEntry } from "@/app/contexts/context-rovo-chat";
import { getStudioSessionAgentDisplayName } from "@/app/contexts";
import type { AgentsDirectoryAgent } from "@/components/blocks/agents-directory";
import { DEFAULT_AGENTS_DIRECTORY_SIDEBAR_GROUPS } from "@/components/blocks/agents-directory/data/sidebar-groups";
import { ControlledRovoIllustration } from "@/components/ui-custom/rovo-illustration";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Empty, EmptyBody, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Icon } from "@/components/ui/icon";
import { Lozenge } from "@/components/ui/lozenge";
import { CardDirectoryAgent } from "@/components/ui-custom/card-directory";
import { List, type ListColumn } from "@/components/ui-custom/list";
import { cn } from "@/lib/utils";
import EditIcon from "@atlaskit/icon/core/edit";
import PinFilledIcon from "@atlaskit/icon/core/pin-filled";
import PinIcon from "@atlaskit/icon/core/pin";

const STUDIO_PINNED_AGENTS_STORAGE_KEY = "vpk:studio:pinned-custom-agents";
const STUDIO_AGENTS_COMPANY_GROUP_TITLE = "By companies";
const STUDIO_AGENTS_COMPANY_AGENT_IDS =
	DEFAULT_AGENTS_DIRECTORY_SIDEBAR_GROUPS.find((group) => group.title === STUDIO_AGENTS_COMPANY_GROUP_TITLE)?.agentIds ?? [];
const STUDIO_AGENTS_COMPANY_AGENT_ID_SET = new Set<string>(STUDIO_AGENTS_COMPANY_AGENT_IDS);

// My agents list: name column flexes; version, modified, and actions are fixed
// so the agent name truncates rather than the trailing metadata/action columns.
const STUDIO_MY_AGENTS_LIST_COLUMNS: readonly ListColumn[] = [
	{},
	{ className: "w-[72px]" },
	{ className: "w-[116px]" },
	{ className: "w-[72px]" },
];

const STUDIO_AGENT_SECTION_TABS = [
	{ id: "my-agents", label: "My agents" },
	{ id: "by-teams", label: "By teams" },
	{ id: "by-companies", label: "By companies" },
] as const;

type StudioAgentSectionTab = (typeof STUDIO_AGENT_SECTION_TABS)[number]["id"];

interface StudioAgentsSectionProps {
	directoryAgents: readonly AgentsDirectoryAgent[];
	entries: readonly StudioSessionAgentEntry[];
	onBrowseTemplates: () => void;
	onCreateAgent: () => void;
	onEditAgent: (agentId: string) => void;
	onSelectDirectoryAgent: (agent: AgentsDirectoryAgent) => void;
}

function readPinnedAgentIds(): ReadonlySet<string> {
	if (typeof window === "undefined") {
		return new Set();
	}
	try {
		const raw = window.localStorage.getItem(STUDIO_PINNED_AGENTS_STORAGE_KEY);
		if (!raw) {
			return new Set();
		}
		const parsed: unknown = JSON.parse(raw);
		if (!Array.isArray(parsed)) {
			return new Set();
		}
		return new Set(parsed.filter((id): id is string => typeof id === "string"));
	} catch {
		return new Set();
	}
}

function writePinnedAgentIds(pinnedAgentIds: ReadonlySet<string>): void {
	if (typeof window === "undefined") {
		return;
	}
	try {
		window.localStorage.setItem(
			STUDIO_PINNED_AGENTS_STORAGE_KEY,
			JSON.stringify([...pinnedAgentIds]),
		);
	} catch {
		// Ignore write failures (e.g. storage disabled or quota exceeded).
	}
}

function formatRelativeModifiedTime(timestamp: number): string {
	if (!Number.isFinite(timestamp) || timestamp <= 0) {
		return "Just now";
	}

	const elapsedMs = Math.max(0, Date.now() - timestamp);
	const elapsedMinutes = Math.floor(elapsedMs / 60_000);
	if (elapsedMinutes < 1) {
		return "Just now";
	}
	if (elapsedMinutes < 60) {
		return `${elapsedMinutes} min ago`;
	}

	const elapsedHours = Math.floor(elapsedMinutes / 60);
	if (elapsedHours < 24) {
		return `${elapsedHours} hr${elapsedHours === 1 ? "" : "s"} ago`;
	}

	const elapsedDays = Math.floor(elapsedHours / 24);
	if (elapsedDays < 14) {
		return `${elapsedDays} day${elapsedDays === 1 ? "" : "s"} ago`;
	}

	const elapsedWeeks = Math.floor(elapsedDays / 7);
	return `${elapsedWeeks} week${elapsedWeeks === 1 ? "" : "s"} ago`;
}

function getVersionLabel(entry: StudioSessionAgentEntry): string {
	return entry.publishStatus === "published" ? "V1" : "Draft";
}

function getVersionVariant(entry: StudioSessionAgentEntry): "success" | "neutral" {
	return entry.publishStatus === "published" ? "success" : "neutral";
}

function derivePublisher(byline: string): string {
	const match = /\bby\s+(.+)$/i.exec(byline);
	return (match?.[1] ?? byline).trim();
}

function isVerified(agent: AgentsDirectoryAgent, publisher: string): boolean {
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

function getDirectoryCardAvatarClassName(agent: AgentsDirectoryAgent): string {
	if (agent.id === "google-drive" || agent.id === "slack") {
		return "size-full scale-85 object-contain";
	}

	return "size-full object-contain";
}

function isTeamDirectoryAgent(agent: AgentsDirectoryAgent): boolean {
	if (STUDIO_AGENTS_COMPANY_AGENT_ID_SET.has(agent.id)) {
		return false;
	}

	const byline = agent.byline.toLowerCase();
	if (byline.startsWith("by ")) {
		return false;
	}
	if (byline.startsWith("custom agent by ") && !byline.includes("atlassian")) {
		return false;
	}

	return (
		byline.includes("agent by") ||
		byline.includes("dev agent") ||
		byline.includes("product agent") ||
		byline.includes("rovo agent") ||
		byline.includes("teamwork agent")
	);
}

function pickAgentsByIds(
	agents: readonly AgentsDirectoryAgent[],
	ids: readonly string[],
): readonly AgentsDirectoryAgent[] {
	return ids
		.map((id) => agents.find((agent) => agent.id === id))
		.filter((agent): agent is AgentsDirectoryAgent => Boolean(agent));
}

function getCustomAgentDescription(entry: StudioSessionAgentEntry): string {
	return (
		entry.profile.description ??
		entry.draftResult.description ??
		entry.draftResult.summary ??
		"Ready to test and refine in Studio."
	);
}

function stopNestedCardAction(event: KeyboardEvent<HTMLElement> | MouseEvent<HTMLElement>): void {
	event.stopPropagation();
}

export function StudioAgentsSection({
	directoryAgents,
	entries,
	onBrowseTemplates,
	onCreateAgent,
	onEditAgent,
	onSelectDirectoryAgent,
}: Readonly<StudioAgentsSectionProps>) {
	const [activeTab, setActiveTab] = useState<StudioAgentSectionTab>("my-agents");
	const [pinnedAgentIds, setPinnedAgentIds] = useState<ReadonlySet<string>>(() => new Set());

	// Hydrate from localStorage after mount to keep the SSR/first client render
	// in sync (both start empty) and avoid a hydration mismatch.
	useEffect(() => {
		const stored = readPinnedAgentIds();
		if (stored.size > 0) {
			setPinnedAgentIds(stored);
		}
	}, []);

	const sortedEntries = useMemo(() => {
		return [...entries].sort((a, b) => {
			const aPinned = pinnedAgentIds.has(a.profile.id);
			const bPinned = pinnedAgentIds.has(b.profile.id);
			if (aPinned !== bPinned) {
				return aPinned ? -1 : 1;
			}
			return b.lastTouchedAt - a.lastTouchedAt;
		});
	}, [entries, pinnedAgentIds]);

	const teamAgents = useMemo(
		() => directoryAgents.filter(isTeamDirectoryAgent),
		[directoryAgents],
	);
	const companyAgents = useMemo(
		() => pickAgentsByIds(directoryAgents, STUDIO_AGENTS_COMPANY_AGENT_IDS),
		[directoryAgents],
	);

	const togglePinned = (agentId: string) => {
		setPinnedAgentIds((current) => {
			const next = new Set(current);
			if (next.has(agentId)) {
				next.delete(agentId);
			} else {
				next.add(agentId);
			}
			writePinnedAgentIds(next);
			return next;
		});
	};

	return (
		<section
			aria-labelledby="studio-agents-heading"
			className="mx-auto mt-12 flex w-[90%] max-w-[800px] flex-col gap-4"
			data-testid="studio-agents-section"
		>
			<div className="flex flex-wrap items-center justify-between gap-3">
				<h2 id="studio-agents-heading" className="px-1.5 text-xs font-semibold leading-4 text-text-subtlest">
					Agents
				</h2>
				<ButtonGroup aria-label="Agent views" className="flex-wrap" variant="separated">
					{STUDIO_AGENT_SECTION_TABS.map((tab) => (
						<Button
							aria-pressed={activeTab === tab.id}
							key={tab.id}
							onClick={() => setActiveTab(tab.id)}
							size="compact"
							type="button"
							variant="outline"
						>
							{tab.label}
						</Button>
					))}
				</ButtonGroup>
			</div>

			{activeTab === "my-agents" ? (
				sortedEntries.length > 0 ? (
					<StudioCustomAgentsList
						entries={sortedEntries}
						pinnedAgentIds={pinnedAgentIds}
						onEditAgent={onEditAgent}
						onTogglePinned={togglePinned}
					/>
				) : (
					<StudioAgentsEmptyState
						onBrowseTemplates={onBrowseTemplates}
						onCreateAgent={onCreateAgent}
					/>
				)
			) : null}

			{activeTab === "by-teams" ? (
				<DirectoryAgentsGrid agents={teamAgents} onSelectAgent={onSelectDirectoryAgent} />
			) : null}

			{activeTab === "by-companies" ? (
				<DirectoryAgentsGrid agents={companyAgents} onSelectAgent={onSelectDirectoryAgent} />
			) : null}
		</section>
	);
}

function StudioAgentCardsGrid({ children }: Readonly<{ children: ReactNode }>) {
	return (
		<ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
			{children}
		</ul>
	);
}

function StudioAgentsEmptyState({
	onBrowseTemplates,
	onCreateAgent,
}: Readonly<{
	onBrowseTemplates: () => void;
	onCreateAgent: () => void;
}>) {
	return (
		<Empty className="max-w-[800px] rounded-[12px] border border-dashed border-border bg-surface px-6 py-0" orientation="horizontal">
			<EmptyMedia>
				<span aria-hidden="true">
					<ControlledRovoIllustration illusId="ai" size={96} />
				</span>
			</EmptyMedia>
			<EmptyBody>
				<EmptyHeader className="gap-1">
					<EmptyTitle headingSize="xsmall">No agents yet</EmptyTitle>
					<EmptyDescription>
						Browse templates or create a new agent from the prompt.
					</EmptyDescription>
				</EmptyHeader>
				<EmptyContent>
					<div className="flex flex-wrap gap-2">
						<Button onClick={onBrowseTemplates} type="button" variant="outline">
							Browse templates
						</Button>
						<Button onClick={onCreateAgent} type="button">
							Create agent
						</Button>
					</div>
				</EmptyContent>
			</EmptyBody>
		</Empty>
	);
}

function StudioCustomAgentsList({
	entries,
	pinnedAgentIds,
	onEditAgent,
	onTogglePinned,
}: Readonly<{
	entries: readonly StudioSessionAgentEntry[];
	pinnedAgentIds: ReadonlySet<string>;
	onEditAgent: (agentId: string) => void;
	onTogglePinned: (agentId: string) => void;
}>) {
	return (
		<List.Root aria-label="My agents">
			<List.Table columns={STUDIO_MY_AGENTS_LIST_COLUMNS}>
				{entries.map((entry) => {
					const agentName = getStudioSessionAgentDisplayName(entry) || "Untitled agent";
					const description = getCustomAgentDescription(entry);
					const isPinned = pinnedAgentIds.has(entry.profile.id);
					const revealOnHover =
						"opacity-0 transition-opacity duration-fast group-hover/row:opacity-100 focus-visible:opacity-100";

					return (
						<List.Row key={entry.profile.id}>
							<List.Cell edge="leading">
								<button
									className="flex w-full min-w-0 items-center gap-3 text-left"
									onClick={() => onEditAgent(entry.profile.id)}
									type="button"
								>
									<Avatar aria-hidden="true" shape="hexagon" size="sm" className="shrink-0 after:border-0">
										{entry.profile.avatarSrc ? <AvatarImage alt="" src={entry.profile.avatarSrc} /> : null}
										<AvatarFallback>{agentName.slice(0, 2).toUpperCase()}</AvatarFallback>
									</Avatar>
									<span className="flex min-w-0 flex-col">
										<span className="truncate font-medium text-text">{agentName}</span>
										{description ? (
											<span className="truncate text-xs text-text-subtle">{description}</span>
										) : null}
									</span>
								</button>
							</List.Cell>
							<List.Cell>
								<Lozenge variant={getVersionVariant(entry)}>{getVersionLabel(entry)}</Lozenge>
							</List.Cell>
							<List.Cell className="whitespace-nowrap text-text-subtle">
								{formatRelativeModifiedTime(entry.lastTouchedAt)}
							</List.Cell>
							<List.Cell edge="trailing">
								<div className="flex justify-end gap-[4px]" onClick={stopNestedCardAction} onKeyDown={stopNestedCardAction}>
									<Button
										aria-label={`Edit ${agentName}`}
										className={cn("size-7", revealOnHover)}
										onClick={() => onEditAgent(entry.profile.id)}
										size="icon"
										type="button"
										variant="ghost"
									>
										<Icon aria-hidden render={<EditIcon label="" size="small" />} />
									</Button>
									<Button
										aria-label={`${isPinned ? "Unpin" : "Pin"} ${agentName}`}
										aria-pressed={isPinned}
										className={cn(
											"size-7 aria-pressed:border-transparent! aria-pressed:bg-transparent! aria-pressed:text-text-subtle! aria-pressed:[&_svg]:text-icon-subtle!",
											isPinned ? "opacity-100" : revealOnHover,
										)}
										onClick={() => onTogglePinned(entry.profile.id)}
										size="icon"
										type="button"
										variant="ghost"
									>
										<Icon aria-hidden render={isPinned ? <PinFilledIcon label="" size="small" /> : <PinIcon label="" size="small" />} />
									</Button>
								</div>
							</List.Cell>
						</List.Row>
					);
				})}
			</List.Table>
		</List.Root>
	);
}

function DirectoryAgentsGrid({
	agents,
	onSelectAgent,
}: Readonly<{
	agents: readonly AgentsDirectoryAgent[];
	onSelectAgent: (agent: AgentsDirectoryAgent) => void;
}>) {
	return (
		<StudioAgentCardsGrid>
			{agents.map((agent) => {
				const publisher = derivePublisher(agent.byline);
				return (
					<li key={agent.id}>
						<CardDirectoryAgent
							avatarImageClassName={getDirectoryCardAvatarClassName(agent)}
							avatarSrc={agent.avatarSrc}
							chatCount={syntheticChats(agent.id)}
							className="hover:border-transparent"
							description={agent.description}
							feedbackCount={syntheticFeedback(agent.id)}
							logoName={agent.logoName}
							name={agent.name}
							onSelect={() => onSelectAgent(agent)}
							publisher={publisher}
							rating={syntheticRating(agent.id)}
							verified={isVerified(agent, publisher)}
						/>
					</li>
				);
			})}
		</StudioAgentCardsGrid>
	);
}
