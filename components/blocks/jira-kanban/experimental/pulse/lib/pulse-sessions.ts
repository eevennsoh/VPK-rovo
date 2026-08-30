import type { AgentSessionItem } from "@/components/blocks/agent-session";

import { isPulseAgentSession, type PulseLooseWork, type PulseMember } from "../types";

/**
 * Boundary between a Pulse local coding session and the shared Agent Session card.
 *
 * Uncaptured GitHub work stays a dashed card with a Link to work item chin. A
 * Claude session uses the same card chrome through the Agent Session block:
 * the shared row (identity, static stamp, viewer machine) sits in the sunken
 * body, and the issue key becomes the chin's Link to work item suggestion. The
 * worktree stays on the flyout payload. Keeping the mapping pure and here means
 * the rail stays a renderer and the fixture never learns the row model.
 */

const WORKTREE_PATTERN = /worktree (\S+)/u;

/** Viewer machine for Pulse local sessions. Venn is the Insights persona. */
const PULSE_LOCAL_MACHINE_NAME = "Venn’s MacBook";

/**
 * Static stamp matching the Agent List local-session row. Local rows must not
 * tick, and they must not reuse the host word "Local" as a timestamp.
 */
const PULSE_LOCAL_TIME_LABEL = "3 mins ago";

/** Worktree path from a session detail line, when the fixture named one. */
export function toPulseSessionWorktree(detail: string): string | undefined {
	return WORKTREE_PATTERN.exec(detail)?.[1];
}

/**
 * Maps one window's loose work onto agent-list rows for the local sessions.
 *
 * GitHub artifacts are skipped. A session whose members are all unknown to the
 * roster still renders: the row leads with Claude, not a teammate, so a missing
 * invoker is omission rather than a faceless row.
 */
export function toPulseSessionItems(
	looseWork: readonly PulseLooseWork[],
	members: readonly PulseMember[],
): readonly AgentSessionItem[] {
	const byId = new Map(members.map((member) => [member.id, member]));

	return looseWork.flatMap((item) => {
		if (!isPulseAgentSession(item)) {
			return [];
		}

		const invoker = item.memberIds
			.map((id) => byId.get(id))
			.find((member) => member !== undefined && member.kind === "human");
		const worktree = toPulseSessionWorktree(item.detail);

		return [{
			agent: {
				brandName: "claude",
				id: "claude",
				kind: "agent",
				name: "Claude",
			},
			host: "local",
			id: item.id,
			invokedBy: invoker === undefined
				? undefined
				: {
					avatarSrc: invoker.avatarSrc,
					name: invoker.name,
				},
			machineName: PULSE_LOCAL_MACHINE_NAME,
			sessionDetails: {
				host: "local",
				issueKey: item.sourceTitle,
				issueSummary: item.title,
				worktreePath: worktree,
			},
			state: "complete",
			timeLabel: PULSE_LOCAL_TIME_LABEL,
			title: item.title,
		} satisfies AgentSessionItem];
	});
}

/**
 * Loose work attributable to the selected roster member.
 *
 * The board header's assignee filter narrows the status columns, so it has to
 * narrow the untracked-work column too — otherwise picking one person hides
 * their teammates' cards while leaving every teammate's session on screen, and
 * the filter stops describing the whole board.
 *
 * It takes the *roster-resolved* member id rather than the raw assignee set on
 * purpose. The assignee field carries ids from whichever facepile wrote it, and
 * only some of those name a Pulse member — that is what `toPulseMemberId` is
 * for. Matching the raw ids instead would empty the column for every selection
 * made in the other id space, asserting "nobody has untracked sessions" when
 * the truth is that the selection cannot be expressed in this roster at all.
 * `null` means no roster member is selected, which is not the same as "nobody
 * matched".
 */
export function filterPulseLooseWorkByMember(
	looseWork: readonly PulseLooseWork[],
	memberId: string | null,
): readonly PulseLooseWork[] {
	if (memberId === null) {
		return looseWork;
	}

	return looseWork.filter((item) => item.memberIds.includes(memberId));
}

/**
 * The Agent Session callbacks for a set of Pulse loose work.
 *
 * The card speaks `AgentSessionItem`; every Pulse action speaks
 * `PulseLooseWork`. Translating between them is a rule, not a rendering
 * detail — resume is gated on host capability *and* on the row still resolving
 * to a known session — so it lives here once and is shared by every surface
 * that shows these sessions (the Insights rail and the board's untracked-work
 * column). A second hand-rolled copy is how the two would drift.
 */
export function toPulseSessionHandlers({
	isLooseWorkResumable,
	looseWork,
	onCapture,
	onResume,
}: Readonly<{
	isLooseWorkResumable?: (item: PulseLooseWork) => boolean;
	looseWork: readonly PulseLooseWork[];
	onCapture: (item: PulseLooseWork) => void;
	onResume?: (item: PulseLooseWork) => void;
}>) {
	const sessionById = new Map(
		looseWork.filter(isPulseAgentSession).map((item) => [item.id, item] as const),
	);
	const resolveResumable = (item: AgentSessionItem): PulseLooseWork | undefined => {
		if (onResume === undefined) return undefined;
		const session = sessionById.get(item.id);
		if (session === undefined) return undefined;
		return (isLooseWorkResumable?.(session) ?? true) ? session : undefined;
	};

	return {
		isResumable: (item: AgentSessionItem) => resolveResumable(item) !== undefined,
		onCopyResume: onResume === undefined ? undefined : (item: AgentSessionItem) => {
			const session = resolveResumable(item);
			if (session === undefined) return;
			onResume(session);
		},
		onLinkWorkItem: (item: AgentSessionItem) => {
			const session = sessionById.get(item.id);
			if (session === undefined) return;
			onCapture(session);
		},
		onView: onResume === undefined ? undefined : (item: AgentSessionItem) => {
			const session = resolveResumable(item);
			if (session === undefined) return;
			onResume(session);
		},
	};
}
