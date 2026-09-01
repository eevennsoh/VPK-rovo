"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

import type { JiraIssueAgentSessionDragSource } from "@/components/blocks/jira-issue/agent-session-drag";
import {
	isWithinJiraIssueDropZoneHalo,
	nextJiraIssueSessionTransferArmed,
	shouldCommitJiraIssueSessionTransferDrop,
	type JiraIssueSessionPointer,
} from "@/components/blocks/jira-issue/agent-session-transfer-model";
import { cn } from "@/lib/utils";

/** Slack around the zone rect that still counts as a drop, so the edges are forgiving. */
const TRANSFER_DROP_HALO_PX = 24;
/**
 * Collapsed at rest (`0fr`) so a stacked board does not reserve a well-sized
 * gap under every card. Hovering or focusing a linked chin row, or dragging
 * that row out, opens the well. Detached sessions reuse
 * `data-slot=jira-issue-agent-row`, so the hover hook is `data-session-chin`
 * on the attached row only.
 *
 * The region's own slot is the second hover trigger so the pointer can travel
 * down from the chin, across this element's 8px top gap, and onto the well
 * without the target vanishing mid-reach — at rest the region is
 * `pointer-events-none` and zero height, so it cannot arm that trigger on
 * its own.
 *
 * Two properties only: height (`grid-template-rows`) so the stack reacts, and
 * opacity so the well fades with that open.
 *
 * `py-2` gives the open well an 8px gap above and below, while still
 * collapsing completely at rest.
 * `px-px` keeps the rounded border inside the `0fr` clipper.
 */
const TRANSFER_REVEAL_CLASS = cn(
	"grid grid-rows-[0fr] opacity-0 transition-[grid-template-rows,opacity] duration-fast ease-out-practical motion-reduce:transition-none",
	"group-has-[[data-session-chin]:hover]/jira-issue-transfer:pointer-events-auto group-has-[[data-session-chin]:hover]/jira-issue-transfer:grid-rows-[1fr] group-has-[[data-session-chin]:hover]/jira-issue-transfer:opacity-100",
	"group-has-[[data-slot=jira-issue-session-transfer]:hover]/jira-issue-transfer:pointer-events-auto group-has-[[data-slot=jira-issue-session-transfer]:hover]/jira-issue-transfer:grid-rows-[1fr] group-has-[[data-slot=jira-issue-session-transfer]:hover]/jira-issue-transfer:opacity-100",
	"group-has-[[data-session-chin]:has(:focus-visible)]/jira-issue-transfer:pointer-events-auto group-has-[[data-session-chin]:has(:focus-visible)]/jira-issue-transfer:grid-rows-[1fr] group-has-[[data-session-chin]:has(:focus-visible)]/jira-issue-transfer:opacity-100",
);
/** The transfer group must carry this so chin-row hover can open the well. */
export const JIRA_ISSUE_SESSION_TRANSFER_GROUP_CLASS = "group/jira-issue-transfer";
/** Native dashes retain the standard rounded control geometry without clipping. */
const TRANSFER_ZONE_BASE_CLASS =
	"flex w-full select-none items-center justify-center rounded-lg border border-dashed border-border px-3 text-center transition-[height,background-color,border-color,color] duration-medium ease-in-out motion-reduce:transition-none";
/** Resting affordance: compact 24px row. */
const TRANSFER_ZONE_REST_CLASS = "h-6 text-xs leading-4 text-text-subtle";
/** Once a session is pulled out the target grows into a 48px dashed drop well. */
const TRANSFER_ZONE_DRAG_CLASS = "h-12 text-sm leading-5 text-text-subtle";
/** Pointer is over the well: selected border, fill, and label together. */
const TRANSFER_ZONE_ARMED_CLASS = "border-border-selected bg-bg-selected text-text-selected";

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

type TransferDropZoneProps = Readonly<{
	armed: boolean;
	description: string;
	/** True once a session is out of the chin: grow the well. */
	dragging: boolean;
	label: string;
	/** Read by the drop-zone hit test. */
	measureRef: React.RefObject<HTMLDivElement | null>;
}>;

function TransferDropZone({ armed, description, dragging, label, measureRef }: TransferDropZoneProps) {
	return (
		<div
			aria-label={description}
			className={cn(
				TRANSFER_ZONE_BASE_CLASS,
				dragging ? TRANSFER_ZONE_DRAG_CLASS : TRANSFER_ZONE_REST_CLASS,
				armed ? TRANSFER_ZONE_ARMED_CLASS : null,
			)}
			data-armed={armed || undefined}
			data-dragging={dragging || undefined}
			ref={measureRef}
			role="img"
		>
			{label}
		</div>
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
	const unlinkRef = useRef<HTMLDivElement | null>(null);
	const [armed, setArmed] = useState(false);
	const armedRef = useRef(false);
	const lastPointerKeyRef = useRef("");
	const isLinking = source === "detached";
	// Attach has no dashed well: the card backdrop/chin is the drop target.
	const showUnlinkWell = !isLinking && Boolean(config.onUnlink);
	// Drag from the chin keeps the well open after the pointer leaves the row.
	// A detached attach gesture also sets `dragging`, but that path unmounts
	// the well via `showUnlinkWell`.
	const revealUnlinkWell = dragging && !isLinking;

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

	// Arms the zone as the pointer moves, then commits on release. The well is
	// a drop target only; click-to-unlink lives on the chin link-broken.
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
		const pointerKey = pointer ? `${pointer.x},${pointer.y}` : "";
		const pointerMoved = Boolean(pointer) && pointerKey !== lastPointerKeyRef.current;
		if (pointer) {
			lastPointerKeyRef.current = pointerKey;
		}
		const next = nextJiraIssueSessionTransferArmed({
			dragging,
			overTarget: overWell || overCard,
			pointerMoved,
			previousArmed: armedRef.current,
		});
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
				TRANSFER_REVEAL_CLASS,
				revealUnlinkWell ? "pointer-events-auto grid-rows-[1fr] opacity-100" : "pointer-events-none",
			)}
			data-slot="jira-issue-session-transfer"
		>
			<div className="min-h-0 overflow-hidden">
				<div className="flex flex-col px-px py-2">
					<TransferDropZone
						armed={armed}
						description={`Unlink ${sessionLabel} from this work item`}
						dragging={revealUnlinkWell}
						label={config.unlinkLabel ?? "Drag here to unlink"}
						measureRef={unlinkRef}
					/>
				</div>
			</div>
		</div>
	);
}
