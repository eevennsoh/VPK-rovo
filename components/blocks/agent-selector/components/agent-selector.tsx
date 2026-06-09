"use client";

import AddIcon from "@atlaskit/icon/core/add";
import AiAgentIcon from "@atlaskit/icon/core/ai-agent";
import { motion, type Variants } from "motion/react";
import Image from "next/image";
import { useMemo, useState, type ReactElement, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Icon } from "@/components/ui/icon";
import { AtlassianLogo, type AtlassianLogoName } from "@/components/ui/logo";
import { cn } from "@/lib/utils";

export interface AgentSelectorAgent {
	id: string;
	name: string;
	byline: string;
	avatarSrc?: string;
	/** When set, renders the ADS brand logo instead of an `avatarSrc` image. */
	logoName?: AtlassianLogoName;
}

export interface AgentSelectorAction {
	id: string;
	icon: ReactNode;
	label: string;
	onSelect?: () => void;
}

export interface AgentSelectorProps {
	agents: readonly AgentSelectorAgent[];
	browseAgentsLabel?: string;
	className?: string;
	createAgentLabel?: string;
	defaultQuery?: string;
	emptyMessage?: string;
	heading?: string;
	onAgentToggle?: (agentId: string) => void;
	onBrowseAgents?: () => void;
	onCreateAgent?: () => void;
	onQueryChange?: (query: string) => void;
	query?: string;
	searchPlaceholder?: string;
	selectionMode?: "multiple" | "single";
	selectedAgentActions?: readonly AgentSelectorAction[];
	selectedAgentIds?: readonly string[];
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
const EMPTY_SELECTED_AGENT_ACTIONS: readonly AgentSelectorAction[] = [];
const ACTION_BUTTON_CLASS = "h-8 min-h-8 w-full justify-start gap-3 pl-2 pr-3 py-0 text-left text-sm font-normal";
const ACTION_ICON_CLASS = "grid size-6 shrink-0 place-items-center text-icon-subtle";
const ACTION_LABEL_CLASS = "text-text-subtle";
const AGENT_ROW_CLASS =
	"grid h-11 w-full grid-cols-[24px_minmax(0,1fr)_auto] items-center gap-3 rounded-[12px] px-1.5 py-0 text-left";
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
	return (
		<span className="grid size-6 shrink-0 place-items-center overflow-hidden rounded-sm">
			{agent.logoName ? (
				<AtlassianLogo name={agent.logoName} size="small" themeAware label={agent.name} />
			) : agent.avatarSrc ? (
				<Image alt="" aria-hidden className="mx-auto block size-6 object-contain object-center" height={24} src={agent.avatarSrc} width={24} />
			) : null}
		</span>
	);
}

function AgentSelectorItem({
	agent,
	isChecked,
	onToggle,
	supportsMultipleSelection,
}: Readonly<{
	agent: AgentSelectorAgent;
	isChecked: boolean;
	onToggle?: (agentId: string) => void;
	supportsMultipleSelection: boolean;
}>): ReactElement {
	// Mirror the editor-palette suggestion row: the byline stays hidden until the
	// row is hovered or focused, then animates in. We drive Motion from explicit
	// interaction state (rather than `whileHover`) so the reveal is deterministic
	// and matches the editor-palette `isInteractionActive` pattern exactly.
	const [isInteractionActive, setIsInteractionActive] = useState(false);
	return (
		<CommandItem
			aria-checked={supportsMultipleSelection ? isChecked : undefined}
			className={AGENT_ROW_CLASS}
			data-checked={supportsMultipleSelection && isChecked ? true : undefined}
			keywords={[agent.name, agent.byline]}
			onBlur={() => setIsInteractionActive(false)}
			onFocus={() => setIsInteractionActive(true)}
			onMouseEnter={() => setIsInteractionActive(true)}
			onMouseLeave={() => setIsInteractionActive(false)}
			onSelect={() => onToggle?.(agent.id)}
			role={supportsMultipleSelection ? "menuitemcheckbox" : undefined}
			showCheckIcon={supportsMultipleSelection}
			value={agent.id}
		>
			<AgentSelectorLogo agent={agent} />
			<motion.span
				animate={isInteractionActive ? "active" : "idle"}
				className={AGENT_COPY_CLASS}
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
		</CommandItem>
	);
}

export function AgentSelector({
	agents,
	browseAgentsLabel = "Browse agents",
	className,
	createAgentLabel = "Create agent",
	defaultQuery = "",
	emptyMessage = "No agents found.",
	heading = "Select an agent",
	onAgentToggle,
	onBrowseAgents,
	onCreateAgent,
	onQueryChange,
	query,
	searchPlaceholder = "Search agents",
	selectionMode = "multiple",
	selectedAgentActions,
	selectedAgentIds,
}: Readonly<AgentSelectorProps>): ReactElement {
	const [internalQuery, setInternalQuery] = useState(defaultQuery);
	const selectedIds = selectedAgentIds ?? EMPTY_SELECTED_AGENT_IDS;
	const selectedActions = selectedAgentActions ?? EMPTY_SELECTED_AGENT_ACTIONS;
	const resolvedQuery = query ?? internalQuery;
	const normalizedQuery = resolvedQuery.trim().toLowerCase();
	const selectedAgentIdSet = useMemo(() => new Set(selectedIds), [selectedIds]);
	const visibleAgents = useMemo(() => {
		const agentById = new Map(agents.map((agent) => [agent.id, agent]));
		const selectedAgents = selectedIds
			.map((agentId) => agentById.get(agentId))
			.filter((agent): agent is AgentSelectorAgent => Boolean(agent));
		const unselectedAgents = agents.filter((agent) => !selectedAgentIdSet.has(agent.id));

		return [
			...filterAgentsByQuery(selectedAgents, normalizedQuery),
			...filterAgentsByQuery(unselectedAgents, normalizedQuery),
		];
	}, [agents, normalizedQuery, selectedAgentIdSet, selectedIds]);

	function handleQueryChange(nextQuery: string) {
		if (query === undefined) {
			setInternalQuery(nextQuery);
		}
		onQueryChange?.(nextQuery);
	}

	const hasFooterActions = Boolean(onBrowseAgents || onCreateAgent);
	const hasSelectedAgentActions = selectedActions.length > 0;
	const supportsMultipleSelection = selectionMode === "multiple";

	return (
		<Command className={cn("h-[26rem] max-h-[min(26rem,var(--available-height,26rem))] min-h-0 min-w-80 flex-1 p-2", className)} shouldFilter={false}>
			{hasSelectedAgentActions ? (
				<div aria-label="Selected agent actions" className="flex shrink-0 flex-col border-b border-border pb-2" role="group">
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
			<CommandList aria-label="Agents" className="min-h-0 max-h-none flex-1 p-0">
				{visibleAgents.length === 0 ? <CommandEmpty>{emptyMessage}</CommandEmpty> : null}
				<CommandGroup className="!px-0 !py-1.5">
					{visibleAgents.map((agent) => (
						<AgentSelectorItem
							agent={agent}
							isChecked={selectedAgentIdSet.has(agent.id)}
							key={agent.id}
							onToggle={onAgentToggle}
							supportsMultipleSelection={supportsMultipleSelection}
						/>
					))}
				</CommandGroup>
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
								<Icon className="size-4" render={<AiAgentIcon label="" />} />
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
			<span className="sr-only">{agents.length} agents available</span>
		</Command>
	);
}
