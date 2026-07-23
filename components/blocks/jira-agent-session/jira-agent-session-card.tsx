"use client";

import { useState, type ReactNode } from "react";

import MergeSuccessIcon from "@atlaskit/icon/core/merge-success";
import PullRequestIcon from "@atlaskit/icon/core/pull-request";
import StatusInformationIcon from "@atlaskit/icon/core/status-information";
import VideoStopOverlayIcon from "@atlaskit/icon/core/video-stop-overlay";

import { AgentAvatarVisual } from "@/components/ui-custom/agent-avatar-visual";
import { AnimatedDots } from "@/components/ui-custom/animated-dots";
import { Shimmer } from "@/components/ui-custom/shimmer";
import { Button } from "@/components/ui/button";
import { ElapsedTime, RelativeTime } from "@/components/ui/elapsed-time";
import { IconTile } from "@/components/ui/icon-tile";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

import type {
	JiraAgentSessionItem,
	JiraAgentSessionPrStatus,
	JiraAgentSessionState,
} from "./jira-agent-session-types";

/**
 * State → title-line + lifecycle treatment. `running` shows a solid title with a
 * trailing rainbow spinner; `needs-input` keeps the task title, adds animated
 * dots, and shows a trailing info icon; `complete` shows a solid title with no
 * lifecycle indicator. `running` and `needs-input` both expose a Stop action;
 * `complete` does not.
 *
 * The trailing indicator itself is rendered by {@link LifecycleIndicator};
 * `showLifecycle` only gates whether the row reserves that trailing slot.
 */
const STATE_META: Record<
	JiraAgentSessionState,
	{
		shimmerTitle: boolean;
		showDots: boolean;
		showStop: boolean;
		/** Whether the row renders a trailing lifecycle indicator. */
		showLifecycle: boolean;
	}
> = {
	running: {
		shimmerTitle: false,
		showDots: false,
		showStop: true,
		showLifecycle: true,
	},
	"needs-input": {
		shimmerTitle: true,
		showDots: true,
		showStop: true,
		showLifecycle: true,
	},
	complete: {
		shimmerTitle: false,
		showDots: false,
		showStop: false,
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
	showStop,
	onView,
	onStop,
}: Readonly<{
	item: JiraAgentSessionItem;
	showStop: boolean;
	onView?: (item: JiraAgentSessionItem) => void;
	onStop?: (item: JiraAgentSessionItem) => void;
}>) {
	return (
		<div className="pointer-events-none absolute inset-y-0 right-0 flex items-center gap-1 pr-3 pl-4 opacity-0 transition-opacity duration-fast ease-out-practical group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100 motion-reduce:transition-none">
			{showStop ? (
				<Button
					aria-label="Stop agent"
					className="[&_svg]:text-icon-danger!"
					onClick={() => onStop?.(item)}
					size="icon-compact"
					variant="outline"
				>
					<VideoStopOverlayIcon label="" />
				</Button>
			) : null}
			<Button onClick={() => onView?.(item)} size="compact" variant="outline">
				View
			</Button>
		</div>
	);
}

export function JiraAgentSessionCard({
	item,
	onView,
	onStop,
}: Readonly<{
	item: JiraAgentSessionItem;
	onView?: (item: JiraAgentSessionItem) => void;
	onStop?: (item: JiraAgentSessionItem) => void;
}>) {
	const stateMeta = STATE_META[item.state];
	const prMeta = item.prStatus ? PR_STATUS_META[item.prStatus] : null;
	const PrIcon = prMeta?.Icon ?? null;

	return (
		<li className="group relative flex items-center gap-3 p-3 transition-colors duration-xxshort ease-out-practical hover:bg-bg-neutral-subtle-hovered">
			<AgentAvatarVisual
				avatarClassName="shrink-0"
				avatarSrc={item.agent.avatarSrc}
				brandName={item.agent.brandName}
				label={item.agent.name}
				sizePx={32}
				vpkLogo={item.agent.vpkLogo}
			/>
			<button
				className="flex min-w-0 flex-1 flex-col items-start justify-center rounded-xs text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
				onClick={() => onView?.(item)}
				type="button"
			>
				<span className="flex w-full min-w-0 items-center gap-0">
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
				</span>
				<span className="flex w-full min-w-0 items-center gap-1 text-xs text-text-subtlest">
					<span className="shrink-0" title={item.state === "complete" ? "Last update" : "Agent runtime"}>
						<JiraAgentSessionTime item={item} />
					</span>
					<MetadataDot />
					<span className="truncate">{item.agent.name}</span>
					{prMeta && PrIcon ? (
						<>
							<MetadataDot />
							<span className="flex shrink-0 items-center gap-1">
								<span
									className={cn(
										"grid size-4 shrink-0 place-items-center",
										prMeta.colorClass,
									)}
								>
									<PrIcon color="currentColor" label="" size="small" />
								</span>
								<span className="text-text-subtle">{prMeta.label}</span>
							</span>
						</>
					) : null}
				</span>
			</button>
			{stateMeta.showLifecycle ? (
				<span className="flex shrink-0 items-center transition-opacity duration-fast ease-out-practical group-hover:opacity-0 group-focus-within:opacity-0 motion-reduce:transition-none">
					<LifecycleIndicator state={item.state} />
				</span>
			) : null}
			<CardActions
				item={item}
				onStop={onStop}
				onView={onView}
				showStop={stateMeta.showStop}
			/>
		</li>
	);
}
