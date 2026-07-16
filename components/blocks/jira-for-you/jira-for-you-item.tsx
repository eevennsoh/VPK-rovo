"use client";

import GenerativeIndicatorIcon from "@atlaskit/icon-lab/core/generative-indicator";
import BugIcon from "@atlaskit/icon/core/bug";
import EpicIcon from "@atlaskit/icon/core/epic";
import StoryIcon from "@atlaskit/icon/core/story";
import SubtasksIcon from "@atlaskit/icon/core/subtasks";
import TaskIcon from "@atlaskit/icon/core/task";
import VideoStopOverlayIcon from "@atlaskit/icon/core/video-stop-overlay";

import { Shimmer } from "@/components/ui-custom/shimmer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { IconTile, type IconTileVariant } from "@/components/ui/icon-tile";

import type {
	JiraForYouAgent,
	JiraForYouIssueType,
	JiraForYouItem,
} from "./jira-for-you-types";

const ISSUE_TYPE_META: Record<
	JiraForYouIssueType,
	{ Glyph: typeof TaskIcon; variant: IconTileVariant; label: string }
> = {
	task: { Glyph: TaskIcon, variant: "blue", label: "Task" },
	bug: { Glyph: BugIcon, variant: "red", label: "Bug" },
	subtask: { Glyph: SubtasksIcon, variant: "blue", label: "Subtask" },
	epic: { Glyph: EpicIcon, variant: "purple", label: "Epic" },
	story: { Glyph: StoryIcon, variant: "green", label: "Story" },
};

function MetadataDot() {
	return (
		<span aria-hidden="true" className="text-text-subtlest">
			•
		</span>
	);
}

function AgentAvatarCluster({
	agents,
}: Readonly<{ agents: readonly JiraForYouAgent[] }>) {
	return (
		<div className="flex shrink-0 items-center -space-x-1">
			{agents.map((agent) => (
				<Avatar key={agent.name} label={agent.name} shape="hexagon" size="xs">
					<AvatarImage alt="" src={agent.avatarSrc} />
					<AvatarFallback>{agent.name.slice(0, 2)}</AvatarFallback>
				</Avatar>
			))}
		</div>
	);
}

function ItemActions({
	isRunning,
	onView,
}: Readonly<{ isRunning?: boolean; onView?: () => void }>) {
	return (
		<div className="pointer-events-none absolute inset-y-0 right-0 flex items-center gap-2 bg-linear-to-l from-bg-neutral-subtle-hovered from-75% to-transparent pr-3 pl-12 opacity-0 transition-opacity duration-fast ease-out-practical group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100 motion-reduce:transition-none">
			<Button
				aria-label="Ask Rovo about this work item"
				className="bg-bg-neutral-bold text-text-inverse [&_svg]:text-text-inverse hover:bg-bg-neutral-bold-hovered"
				size="icon"
			>
				<GenerativeIndicatorIcon label="" />
			</Button>
			{isRunning ? (
				<Button
					aria-label="Stop agents"
					className="[&_svg]:text-icon-danger!"
					size="icon"
					variant="outline"
				>
					<VideoStopOverlayIcon label="" />
				</Button>
			) : null}
			<Button onClick={onView} variant="outline">
				View
			</Button>
		</div>
	);
}

export function JiraForYouItemRow({
	item,
	onItemClick,
}: Readonly<{
	item: JiraForYouItem;
	onItemClick?: (item: JiraForYouItem) => void;
}>) {
	const meta = ISSUE_TYPE_META[item.issueType];
	const Glyph = meta.Glyph;
	const hasActivity = Boolean(item.agents?.length || item.status);

	return (
		<li className="group relative flex items-center gap-3 p-3 transition-colors duration-xxshort ease-out-practical hover:bg-bg-neutral-subtle-hovered">
			<IconTile
				aria-hidden
				icon={<Glyph label="" />}
				label={meta.label}
				shape="square"
				size="medium"
				variant={meta.variant}
			/>
			<button
				className="flex min-w-0 flex-1 flex-col items-start justify-center rounded-xs text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
				onClick={() => onItemClick?.(item)}
				type="button"
			>
				<span className="flex w-full min-w-0 items-center gap-1">
					<span className="truncate text-sm font-medium text-text">
						{item.title}
					</span>
					{hasActivity ? (
						<>
							<MetadataDot />
							<span className="flex shrink-0 items-center gap-1">
								{item.agents?.length ? (
									<AgentAvatarCluster agents={item.agents} />
								) : null}
								{item.status ? (
									<Shimmer
										as="span"
										className="text-xs leading-4"
										duration={1.6}
										spread={2}
									>
										{item.status}
									</Shimmer>
								) : null}
							</span>
						</>
					) : null}
				</span>
				<span className="flex w-full min-w-0 items-center gap-1 text-xs text-text-subtlest">
					<span className="shrink-0">{meta.label}</span>
					<MetadataDot />
					<span className="shrink-0">{item.issueKey}</span>
					<MetadataDot />
					<span className="truncate">{item.spaceName}</span>
				</span>
			</button>
			<ItemActions isRunning={item.isRunning} onView={() => onItemClick?.(item)} />
		</li>
	);
}
