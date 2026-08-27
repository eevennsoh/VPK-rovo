"use client";

import { useId, useState, type ReactNode } from "react";

import { AgentList, type AgentListItem } from "@/components/blocks/agent-list";
import { NextBestAction, type NextBestActionItem } from "@/components/blocks/next-best-action";
import {
	PULSE_ITEM_BODY,
	PULSE_SECTION_LABEL,
} from "@/components/blocks/jira-kanban/experimental/pulse/components/pulse-type";
import { toPulseAttentionItems } from "@/components/blocks/jira-kanban/experimental/pulse/lib/pulse-attention";
import { toPulseNextActionItems } from "@/components/blocks/jira-kanban/experimental/pulse/lib/pulse-next-actions";
import { toSectionHeading } from "@/components/blocks/jira-kanban/experimental/pulse/lib/pulse-outline";
import { cn } from "@/lib/utils";
import type {
	PulseAction,
	PulseMember,
	PulseSignal,
} from "@/components/blocks/jira-kanban/experimental/pulse/types";

/**
 * Pulse signals — the two reading sections that close a snapshot: what needs a
 * human right now, and what that human can do about it without leaving Jira.
 *
 * They are deliberately not the same list. "Needs input" is a list of
 * *people and agents* — an agent that stopped and is waiting, a teammate who
 * @mentioned you — so it is the shared `agent-list` block, identity first.
 * "Next best actions" is a list of *things to do*, so it is the shared
 * `next-best-action` block: title, rationale, and a per-row verb.
 */

export interface PulseSectionLabelProps {
	children: string;
	id?: string;
	className?: string;
}

/**
 * Shared micro-label above every story section. Visible copy is sentence case
 * (matching the work-item Activity heading); `aria-label` restates the same
 * name so the accessibility tree does not depend on CSS text-transform.
 */
export function PulseSectionLabel({ children, id, className }: Readonly<PulseSectionLabelProps>) {
	return (
		<h3 aria-label={children} className={cn(PULSE_SECTION_LABEL, className)} id={id}>
			{children}
		</h3>
	);
}

/** Heading plus a one-line explanation, used when scoping empties a section. */
function PulseSectionNote({ children }: Readonly<{ children: ReactNode }>) {
	return <p className={cn("mt-3", PULSE_ITEM_BODY)}>{children}</p>;
}

export interface PulseAttentionProps {
	signals: readonly PulseSignal[];
	/** The window's roster, used to put a face on every signal. */
	members: readonly PulseMember[];
	className?: string;
	/** Rendered in place of the list when scoping has emptied it. */
	emptyNote?: string;
	/** Opens the work item a Needs input row is waiting on. */
	onView: (item: AgentListItem) => void;
}

/**
 * "Needs input" — the agents and people a reader must not scroll past.
 *
 * Rendered through the shared agent-list block so an agent waiting on an answer
 * and a teammate who @mentioned you sit in one list, told apart by their
 * avatars (hexagon versus circle) rather than by a label. The rows are
 * flyout-free: half of them are comments, which have no agent session to
 * preview. The primary action still shows — Reply on a person, Give input on
 * an agent — because waiting without a way to answer is just a list.
 */
export function PulseAttention({
	signals,
	members,
	className,
	emptyNote,
	onView,
}: Readonly<PulseAttentionProps>) {
	const labelId = `${useId()}-pulse-attention`;
	const items = toPulseAttentionItems(signals, members);

	if (items.length === 0 && emptyNote === undefined) return null;

	return (
		<section aria-labelledby={labelId} className={cn("min-w-0", className)}>
			<PulseSectionLabel id={labelId}>{toSectionHeading("attention")}</PulseSectionLabel>
			{items.length === 0 ? (
				<PulseSectionNote>{emptyNote}</PulseSectionNote>
			) : (
				<AgentList chrome="raised" className="mt-3" flyout="none" items={items} onView={onView} />
			)}
		</section>
	);
}

export interface PulseNextActionsProps {
	actions: readonly PulseAction[];
	/**
	 * Ids already requested. Owned above the snapshot transition so a committed
	 * request survives scrubbing away and back.
	 */
	requestedActionIds: ReadonlySet<string>;
	onRequestAction: (action: PulseAction) => void;
	className?: string;
	/** Rendered in place of the list when scoping has emptied it. */
	emptyNote?: string;
}

/** "Next best actions" — every one performable here, without leaving Jira. */
export function PulseNextActions({
	actions,
	requestedActionIds,
	onRequestAction,
	className,
	emptyNote,
}: Readonly<PulseNextActionsProps>) {
	const labelId = `${useId()}-pulse-next-actions`;
	const [statusMessage, setStatusMessage] = useState("");
	const items = toPulseNextActionItems(actions, requestedActionIds);

	const handleAct = (item: NextBestActionItem) => {
		if (requestedActionIds.has(item.id)) return;
		const action = actions.find((entry) => entry.id === item.id);
		if (action === undefined) return;
		setStatusMessage(`${action.actionLabel} requested for ${action.label}.`);
		onRequestAction(action);
	};

	if (items.length === 0 && emptyNote === undefined) return null;

	return (
		<section aria-labelledby={labelId} className={cn("min-w-0", className)}>
			<PulseSectionLabel id={labelId}>{toSectionHeading("actions")}</PulseSectionLabel>
			{items.length === 0 ? (
				<PulseSectionNote>{emptyNote}</PulseSectionNote>
			) : (
				<NextBestAction className="mt-3" items={items} onAct={handleAct} />
			)}
			<p aria-live="polite" className="sr-only" role="status">
				{statusMessage}
			</p>
		</section>
	);
}
