"use client";

import { useState, type ReactNode } from "react";

import {
	AgentSelector,
	type AgentSelectorAgent,
} from "@/components/blocks/agent-selector";
import { AssignedAgentsMenu } from "@/components/blocks/agent-assignment/components/assigned-agents-menu";
import { AssignmentAvatar } from "@/components/blocks/agent-assignment/components/assignment-avatar";
import { Avatar } from "@/components/ui/avatar";
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
	statusLabel: string;
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
	onCreateAgent?: () => void;
	pinnedItemsLabel?: string;
	positionerClassName?: string;
	triggerLabel?: string;
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
	onCreateAgent,
	pinnedItemsLabel,
	positionerClassName = "z-[502]",
	triggerLabel = "Edit agents",
}: Readonly<AgentAssignmentProps>) {
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState("");
	const [view, setView] = useState<"assigned" | "selector">("assigned");
	const [pinnedAgentIds, setPinnedAgentIds] = useState<readonly string[]>(defaultPinnedAgentIds);
	const assignedAgentIds = assignedAgents.map((agent) => agent.id);
	const effectiveView = assignedAgents.length === 0 ? "selector" : view;
	const shown = assignedAgents.slice(0, maxVisibleAgents);

	const handleOpenChange = (nextOpen: boolean) => {
		setOpen(nextOpen);
		if (!nextOpen) {
			setQuery("");
			setView("assigned");
		}
	};

	const handleFooterAction = (action?: () => void) => {
		handleOpenChange(false);
		action?.();
	};

	const handleAgentToggle = (agentId: string) => {
		const agent = agents.find((candidate) => candidate.id === agentId);
		if (!agent) {
			return;
		}
		if (!assignedAgentIds.includes(agentId)) {
			onAgentAssign?.(agent);
		}
		const nextAssignedAgentIds = assignedAgentIds.includes(agentId)
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

	return (
		<TooltipProvider>
			<Popover onOpenChange={handleOpenChange} open={open}>
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
				<PopoverContent
					align="start"
					aria-label="Agent assignment"
					className="max-h-none w-[360px] gap-0 overflow-hidden rounded-xl p-0"
					positionerClassName={positionerClassName}
					sideOffset={8}
					style={{ boxShadow: token("elevation.shadow.overlay") }}
				>
					{effectiveView === "assigned" ? (
						<AssignedAgentsMenu
							onAddAgent={() => setView("selector")}
							onArchiveAgent={handleArchiveAgent}
							onSelectAgent={handleAssignedAgentSelect}
							rows={assignedAgents}
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
							selectionMode="single"
							selectedAgentIds={assignedAgentIds}
						/>
					)}
				</PopoverContent>
			</Popover>
		</TooltipProvider>
	);
}
