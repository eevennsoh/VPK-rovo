"use client";

import AddIcon from "@atlaskit/icon/core/add";

import { AgentAvatarVisual } from "@/components/ui-custom/agent-avatar-visual";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

import { AgentSessionNotchMark } from "./agent-session-notch";
import type { AgentSessionItem, AgentSessionVariant } from "./agent-session-types";

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

function AgentIdentity({ item }: Readonly<{ item: AgentSessionItem }>) {
	return (
		<AgentAvatarVisual
			avatarSrc={item.agent.avatarSrc}
			brandName={item.agent.brandName}
			fallbackText={item.agent.name.slice(0, 1)}
			label={item.agent.name}
			sizePx={16}
			vpkLogo={item.agent.vpkLogo}
		/>
	);
}

function SmallAgentSession({
	isArriving,
	isNew,
	item,
	onView,
}: Readonly<{
	isArriving: boolean;
	isNew: boolean;
	item: AgentSessionItem;
	onView?: (item: AgentSessionItem) => void;
}>) {
	const content = <AgentSessionNotchMark isArriving={isArriving} isNew={isNew} />;

	return onView === undefined ? (
		<div
			aria-label={`${item.agent.name} session`}
			className="group/notch flex h-5 w-8 items-center justify-center"
			role="img"
		>
			{content}
		</div>
	) : (
		<div className="group/notch flex h-5 w-8 items-center justify-center">
			<Button
				aria-label={`Open ${item.agent.name} session`}
				className="h-5! w-8! rounded-xs! p-0"
				onClick={onView === undefined ? undefined : () => onView(item)}
				type="button"
				variant="ghost"
			>
				{content}
			</Button>
		</div>
	);
}

function MediumAgentSession({
	item,
	onView,
}: Readonly<{
	item: AgentSessionItem;
	onView?: (item: AgentSessionItem) => void;
}>) {
	const invoker = item.invokedBy ?? { name: "person A" };
	const label = `${item.agent.name} with ${invoker.name}`;
	const className = "flex h-[33px] w-[276px] items-center rounded-[10px] bg-bg-accent-gray-subtlest px-3 text-text";
	const content = (
		<>
			<span className="flex min-w-0 flex-1 items-center gap-1.5">
				<AgentIdentity item={item} />
				<span className="w-[160px] truncate text-left text-xs font-normal leading-4">
					{label}
				</span>
			</span>
			<span className="flex shrink-0 items-center gap-1.5">
				<Icon
					className="size-3 shrink-0 text-icon"
					render={<AddIcon label="" size="small" />}
				/>
				<Avatar label={invoker.name} size="xs">
					{invoker.avatarSrc ? <AvatarImage alt="" src={invoker.avatarSrc} /> : null}
					<AvatarFallback>{actorInitials(invoker.name)}</AvatarFallback>
				</Avatar>
			</span>
		</>
	);

	return onView === undefined ? (
		<div className={className}>{content}</div>
	) : (
		<Button
			aria-label={`Open ${label} session`}
			className={cn(
				className,
				"h-[33px]! rounded-[10px]! hover:bg-bg-accent-gray-subtlest-hovered active:bg-bg-accent-gray-subtlest-pressed",
			)}
			onClick={() => onView(item)}
			type="button"
			variant="ghost"
		>
			{content}
		</Button>
	);
}

export function AgentSessionCompactCard({
	isArriving = false,
	isNew = false,
	item,
	onView,
	variant,
}: Readonly<{
	isArriving?: boolean;
	isNew?: boolean;
	item: AgentSessionItem;
	onView?: (item: AgentSessionItem) => void;
	variant: Exclude<AgentSessionVariant, "large">;
}>) {
	return variant === "small" ? (
		<SmallAgentSession
			isArriving={isArriving}
			isNew={isNew}
			item={item}
			onView={onView}
		/>
	) : (
		<MediumAgentSession item={item} onView={onView} />
	);
}
