"use client";

import { useEffect, useRef, useState, type ComponentProps, type RefObject } from "react";

import type { JiraIssueAgentSessionDragSource } from "@/components/blocks/jira-issue/agent-session-drag";
import {
	isWithinJiraIssueDropZoneHalo,
	shouldCommitJiraIssueSessionTransferDrop,
	type JiraIssueSessionPointer,
} from "@/components/blocks/jira-issue/agent-session-transfer-model";
import { cn } from "@/lib/utils";

/** Slack around the zone rect that still counts as a drop, so the edges are forgiving. */
const TRANSFER_DROP_HALO_PX = 24;
/**
 * Hidden at rest. Hover reveal is scoped to the agent session rows, not the
 * whole card: hovering the summary, tags, or subtasks must not offer a drop
 * target for a session the pointer never touched. The region's own slot is the
 * second hover trigger so the pointer can travel down from the row, across this
 * element's `pt-2` gap, and onto the well without the target vanishing
 * mid-reach — at rest the region is `pointer-events-none`, so it cannot arm
 * that trigger on its own.
 *
 * Keyboard reveal stays card-wide on purpose. The well is a tabbable button, so
 * narrowing focus to the row would leave it reachable while invisible the
 * moment focus moved onto it.
 *
 * `translate` rides the same declaration as `opacity` on purpose: two
 * `transition-*` utilities on one element collapse to the last one, so the
 * drag shift would snap if it declared its own.
 */
const TRANSFER_REVEAL_CLASS =
	"opacity-0 transition-[opacity,translate] duration-fast ease-out-practical motion-reduce:transition-none group-has-[[data-slot=jira-issue-agent-row]:hover]/jira-issue-transfer:pointer-events-auto group-has-[[data-slot=jira-issue-agent-row]:hover]/jira-issue-transfer:opacity-100 group-has-[[data-slot=jira-issue-session-transfer]:hover]/jira-issue-transfer:pointer-events-auto group-has-[[data-slot=jira-issue-session-transfer]:hover]/jira-issue-transfer:opacity-100 group-has-[:focus-visible]/jira-issue-transfer:pointer-events-auto group-has-[:focus-visible]/jira-issue-transfer:opacity-100";
const TRANSFER_ZONE_BASE_CLASS =
	"flex w-full select-none items-center justify-center rounded-lg border px-3 text-center outline-none transition-[height,background-color,border-color,color] duration-medium ease-in-out focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 motion-reduce:transition-none";
/** Resting affordance: compact 24px row with a solid stroke. */
const TRANSFER_ZONE_REST_CLASS =
	"h-6 border-solid border-border text-xs leading-4 text-text-subtle hover:bg-bg-neutral-subtle-hovered";
/** Once a session is pulled out the target grows into a 48px dashed drop well. */
const TRANSFER_ZONE_DRAG_CLASS = "h-12 border-dashed border-border-bold text-sm leading-5 text-text-subtle";
/** Pointer is over the well: blue stroke, fill, and label together. */
const TRANSFER_ZONE_ARMED_CLASS = "border-dashed border-border-selected bg-bg-selected text-text-selected";
/** The whole region eases down as the session leaves the chin, opening a gap. */
const TRANSFER_DRAG_SHIFT_CLASS = "translate-y-2";

/** The host card must carry this; the reveal keys off an agent session row
 *  inside this group being hovered, or any focus-visible within it. */
export const JIRA_ISSUE_SESSION_TRANSFER_GROUP_CLASS = "group/jira-issue-transfer";

/** Identity of the session a transfer acted on. Split layout renders one row per
 *  agent against a single config, so the callback has to say which one. */
export interface JiraIssueAgentSessionRef {
	id: string;
	name: string;
}

/** Demo-owned copy and commit handler. Every label has a neutral default. */
export interface JiraIssueAgentSessionTransferConfig {
	/** Receives the session that was dragged out, so a host rendering split rows
	 *  can tell which of several sessions to detach. */
	onUnlink?: (session?: JiraIssueAgentSessionRef) => void;
	/** Receives the detached session that was dropped back onto this work item. */
	onLink?: (session?: JiraIssueAgentSessionRef) => void;
	unlinkLabel?: string;
}

export interface JiraIssueAgentSessionTransferProps {
	/** The drag was interrupted rather than released: clear the armed zone
	 *  without committing it. */
	cancelled?: boolean;
	config: Readonly<JiraIssueAgentSessionTransferConfig>;
	/** True while a session row is dragged; keeps the region revealed. */
	dragging?: boolean;
	/** Viewport-space pointer while dragging; drives the drop-zone hit test. */
	pointer?: JiraIssueSessionPointer | null;
	/** Which session the gesture is carrying, forwarded to the commit callback. */
	session?: JiraIssueAgentSessionRef;
	sessionLabel?: string;
	/** `detached` attaches via the card chin, not this unlink well. */
	source?: JiraIssueAgentSessionDragSource;
	/** Work-item card rect, so a detached session can drop onto the card itself. */
	cardMeasureRef?: RefObject<HTMLElement | null>;
}

type TransferDropZoneProps = Readonly<
	Omit<ComponentProps<"button">, "children" | "ref"> & {
		armed: boolean;
		description: string;
		/** True once a session is out of the chin: grow the well and go dashed. */
		dragging: boolean;
		label: string;
		/** Read by the drop-zone hit test. */
		measureRef: React.RefObject<HTMLButtonElement | null>;
	}
>;

function TransferDropZone({ armed, description, dragging, label, measureRef, ...buttonProps }: TransferDropZoneProps) {
	return (
		<button
			aria-label={description}
			className={cn(
				TRANSFER_ZONE_BASE_CLASS,
				dragging ? TRANSFER_ZONE_DRAG_CLASS : TRANSFER_ZONE_REST_CLASS,
				armed ? TRANSFER_ZONE_ARMED_CLASS : null,
			)}
			data-armed={armed || undefined}
			data-dragging={dragging || undefined}
			type="button"
			{...buttonProps}
			ref={measureRef}
		>
			{label}
		</button>
	);
}

export function JiraIssueAgentSessionTransfer({
	config,
	cancelled = false,
	cardMeasureRef,
	dragging = false,
	pointer,
	session,
	sessionLabel = "agent session",
	source = "chin",
}: Readonly<JiraIssueAgentSessionTransferProps>) {
	const unlinkRef = useRef<HTMLButtonElement | null>(null);
	const [armed, setArmed] = useState(false);
	const armedRef = useRef(false);
	const isLinking = source === "detached";
	// Attach has no dashed well: the card backdrop/chin is the drop target.
	const showUnlinkWell = !isLinking && Boolean(config.onUnlink);

	// The commit handler changes identity on every render, so the drop effect
	// reads it from a committed ref rather than resubscribing (and re-running its
	// arm/commit pass) each time the parent re-renders.
	const commitRef = useRef<{
		onLink?: (session?: JiraIssueAgentSessionRef) => void;
		onUnlink?: (session?: JiraIssueAgentSessionRef) => void;
		session?: JiraIssueAgentSessionRef;
		source: JiraIssueAgentSessionDragSource;
	} | null>(null);
	useEffect(() => {
		// Snapshot only while the gesture is live. The host resets to idle on
		// release in the same commit that this effect would otherwise overwrite
		// with `source: "chin"`, and that would make a detached drop unlink.
		if (!dragging) {
			return;
		}
		commitRef.current = {
			onLink: config.onLink,
			onUnlink: config.onUnlink,
			session,
			source,
		};
	});

	// Arms the zone as the pointer moves, then commits on release — a drop runs
	// exactly the callback the zone's click handler runs.
	useEffect(() => {
		const wellRect = unlinkRef.current?.getBoundingClientRect();
		const cardRect = cardMeasureRef?.current?.getBoundingClientRect();
		const overWell = Boolean(
			!isLinking
			&& dragging
			&& pointer
			&& wellRect
			&& isWithinJiraIssueDropZoneHalo(pointer, wellRect, TRANSFER_DROP_HALO_PX),
		);
		const overCard = Boolean(
			isLinking
			&& dragging
			&& pointer
			&& cardRect
			&& isWithinJiraIssueDropZoneHalo(pointer, cardRect, TRANSFER_DROP_HALO_PX),
		);
		const next = overWell || overCard;
		// A cancelled gesture ends the drag without being a drop: clear the armed
		// target rather than committing it, or an interrupted pointer would
		// silently unlink a session the user never released.
		const dropped = shouldCommitJiraIssueSessionTransferDrop({
			armed: armedRef.current,
			cancelled,
			dragging,
		});
		armedRef.current = next;
		setArmed(next);
		if (dropped) {
			const commit = commitRef.current;
			if (!commit) {
				return;
			}
			if (commit.source === "detached") {
				commit.onLink?.(commit.session);
			} else {
				commit.onUnlink?.(commit.session);
			}
		}
	}, [cancelled, cardMeasureRef, dragging, isLinking, pointer]);

	if (!showUnlinkWell) {
		return null;
	}

	return (
		<div
			className={cn(
				"flex flex-col pt-2",
				TRANSFER_REVEAL_CLASS,
				dragging ? "pointer-events-auto opacity-100" : "pointer-events-none",
				dragging ? TRANSFER_DRAG_SHIFT_CLASS : null,
			)}
			data-slot="jira-issue-session-transfer"
		>
			<TransferDropZone
				armed={armed}
				description={`Unlink ${sessionLabel} from this work item`}
				dragging={dragging}
				label={config.unlinkLabel ?? "Drag here to unlink"}
				measureRef={unlinkRef}
				onClick={() => {
					config.onUnlink?.(session);
				}}
			/>
		</div>
	);
}
