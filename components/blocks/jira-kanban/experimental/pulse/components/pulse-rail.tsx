"use client";

import { useMemo, useState, type ReactNode } from "react";
import CheckMarkIcon from "@atlaskit/icon/core/check-mark";
import LinkIcon from "@atlaskit/icon/core/link";

import { JiraIssue } from "@/components/blocks/jira-issue";
import { PulseSectionLabel } from "@/components/blocks/jira-kanban/experimental/pulse/components/pulse-signals";
import { PULSE_ITEM_TITLE } from "@/components/blocks/jira-kanban/experimental/pulse/components/pulse-type";
import { Avatar, AvatarFallback, AvatarGroup, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

import type { PulseLooseWork, PulseMember, PulseWorkItem } from "../types";

/**
 * Pulse work columns — what the team captured in Jira, and what it did not.
 *
 * Everything hangs off one left edge and one right edge: rows pad inward rather
 * than outward, so the section headings and the card borders sit on the same
 * two x positions. The roster and the window's numbers used to live here too;
 * they moved to the board header's facepile and under the headline they
 * describe, which is why this file now only draws work.
 */


function getInitials(name: string): string {
	return name
		.split(" ")
		.map((part) => part.charAt(0))
		.join("")
		.slice(0, 2)
		.toUpperCase();
}


function PulseRailEmpty({ children }: Readonly<{ children: ReactNode }>) {
	return <p className="py-1 text-xs text-text-subtlest">{children}</p>;
}






function PulseLooseWorkRow({
	item,
	memberLookup,
}: Readonly<{ item: PulseLooseWork; memberLookup: ReadonlyMap<string, PulseMember> }>) {
	const [isLinked, setIsLinked] = useState(false);
	const involved = item.memberIds.map((id) => memberLookup.get(id)).filter((member) => member !== undefined);

	return (
		<li className="flex flex-col gap-2 rounded-md border border-dashed border-border p-2.5">
			<div className="flex min-w-0 flex-col gap-0.5">
				<p className={cn("truncate", PULSE_ITEM_TITLE)}>{item.title}</p>
				<p className="truncate text-xs text-text-subtlest">
					{item.source} · {item.detail}
				</p>
			</div>
			<div className="flex items-center justify-between gap-2">
				<AvatarGroup label={`Involved: ${involved.map((member) => member.name).join(", ")}`}>
					{involved.map((member) => (
						<Avatar key={member.id} label={member.name} shape={member.kind === "agent" ? "hexagon" : "circle"} size="sm">
							<AvatarImage alt="" src={member.avatarSrc} />
							<AvatarFallback>{getInitials(member.name)}</AvatarFallback>
						</Avatar>
					))}
				</AvatarGroup>
				{item.suggestedAction === undefined ? null : (
					// One element across both states, and `aria-disabled` rather than
					// `disabled`, so committing the capture keeps the focus that
					// triggered it. The live region is a sibling: a live region must
					// never contain the control it is announcing.
					<>
						<Button
							aria-disabled={isLinked}
							className={cn(
								"shrink-0",
								isLinked
									? "border-transparent bg-transparent text-text-success [&_svg]:text-icon-success hover:bg-transparent active:bg-transparent"
									: null,
							)}
							onClick={() => {
								if (isLinked) return;
								setIsLinked(true);
							}}
							size="compact"
							variant="outline"
						>
							<Icon aria-hidden render={isLinked ? <CheckMarkIcon label="" /> : <LinkIcon label="" />} />
							{isLinked ? "Captured" : item.suggestedAction}
						</Button>
						<p aria-live="polite" className="sr-only" role="status">
							{isLinked ? `${item.title} captured.` : ""}
						</p>
					</>
				)}
			</div>
		</li>
	);
}

function PulseWorkItemList({ workItems }: Readonly<{ workItems: readonly PulseWorkItem[] }>) {
	if (workItems.length === 0) return <PulseRailEmpty>No work items moved in this window.</PulseRailEmpty>;

	// The rail's cards are a read-out, not a board: nothing here opens, moves or
	// toggles, so they stay out of the tab order and advertise no drag.
	return (
		<ul className="flex flex-col gap-2">
			{workItems.map((workItem) => (
				<li key={workItem.key}>
					<JiraIssue
						assigneeAvatarLabel={workItem.assigneeName}
						assigneeAvatarSrc={workItem.assigneeAvatarSrc}
						draggable={false}
						issueKey={workItem.key}
						priority={workItem.priority}
						summary={workItem.summary}
						tabIndex={-1}
						tags={workItem.tags}
					/>
				</li>
			))}
		</ul>
	);
}

/**
 * The work columns.
 *
 * The roster and the window's numbers used to live here too. They moved — the
 * roster to the board header's facepile and the faces above the story, the
 * numbers under the headline they describe — leaving these two columns to do
 * one job each: what the team captured in Jira, and what it did not.
 */

/** Column shell: one heading, one stack, one left edge. */
function PulseWorkColumn({
	children,
	label,
	width,
}: Readonly<{ children: ReactNode; label: string; width: string }>) {
	return (
		<section
			aria-label={label}
			// 12px of horizontal bleed taken straight back out, so a card's focus
			// ring clears itself without shifting the column's single left edge.
			className={cn("-mx-3 -my-1 flex w-full shrink-0 flex-col gap-3 px-3 py-1 lg:overflow-y-auto lg:overscroll-y-contain", width)}
		>
			<PulseSectionLabel>{label}</PulseSectionLabel>
			{children}
		</section>
	);
}

export function PulseWorkItemsColumn({
	scopedToFirstName,
	workItems,
}: Readonly<{ scopedToFirstName: string | null; workItems: readonly PulseWorkItem[] }>) {
	return (
		<PulseWorkColumn label="Work items" width="lg:w-[320px]">
			{scopedToFirstName === null ? null : (
				<p className="text-xs leading-5 text-text-subtle">
					{`Items ${scopedToFirstName} touched in this window — not only items they own.`}
				</p>
			)}
			<PulseWorkItemList workItems={workItems} />
		</PulseWorkColumn>
	);
}

export function PulseUncapturedColumn({
	looseWork,
	members,
}: Readonly<{ looseWork: readonly PulseLooseWork[]; members: readonly PulseMember[] }>) {
	const memberLookup = useMemo(() => new Map(members.map((member) => [member.id, member])), [members]);
	return (
		<PulseWorkColumn label="Uncaptured work" width="lg:w-[300px]">
			<p className="text-xs leading-5 text-text-subtle">
				Produced in this window but never landed in a work item. Capture it before it disappears.
			</p>
			{looseWork.length === 0 ? (
				<PulseRailEmpty>Everything in this window is captured.</PulseRailEmpty>
			) : (
				<ul className="flex flex-col gap-2">
					{looseWork.map((item) => (
						<PulseLooseWorkRow item={item} key={item.id} memberLookup={memberLookup} />
					))}
				</ul>
			)}
		</PulseWorkColumn>
	);
}
