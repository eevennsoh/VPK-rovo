"use client";

import { AnimatePresence, motion, useReducedMotion, type Transition } from "motion/react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import AiAgentIcon from "@atlaskit/icon/core/ai-agent";
import CrossIcon from "@atlaskit/icon/core/cross";
import DeleteIcon from "@atlaskit/icon/core/delete";
import EditBulkIcon from "@atlaskit/icon/core/edit-bulk";
import EyeOpenIcon from "@atlaskit/icon/core/eye-open";
import ProjectStatusIcon from "@atlaskit/icon/core/project-status";
import CursorIcon from "@atlaskit/icon-lab/core/cursor";
import DiagramSymbolMergeIcon from "@atlaskit/icon-lab/core/diagram-symbol-merge";

import {
	AgentSelector,
	type AgentSelectorAgent,
} from "@/components/blocks/agent-selector";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

const TOOLBAR_ENTER: Transition = {
	duration: 0.25,
	ease: [0, 0.4, 0, 1],
}; // duration-slow + ease-out
const TOOLBAR_EXIT: Transition = {
	duration: 0.2,
	ease: [0.6, 0, 0.8, 0.6],
}; // duration-medium + ease-in
const TOOLBAR_REDUCED: Transition = { duration: 0 };

const ACTION_BUTTON_CLASS =
	"h-8 gap-1.5 px-2 text-text-inverse [&_[data-slot=icon]]:text-icon-inverse [&_svg]:text-icon-inverse hover:bg-bg-inverse-subtle-hovered hover:text-text-inverse active:bg-bg-inverse-subtle-pressed active:text-text-inverse aria-expanded:border-transparent aria-expanded:bg-bg-inverse-subtle-pressed aria-expanded:text-text-inverse focus-visible:border-border-inverse focus-visible:ring-border-inverse/40";

export interface JiraToolbarProps {
	agents: readonly AgentSelectorAgent[];
	className?: string;
	onAgentAssignmentChange: (agentId: string, assigned: boolean) => void;
	onBrowseAgents?: () => void;
	onClearSelection: () => void;
	onCreateAgent?: () => void;
	onDelete?: () => void;
	onEditFields?: () => void;
	onMerge?: () => void;
	onSelectAll?: () => void;
	onStatusChange: (status: string) => void;
	onWatchOptions?: () => void;
	selectedAgentIds?: readonly string[];
	selectedCount: number;
	selectedStatus?: string | null;
	statusOptions: readonly string[];
}

interface JiraToolbarActionProps {
	children: ReactNode;
	icon: ReactNode;
	onClick?: () => void;
}

function JiraToolbarAction({
	children,
	icon,
	onClick,
}: Readonly<JiraToolbarActionProps>) {
	return (
		<Button
			className={ACTION_BUTTON_CLASS}
			onClick={onClick}
			type="button"
			variant="ghost"
		>
			{icon}
			{children}
		</Button>
	);
}

function ToolbarSeparator() {
	return <span aria-hidden="true" className="mx-1 h-6 w-px shrink-0 bg-border-inverse opacity-30" />;
}

export function JiraToolbar({
	agents,
	className,
	onAgentAssignmentChange,
	onBrowseAgents,
	onClearSelection,
	onCreateAgent,
	onDelete,
	onEditFields,
	onMerge,
	onSelectAll,
	onStatusChange,
	onWatchOptions,
	selectedAgentIds = [],
	selectedCount,
	selectedStatus,
	statusOptions,
}: Readonly<JiraToolbarProps>) {
	const shouldReduceMotion = useReducedMotion();
	const [agentSelectorOpen, setAgentSelectorOpen] = useState(false);
	const [agentQuery, setAgentQuery] = useState("");
	const selectedAgentIdSet = useMemo(
		() => new Set(selectedAgentIds),
		[selectedAgentIds],
	);
	const transition = shouldReduceMotion ? TOOLBAR_REDUCED : TOOLBAR_ENTER;

	const handleAgentSelectorOpenChange = (open: boolean) => {
		setAgentSelectorOpen(open);
		if (!open) {
			setAgentQuery("");
		}
	};

	useEffect(() => {
		if (selectedCount === 0) {
			return;
		}

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				onClearSelection();
			}
		};

		window.addEventListener("keydown", handleKeyDown, true);
		return () => window.removeEventListener("keydown", handleKeyDown, true);
	}, [onClearSelection, selectedCount]);

	return (
		<AnimatePresence initial={false}>
			{selectedCount > 0 ? (
				<div
					aria-label={`${selectedCount} card${selectedCount === 1 ? "" : "s"} selected. Bulk actions available.`}
					className={cn(
						"pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4",
						className,
					)}
					data-slot="jira-toolbar-positioner"
					role="region"
				>
					<motion.div
						animate={{ opacity: 1, y: 0 }}
						className="pointer-events-auto max-w-full rounded-lg bg-bg-neutral-bold shadow-xl"
						data-color-mode="light"
						data-slot="jira-toolbar"
						data-subtree-theme=""
						data-theme="light:light spacing:spacing typography:typography shape:shape"
						exit={{
							opacity: shouldReduceMotion ? 1 : 0,
							y: shouldReduceMotion ? 0 : 16,
							transition: shouldReduceMotion ? TOOLBAR_REDUCED : TOOLBAR_EXIT,
						}}
						initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
						style={{ willChange: "transform, opacity" }}
						transition={transition}
					>
						<div className="scrollbar-none flex h-12 max-w-[calc(100vw-2rem)] min-w-0 items-center overflow-x-auto overscroll-x-contain px-2">
							<div className="inline-flex min-w-max items-center">
								<div aria-live="polite" className="flex h-8 shrink-0 items-center gap-2 px-2 text-sm font-medium text-text-inverse">
									<Badge
										className="h-6 min-w-6 rounded-sm bg-bg-inverse-subtle px-1.5 text-text-inverse hover:bg-bg-inverse-subtle"
										max={false}
									>
										{selectedCount}
									</Badge>
									<span>selected</span>
								</div>
								<JiraToolbarAction
									icon={<Icon render={<CursorIcon label="" />} />}
									onClick={onSelectAll}
								>
									Select all
								</JiraToolbarAction>
								<ToolbarSeparator />
								<DropdownMenu open={agentSelectorOpen} onOpenChange={handleAgentSelectorOpenChange}>
									<DropdownMenuTrigger
										render={<Button className={ACTION_BUTTON_CLASS} type="button" variant="ghost" />}
									>
										<Icon render={<AiAgentIcon label="" />} />
										Assign agents
									</DropdownMenuTrigger>
									<DropdownMenuContent
										align="start"
										className="max-h-none w-[360px] overflow-hidden p-0"
										positionerClassName="z-[501]"
										side="top"
										sideOffset={8}
									>
										<AgentSelector
											agents={agents}
											onAgentToggle={(agentId) => {
												onAgentAssignmentChange(agentId, !selectedAgentIdSet.has(agentId));
											}}
											onBrowseAgents={() => onBrowseAgents?.()}
											onCreateAgent={() => onCreateAgent?.()}
											onQueryChange={setAgentQuery}
											query={agentQuery}
											selectedAgentIds={selectedAgentIds}
										/>
									</DropdownMenuContent>
								</DropdownMenu>
								<JiraToolbarAction
									icon={<Icon render={<EditBulkIcon label="" />} />}
									onClick={onEditFields}
								>
									Edit fields
								</JiraToolbarAction>
								<DropdownMenu>
									<DropdownMenuTrigger
										render={<Button className={ACTION_BUTTON_CLASS} type="button" variant="ghost" />}
									>
										<Icon render={<ProjectStatusIcon label="" />} />
										Change status
									</DropdownMenuTrigger>
									<DropdownMenuContent
										align="start"
										positionerClassName="z-[501]"
										side="top"
										sideOffset={8}
									>
										<DropdownMenuGroup>
											{statusOptions.map((status) => (
												<DropdownMenuItem
													key={status}
													onSelect={() => onStatusChange(status)}
													selected={selectedStatus === status}
												>
													{status}
												</DropdownMenuItem>
											))}
										</DropdownMenuGroup>
									</DropdownMenuContent>
								</DropdownMenu>
								{selectedCount > 1 ? (
									<JiraToolbarAction
										icon={<Icon render={<DiagramSymbolMergeIcon label="" />} />}
										onClick={onMerge}
									>
										Merge
									</JiraToolbarAction>
								) : null}
								<JiraToolbarAction
									icon={<Icon render={<EyeOpenIcon label="" />} />}
									onClick={onWatchOptions}
								>
									Watch options
								</JiraToolbarAction>
								<JiraToolbarAction
									icon={<Icon render={<DeleteIcon label="" />} />}
									onClick={onDelete}
								>
									Delete
								</JiraToolbarAction>
								<ToolbarSeparator />
								<Button
									aria-label="Clear selection"
									className="size-8 text-text-inverse [&_[data-slot=icon]]:text-icon-inverse [&_svg]:text-icon-inverse hover:bg-bg-inverse-subtle-hovered active:bg-bg-inverse-subtle-pressed focus-visible:border-border-inverse focus-visible:ring-border-inverse/40"
									onClick={onClearSelection}
									shape="circle"
									size="icon"
									type="button"
									variant="ghost"
								>
									<Icon render={<CrossIcon label="" size="small" />} />
								</Button>
							</div>
						</div>
					</motion.div>
				</div>
			) : null}
		</AnimatePresence>
	);
}

export type { AgentSelectorAgent as JiraToolbarAgent };
