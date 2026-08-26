"use client";

import { useMemo, type ReactNode } from "react";

import { JiraIssue, type JiraIssueParticipant } from "@/components/blocks/jira-issue";
import { PulseResizeHandle } from "@/components/blocks/jira-kanban/experimental/pulse/components/pulse-resize-handle";
import { PulseSectionLabel } from "@/components/blocks/jira-kanban/experimental/pulse/components/pulse-signals";
import { usePulseWorkRailResize } from "@/components/blocks/jira-kanban/experimental/pulse/hooks/use-pulse-work-rail-resize";
import {
	toPullRequestSmartLink,
	type SmartLinkItem,
	type SmartLinkVisual,
} from "@/components/blocks/smart-link";

import { PULSE_SPACE_REPOSITORY } from "../data/pulse-timeline";
import {
	pulseLooseWorkSource,
	type PulseLooseWork,
	type PulseLooseWorkSource,
	type PulseMember,
	type PulseWorkItem,
} from "../types";

const PULSE_LOOSE_WORK_SOURCE_VISUALS: Readonly<Record<PulseLooseWorkSource, SmartLinkVisual>> = {
	GitHub: { kind: "third-party", name: "github" },
	Claude: { kind: "third-party", name: "claude" },
};

/**
 * Pulse work columns — what the team captured in Jira, and what it did not.
 *
 * Everything hangs off one left edge and one right edge: rows pad inward rather
 * than outward, so the section headings and the card borders sit on the same
 * two x positions. The roster and the window's numbers used to live here too;
 * they moved to the board header's facepile and under the headline they
 * describe, which is why this file now only draws work.
 */


function PulseRailEmpty({ children }: Readonly<{ children: ReactNode }>) {
	return <p className="py-1 text-xs text-text-subtlest">{children}</p>;
}

function toUncapturedParticipants(
	item: PulseLooseWork,
	memberLookup: ReadonlyMap<string, PulseMember>,
): JiraIssueParticipant[] {
	return item.memberIds
		.map((id) => memberLookup.get(id))
		.filter((member): member is PulseMember => member !== undefined)
		.map((member) => ({
			id: member.id,
			name: member.name,
			avatarShape: member.kind === "agent" ? "hexagon" : "circle",
			avatarSrc: member.avatarSrc,
		}));
}

function createPulseLooseWorkSmartLink(
	item: PulseLooseWork,
	participants: readonly JiraIssueParticipant[],
): SmartLinkItem {
	const source = pulseLooseWorkSource(item.kind);
	const visual = PULSE_LOOSE_WORK_SOURCE_VISUALS[source];
	const avatars = participants.map((participant) => ({
		name: participant.name,
		src: participant.avatarSrc,
	}));

	switch (item.kind) {
		case "pull-request": {
			const { pullRequest } = item;
			return {
				...toPullRequestSmartLink({
					id: `pulse-source-${item.id}`,
					number: pullRequest.number,
					title: item.title,
					status: pullRequest.status,
					files: pullRequest.files,
					additions: pullRequest.additions,
					deletions: pullRequest.deletions,
					repository: PULSE_SPACE_REPOSITORY,
					branch: pullRequest.branch,
					targetBranch: "main",
					description: item.detail,
				}),
				title: item.sourceTitle,
				avatars,
			};
		}
		case "branch":
			return {
				id: `pulse-source-${item.id}`,
				href: `https://github.com/${PULSE_SPACE_REPOSITORY}/tree/${item.sourceTitle}`,
				title: item.sourceTitle,
				variant: "generic",
				provider: { name: source, logo: visual },
				icon: visual,
				description: item.detail,
				avatars,
			};
		case "commit":
			return {
				id: `pulse-source-${item.id}`,
				href: `https://github.com/${PULSE_SPACE_REPOSITORY}/commit/${item.sourceTitle}`,
				title: item.sourceTitle,
				variant: "generic",
				provider: { name: source, logo: visual },
				icon: visual,
				description: item.detail,
				avatars,
			};
		case "agent-session":
			return {
				id: `pulse-source-${item.id}`,
				href: `#${item.id}`,
				title: item.sourceTitle,
				variant: "generic",
				provider: { name: source, logo: visual },
				icon: visual,
				description: item.detail,
				avatars,
			};
		default: {
			const _exhaustive: never = item;
			return _exhaustive;
		}
	}
}

function PulseWorkItemList({
	members,
	workItems,
}: Readonly<{
	members: readonly PulseMember[];
	workItems: readonly PulseWorkItem[];
}>) {
	const memberLookup = useMemo(() => new Map(members.map((member) => [member.id, member])), [members]);
	if (workItems.length === 0) return <PulseRailEmpty>No work items moved in this window.</PulseRailEmpty>;

	// The rail's cards are a read-out, not a board: nothing here opens, moves or
	// toggles, so they stay out of the tab order and advertise no drag.
	return (
		<ul className="flex flex-col gap-2">
			{workItems.map((workItem) => {
				const assignee = workItem.assigneeId === undefined ? undefined : memberLookup.get(workItem.assigneeId);
				return (
					<li key={workItem.key}>
						<JiraIssue
							assigneeAvatarLabel={assignee?.name ?? workItem.assigneeName}
							assigneeAvatarShape={assignee?.kind === "agent" ? "hexagon" : "circle"}
							assigneeAvatarSrc={assignee?.avatarSrc ?? workItem.assigneeAvatarSrc}
							chrome="stroke"
							draggable={false}
							issueKey={workItem.key}
							priority={workItem.priority}
							summary={workItem.summary}
							tabIndex={-1}
							tags={workItem.tags}
						/>
					</li>
				);
			})}
		</ul>
	);
}

/**
 * The work rail.
 *
 * The roster and the window's numbers used to live here too. They moved — the
 * roster to the board header's facepile and the faces above the story, the
 * numbers under the headline they describe — leaving this rail to do one job:
 * what the team captured in Jira, and what it did not, as two tracks of one
 * grid. The parent is the only scroller; the tracks themselves do not scroll.
 */

/** Column shell: one heading, one stack, one left edge. */
function PulseWorkColumn({
	children,
	label,
}: Readonly<{ children: ReactNode; label: string }>) {
	return (
		<section aria-label={label} className="flex min-w-0 flex-col gap-3">
			<PulseSectionLabel>{label}</PulseSectionLabel>
			{children}
		</section>
	);
}

function PulseWorkItemsColumn({
	members,
	scopedToFirstName,
	workItems,
}: Readonly<{
	members: readonly PulseMember[];
	scopedToFirstName: string | null;
	workItems: readonly PulseWorkItem[];
}>) {
	return (
		<PulseWorkColumn label="Work items">
			{scopedToFirstName === null ? null : (
				<p className="text-xs leading-5 text-text-subtle">
					{`Items ${scopedToFirstName} touched in this window — not only items they own.`}
				</p>
			)}
			<PulseWorkItemList members={members} workItems={workItems} />
		</PulseWorkColumn>
	);
}

function PulseUncapturedColumn({
	capturedIds,
	looseWork,
	members,
	onCapture,
}: Readonly<{
	/**
	 * Captured rows, owned above this column. A capture is a commitment the
	 * reader made; keeping it in the row meant scrolling to another insight
	 * unmounted the keyed row and silently un-captured it on the way back.
	 */
	capturedIds: ReadonlySet<string>;
	looseWork: readonly PulseLooseWork[];
	members: readonly PulseMember[];
	onCapture: (item: PulseLooseWork) => void;
}>) {
	const memberLookup = useMemo(() => new Map(members.map((member) => [member.id, member])), [members]);
	return (
		<PulseWorkColumn label="Uncaptured work">
			{looseWork.length === 0 ? (
				<PulseRailEmpty>Everything in this window is captured.</PulseRailEmpty>
			) : (
				<ul className="flex flex-col gap-2">
					{looseWork.map((item) => {
						const participants = toUncapturedParticipants(item, memberLookup);
						return (
							<li key={item.id}>
								<JiraIssue
									captured={capturedIds.has(item.id)}
									onCreateWorkItem={() => onCapture(item)}
									onLinkWorkItem={() => onCapture(item)}
									participants={participants}
									sourceLink={createPulseLooseWorkSmartLink(item, participants)}
									summary={item.title}
									variant="uncaptured-work"
								/>
							</li>
						);
					})}
				</ul>
			)}
		</PulseWorkColumn>
	);
}

/**
 * One right-rail parent: two tracks, one scrollbar, one resize handle.
 *
 * Desktop defaults to 320 / 8 / 300 — the 8px gutter matches experimental
 * kanban columns (`gap-2` / `space.100`). From `lg` the rail is resizable
 * against the article; below `lg` the tracks stack with the shell's own
 * `flex-col gap-10` and the handle unmounts from layout via `contents`.
 * `-m-1 p-1` is the scrollport's focus-ring gutter. `lg:box-content` keeps
 * `--pulse-work-rail-width` as the track measure so padding sits outside the
 * tracks. The handle sits as a sibling of the overflow grid so `overflow-y:
 * auto` cannot clip its hit area in the article gutter.
 */
export function PulseWorkRail({
	capturedIds,
	chat,
	looseWork,
	members,
	onCapture,
	scopedToFirstName,
	workItems,
}: Readonly<{
	capturedIds: ReadonlySet<string>;
	/** When set, replaces both card tracks — same swap as the work-item side panel. */
	chat?: ReactNode;
	looseWork: readonly PulseLooseWork[];
	members: readonly PulseMember[];
	onCapture: (item: PulseLooseWork) => void;
	scopedToFirstName: string | null;
	workItems: readonly PulseWorkItem[];
}>) {
	const { railRef, railResize, style } = usePulseWorkRailResize();

	return (
		<div
			className="group/pulse-work-rail relative min-w-0 lg:box-content lg:h-full lg:min-h-0 lg:w-[var(--pulse-work-rail-width)] lg:shrink-0"
			data-pulse-work-rail=""
			ref={railRef}
			style={style}
		>
			<div className="hidden lg:contents">
				<PulseResizeHandle
					ariaLabel="Resize insights and work items"
					className="top-0! left-[-1.25rem]! after:w-10 group-hover/pulse-work-rail:[&>div]:opacity-100"
					resize={railResize}
					side="left"
					testId="jira-pulse-insights-resize-handle"
				/>
			</div>
			{chat === undefined ? (
				<div className="-m-1 grid min-w-0 grid-cols-1 gap-10 p-1 lg:box-content lg:h-full lg:min-h-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-2 lg:overflow-y-auto lg:overscroll-y-contain">
					<PulseWorkItemsColumn
						members={members}
						scopedToFirstName={scopedToFirstName}
						workItems={workItems}
					/>
					<PulseUncapturedColumn
						capturedIds={capturedIds}
						looseWork={looseWork}
						members={members}
						onCapture={onCapture}
					/>
				</div>
			) : (
				<div
					className="relative min-h-[24rem] min-w-0 overflow-visible lg:h-full lg:min-h-0"
					data-pulse-embedded-chat=""
				>
					{chat}
				</div>
			)}
		</div>
	);
}
