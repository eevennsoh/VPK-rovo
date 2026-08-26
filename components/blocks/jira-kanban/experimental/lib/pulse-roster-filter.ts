import type { JiraKanbanAssigneeData } from "@/components/blocks/jira-kanban";
import type { PulseMember } from "@/components/blocks/jira-kanban/experimental/pulse/types";

/**
 * The presentation persona for Insights. Clicking Insights with no person
 * selected filters to this member, and the same id is what the board facepile
 * uses for Venn, so the avatar survives the mode switch.
 */
export const PULSE_PRESENTATION_MEMBER_ID = "venn";

/**
 * Insights is single-select. The board filter's assignee field is multi-select,
 * so the Pulse roster reads the first selected id that names a roster member.
 */
export function toPulseMemberId(
	selectedAssigneeIds: ReadonlySet<string>,
	pulseMemberIds: ReadonlySet<string>,
): string | null {
	for (const id of selectedAssigneeIds) {
		if (pulseMemberIds.has(id)) {
			return id;
		}
	}
	return null;
}

/**
 * Clicking a Pulse face is a shorthand for Filter → that person or agent.
 * Clearing the face clears only the assignee field.
 */
export function toPulseMemberAssigneeIds(memberId: string | null): Set<string> {
	return memberId === null ? new Set() : new Set([memberId]);
}

/**
 * Insights defaults to the presentation persona unless the reader already
 * filtered to someone (or some agent) on the roster.
 */
export function toInsightsAssigneeIds(
	selectedAssigneeIds: ReadonlySet<string>,
	pulseMemberIds: ReadonlySet<string>,
	fallbackId: string = PULSE_PRESENTATION_MEMBER_ID,
): Set<string> {
	if (toPulseMemberId(selectedAssigneeIds, pulseMemberIds) !== null) {
		return new Set(selectedAssigneeIds);
	}
	return pulseMemberIds.has(fallbackId)
		? new Set([fallbackId])
		: new Set(selectedAssigneeIds);
}

/**
 * Keep the presentation persona leftmost in the board facepile so swapping to
 * the Pulse roster cannot drop them behind the overflow.
 */
export function promoteAssignee(
	assignees: readonly JiraKanbanAssigneeData[],
	assigneeId: string,
): JiraKanbanAssigneeData[] {
	const match = assignees.find((assignee) => assignee.id === assigneeId);
	if (match === undefined) {
		return [...assignees];
	}
	return [match, ...assignees.filter((assignee) => assignee.id !== assigneeId)];
}

/**
 * Filter's assignee list is the union of board people and the Pulse roster, so
 * choosing a face and choosing the same row in Filter cannot disagree.
 */
export function mergeBoardFilterAssignees(
	boardAssignees: readonly JiraKanbanAssigneeData[],
	members: readonly PulseMember[],
): JiraKanbanAssigneeData[] {
	const seen = new Set<string>();
	const merged: JiraKanbanAssigneeData[] = [];

	for (const member of members) {
		if (seen.has(member.id)) {
			continue;
		}
		seen.add(member.id);
		merged.push({
			avatarSrc: member.avatarSrc,
			id: member.id,
			name: member.name,
		});
	}
	for (const assignee of boardAssignees) {
		if (seen.has(assignee.id)) {
			continue;
		}
		seen.add(assignee.id);
		merged.push(assignee);
	}

	return merged;
}
