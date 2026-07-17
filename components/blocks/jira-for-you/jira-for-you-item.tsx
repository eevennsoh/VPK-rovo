"use client";

import GenerativeIndicatorIcon from "@atlaskit/icon-lab/core/generative-indicator";
import BugIcon from "@atlaskit/icon/core/bug";
import EpicIcon from "@atlaskit/icon/core/epic";
import StoryIcon from "@atlaskit/icon/core/story";
import SubtasksIcon from "@atlaskit/icon/core/subtasks";
import TaskIcon from "@atlaskit/icon/core/task";
import VideoStopOverlayIcon from "@atlaskit/icon/core/video-stop-overlay";

import { JiraIssueGenerativeActionMenu } from "@/components/blocks/jira-issue/generative-action-menu";
import { AgentAvatarVisual } from "@/components/ui-custom/agent-avatar-visual";
import { Shimmer } from "@/components/ui-custom/shimmer";
import { AvatarGroup } from "@/components/ui/avatar";
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
			·
		</span>
	);
}

/**
 * Groups a multi-agent item's per-agent statuses into ordered
 * "<count> <status>" segments, e.g. [{ status: "In progress", count: 2 }].
 * First-seen order is preserved so the copy is stable.
 */
function groupAgentStatuses(
	agents: readonly JiraForYouAgent[],
): { status: string; count: number }[] {
	const order: string[] = [];
	const counts = new Map<string, number>();
	for (const agent of agents) {
		if (!agent.status) continue;
		if (!counts.has(agent.status)) order.push(agent.status);
		counts.set(agent.status, (counts.get(agent.status) ?? 0) + 1);
	}
	return order.map((status) => ({ status, count: counts.get(status) ?? 0 }));
}

function AgentAvatarCluster({
	agents,
}: Readonly<{ agents: readonly JiraForYouAgent[] }>) {
	const label = agents.map((agent) => agent.name).join(", ");
	return (
		<AvatarGroup
			className="shrink-0 -space-x-1 *:data-[slot=avatar]:ring-0!"
			label={`Agents: ${label}`}
		>
			{agents.map((agent) => (
				<AgentAvatarVisual
					avatarSrc={agent.avatarSrc}
					fallbackText={agent.name.slice(0, 2)}
					key={agent.name}
					label={agent.name}
					sizePx={16}
				/>
			))}
		</AvatarGroup>
	);
}

function ItemActions({
	item,
	onView,
}: Readonly<{ item: JiraForYouItem; onView?: () => void }>) {
	const generativeTrigger = (
		<Button
			aria-label="Ask Rovo about this work item"
			className="bg-bg-neutral-bold text-text-inverse [&_svg]:text-text-inverse hover:bg-bg-neutral-bold-hovered"
			onClick={(event) => event.stopPropagation()}
			size="icon-compact"
		>
			<GenerativeIndicatorIcon label="" />
		</Button>
	);

	return (
		<div className="pointer-events-none absolute inset-y-0 right-0 flex items-center gap-1 pr-3 pl-4 opacity-0 transition-opacity duration-fast ease-out-practical group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100 motion-reduce:transition-none">
			<JiraIssueGenerativeActionMenu
				action={{ onSubmit: () => undefined }}
				issue={{ issueKey: item.issueKey, summary: item.title }}
				triggerElement={generativeTrigger}
			/>
			{item.isRunning ? (
				<Button
					aria-label="Stop agents"
					className="[&_svg]:text-icon-danger!"
					size="icon-compact"
					variant="outline"
				>
					<VideoStopOverlayIcon label="" />
				</Button>
			) : null}
			<Button onClick={onView} size="compact" variant="outline">
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
	const agents = item.agents;
	const hasAgents = Boolean(agents?.length);
	const isMultiAgent = (agents?.length ?? 0) > 1;
	const agentStatusGroups =
		isMultiAgent && agents ? groupAgentStatuses(agents) : [];
	// Multi-agent items read as one sentence of comma-joined "<count> <status>"
	// segments; single-agent items keep the item-level status copy.
	const statusText = isMultiAgent
		? agentStatusGroups
				.map(({ status, count }) => `${count} ${status}`)
				.join(", ")
		: (item.status ?? "");

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
				</span>
				<span className="flex w-full min-w-0 items-center gap-1 text-xs text-text-subtlest">
					{hasAgents && agents ? (
						<AgentAvatarCluster agents={agents} />
					) : null}
					{statusText ? (
						<>
							<Shimmer
								as="span"
								className="shrink-0 leading-4"
								duration={1.6}
								spread={2}
							>
								{statusText}
							</Shimmer>
							<MetadataDot />
						</>
					) : null}
					<span className="shrink-0">{meta.label}</span>
					<MetadataDot />
					<span className="shrink-0">{item.issueKey}</span>
					<MetadataDot />
					<span className="truncate">{item.spaceName}</span>
				</span>
			</button>
			<ItemActions item={item} onView={() => onItemClick?.(item)} />
		</li>
	);
}
