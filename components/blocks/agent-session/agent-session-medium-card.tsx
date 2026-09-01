"use client";

import { motion, useReducedMotion } from "motion/react";

import LinkIcon from "@atlaskit/icon/core/link";

import type { JiraIssueAgentSessionDragBinding } from "@/components/blocks/jira-issue/agent-session-drag";
import { uncapturedWorkLinkLabel } from "@/components/blocks/jira-issue/lib";
import { AgentAvatarVisual } from "@/components/ui-custom/agent-avatar-visual";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
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
	isHighlighted = false,
	isNew,
	issueKey,
	item,
	onAttach,
	onCreateWorkItem,
	onSubtasks,
	onView,
	sessionDrag,
}: Readonly<{
	isArriving: boolean;
	/** Lit from the Untracked work column hovering this same session. */
	isHighlighted?: boolean;
	isNew: boolean;
	issueKey?: string;
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
	/**
	 * The row shows what the session is about, not who is in it. Both the agent
	 * mark and the invoker avatar already sit on this row, so spending its one
	 * line of copy on "Claude with Jordan Okafor" says nothing the two avatars
	 * have not said. Identity still carries the accessible names, where there is
	 * no avatar to read it off.
	 */
	const sessionTitle = item.shortTitle ?? item.title;
	const identityLabel = invoker === undefined
		? item.agent.name
		: `${item.agent.name} with ${invoker.name}`;
	const linkLabel = uncapturedWorkLinkLabel(issueKey ?? item.sessionDetails?.issueKey);
	const className = cn(
		"group/session-card relative flex h-[33px] w-[276px] items-center gap-2 rounded-[10px] border border-transparent px-3 text-text",
		"transition-[background-color] duration-xxshort ease-out-practical motion-reduce:transition-none",
		// Lit from the column, the pointer is nowhere near this row, so it borrows
		// the row's own hover rung: the board reads as if the pointer were on the
		// twin, which is exactly the relationship the column hover is claiming.
		isHighlighted
			? "bg-bg-accent-gray-subtlest-hovered"
			: "bg-bg-accent-gray-subtlest hover:bg-bg-accent-gray-subtlest-hovered",
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
				<span className="min-w-0 flex-1 truncate text-left text-xs font-normal leading-4 text-text-subtlest">
					{sessionTitle}
				</span>
			</>
		);
		const actions = (
			<span className="flex shrink-0 items-center gap-0">
				<AgentSessionMediumMoreMenu
					label={`${sessionTitle} — ${identityLabel}`}
					onCreateWorkItem={onCreateWorkItem ? () => onCreateWorkItem(item) : undefined}
					onSubtasks={onSubtasks ? () => onSubtasks(item) : undefined}
				/>
				<TooltipProvider>
					<Tooltip>
						<TooltipTrigger
							render={
								<Button
									aria-label={linkLabel}
									onClick={() => onAttach?.(item)}
									onPointerDown={stopSessionDrag}
									size="icon-compact"
									type="button"
									variant="ghost"
								/>
							}
						>
							<Icon className="text-icon-subtle" render={<LinkIcon label="" size="small" />} />
						</TooltipTrigger>
						<TooltipContent>{linkLabel}</TooltipContent>
					</Tooltip>
				</TooltipProvider>
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
			<div className={className} data-highlighted={isHighlighted || undefined} data-new={isNew || undefined}>
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
						aria-label={`${onView === undefined ? "Preview" : "Open"} ${sessionTitle} — ${identityLabel} session`}
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
