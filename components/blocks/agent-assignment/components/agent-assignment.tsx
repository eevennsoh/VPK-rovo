"use client";

import { cloneElement, useState, type ReactElement, type ReactNode } from "react";

import {
	AgentSelector,
	type AgentSelectorAgent,
} from "@/components/blocks/agent-selector";
import {
	AgentSessionTargetMenu,
	type AgentSessionTargetChoice,
} from "@/components/blocks/agent-assignment/components/agent-session-target-menu";
import { AssignedAgentsMenu } from "@/components/blocks/agent-assignment/components/assigned-agents-menu";
import { AssignmentAvatar } from "@/components/blocks/agent-assignment/components/assignment-avatar";
import { Avatar } from "@/components/ui/avatar";
import {
	HoverCard,
	HoverCardContent,
	HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { PlusIcon } from "@/components/ui/vpk-icons";
import { TooltipProvider } from "@/components/ui/tooltip";
import { token } from "@/lib/tokens";
import { cn } from "@/lib/utils";

export interface AgentAssignmentAgent extends AgentSelectorAgent {
	status?: ReactNode;
	/** Minimum time a status remains visible before advancing. */
	statusCycleIntervalMs?: number;
	/** Random time added independently to every status step. */
	statusCycleJitterMs?: number;
	statusLabel: string;
	/** Agent-specific tool-call narration. Avoid sharing one sequence across agents. */
	statusSequence?: readonly string[];
}

export interface AgentAssignmentProps {
	agents: readonly AgentSelectorAgent[];
	assignedAgents: readonly AgentAssignmentAgent[];
	className?: string;
	defaultPinnedAgentIds?: readonly string[];
	maxVisibleAgents?: number;
	onAgentAssign?: (agent: AgentSelectorAgent) => void;
	onAssignedAgentIdsChange: (agentIds: readonly string[]) => void;
	onAssignedAgentSelect: (agent: AgentAssignmentAgent) => void;
	onBrowseAgents?: () => void;
	onContinueExistingSession?: (agent: AgentSelectorAgent) => void;
	onCreateAgent?: () => void;
	onOpenChange?: (open: boolean) => void;
	onStartNewSession?: (agent: AgentSelectorAgent) => void;
	openMode?: "click" | "hover";
	pinnedItemsLabel?: string;
	positionerClassName?: string;
	side?: "top" | "right" | "bottom" | "left";
	trigger?: ReactElement<{ "aria-expanded"?: boolean }>;
	triggerLabel?: string;
	/**
	 * Agents that already have a session the user can continue. Selecting one
	 * from the directory opens Continue / Start new instead of toggling assign.
	 */
	usedAgentIds?: readonly string[];
}

export function AgentAssignment({
	agents,
	assignedAgents,
	className,
	defaultPinnedAgentIds = [],
	maxVisibleAgents = 4,
	onAgentAssign,
	onAssignedAgentIdsChange,
	onAssignedAgentSelect,
	onBrowseAgents,
	onContinueExistingSession,
	onCreateAgent,
	onOpenChange,
	onStartNewSession,
	openMode = "click",
	pinnedItemsLabel,
	positionerClassName = "z-[502]",
	side,
	trigger,
	triggerLabel = "Edit agents",
	usedAgentIds = [],
}: Readonly<AgentAssignmentProps>) {
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState("");
	const [view, setView] = useState<"assigned" | "selector" | "session">("assigned");
	const [pendingSessionAgent, setPendingSessionAgent] = useState<AgentSelectorAgent | null>(null);
	const [pinnedAgentIds, setPinnedAgentIds] = useState<readonly string[]>(defaultPinnedAgentIds);
	const assignedAgentIds = assignedAgents.map((agent) => agent.id);
	const showSessionView = view === "session" && pendingSessionAgent !== null;
	const effectiveView = showSessionView
		? "session"
		: assignedAgents.length === 0 || view === "session"
			? "selector"
			: view;
	const shown = assignedAgents.slice(0, maxVisibleAgents);
	const overlayPositionerClassName = openMode === "hover"
		? cn(
			positionerClassName,
			"after:pointer-events-auto after:absolute after:-inset-2 after:-z-10 after:content-['']",
		)
		: positionerClassName;
	const resolvedTrigger = trigger
		? cloneElement(trigger, { "aria-expanded": open })
		: undefined;

	const handleOpenChange = (nextOpen: boolean) => {
		setOpen(nextOpen);
		onOpenChange?.(nextOpen);
		if (!nextOpen) {
			setQuery("");
			setPendingSessionAgent(null);
			setView("assigned");
		}
	};

	const handleFooterAction = (action?: () => void) => {
		handleOpenChange(false);
		action?.();
	};

	const ensureAssigned = (agent: AgentSelectorAgent) => {
		if (!assignedAgentIds.includes(agent.id)) {
			onAssignedAgentIdsChange([...assignedAgentIds, agent.id]);
		}
	};

	const handleSessionChoice = (
		agent: AgentSelectorAgent,
		choice: AgentSessionTargetChoice,
	) => {
		ensureAssigned(agent);
		handleOpenChange(false);
		switch (choice) {
			case "continue":
				if (onContinueExistingSession) {
					onContinueExistingSession(agent);
					return;
				}
				onAssignedAgentSelect(
					assignedAgents.find((candidate) => candidate.id === agent.id)
						?? { ...agent, statusLabel: "Assigned" },
				);
				return;
			case "new":
				if (onStartNewSession) {
					onStartNewSession(agent);
					return;
				}
				onAgentAssign?.(agent);
				return;
			default: {
				const _exhaustive: never = choice;
				return _exhaustive;
			}
		}
	};

	const handleAgentToggle = (agentId: string) => {
		const agent = agents.find((candidate) => candidate.id === agentId);
		if (!agent) {
			return;
		}
		if (usedAgentIds.includes(agentId)) {
			setPendingSessionAgent(agent);
			setView("session");
			return;
		}
		const isAssigned = assignedAgentIds.includes(agentId);
		if (!isAssigned) {
			onAgentAssign?.(agent);
		}
		const nextAssignedAgentIds = isAssigned
			? assignedAgentIds.filter((id) => id !== agentId)
			: [...assignedAgentIds, agentId];
		onAssignedAgentIdsChange(nextAssignedAgentIds);
		handleOpenChange(false);
	};

	const handleArchiveAgent = (agent: AgentAssignmentAgent) => {
		onAssignedAgentIdsChange(assignedAgentIds.filter((agentId) => agentId !== agent.id));
	};

	const handleAssignedAgentSelect = (agent: AgentAssignmentAgent) => {
		handleOpenChange(false);
		onAssignedAgentSelect?.(agent);
	};

	const menu = effectiveView === "assigned" ? (
		<AssignedAgentsMenu
			onAddAgent={() => setView("selector")}
			onArchiveAgent={handleArchiveAgent}
			onSelectAgent={handleAssignedAgentSelect}
			rows={assignedAgents}
		/>
	) : effectiveView === "session" && pendingSessionAgent ? (
		<AgentSessionTargetMenu
			onBack={() => {
				setPendingSessionAgent(null);
				setView("selector");
			}}
			onChoose={(choice) => handleSessionChoice(pendingSessionAgent, choice)}
		/>
	) : (
		<AgentSelector
			agents={agents}
			onAgentToggle={handleAgentToggle}
			onBrowseAgents={onBrowseAgents ? () => handleFooterAction(onBrowseAgents) : undefined}
			onCreateAgent={onCreateAgent ? () => handleFooterAction(onCreateAgent) : undefined}
			onPinnedAgentIdsChange={setPinnedAgentIds}
			onQueryChange={setQuery}
			pinnedAgentIds={pinnedAgentIds}
			pinnedItemsLabel={pinnedItemsLabel}
			query={query}
			searchVariant="palette"
			selectionMode="multiple"
			selectedAgentIds={assignedAgentIds}
		/>
	);

	if (openMode === "hover") {
		return (
			<TooltipProvider>
				<HoverCard onOpenChange={handleOpenChange} open={open}>
					<HoverCardTrigger
						closeDelay={80}
						delay={120}
						render={resolvedTrigger ?? (
							<button
								aria-expanded={open}
								aria-label={triggerLabel}
								className="rounded-md outline-none"
								type="button"
							/>
						)}
					/>
					<HoverCardContent
						align="start"
						aria-label="Agent assignment"
						className="max-h-none w-[360px] gap-0 overflow-hidden rounded-xl p-0 shadow-none"
						positionerClassName={overlayPositionerClassName}
						side={side ?? "right"}
						sideOffset={8}
						style={{ boxShadow: token("elevation.shadow.overlay") }}
					>
						{menu}
					</HoverCardContent>
				</HoverCard>
			</TooltipProvider>
		);
	}

	return (
		<TooltipProvider>
			<Popover onOpenChange={handleOpenChange} open={open}>
				{resolvedTrigger ? (
					<PopoverTrigger render={resolvedTrigger} />
				) : (
					<div className={cn("relative flex min-h-8 w-full min-w-0 items-center gap-0.5 px-2", className)}>
						<PopoverTrigger
							render={
								<button
									aria-label={triggerLabel}
									className="absolute inset-0 z-0 rounded-md outline-none"
									type="button"
								/>
							}
						/>
						{shown.map((agent) => (
							<AssignmentAvatar
								agent={agent}
								key={agent.id}
								onOpen={() => handleOpenChange(true)}
								positionerClassName={positionerClassName}
							/>
						))}
						<Avatar
							aria-hidden
							className="pointer-events-none relative z-10 text-icon-subtle"
							shape="hexagon"
							size="sm"
						>
							<span className="flex size-full items-center justify-center bg-bg-neutral text-icon-subtle">
								<PlusIcon size="small" />
							</span>
						</Avatar>
					</div>
				)}
				<PopoverContent
					align="start"
					aria-label="Agent assignment"
					className="max-h-none w-[360px] gap-0 overflow-hidden rounded-xl p-0"
					positionerClassName={positionerClassName}
					side={side}
					sideOffset={8}
					style={{ boxShadow: token("elevation.shadow.overlay") }}
				>
					{menu}
				</PopoverContent>
			</Popover>
		</TooltipProvider>
	);
}
