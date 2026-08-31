"use client";

import { motion, useReducedMotion } from "motion/react";

import AddIcon from "@atlaskit/icon/core/add";

import { AgentAvatarVisual } from "@/components/ui-custom/agent-avatar-visual";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

import {
	AGENT_SESSION_ARRIVAL_OFFSET_PX,
	AGENT_SESSION_ARRIVAL_TRANSITION,
} from "./agent-session-arrival-motion";
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

export function AgentSessionMediumCard({
	flyout,
	isArriving,
	isNew,
	item,
	onView,
}: Readonly<{
	isArriving: boolean;
	isNew: boolean;
	item: AgentSessionItem;
	onView?: (item: AgentSessionItem) => void;
	flyout: boolean;
}>) {
	const shouldReduceMotion = useReducedMotion();
	const shouldPlayArrival = isArriving && !shouldReduceMotion;
	const invoker = item.invokedBy;
	const label = invoker === undefined ? item.agent.name : `${item.agent.name} with ${invoker.name}`;
	const className = cn(
		"relative flex h-[33px] w-[276px] items-center rounded-[10px] bg-bg-accent-gray-subtlest px-3 text-text",
		isNew ? "ring-1 ring-border-discovery" : null,
	);
	const content = (
		<>
			{isNew ? (
				<>
					<span className="sr-only">Newly synced, not yet reviewed</span>
					<span aria-hidden="true" className="absolute left-1 top-1 size-1 rounded-full bg-icon-discovery" />
				</>
			) : null}
			<span className="flex min-w-0 flex-1 items-center gap-1.5">
				<AgentAvatarVisual
					avatarSrc={item.agent.avatarSrc}
					brandName={item.agent.brandName}
					fallbackText={item.agent.name.slice(0, 1)}
					label={item.agent.name}
					sizePx={16}
					vpkLogo={item.agent.vpkLogo}
				/>
				<span className="w-[160px] truncate text-left text-xs font-normal leading-4">
					{label}
				</span>
			</span>
			<span className="flex shrink-0 items-center gap-1.5">
				<Icon className="size-3 shrink-0 text-icon" render={<AddIcon label="" size="small" />} />
				{invoker === undefined ? null : (
					<Avatar label={invoker.name} size="xs">
						{invoker.avatarSrc ? <AvatarImage alt="" src={invoker.avatarSrc} /> : null}
						<AvatarFallback>{actorInitials(invoker.name)}</AvatarFallback>
					</Avatar>
				)}
			</span>
		</>
	);

	return (
		<motion.div
			animate={shouldPlayArrival ? { opacity: 1, y: 0 } : undefined}
			data-new={isNew || undefined}
			initial={shouldPlayArrival ? { opacity: 0, y: AGENT_SESSION_ARRIVAL_OFFSET_PX } : false}
			style={{ willChange: shouldPlayArrival ? "opacity, transform" : undefined }}
			transition={AGENT_SESSION_ARRIVAL_TRANSITION}
		>
			{onView === undefined && !flyout ? (
				<div className={className}>{content}</div>
			) : (
				<Button
					aria-label={`${onView === undefined ? "Preview" : "Open"} ${label} session`}
					className={cn(
						className,
						"h-[33px]! rounded-[10px]! hover:bg-bg-accent-gray-subtlest-hovered active:bg-bg-accent-gray-subtlest-pressed",
					)}
					onClick={onView === undefined ? undefined : () => onView(item)}
					type="button"
					variant="ghost"
				>
					{content}
				</Button>
			)}
		</motion.div>
	);
}
