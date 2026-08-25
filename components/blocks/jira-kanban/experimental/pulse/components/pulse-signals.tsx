"use client";

import { useId, useState, type ReactNode } from "react";
import CheckMarkIcon from "@atlaskit/icon/core/check-mark";

import {
	PULSE_ITEM_BODY,
	PULSE_ITEM_TITLE,
	PULSE_ROW,
	PULSE_ROW_ACTION_TRACK,
	PULSE_ROW_KEY_TRACK,
	PULSE_SECTION_LABEL,
} from "@/components/blocks/jira-kanban/experimental/pulse/components/pulse-type";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Lozenge, type LozengeProps } from "@/components/ui/lozenge";
import { cn } from "@/lib/utils";
import type {
	PulseAction,
	PulseSignal,
	PulseSignalTone,
} from "@/components/blocks/jira-kanban/experimental/pulse/types";

/**
 * Pulse signals — the two reading sections that close a snapshot: what needs a
 * human right now, and what that human can do about it without leaving Jira.
 *
 * Both sections use one row shape: a title and its reason on the left, the work
 * item key in a reserved centre track, and the trailing control in a reserved
 * right track. Every row therefore hangs off the same two edges, and the
 * sections read as one list rather than two rhythms. Tone is carried by a
 * single small lozenge in the trailing track, never by a filled alert surface.
 */

type SignalToneVariant = NonNullable<LozengeProps["variant"]>;

const SIGNAL_TONE_LABEL: Record<PulseSignalTone, string> = {
	attention: "Attention",
	risk: "Risk",
	decision: "Decision",
	shipped: "Shipped",
};

const SIGNAL_TONE_VARIANT: Record<PulseSignalTone, SignalToneVariant> = {
	attention: "warning",
	risk: "danger",
	decision: "discovery",
	shipped: "success",
};

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

/** One row of either section: title + reason, reserved key track, reserved action track. */
function PulseSignalRow({
	detail,
	title,
	trailing,
	workItemKey,
}: Readonly<{ detail: string; title: string; trailing: ReactNode; workItemKey?: string }>) {
	return (
		<li className={PULSE_ROW}>
			<div className="min-w-0 flex-1">
				<p className={PULSE_ITEM_TITLE}>{title}</p>
				<p className={cn("mt-1", PULSE_ITEM_BODY)}>{detail}</p>
			</div>
			<span aria-hidden={workItemKey === undefined} className={PULSE_ROW_KEY_TRACK}>
				{workItemKey === undefined ? "" : workItemKey}
			</span>
			<div className={PULSE_ROW_ACTION_TRACK}>{trailing}</div>
		</li>
	);
}

/** Heading plus a one-line explanation, used when scoping empties a section. */
function PulseSectionNote({ children }: Readonly<{ children: ReactNode }>) {
	return <p className={cn("mt-3", PULSE_ITEM_BODY)}>{children}</p>;
}

export interface PulseAttentionProps {
	signals: readonly PulseSignal[];
	className?: string;
	/** Rendered in place of the list when scoping has emptied it. */
	emptyNote?: string;
}

/** "Needs attention" — the signals a reader must not scroll past. */
export function PulseAttention({ signals, className, emptyNote }: Readonly<PulseAttentionProps>) {
	const labelId = `${useId()}-pulse-attention`;

	if (signals.length === 0 && emptyNote === undefined) return null;

	return (
		<section aria-labelledby={labelId} className={cn("min-w-0", className)}>
			<PulseSectionLabel id={labelId}>Needs attention</PulseSectionLabel>
			{signals.length === 0 ? (
				<PulseSectionNote>{emptyNote}</PulseSectionNote>
			) : (
				<ul className="mt-3 flex flex-col">
					{signals.map((signal) => (
						<PulseSignalRow
							detail={signal.detail}
							key={signal.id}
							title={signal.title}
							trailing={
								<Lozenge variant={SIGNAL_TONE_VARIANT[signal.tone]}>
									{SIGNAL_TONE_LABEL[signal.tone]}
								</Lozenge>
							}
							workItemKey={signal.workItemKey}
						/>
					))}
				</ul>
			)}
		</section>
	);
}

function PulseNextActionRow({
	action,
	isRequested,
	onRequest,
}: Readonly<{
	action: PulseAction;
	isRequested: boolean;
	onRequest: (action: PulseAction) => void;
}>) {
	return (
		<PulseSignalRow
			detail={action.rationale}
			title={action.label}
			trailing={
				// One element across both states: swapping the Button for a static
				// span on activation would throw focus to the document body on the
				// one interaction this whole mode is built around.
				<Button
					aria-disabled={isRequested}
					className={cn(
						"shrink-0",
						isRequested
							? "border-transparent bg-transparent text-text-success [&_svg]:text-icon-success hover:bg-transparent active:bg-transparent"
							: null,
					)}
					onClick={() => {
						if (isRequested) return;
						onRequest(action);
					}}
					size="compact"
					type="button"
					variant="outline"
				>
					{isRequested ? <Icon aria-hidden render={<CheckMarkIcon label="" />} /> : null}
					{isRequested ? "Requested" : action.actionLabel}
				</Button>
			}
			workItemKey={action.workItemKey}
		/>
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

	const handleRequest = (action: PulseAction) => {
		setStatusMessage(`${action.actionLabel} requested for ${action.label}.`);
		onRequestAction(action);
	};

	if (actions.length === 0 && emptyNote === undefined) return null;

	return (
		<section aria-labelledby={labelId} className={cn("min-w-0", className)}>
			<PulseSectionLabel id={labelId}>Next best actions</PulseSectionLabel>
			{actions.length === 0 ? (
				<PulseSectionNote>{emptyNote}</PulseSectionNote>
			) : (
				<ul className="mt-3 flex flex-col">
					{actions.map((action) => (
						<PulseNextActionRow
							action={action}
							isRequested={requestedActionIds.has(action.id)}
							key={action.id}
							onRequest={handleRequest}
						/>
					))}
				</ul>
			)}
			<p aria-live="polite" className="sr-only" role="status">
				{statusMessage}
			</p>
		</section>
	);
}
