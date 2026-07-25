"use client";

import { useState, type ReactNode } from "react";

import MergeSuccessIcon from "@atlaskit/icon/core/merge-success";
import PullRequestIcon from "@atlaskit/icon/core/pull-request";
import StatusInformationIcon from "@atlaskit/icon/core/status-information";

import {
	getRovoAgentProfile,
	ROVO_AGENT_PROFILES,
} from "@/app/data/directory/agents";
import { AgentAvatarVisual } from "@/components/ui-custom/agent-avatar-visual";
import { AnimatedDots } from "@/components/ui-custom/animated-dots";
import { EntityCardAgentProfile } from "@/components/ui-custom/entity-card";
import { Shimmer } from "@/components/ui-custom/shimmer";
import { Button } from "@/components/ui/button";
import { ElapsedTime, RelativeTime } from "@/components/ui/elapsed-time";
import {
	HoverCard,
	HoverCardContent,
	HoverCardTrigger,
} from "@/components/ui/hover-card";
import { IconTile } from "@/components/ui/icon-tile";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

import type {
	JiraAgentSessionItem,
	JiraAgentSessionPrStatus,
	JiraAgentSessionState,
	JiraAgentSessionVariant,
} from "./jira-agent-session-types";

/**
 * State → title-line + lifecycle treatment. `running` shows a solid title with a
 * trailing rainbow spinner; `needs-input` keeps the task title, adds animated
 * dots, and shows a trailing info icon; `complete` shows a solid title with no
 * lifecycle indicator.
 *
 * The trailing indicator itself is rendered by {@link LifecycleIndicator};
 * `showLifecycle` only gates whether the row reserves that trailing slot.
 */
const STATE_META: Record<
	JiraAgentSessionState,
	{
		shimmerTitle: boolean;
		showDots: boolean;
		/** Whether the row renders a trailing lifecycle indicator. */
		showLifecycle: boolean;
	}
> = {
	running: {
		shimmerTitle: false,
		showDots: false,
		showLifecycle: true,
	},
	"needs-input": {
		shimmerTitle: true,
		showDots: true,
		showLifecycle: true,
	},
	complete: {
		shimmerTitle: false,
		showDots: false,
		showLifecycle: false,
	},
};

/**
 * Pull-request status → icon + color, matching the Jira queue card
 * (`components/blocks/product-sidebar/variants/jira.tsx`).
 */
const PR_STATUS_META: Record<
	JiraAgentSessionPrStatus,
	{ Icon: typeof PullRequestIcon; label: string; colorClass: string }
> = {
	created: {
		Icon: PullRequestIcon,
		label: "PR created",
		colorClass: "text-icon-success",
	},
	merged: {
		Icon: MergeSuccessIcon,
		label: "PR merged",
		colorClass: "text-icon-accent-purple",
	},
};

function MetadataDot() {
	return (
		<span aria-hidden="true" className="text-text-subtlest">
			·
		</span>
	);
}

function getAgentPublisher(byline: string): string {
	return /\bby\s+(.+)$/iu.exec(byline)?.[1]?.trim() ?? byline;
}

/**
 * Trailing per-state lifecycle indicator, mirroring the Jira queue card
 * (`components/blocks/product-sidebar/variants/jira.tsx`): `running` shows the
 * Rovo rainbow spinner, `needs-input` an information icon, `complete` nothing.
 * Each glyph sits in a 24×24 transparent {@link IconTile} (12px design inside),
 * so the trailing slot reads at a consistent size across states.
 */
function LifecycleIndicator({
	state,
}: Readonly<{ state: JiraAgentSessionState }>) {
	switch (state) {
		case "running":
			return (
				<IconTile
					icon={<Spinner label="Running" variant="rainbow" />}
					iconSize="small"
					label="Running"
					size="small"
					variant="transparent"
				/>
			);
		case "needs-input":
			return (
				<IconTile
					icon={
						<span className="grid place-items-center leading-none text-icon-information">
							<StatusInformationIcon
								color="currentColor"
								label=""
								size="small"
							/>
						</span>
					}
					iconSize="small"
					label="Waiting for input"
					size="small"
					title="Waiting for input"
					variant="transparent"
				/>
			);
		case "complete":
			return null;
	}
}

function JiraAgentSessionTime({ item }: Readonly<{ item: JiraAgentSessionItem }>) {
	const [seededStartedAtMs] = useState(
		() => Date.now() - Math.max(0, item.elapsedSeconds ?? 0) * 1000,
	);

	return item.state === "complete" ? (
		<RelativeTime
			fallback="Just now"
			secondsAgo={item.completedSecondsAgo}
			timestampMs={item.completedAtMs}
		/>
	) : (
		<ElapsedTime startedAtMs={item.startedAtMs ?? seededStartedAtMs} />
	);
}

export function JiraAgentSessionActivityHeader({
	item,
	action,
	onView,
}: Readonly<{
	item: JiraAgentSessionItem;
	action?: ReactNode;
	onView?: (item: JiraAgentSessionItem) => void;
}>) {
	const stateMeta = STATE_META[item.state];
	const prMeta = item.prStatus ? PR_STATUS_META[item.prStatus] : null;
	const PrIcon = prMeta?.Icon ?? null;

	return (
		<div className="flex min-w-0 items-center gap-3">
			<AgentAvatarVisual
				avatarClassName="shrink-0"
				avatarSrc={item.agent.avatarSrc}
				brandName={item.agent.brandName}
				label={item.agent.name}
				sizePx={32}
				vpkLogo={item.agent.vpkLogo}
			/>
			<div className="min-w-0 flex-1">
				<div className="flex min-w-0 items-center">
					{stateMeta.shimmerTitle ? (
						<Shimmer
							as="span"
							className="min-w-0 truncate text-sm font-medium"
							duration={1.4}
							spread={2}
						>
							{item.title}
						</Shimmer>
					) : (
						<span className="min-w-0 truncate text-sm font-medium text-text">
							{item.title}
						</span>
					)}
					{stateMeta.showDots ? <AnimatedDots /> : null}
				</div>
				<div className="flex min-w-0 items-center gap-1 text-xs leading-4 text-text-subtle">
					<span className="shrink-0" title={item.state === "complete" ? "Last update" : "Agent runtime"}>
						<JiraAgentSessionTime item={item} />
					</span>
					<MetadataDot />
					<span className="truncate">{item.agent.name}</span>
					{prMeta && PrIcon ? (
						<>
							<MetadataDot />
							<span className="flex shrink-0 items-center gap-1">
								<span className={cn("grid size-4 place-items-center", prMeta.colorClass)}>
									<PrIcon color="currentColor" label="" size="small" />
								</span>
								<span>{prMeta.label}</span>
							</span>
						</>
					) : null}
				</div>
			</div>
			{stateMeta.showLifecycle ? <LifecycleIndicator state={item.state} /> : null}
			<Button onClick={() => onView?.(item)} size="compact" type="button" variant="outline">
				View
			</Button>
			{action ? <div className="shrink-0">{action}</div> : null}
		</div>
	);
}

function CardActions({
	item,
	onView,
}: Readonly<{
	item: JiraAgentSessionItem;
	onView?: (item: JiraAgentSessionItem) => void;
}>) {
	return (
		<div
			className="pointer-events-none invisible ml-0 flex w-0 shrink-0 items-center overflow-hidden opacity-0 transition-[width,margin,opacity] duration-fast ease-out-practical group-hover:pointer-events-auto group-hover:visible group-hover:ml-3 group-hover:w-auto group-hover:overflow-visible group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:visible group-focus-within:ml-3 group-focus-within:w-auto group-focus-within:overflow-visible group-focus-within:opacity-100 motion-reduce:transition-none"
		>
			<Button onClick={() => onView?.(item)} size="compact" variant="outline">
				View
			</Button>
		</div>
	);
}

export function JiraAgentSessionCard({
	isSelected = false,
	item,
	onView,
	variant,
}: Readonly<{
	isSelected?: boolean;
	item: JiraAgentSessionItem;
	onView?: (item: JiraAgentSessionItem) => void;
	variant: JiraAgentSessionVariant;
}>) {
	const stateMeta = STATE_META[item.state];
	const prMeta = item.prStatus ? PR_STATUS_META[item.prStatus] : null;
	const PrIcon = prMeta?.Icon ?? null;
	const agentProfile = item.agent.id
		? getRovoAgentProfile(item.agent.id)
		: ROVO_AGENT_PROFILES.find(
			(profile) => profile.name.toLocaleLowerCase() === item.agent.name.toLocaleLowerCase(),
		);
	const isCompact = variant === "compact";
	const titleClassName = cn(
		"min-w-0 truncate font-medium",
		isCompact ? "text-xs" : "text-sm",
	);

	return (
		<HoverCard closeDelay={80} openDelay={120}>
			<HoverCardTrigger
				closeDelay={80}
				delay={120}
				render={(
					<li
						aria-current={isSelected ? "true" : undefined}
						className={cn(
							"group relative flex items-center gap-0 p-3 transition-colors duration-xxshort ease-out-practical hover:bg-bg-neutral-subtle-hovered",
							isSelected && "bg-bg-selected hover:bg-bg-selected-hovered",
						)}
					/>
				)}
			>
			<AgentAvatarVisual
				avatarClassName="mr-3 shrink-0"
				avatarSrc={item.agent.avatarSrc}
				brandName={item.agent.brandName}
				label={item.agent.name}
				sizePx={isCompact ? 24 : 32}
				vpkLogo={item.agent.vpkLogo}
			/>
			<button
				aria-pressed={isSelected}
				className="flex min-w-0 flex-1 flex-col items-start justify-center rounded-xs text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
				onClick={() => onView?.(item)}
				type="button"
			>
				<span className="flex w-full min-w-0 items-center gap-0 overflow-hidden">
					{stateMeta.shimmerTitle ? (
						<Shimmer
							as="span"
							className={titleClassName}
							duration={1.4}
							spread={2}
						>
							{item.title}
						</Shimmer>
					) : (
						<span className={cn(titleClassName, "text-text")}>
							{item.title}
						</span>
					)}
					{stateMeta.showDots ? <AnimatedDots /> : null}
				</span>
				<span className="flex w-full min-w-0 items-center gap-1 overflow-hidden text-xs text-text-subtlest">
					<span className="shrink-0" title={item.state === "complete" ? "Last update" : "Agent runtime"}>
						<JiraAgentSessionTime item={item} />
					</span>
					<MetadataDot />
					<span className="min-w-0 truncate">{item.agent.name}</span>
					{prMeta && PrIcon ? (
						<>
							<MetadataDot />
							<span className="flex min-w-0 shrink items-center gap-1">
								<span
									className={cn(
										"grid size-4 shrink-0 place-items-center",
										prMeta.colorClass,
									)}
								>
									<PrIcon color="currentColor" label="" size="small" />
								</span>
								<span className="truncate text-text-subtle">{prMeta.label}</span>
							</span>
						</>
					) : null}
				</span>
			</button>
			{stateMeta.showLifecycle ? (
				<span
					className={cn(
						"ml-3 flex w-6 shrink-0 items-center overflow-hidden opacity-100 transition-[width,margin,opacity] duration-fast ease-out-practical motion-reduce:transition-none",
						!isSelected &&
							"group-hover:ml-0 group-hover:w-0 group-hover:opacity-0 group-focus-within:ml-0 group-focus-within:w-0 group-focus-within:opacity-0",
					)}
				>
					<LifecycleIndicator state={item.state} />
				</span>
			) : null}
			{isSelected ? null : (
				<CardActions
					item={item}
					onView={onView}
				/>
			)}
			</HoverCardTrigger>
			{agentProfile ? (
				<HoverCardContent
					align="start"
					alignOffset={0}
					className="w-auto max-w-[calc(100vw-32px)] bg-transparent p-0 shadow-none"
					data-testid={`jira-agent-profile-${agentProfile.id}`}
					positionerClassName="z-[575] after:pointer-events-auto after:absolute after:-inset-2 after:-z-10 after:content-['']"
					side="left"
					sideOffset={12}
				>
					<EntityCardAgentProfile
						attributionKind={agentProfile.attributionKind}
						avatarSrc={agentProfile.avatarSrc}
						description={agentProfile.description}
						name={agentProfile.name}
						partnerBrandName={agentProfile.brandName}
						partnerName={getAgentPublisher(agentProfile.byline)}
						surface="overlay"
						variant="preview"
						verified={agentProfile.verified}
					/>
				</HoverCardContent>
			) : null}
		</HoverCard>
	);
}
