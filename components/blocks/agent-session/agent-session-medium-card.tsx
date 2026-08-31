"use client";

import { motion, useReducedMotion } from "motion/react";

import AddIcon from "@atlaskit/icon/core/add";

import type { JiraIssueAgentSessionDragBinding } from "@/components/blocks/jira-issue/agent-session-drag";
import { AgentAvatarVisual } from "@/components/ui-custom/agent-avatar-visual";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

import {
	AGENT_SESSION_ARRIVAL_OFFSET_PX,
	AGENT_SESSION_ARRIVAL_TRANSITION,
} from "./agent-session-arrival-motion";
import { AgentSessionMediumDrag } from "./agent-session-medium-drag";
import { AgentSessionMediumMoreMenu } from "./agent-session-medium-more-menu";
import type { AgentSessionItem } from "./agent-session-types";

function actorInitials(name: string): string {
	return (
		name
			.split(" ")
			.filter(Boolean)
			.slice(0, 2)
			.map((word) => word[0]?.toUpperCase())
			.join("") || "?"
	);
}

function stopSessionDrag(event: { stopPropagation: () => void }) {
	event.stopPropagation();
}

export function AgentSessionMediumCard({
	flyout,
	isArriving,
	isNew,
	item,
	onAttach,
	onCreateWorkItem,
	onSubtasks,
	onView,
	sessionDrag,
}: Readonly<{
	isArriving: boolean;
	isNew: boolean;
	item: AgentSessionItem;
	flyout: boolean;
	onAttach?: (item: AgentSessionItem) => void;
	onCreateWorkItem?: (item: AgentSessionItem) => void;
	onSubtasks?: (item: AgentSessionItem) => void;
	onView?: (item: AgentSessionItem) => void;
	sessionDrag?: JiraIssueAgentSessionDragBinding;
}>) {
	const shouldReduceMotion = useReducedMotion();
	const shouldPlayArrival = isArriving && !shouldReduceMotion;
	const invoker = item.invokedBy;
	const label = invoker === undefined ? item.agent.name : `${item.agent.name} with ${invoker.name}`;
	const className = cn(
		"group/session-card relative flex h-[33px] w-[276px] items-center gap-2 rounded-[10px] border border-transparent bg-bg-accent-gray-subtlest px-3 text-text hover:bg-bg-accent-gray-subtlest-hovered",
		isNew ? "ring-1 ring-border-discovery" : null,
	);

	function renderCard(bind: Record<string, unknown> | undefined) {
		const identity = (
			<>
				<AgentAvatarVisual
					avatarSrc={item.agent.avatarSrc}
					brandName={item.agent.brandName}
					fallbackText={item.agent.name.slice(0, 1)}
					label={item.agent.name}
					sizePx={16}
					vpkLogo={item.agent.vpkLogo}
				/>
				<span className="min-w-0 flex-1 truncate text-left text-xs font-normal leading-4">
					{label}
				</span>
			</>
		);
		const actions = (
			<span className="flex shrink-0 items-center gap-0">
				<AgentSessionMediumMoreMenu
					label={label}
					onCreateWorkItem={onCreateWorkItem ? () => onCreateWorkItem(item) : undefined}
					onSubtasks={onSubtasks ? () => onSubtasks(item) : undefined}
				/>
				<Button
					aria-label={`Attach ${label} to work item`}
					onClick={() => onAttach?.(item)}
					onPointerDown={stopSessionDrag}
					size="icon-compact"
					type="button"
					variant="ghost"
				>
					<Icon className="text-icon" render={<AddIcon label="" size="small" />} />
				</Button>
				{invoker === undefined ? null : (
					<span
						className="flex size-6 shrink-0 items-center justify-center -mr-1"
						data-slot="jira-issue-assignee-slot"
					>
						<Avatar label={invoker.name} size="xs">
							{invoker.avatarSrc ? <AvatarImage alt="" src={invoker.avatarSrc} /> : null}
							<AvatarFallback>{actorInitials(invoker.name)}</AvatarFallback>
						</Avatar>
					</span>
				)}
			</span>
		);

		return (
			<div className={className} data-new={isNew || undefined}>
				{isNew ? (
					<>
						<span className="sr-only">Newly synced, not yet reviewed</span>
						<span aria-hidden="true" className="absolute left-1 top-1 size-1 rounded-full bg-icon-discovery" />
					</>
				) : null}
				{onView === undefined && !flyout && !bind ? (
					<span className="flex min-w-0 flex-1 items-center gap-1">{identity}</span>
				) : (
					<Button
						aria-label={`${onView === undefined ? "Preview" : "Open"} ${label} session`}
						aria-roledescription={bind ? "Draggable agent session" : undefined}
						className="h-auto! min-w-0 flex-1 justify-start gap-1 rounded-none! border-0 px-0! py-0! hover:bg-transparent active:bg-transparent"
						data-slot={bind ? "jira-issue-agent-row" : undefined}
						draggable={false}
						onClick={onView === undefined ? undefined : () => onView(item)}
						type="button"
						variant="ghost"
						{...bind}
					>
						{identity}
					</Button>
				)}
				{actions}
			</div>
		);
	}

	return (
		<motion.div
			animate={shouldPlayArrival ? { opacity: 1, y: 0 } : undefined}
			data-new={isNew || undefined}
			initial={shouldPlayArrival ? { opacity: 0, y: AGENT_SESSION_ARRIVAL_OFFSET_PX } : false}
			style={{ willChange: shouldPlayArrival ? "opacity, transform" : undefined }}
			transition={AGENT_SESSION_ARRIVAL_TRANSITION}
		>
			<AgentSessionMediumDrag
				item={item}
				sessionDrag={sessionDrag}
				shouldReduceMotion={shouldReduceMotion}
			>
				{renderCard}
			</AgentSessionMediumDrag>
		</motion.div>
	);
}
