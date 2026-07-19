"use client";

// oxlint-disable react-doctor/prefer-tag-over-role -- This file uses ARIA roles for custom generated visuals or composite widgets where the suggested native tag would change semantics or behavior.

import AddIcon from "@atlaskit/icon/core/add";
import AiAgentIcon from "@atlaskit/icon/core/ai-agent";
import PinFilledIcon from "@atlaskit/icon/core/pin-filled";
import PinIcon from "@atlaskit/icon/core/pin";
import { motion, useReducedMotion, type Variants } from "motion/react";
import { useMemo, useState, type ReactElement, type ReactNode } from "react";

import { ROVO_AGENT_SELECTOR_AGENTS } from "@/app/data/directory/agents";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Icon } from "@/components/ui/icon";
import type { AtlassianLogoName } from "@/components/ui/logo";
import type { ThirdPartyLogoName } from "@/components/ui/data/logo-third-party-data";
import { AgentAvatarVisual } from "@/components/ui-custom/agent-avatar-visual";
import { cn } from "@/lib/utils";

export interface AgentSelectorAgent {
	id: string;
	name: string;
	byline: string;
	/** Optional directory visual that replaces the default agent avatar treatment. */
	visual?: ReactElement;
	avatarSrc?: string;
	/** When set, renders the ADS brand logo instead of an `avatarSrc` image. */
	logoName?: AtlassianLogoName;
	/** When set, renders the upstream `@atlassian/logo-third-party` mark (3P brands). */
	brandName?: ThirdPartyLogoName;
}

export interface AgentSelectorAction {
	id: string;
	icon: ReactNode;
	label: string;
	onSelect?: () => void;
}

export interface AgentSelectorProps {
	agents?: readonly AgentSelectorAgent[];
	availableLabel?: string;
	browseIcon?: ReactNode;
	browseAgentsLabel?: string;
	className?: string;
	createAgentLabel?: string;
	defaultQuery?: string;
	defaultPinnedAgentIds?: readonly string[];
	emptyMessage?: string;
	heading?: string;
	listLabel?: string;
	moreItemsLabel?: string;
	onAgentToggle?: (agentId: string) => void;
	onBrowseAgents?: () => void;
	onCreateAgent?: () => void;
	onPinnedAgentIdsChange?: (agentIds: readonly string[]) => void;
	onQueryChange?: (query: string) => void;
	query?: string;
	searchPlaceholder?: string;
	pinnedAgentIds?: readonly string[];
	pinnedItemsLabel?: string;
	pinningEnabled?: boolean;
	selectionMode?: "multiple" | "single";
	selectedAgentActions?: readonly AgentSelectorAction[];
	selectedActionsLabel?: string;
	selectedAgentIds?: readonly string[];
	/**
	 * Agents that are already committed elsewhere and must not be re-selected.
	 * Disabled rows get `aria-disabled`, a subtle trailing marker, and their
	 * toggle is a no-op. Generic + domain-neutral; absent = no disabled rows.
	 */
	disabledAgentIds?: readonly string[];
}

// Keep the hover/focus reveal in lockstep with GreetingPromptRow so agent rows
// use the same label lift and byline reveal rhythm without importing chat CSS.
const agentLabelVariants: Variants = {
	idle: {
		transform: "translateY(8px)",
		transition: { type: "spring", bounce: 0, visualDuration: 0.18 },
	},
	active: {
		transform: "translateY(0px)",
		transition: { type: "spring", bounce: 0.12, visualDuration: 0.24 },
	},
};

const agentDescriptionVariants: Variants = {
	idle: {
		opacity: 0,
		transform: "translateY(4px)",
		transition: { duration: 0.1, ease: [0.4, 0, 1, 1] },
	},
	active: {
		opacity: 1,
		transform: "translateY(0px)",
		transition: { delay: 0.02, duration: 0.16, ease: [0, 0.4, 0, 1] },
	},
};

const EMPTY_SELECTED_AGENT_IDS: readonly string[] = [];
const EMPTY_PINNED_AGENT_IDS: readonly string[] = [];
const EMPTY_DISABLED_AGENT_IDS: readonly string[] = [];
const EMPTY_SELECTED_AGENT_ACTIONS: readonly AgentSelectorAction[] = [];
const ACTION_BUTTON_CLASS = "h-8 min-h-8 w-full justify-start gap-3 pl-2 pr-3 py-0 text-left text-sm font-normal";
const ACTION_ICON_CLASS = "grid size-6 shrink-0 place-items-center text-icon-subtle";
const ACTION_LABEL_CLASS = "text-text-subtle";
const AGENT_ROW_CLASS =
	"grid h-11 w-full grid-cols-[24px_minmax(0,1fr)] items-center gap-3 rounded-[12px] px-1.5 py-0 text-left";
const AGENT_COPY_CLASS =
	"flex min-h-[34px] min-w-0 flex-col justify-start overflow-hidden";
// Title + byline share the editor palette's reusable type treatment
// (`menu-row-title` / `menu-row-byline` in app/globals.css): explicit 14px/20px
// and 12px/16px line-heights + truncation + subtle/subtlest color. `text-left`
// keeps the alignment the row expects.
const AGENT_LABEL_CLASS = "menu-row-title text-left";
const AGENT_DESCRIPTION_CLASS = "menu-row-byline text-left";

function matchesAgent(agent: AgentSelectorAgent, query: string): boolean {
	const searchableText = `${agent.name} ${agent.byline}`.toLowerCase();
	return searchableText.includes(query);
}

function filterAgentsByQuery(
	agents: readonly AgentSelectorAgent[],
	normalizedQuery: string,
): AgentSelectorAgent[] {
	return normalizedQuery
		? agents.filter((agent) => matchesAgent(agent, normalizedQuery))
		: [...agents];
}

function AgentSelectorLogo({ agent }: Readonly<{ agent: AgentSelectorAgent }>): ReactElement {
	if (agent.visual) {
		return agent.visual;
	}

	return (
		<AgentAvatarVisual
			avatarClassName="shrink-0"
			avatarSrc={agent.avatarSrc}
			brandName={agent.brandName}
			fallbackText={agent.name.slice(0, 2).toUpperCase()}
			label={agent.name}
			logoName={agent.logoName}
			sizePx={24}
		/>
	);
}

function AgentSelectorItem({
	agent,
	isChecked,
	isDisabled,
	isPinned,
	onTogglePinned,
	onToggle,
	pinningEnabled,
	supportsMultipleSelection,
}: Readonly<{
	agent: AgentSelectorAgent;
	isChecked: boolean;
	isDisabled: boolean;
	isPinned: boolean;
	onTogglePinned: (agentId: string) => void;
	onToggle?: (agentId: string) => void;
	pinningEnabled: boolean;
	supportsMultipleSelection: boolean;
}>): ReactElement {
	// Mirror the editor-palette suggestion row: the byline stays hidden until the
	// row is hovered or focused, then animates in. We drive Motion from explicit
	// interaction state (rather than `whileHover`) so the reveal is deterministic
	// and matches the editor-palette `isInteractionActive` pattern exactly.
	const [isInteractionActive, setIsInteractionActive] = useState(false);
	const shouldReduceMotion = Boolean(useReducedMotion());
	const showPinButton = pinningEnabled && (isPinned || isInteractionActive);
	return (
		<CommandItem
			aria-checked={supportsMultipleSelection ? isChecked : undefined}
			aria-disabled={isDisabled || undefined}
			className={AGENT_ROW_CLASS}
			data-checked={supportsMultipleSelection && isChecked ? true : undefined}
			keywords={[agent.name, agent.byline]}
			onBlur={() => setIsInteractionActive(false)}
			onFocus={() => setIsInteractionActive(true)}
			onMouseEnter={() => setIsInteractionActive(true)}
			onMouseLeave={() => setIsInteractionActive(false)}
			onSelect={() => {
				if (isDisabled) {
					return;
				}
				onToggle?.(agent.id);
			}}
			role={supportsMultipleSelection ? "menuitemcheckbox" : undefined}
			showCheckIcon={supportsMultipleSelection}
			value={agent.id}
		>
			<AgentSelectorLogo agent={agent} />
			<div className="flex min-w-0 items-center">
				<motion.span
					animate={isInteractionActive ? "active" : "idle"}
					className={cn(AGENT_COPY_CLASS, "flex-1")}
					initial={false}
				>
					<motion.span
						className={AGENT_LABEL_CLASS}
						style={{ willChange: "transform" }}
						variants={agentLabelVariants}
					>
						{agent.name}
					</motion.span>
					<motion.span
						className={AGENT_DESCRIPTION_CLASS}
						style={{ willChange: "transform, opacity" }}
						variants={agentDescriptionVariants}
					>
						{agent.byline}
					</motion.span>
				</motion.span>
				{isDisabled ? (
					<span className="ml-2 shrink-0 text-xs font-medium text-text-subtlest">Working</span>
				) : null}
				{pinningEnabled ? (
					<motion.span
						animate={{
							marginLeft: showPinButton ? 8 : 0,
							opacity: showPinButton ? 1 : 0,
							width: showPinButton ? 24 : 0,
						}}
						className="shrink-0 overflow-hidden"
						initial={false}
						transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.15, ease: [0.4, 1, 0.6, 1] }}
					>
						<Button
							aria-hidden={!showPinButton}
							aria-label={`${isPinned ? "Unpin" : "Pin"} ${agent.name}`}
							aria-pressed={isPinned}
							className="size-6 text-icon-subtle aria-pressed:border-transparent! aria-pressed:bg-transparent! aria-pressed:text-icon-subtle! aria-pressed:[&_svg]:text-icon-subtle!"
							onClick={(event) => {
								event.preventDefault();
								event.stopPropagation();
								onTogglePinned(agent.id);
							}}
							onFocus={() => setIsInteractionActive(true)}
							size="icon"
							tabIndex={showPinButton ? 0 : -1}
							type="button"
							variant="ghost"
						>
							<Icon
								aria-hidden
								render={isPinned ? <PinFilledIcon label="" size="small" /> : <PinIcon label="" size="small" />}
							/>
						</Button>
					</motion.span>
				) : null}
			</div>
		</CommandItem>
	);
}

interface AgentSelectorGroupProps {
	agents: readonly AgentSelectorAgent[];
	disabledAgentIdSet: ReadonlySet<string>;
	heading?: string;
	onAgentToggle?: (agentId: string) => void;
	onTogglePinned: (agentId: string) => void;
	pinnedAgentIdSet: ReadonlySet<string>;
	pinningEnabled: boolean;
	selectedAgentIdSet: ReadonlySet<string>;
	supportsMultipleSelection: boolean;
}

function AgentSelectorGroup({
	agents,
	disabledAgentIdSet,
	heading,
	onAgentToggle,
	onTogglePinned,
	pinnedAgentIdSet,
	pinningEnabled,
	selectedAgentIdSet,
	supportsMultipleSelection,
}: Readonly<AgentSelectorGroupProps>): ReactElement | null {
	return agents.length > 0 ? (
		<CommandGroup className="!px-0 !py-1.5" heading={heading}>
			{agents.map((agent) => (
				<AgentSelectorItem
					agent={agent}
					isChecked={selectedAgentIdSet.has(agent.id)}
					isDisabled={disabledAgentIdSet.has(agent.id)}
					isPinned={pinnedAgentIdSet.has(agent.id)}
					key={agent.id}
					onToggle={onAgentToggle}
					onTogglePinned={onTogglePinned}
					pinningEnabled={pinningEnabled}
					supportsMultipleSelection={supportsMultipleSelection}
				/>
			))}
		</CommandGroup>
	) : null;
}

export function AgentSelector({
	agents = ROVO_AGENT_SELECTOR_AGENTS,
	availableLabel = "agents",
	browseIcon = <Icon className="size-4" render={<AiAgentIcon label="" />} />,
	browseAgentsLabel = "Browse agents",
	className,
	createAgentLabel = "Create agent",
	defaultQuery = "",
	defaultPinnedAgentIds = EMPTY_PINNED_AGENT_IDS,
	emptyMessage = "No agents found.",
	heading = "Select an agent",
	listLabel = "Agents",
	moreItemsLabel = "More agents",
	onAgentToggle,
	onBrowseAgents,
	onCreateAgent,
	onPinnedAgentIdsChange,
	onQueryChange,
	query,
	searchPlaceholder = "Search agents",
	pinnedAgentIds,
	pinnedItemsLabel = "Pinned",
	pinningEnabled = true,
	selectionMode = "multiple",
	selectedAgentActions,
	selectedActionsLabel = "Selected agent actions",
	selectedAgentIds,
	disabledAgentIds,
}: Readonly<AgentSelectorProps>): ReactElement {
	const [internalQuery, setInternalQuery] = useState(defaultQuery);
	const [internalPinnedAgentIds, setInternalPinnedAgentIds] = useState<readonly string[]>(defaultPinnedAgentIds);
	const selectedIds = selectedAgentIds ?? EMPTY_SELECTED_AGENT_IDS;
	const disabledIds = disabledAgentIds ?? EMPTY_DISABLED_AGENT_IDS;
	const selectedActions = selectedAgentActions ?? EMPTY_SELECTED_AGENT_ACTIONS;
	const resolvedQuery = query ?? internalQuery;
	const normalizedQuery = resolvedQuery.trim().toLowerCase();
	const resolvedPinnedAgentIds = pinnedAgentIds ?? internalPinnedAgentIds;
	const selectedAgentIdSet = useMemo(() => new Set(selectedIds), [selectedIds]);
	const disabledAgentIdSet = useMemo(() => new Set(disabledIds), [disabledIds]);
	const pinnedAgentIdSet = useMemo(() => new Set(resolvedPinnedAgentIds), [resolvedPinnedAgentIds]);
	const visibleAgents = useMemo(() => {
		const agentById = new Map(agents.map((agent) => [agent.id, agent]));
		const selectedAgents = selectedIds
			.map((agentId) => agentById.get(agentId))
			.filter((agent): agent is AgentSelectorAgent => Boolean(agent));
		const unselectedAgents = agents.filter((agent) => !selectedAgentIdSet.has(agent.id));

		const ordered = [
			...filterAgentsByQuery(selectedAgents, normalizedQuery),
			...filterAgentsByQuery(unselectedAgents, normalizedQuery),
		];

		// De-duplicate by id so each agent renders once with a unique React key.
		// Duplicates can arise from repeated ids in `selectedIds` or from a
		// caller passing an `agents` list that already contains the same id twice.
		const seen = new Set<string>();
		return ordered.filter((agent) => {
			if (seen.has(agent.id)) {
				return false;
			}
			seen.add(agent.id);
			return true;
		});
	}, [agents, normalizedQuery, selectedAgentIdSet, selectedIds]);
	const pinnedAgents = useMemo(
		() => visibleAgents.filter((agent) => pinnedAgentIdSet.has(agent.id)),
		[pinnedAgentIdSet, visibleAgents],
	);
	const moreAgents = useMemo(
		() => visibleAgents.filter((agent) => !pinnedAgentIdSet.has(agent.id)),
		[pinnedAgentIdSet, visibleAgents],
	);
	const hasPinnedAgents = agents.some((agent) => pinnedAgentIdSet.has(agent.id));

	function handleQueryChange(nextQuery: string) {
		if (query === undefined) {
			setInternalQuery(nextQuery);
		}
		onQueryChange?.(nextQuery);
	}

	function handleTogglePinned(agentId: string) {
		const nextPinnedAgentIds = pinnedAgentIdSet.has(agentId)
			? resolvedPinnedAgentIds.filter((id) => id !== agentId)
			: [...resolvedPinnedAgentIds, agentId];
		if (pinnedAgentIds === undefined) {
			setInternalPinnedAgentIds(nextPinnedAgentIds);
		}
		onPinnedAgentIdsChange?.(nextPinnedAgentIds);
	}

	const hasFooterActions = Boolean(onBrowseAgents || onCreateAgent);
	const hasSelectedAgentActions = selectedActions.length > 0;
	const supportsMultipleSelection = selectionMode === "multiple";

	return (
		<Command className={cn("h-[26rem] max-h-[min(26rem,var(--available-height,26rem))] min-h-0 min-w-80 flex-1 p-2", className)} shouldFilter={false}>
			{hasSelectedAgentActions ? (
				<div aria-label={selectedActionsLabel} className="flex shrink-0 flex-col border-b border-border pb-2" role="group">
					{selectedActions.map((action) => (
						<Button
							className={ACTION_BUTTON_CLASS}
							key={action.id}
							onClick={action.onSelect}
							type="button"
							variant="ghost"
						>
							<span className={ACTION_ICON_CLASS}>
								{action.icon}
							</span>
							<span className={ACTION_LABEL_CLASS}>{action.label}</span>
						</Button>
					))}
				</div>
			) : null}
			<div className={cn("shrink-0", hasSelectedAgentActions && "pt-4")}>
				<p className="mb-2 px-2 text-xs font-semibold leading-4 text-text-subtlest">{heading}</p>
				<CommandInput
					aria-label={searchPlaceholder}
					inputGroupClassName="has-[[data-slot=input-group-control]:focus-visible]:border-input has-[[data-slot=input-group-control]:focus-visible]:ring-0 [&>[data-align=inline-start]]:pl-3 has-[>[data-align=inline-start]]:[&>input]:pl-3"
					onValueChange={handleQueryChange}
					placeholder={searchPlaceholder}
					value={resolvedQuery}
					wrapperClassName="p-0"
				/>
			</div>
			<CommandList aria-label={listLabel} className="min-h-0 max-h-none flex-1 p-0">
				{visibleAgents.length === 0 ? <CommandEmpty>{emptyMessage}</CommandEmpty> : null}
				<AgentSelectorGroup
					agents={pinnedAgents}
					disabledAgentIdSet={disabledAgentIdSet}
					heading={pinnedItemsLabel}
					onAgentToggle={onAgentToggle}
					onTogglePinned={handleTogglePinned}
					pinnedAgentIdSet={pinnedAgentIdSet}
					pinningEnabled={pinningEnabled}
					selectedAgentIdSet={selectedAgentIdSet}
					supportsMultipleSelection={supportsMultipleSelection}
				/>
				<AgentSelectorGroup
					agents={moreAgents}
					disabledAgentIdSet={disabledAgentIdSet}
					heading={hasPinnedAgents ? moreItemsLabel : undefined}
					onAgentToggle={onAgentToggle}
					onTogglePinned={handleTogglePinned}
					pinnedAgentIdSet={pinnedAgentIdSet}
					pinningEnabled={pinningEnabled}
					selectedAgentIdSet={selectedAgentIdSet}
					supportsMultipleSelection={supportsMultipleSelection}
				/>
			</CommandList>
			{hasFooterActions ? (
				<div className="sticky bottom-0 z-10 flex shrink-0 flex-col border-t border-border bg-popover p-0 pt-2">
					{onBrowseAgents ? (
						<Button
							className={ACTION_BUTTON_CLASS}
							onClick={onBrowseAgents}
							type="button"
							variant="ghost"
						>
							<span className={ACTION_ICON_CLASS}>
								{browseIcon}
							</span>
							<span className={ACTION_LABEL_CLASS}>{browseAgentsLabel}</span>
						</Button>
					) : null}
					{onCreateAgent ? (
						<Button
							className={ACTION_BUTTON_CLASS}
							onClick={onCreateAgent}
							type="button"
							variant="ghost"
						>
							<span className={ACTION_ICON_CLASS}>
								<Icon className="size-4" render={<AddIcon label="" />} />
							</span>
							<span className={ACTION_LABEL_CLASS}>{createAgentLabel}</span>
						</Button>
					) : null}
				</div>
			) : null}
			<span className="sr-only">{agents.length} {availableLabel} available</span>
		</Command>
	);
}
