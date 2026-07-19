"use client";

import GenerativeIndicatorIcon from "@atlaskit/icon-lab/core/generative-indicator";
import BugIcon from "@atlaskit/icon/core/bug";
import EpicIcon from "@atlaskit/icon/core/epic";
import StoryIcon from "@atlaskit/icon/core/story";
import SubtasksIcon from "@atlaskit/icon/core/subtasks";
import TaskIcon from "@atlaskit/icon/core/task";

import { JiraIssueGenerativeActionMenu } from "@/components/blocks/jira-issue/generative-action-menu";
import { AgentAvatarVisual } from "@/components/ui-custom/agent-avatar-visual";
import { Shimmer } from "@/components/ui-custom/shimmer";
import { AvatarGroup } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { IconTile, type IconTileVariant } from "@/components/ui/icon-tile";
import { Spinner } from "@/components/ui/spinner";

import {
	JiraForYouStatusLozenge,
	JiraForYouStatusLozengeDropdown,
} from "./jira-for-you-status";
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
 * Visual rule (shared with jira-issue agent activity): text shimmer is reserved
 * for "needs input" states; in-progress work uses the rainbow spinner instead.
 * A status can combine both (e.g. "1 Awaiting user response, 2 In progress"),
 * so each comma-separated segment is classified and rendered independently.
 */
function isAwaitingInputStatus(status: string): boolean {
	return /awaiting user/i.test(status);
}

function JiraForYouStatusSegment({
	segment,
	trailingComma = false,
}: Readonly<{ segment: string; trailingComma?: boolean }>) {
	// The comma is punctuation, not status text, so it stays outside the shimmer
	// while still hugging the segment (no leading space): "Awaiting user response, …".
	const comma = trailingComma ? <span aria-hidden="true">,</span> : null;

	if (isAwaitingInputStatus(segment)) {
		return (
			<span className="inline-flex items-baseline text-xs leading-4">
				<Shimmer as="span" duration={1.6} spread={2}>
					{segment}
				</Shimmer>
				{comma}
			</span>
		);
	}

	return (
		<span className="flex items-center gap-1 text-xs leading-4">
			<span className="inline-flex items-baseline">
				{segment}
				{comma}
			</span>
			<Spinner size="xs" variant="rainbow" label="" />
		</span>
	);
}

function JiraForYouItemStatus({ status }: Readonly<{ status: string }>) {
	const segments = status
		.split(",")
		.map((segment) => segment.trim())
		.filter(Boolean);

	return (
		<span className="flex items-center gap-1 text-xs leading-4">
			{segments.map((segment, index) => (
				<JiraForYouStatusSegment
					key={segment}
					segment={segment}
					trailingComma={index < segments.length - 1}
				/>
			))}
		</span>
	);
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
		<div
			className="pointer-events-none absolute top-1/2 right-0 flex -translate-y-1/2 items-center gap-1 opacity-0 transition-opacity duration-fast ease-out-practical group-hover:pointer-events-auto group-hover:opacity-100 group-has-[[data-slot=jira-for-you-row-button]:focus-visible]:pointer-events-auto group-has-[[data-slot=jira-for-you-row-button]:focus-visible]:opacity-100 has-[:focus-visible]:pointer-events-auto has-[:focus-visible]:opacity-100 has-[button[aria-expanded=true]]:pointer-events-auto has-[button[aria-expanded=true]]:opacity-100 motion-reduce:transition-none"
			data-slot="jira-for-you-actions"
		>
			<JiraIssueGenerativeActionMenu
				action={{ onSubmit: () => undefined }}
				issue={{ issueKey: item.issueKey, summary: item.title }}
				triggerElement={generativeTrigger}
			/>
			<JiraForYouStatusLozengeDropdown value={item.jiraStatus} />
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
				data-slot="jira-for-you-row-button"
				onClick={() => onItemClick?.(item)}
				type="button"
			>
				<span className="flex w-full min-w-0 items-center gap-1">
					<span className="truncate text-sm font-medium text-text">
						{item.title}
					</span>
				</span>
				<span className="flex w-full min-w-0 items-center gap-1 text-xs text-text-subtlest">
					{hasActivity ? (
						<>
							<span className="flex shrink-0 items-center gap-1">
								{item.agents?.length ? (
									<AgentAvatarCluster agents={item.agents} />
								) : null}
								{item.status ? (
									<JiraForYouItemStatus status={item.status} />
								) : null}
							</span>
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
			<div className="relative flex shrink-0 items-center">
				<ItemActions item={item} onView={() => onItemClick?.(item)} />
				<div className="transition-opacity duration-fast ease-out-practical group-hover:pointer-events-none group-hover:opacity-0 group-has-[[data-slot=jira-for-you-row-button]:focus-visible]:pointer-events-none group-has-[[data-slot=jira-for-you-row-button]:focus-visible]:opacity-0 group-has-[[data-slot=jira-for-you-actions]_:focus-visible]:pointer-events-none group-has-[[data-slot=jira-for-you-actions]_:focus-visible]:opacity-0 group-has-[[data-slot=jira-for-you-actions]_button[aria-expanded=true]]:pointer-events-none group-has-[[data-slot=jira-for-you-actions]_button[aria-expanded=true]]:opacity-0 motion-reduce:transition-none">
					<JiraForYouStatusLozenge value={item.jiraStatus} />
				</div>
			</div>
		</li>
	);
}
