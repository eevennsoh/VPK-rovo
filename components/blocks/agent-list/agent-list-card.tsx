"use client";

import { useState, type ReactNode } from "react";

import MergeSuccessIcon from "@atlaskit/icon/core/merge-success";
import PullRequestIcon from "@atlaskit/icon/core/pull-request";
import StatusInformationIcon from "@atlaskit/icon/core/status-information";

import { AgentAvatarVisual } from "@/components/ui-custom/agent-avatar-visual";
import { AnimatedDots } from "@/components/ui-custom/animated-dots";
import {
	AgentStates,
	type AgentStatesState,
} from "@/components/blocks/agent-states";
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
	AgentListItem,
	AgentListPrStatus,
	AgentListState,
	AgentListVariant,
} from "./agent-list-types";

/**
 * State → title-line + lifecycle treatment. `running` shows a solid title with a
 * trailing rainbow spinner; `needs-input` swaps the title for "Waiting for input"
 * (see {@link getSessionTitle}), adds animated dots, and shows a trailing info
 * icon; `complete` shows a solid title with no lifecycle indicator.
 *
 * The trailing indicator itself is rendered by {@link LifecycleIndicator};
 * `showLifecycle` only gates whether the row reserves that trailing slot.
 */
const STATE_META: Record<
	AgentListState,
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
	AgentListPrStatus,
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

/** Copy shown on the title line while a session is blocked awaiting a reply. */
const AWAITING_INPUT_TITLE = "Waiting for input";

/**
 * Title-line text for a session row. `needs-input` swaps the work-item title for
 * "Waiting for input", mirroring the Jira queue card's `JiraSessionLabel`
 * (`components/blocks/product-sidebar/variants/jira.tsx`), so the shimmering line
 * names the state the session is blocked on. Other states show the task title.
 */
function getSessionTitle(item: AgentListItem): string {
	return item.state === "needs-input" ? AWAITING_INPUT_TITLE : item.title;
}

function getAgentStatesState(state: AgentListState): AgentStatesState {
	switch (state) {
		case "running":
			return "working";
		case "needs-input":
			return "awaiting-input";
		case "complete":
			return "completed";
	}
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
}: Readonly<{ state: AgentListState }>) {
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

function AgentListTime({
	item,
	fallback = "Just now",
}: Readonly<{
	item: AgentListItem;
	fallback?: string;
}>) {
	const [seededStartedAtMs] = useState(
		() => Date.now() - Math.max(0, item.elapsedSeconds ?? 0) * 1000,
	);

	return item.state === "complete" ? (
		<RelativeTime
			fallback={fallback}
			secondsAgo={item.completedSecondsAgo}
			timestampMs={item.completedAtMs}
		/>
	) : (
		<ElapsedTime startedAtMs={item.startedAtMs ?? seededStartedAtMs} />
	);
}

export function AgentListActivityHeader({
	item,
	action,
	metadataPrefix,
	onView,
	timeFallback,
}: Readonly<{
	item: AgentListItem;
	action?: ReactNode;
	metadataPrefix?: ReactNode;
	onView?: (item: AgentListItem) => void;
	timeFallback?: string;
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
							{getSessionTitle(item)}
						</Shimmer>
					) : (
						<span className="min-w-0 truncate text-sm font-medium text-text">
							{getSessionTitle(item)}
						</span>
					)}
					{stateMeta.showDots ? <AnimatedDots /> : null}
				</div>
				<div className="flex min-w-0 items-center gap-1 text-xs leading-4 text-text-subtle">
					{metadataPrefix ? (
						<>
							{metadataPrefix}
							<MetadataDot />
						</>
					) : null}
					<span className="shrink-0" title={item.state === "complete" ? "Last update" : "Agent runtime"}>
						<AgentListTime fallback={timeFallback} item={item} />
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
			{onView ? (
				<Button onClick={() => onView(item)} size="compact" type="button" variant="outline">
					View
				</Button>
			) : null}
			{action ? <div className="shrink-0">{action}</div> : null}
		</div>
	);
}

function CardActions({
	item,
	onView,
}: Readonly<{
	item: AgentListItem;
	onView?: (item: AgentListItem) => void;
}>) {
	return (
		<div
			className="ml-3 hidden shrink-0 items-center group-hover:flex group-focus-within:flex"
		>
			<Button onClick={() => onView?.(item)} size="compact" variant="outline">
				View
			</Button>
		</div>
	);
}

export function AgentListCard({
	isSelected = false,
	item,
	onFlyoutSubmit,
	onView,
	variant,
}: Readonly<{
	isSelected?: boolean;
	item: AgentListItem;
	onFlyoutSubmit?: (prompt: string) => void;
	onView?: (item: AgentListItem) => void;
	variant: AgentListVariant;
}>) {
	const stateMeta = STATE_META[item.state];
	const prMeta = item.prStatus ? PR_STATUS_META[item.prStatus] : null;
	const PrIcon = prMeta?.Icon ?? null;
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
							"group relative flex items-center gap-0 transition-colors duration-xxshort ease-out-practical hover:bg-bg-neutral-subtle-hovered",
							isCompact ? "px-3 py-1.5" : "p-3",
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
							{getSessionTitle(item)}
						</Shimmer>
					) : (
						<span className={cn(titleClassName, "text-text")}>
							{getSessionTitle(item)}
						</span>
					)}
					{stateMeta.showDots ? <AnimatedDots /> : null}
				</span>
				<span className="flex w-full min-w-0 items-center gap-1 overflow-hidden text-xs text-text-subtlest">
					<span className="shrink-0" title={item.state === "complete" ? "Last update" : "Agent runtime"}>
						<AgentListTime item={item} />
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
						"ml-3 flex w-6 shrink-0 items-center",
						!isSelected &&
							"group-hover:hidden group-focus-within:hidden",
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
			<HoverCardContent
				align="start"
				alignOffset={0}
				className="w-auto max-w-[calc(100vw-32px)] bg-transparent p-0 shadow-none"
				data-testid={"agent-list-state-" + item.id}
				positionerClassName="z-[575] after:pointer-events-auto after:absolute after:-inset-2 after:-z-10 after:content-['']"
				side="left"
				sideOffset={12}
			>
				<AgentStates
					agent={{
						avatarSrc: item.agent.avatarSrc,
						brandName: item.agent.brandName,
						id: item.agent.id ?? item.id,
						name: item.agent.name,
					}}
					initialElapsedSeconds={item.elapsedSeconds}
					onSubmit={onFlyoutSubmit}
					onView={() => onView?.(item)}
					startedAtMs={item.startedAtMs}
					state={getAgentStatesState(item.state)}
				/>
			</HoverCardContent>
		</HoverCard>
	);
}
