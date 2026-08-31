"use client";

import { Button } from "@/components/ui/button";

import { AgentSessionMediumCard } from "./agent-session-medium-card";
import { AgentSessionNotchMark } from "./agent-session-notch";
import type { AgentSessionItem, AgentSessionVariant } from "./agent-session-types";

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
			aria-label={`${item.agent.name} session: ${item.title}`}
			className="group/notch flex h-5 w-8 items-center justify-center"
			role="img"
		>
			{content}
		</div>
	) : (
		<div className="group/notch flex h-5 w-8 items-center justify-center">
			<Button
				aria-label={`Open ${item.agent.name} session: ${item.title}`}
				className="h-5! w-8! rounded-xs! p-0"
				onClick={() => onView(item)}
				type="button"
				variant="ghost"
			>
				{content}
			</Button>
		</div>
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
		<AgentSessionMediumCard
			isArriving={isArriving}
			isNew={isNew}
			item={item}
			onView={onView}
		/>
	);
}
