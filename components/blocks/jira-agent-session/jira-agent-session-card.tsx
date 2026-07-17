"use client";

import MergeSuccessIcon from "@atlaskit/icon/core/merge-success";
import PullRequestIcon from "@atlaskit/icon/core/pull-request";
import VideoStopOverlayIcon from "@atlaskit/icon/core/video-stop-overlay";

import { AgentAvatarVisual } from "@/components/ui-custom/agent-avatar-visual";
import { AnimatedDots } from "@/components/ui-custom/animated-dots";
import { Shimmer } from "@/components/ui-custom/shimmer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type {
	JiraAgentSessionItem,
	JiraAgentSessionPrStatus,
	JiraAgentSessionState,
} from "./jira-agent-session-types";

/**
 * State → title-line treatment. `running` shimmers the work-item title (the
 * shimmer alone communicates "in progress"); `needs-input` overrides the title
 * with "Awaiting user response" plus animated dots; `complete` shows a solid
 * title. Only `running` exposes a Stop action.
 */
const STATE_META: Record<
	JiraAgentSessionState,
	{
		/** When set, replaces the work-item title in the title line. */
		titleOverride: string | null;
		shimmerTitle: boolean;
		showDots: boolean;
		showStop: boolean;
	}
> = {
	running: {
		titleOverride: null,
		shimmerTitle: true,
		showDots: false,
		showStop: true,
	},
	"needs-input": {
		titleOverride: "Awaiting user response",
		shimmerTitle: true,
		showDots: true,
		showStop: false,
	},
	complete: {
		titleOverride: null,
		shimmerTitle: false,
		showDots: false,
		showStop: false,
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
	const titleText = stateMeta.titleOverride ?? item.title;

	return (
		<li className="group relative flex items-center gap-3 p-3 transition-colors duration-xxshort ease-out-practical hover:bg-bg-neutral-subtle-hovered">
			<AgentAvatarVisual
				avatarClassName="shrink-0"
				avatarSrc={item.agent.avatarSrc}
				label={item.agent.name}
				sizePx={32}
			/>
			<button
				className="flex min-w-0 flex-1 flex-col items-start justify-center rounded-xs text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
				onClick={() => onView?.(item)}
				type="button"
			>
				<span className="flex w-full min-w-0 items-center gap-1">
					{stateMeta.shimmerTitle ? (
						<Shimmer
							as="span"
							className="min-w-0 truncate text-sm font-medium"
							duration={1.4}
							spread={2}
						>
							{titleText}
						</Shimmer>
					) : (
						<span className="min-w-0 truncate text-sm font-medium text-text">
							{titleText}
						</span>
					)}
					{stateMeta.showDots ? <AnimatedDots /> : null}
				</span>
				<span className="flex w-full min-w-0 items-center gap-1 text-xs text-text-subtlest">
					<span className="shrink-0">{item.agent.name}</span>
					<MetadataDot />
					<span className="truncate">{item.branch}</span>
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
			<CardActions
				item={item}
				onStop={onStop}
				onView={onView}
				showStop={stateMeta.showStop}
			/>
		</li>
	);
}
