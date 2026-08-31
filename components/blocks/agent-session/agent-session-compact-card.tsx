"use client";

import { useReducedMotion } from "motion/react";

import { JiraIssueAgentActivityRows, type JiraIssueAgentActivity } from "@/components/blocks/jira-issue/agent-activity";
import { Button } from "@/components/ui/button";

import { AgentSessionMediumCard } from "./agent-session-medium-card";
import { AgentSessionNotchMark } from "./agent-session-notch";
import type { AgentSessionItem, AgentSessionVariant } from "./agent-session-types";

function toAttachedActivity(item: AgentSessionItem): JiraIssueAgentActivity {
	return {
		agentBrandName: item.agent.brandName,
		avatarSrc: item.agent.avatarSrc,
		id: item.id,
		label: item.title,
		name: item.agent.name,
		state: item.state === "needs-input" || item.state === "attention"
			? "awaiting-input"
			: item.state === "complete"
				? "completed"
				: "working",
	};
}

function AttachedAgentSession({
	item,
	onView,
}: Readonly<{
	item: AgentSessionItem;
	onView?: (item: AgentSessionItem) => void;
}>) {
	const shouldReduceMotion = useReducedMotion();

	return (
		<div className="w-[276px] rounded-[10px] bg-bg-accent-gray-subtlest">
			<JiraIssueAgentActivityRows
				activities={[toAttachedActivity(item)]}
				onViewChat={onView === undefined ? undefined : () => onView(item)}
				shouldReduceMotion={shouldReduceMotion}
				usesStrokeChrome
			/>
		</div>
	);
}

function SmallAgentSession({
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
	const content = <AgentSessionNotchMark isArriving={isArriving} isNew={isNew} />;

	return onView === undefined && !flyout ? (
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
				aria-label={`${onView === undefined ? "Preview" : "Open"} ${item.agent.name} session: ${item.title}`}
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

export function AgentSessionCompactCard({
	flyout = false,
	isArriving = false,
	isNew = false,
	item,
	onView,
	variant,
}: Readonly<{
	isArriving?: boolean;
	isNew?: boolean;
	item: AgentSessionItem;
	flyout?: boolean;
	onView?: (item: AgentSessionItem) => void;
	variant: Exclude<AgentSessionVariant, "large">;
}>) {
	return variant === "small" ? (
		<SmallAgentSession
			flyout={flyout}
			isArriving={isArriving}
			isNew={isNew}
			item={item}
			onView={onView}
		/>
	) : variant === "medium-attached" ? (
		<AttachedAgentSession item={item} onView={onView} />
	) : (
		<AgentSessionMediumCard
			flyout={flyout}
			isArriving={isArriving}
			isNew={isNew}
			item={item}
			onView={onView}
		/>
	);
}
