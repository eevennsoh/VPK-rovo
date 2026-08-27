import type { PulseMember, PulseMemberKind, PulseWorkItem } from "../types";

/**
 * The face on a Pulse work-item card.
 *
 * The rail is a read-out of a slice, not the board. While a member filter is
 * on, every card in that slice wears the filtered person — they are the DRI of
 * the view. Clearing the filter restores the Jira assignee.
 */
export interface PulseWorkItemFace {
	avatarSrc?: string;
	kind?: PulseMemberKind;
	name?: string;
}

export function resolvePulseWorkItemFace(
	workItem: PulseWorkItem,
	memberLookup: ReadonlyMap<string, PulseMember>,
	selectedMember: PulseMember | null = null,
): PulseWorkItemFace {
	const face = selectedMember ?? (
		workItem.assigneeId === undefined ? undefined : memberLookup.get(workItem.assigneeId)
	);

	return {
		avatarSrc: face?.avatarSrc ?? workItem.assigneeAvatarSrc,
		kind: face?.kind,
		name: face?.name ?? workItem.assigneeName,
	};
}
