import type { AgentListItem } from "@/components/blocks/agent-list";

import type {
	PulseMember,
	PulseMemberKind,
	PulseSignal,
	PulseSignalTone,
	PulseWorkItem,
} from "../types";

/**
 * Boundary between a Pulse attention signal and the shared agent-list row.
 *
 * "Needs input" is a list of people and agents, not a list of statements:
 * an agent that stopped and is waiting on a human, a teammate who commented or
 * @mentioned the reader. That is exactly what `components/blocks/agent-list`
 * renders, so the section shows the identity first and the signal becomes the
 * row's title, reason and metadata. Keeping the mapping pure and here means the
 * section component stays a renderer and the fixture never learns the row model.
 */

/**
 * Tone → the word that leads the metadata line, before the work item key.
 *
 * `attention` has no word: the section is headed "Needs input" and the row
 * already carries the warning glyph, so naming it a third time spends a line of
 * metadata saying nothing. The other three are classifications the row cannot
 * otherwise show.
 */
const TONE_LABEL: Record<PulseSignalTone, string | null> = {
	attention: null,
	risk: "Risk",
	decision: "Decision",
	shipped: "Shipped",
};

/**
 * Tone → row state. `shipped` already happened and is on the page as a record,
 * so it reads as settled; everything else is still asking a human for something
 * and takes the row's attention treatment — the row's own title, because on
 * these rows the title *is* the news, plus the trailing warning glyph.
 */
export function toAttentionState(tone: PulseSignalTone): AgentListItem["state"] {
	return tone === "shipped" ? "complete" : "attention";
}

/**
 * Human comments ask for a reply; agents that stopped ask for input. The verbs
 * are different on purpose so a mixed Needs input list does not pretend those
 * are the same kind of wait.
 */
export function toAttentionActionLabel(kind: PulseMemberKind): string {
	switch (kind) {
		case "human":
			return "Reply";
		case "agent":
			return "Give input";
		default: {
			const _exhaustive: never = kind;
			return _exhaustive;
		}
	}
}

/** The work item a Needs input row opens, when the signal named one. */
export function resolveAttentionWorkItem(
	itemId: string,
	signals: readonly PulseSignal[],
	workItems: readonly PulseWorkItem[],
): PulseWorkItem | undefined {
	const signal = signals.find((entry) => entry.id === itemId);
	if (signal?.workItemKey === undefined) {
		return undefined;
	}

	return workItems.find((workItem) => workItem.key === signal.workItemKey);
}

/** `"Risk · PAY-112"`, or whichever half of that the signal actually has. */
export function toAttentionMetadata(signal: PulseSignal): string | undefined {
	const parts = [TONE_LABEL[signal.tone], signal.workItemKey].filter(
		(part): part is string => typeof part === "string",
	);
	return parts.length === 0 ? undefined : parts.join(" · ");
}

/**
 * Maps one window's signals onto agent-list rows.
 *
 * `members` is the window's roster. A signal whose member is not in it is
 * dropped rather than rendered faceless: the row model leads with an identity,
 * and a row that cannot name who it is from is worse than no row. The fixture
 * suite asserts that never happens.
 *
 * Each row carries the signal's own pre-formatted stamp, not the window's
 * closing boundary — a comment posted at 08:06 inside a window that closes at
 * 08:12 must say 08:06 — and it is a fixed string, so the list states when
 * something happened instead of running a live clock per row against a week
 * that is already over.
 */
export function toPulseAttentionItems(
	signals: readonly PulseSignal[],
	members: readonly PulseMember[],
): readonly AgentListItem[] {
	const byId = new Map(members.map((member) => [member.id, member]));

	return signals.flatMap((signal) => {
		const member = byId.get(signal.memberId);
		if (member === undefined) {
			return [];
		}

		return [{
			actionLabel: toAttentionActionLabel(member.kind),
			agent: {
				avatarSrc: member.avatarSrc,
				id: member.id,
				kind: member.kind === "agent" ? "agent" : "person",
				name: member.name,
			},
			id: signal.id,
			metadataPrefix: toAttentionMetadata(signal),
			state: toAttentionState(signal.tone),
			summary: signal.detail,
			timeLabel: signal.timeLabel,
			title: signal.title,
		} satisfies AgentListItem];
	});
}
